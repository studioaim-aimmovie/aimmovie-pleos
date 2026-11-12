package com.aimmovie.car.data.auth

import com.aimmovie.car.data.config.AppConfig
import com.aimmovie.car.data.net.OkHttpTransport
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.Dispatcher
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.mockwebserver.RecordedRequest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

/**
 * web/src/auth/apiClient.ts 의 핵심 — refresh 동시 실행 방지.
 * 실제 HTTP(MockWebServer)와 실제 스레드에서 동시에 요청을 보내 경합을 재현한다.
 */
class ApiClientTest {
    private lateinit var server: MockWebServer
    private lateinit var scope: CoroutineScope
    private lateinit var tokenStore: TokenStore
    private lateinit var client: ApiClient

    private val user = StoredUser(id = "u1", name = "홍길동", countryCode = "KR")
    private val refreshCount = AtomicInteger()
    private val refreshBodies = ConcurrentLinkedQueue<String>()
    private val authHeaders = ConcurrentLinkedQueue<String>()

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
        scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
        tokenStore = TokenStore(InMemoryTokenStorage())
        val okHttp = OkHttpClient.Builder()
            .dispatcher(okhttp3.Dispatcher().apply { maxRequestsPerHost = 64; maxRequests = 64 })
            .build()
        val config = AppConfig(apiRoot = server.url("").toString().trimEnd('/'), cdnUrl = "")
        client = ApiClient(config, OkHttpTransport(okHttp), tokenStore, scope)
    }

    @After
    fun tearDown() {
        scope.cancel()
        server.shutdown()
    }

    private fun tokens(access: String = "old-access", expiresAt: Long = System.currentTimeMillis() + 3_600_000) =
        AuthTokens(accessToken = access, refreshToken = "old-refresh", accessExpiresAt = expiresAt, user = user)

    private val refreshOk = """{"result":true,"access_token":"new-access","refresh_token":"new-refresh","expires_in":1800}"""

    /**
     * /authapi/token/refresh 는 [beforeRefresh] 가 풀릴 때까지 응답을 붙잡는다 — 그 사이 다른 요청들이 401 을 받고
     * refresh 를 시도하게 만들어 "진행 중인 refresh 공유" 경로를 확실히 탄다.
     */
    private fun installDispatcher(refreshResponse: () -> MockResponse, beforeRefresh: CountDownLatch? = null, on401: () -> Unit = {}) {
        server.dispatcher = object : Dispatcher() {
            override fun dispatch(request: RecordedRequest): MockResponse = when (request.path) {
                "/authapi/token/refresh" -> {
                    refreshCount.incrementAndGet()
                    refreshBodies += request.body.readUtf8()
                    beforeRefresh?.await(5, TimeUnit.SECONDS)
                    refreshResponse()
                }
                "/authapi/token/logout" -> MockResponse().setBody("""{"result":true}""")
                else -> {
                    val auth = request.getHeader("Authorization").orEmpty()
                    authHeaders += "${request.path} $auth"
                    if (auth == "Bearer new-access") {
                        MockResponse().setBody("""{"result":true}""")
                    } else {
                        on401()
                        MockResponse().setResponseCode(401).setBody("""{"result":false}""")
                    }
                }
            }
        }
    }

    @Test
    fun concurrent401s_triggerExactlyOneRefreshAndAllRetryWithNewToken() = runBlocking {
        tokenStore.setTokens(tokens())
        val n = 10
        val all401 = CountDownLatch(n)
        installDispatcher({ MockResponse().setBody(refreshOk) }, beforeRefresh = all401, on401 = { all401.countDown() })

        val results = withTimeout(15_000) {
            (1..n).map { i -> async(Dispatchers.IO) { client.authPost("/api/likestatus/mylist?i=$i", "{}") } }.awaitAll()
        }

        assertEquals(1, refreshCount.get())
        assertEquals(listOf("""{"refresh_token":"old-refresh"}"""), refreshBodies.toList())
        assertTrue(results.all { it.status == 200 })
        // 원요청 N 개는 옛 토큰, 재시도 N 개는 새 토큰
        val headers = authHeaders.toList()
        assertEquals(n, headers.count { it.endsWith("Bearer old-access") })
        assertEquals(n, headers.count { it.endsWith("Bearer new-access") })
        // 논리 경로 /api/ → /authapi/
        assertTrue(headers.all { it.startsWith("/authapi/likestatus/mylist") })
        // 회전 결과가 저장됐다
        val saved = tokenStore.getTokens()!!
        assertEquals("new-access", saved.accessToken)
        assertEquals("new-refresh", saved.refreshToken)
        assertEquals(user, saved.user)
    }

    @Test
    fun expiringAccess_refreshesOnceBeforeSending() = runBlocking {
        // 만료 30초 이내 → 요청 전에 미리 갱신한다. 동시에 들어와도 refresh 는 한 번.
        tokenStore.setTokens(tokens(expiresAt = System.currentTimeMillis() + 10_000))
        installDispatcher({ MockResponse().setBody(refreshOk).setBodyDelay(300, TimeUnit.MILLISECONDS) })

        val n = 8
        val results = withTimeout(15_000) {
            (1..n).map { async(Dispatchers.IO) { client.authPost("/api/videostatus/resume", "{}") } }.awaitAll()
        }

        assertEquals(1, refreshCount.get())
        assertTrue(results.all { it.status == 200 })
        assertTrue(authHeaders.all { it.endsWith("Bearer new-access") }) // 401 왕복이 없었다
        assertEquals(n, authHeaders.size)
    }

    @Test
    fun rejectedRefresh_endsSessionAndReturnsOriginal401() = runBlocking {
        tokenStore.setTokens(tokens())
        installDispatcher({ MockResponse().setResponseCode(401).setBody("""{"result":false,"code":"invalid_refresh"}""") })
        val authState = AuthRepository(tokenStore, client, scope)

        val res = client.authPost("/api/popcorn/balance", "{}")

        assertEquals(401, res.status)
        assertEquals(1, refreshCount.get())
        assertNull(tokenStore.getTokens())
        withTimeout(5_000) {
            while (authState.state.value != AuthState.LoggedOut) delay(10)
        }
    }

    @Test
    fun networkErrorDuringRefresh_keepsSession() = runBlocking {
        tokenStore.setTokens(tokens())
        val offline = ApiClient(
            AppConfig("https://cms.test", ""),
            { throw java.io.IOException("연결 실패") },
            tokenStore,
            scope,
        )

        assertEquals(false, offline.refreshAccessToken())
        assertEquals("old-refresh", tokenStore.getTokens()?.refreshToken) // 로그아웃 사유가 아니다
    }

    @Test
    fun guestRequest_sendsWithoutAuthorizationAndDoesNotRefresh() = runBlocking {
        installDispatcher({ MockResponse().setBody(refreshOk) })
        val res = client.authPost("/api/likestatus/mylist", "{}")
        assertEquals(401, res.status)
        assertEquals(0, refreshCount.get())
        assertEquals(listOf("/authapi/likestatus/mylist "), authHeaders.toList())
    }

    @Test
    fun logout_notifiesServerAndClearsTokens() = runBlocking {
        tokenStore.setTokens(tokens())
        installDispatcher({ MockResponse().setBody(refreshOk) })
        client.logout()
        val recorded = server.takeRequest(1, TimeUnit.SECONDS)!!
        assertEquals("/authapi/token/logout", recorded.path)
        assertEquals("""{"refresh_token":"old-refresh"}""", recorded.body.readUtf8())
        assertNull(tokenStore.getTokens())
    }

    @Test
    fun toCmsUrl_mapsLogicalPrefixOnly() {
        val root = server.url("").toString().trimEnd('/')
        assertEquals("$root/authapi/videostatus/play", client.toCmsUrl("/api/videostatus/play"))
        assertEquals("$root/authapi/device/code", client.toCmsUrl("/authapi/device/code"))
        assertEquals("https://other/x", client.toCmsUrl("https://other/x"))
    }
}
