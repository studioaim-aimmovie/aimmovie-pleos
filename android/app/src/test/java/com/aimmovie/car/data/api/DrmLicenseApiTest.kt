package com.aimmovie.car.data.api

import com.aimmovie.car.data.auth.ApiClient
import com.aimmovie.car.data.auth.AuthTokens
import com.aimmovie.car.data.auth.InMemoryTokenStorage
import com.aimmovie.car.data.auth.StoredUser
import com.aimmovie.car.data.auth.TokenStore
import com.aimmovie.car.data.config.AppConfig
import com.aimmovie.car.data.net.AppJson
import com.aimmovie.car.data.net.OkHttpTransport
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.Dispatcher
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.mockwebserver.RecordedRequest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.util.concurrent.TimeUnit

/**
 * 라이선스 요청 형식이 CMS 계약과 맞는지
 * 실제 HTTP(MockWebServer)로 확인한다. 인증은 ApiClient(Bearer + 401 시 refresh 1회)를 거친다.
 */
class DrmLicenseApiTest {
    private lateinit var server: MockWebServer
    private lateinit var scope: CoroutineScope
    private lateinit var tokenStore: TokenStore
    private lateinit var api: DrmLicenseApi
    private var loggedIn = true

    private val user = StoredUser(id = "u1", name = "홍길동", countryCode = "KR")
    private val granted = """{"result":true,"token":"tok64","license_url":"https://drm-license.doverunner.com/ri/licenseManager.do","header":"pallycon-customdata-v2","drm_type":"Widevine"}"""

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
        scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
        tokenStore = TokenStore(InMemoryTokenStorage())
        val config = AppConfig(apiRoot = server.url("").toString().trimEnd('/'), cdnUrl = "")
        val client = ApiClient(config, OkHttpTransport(OkHttpClient()), tokenStore, scope)
        api = DrmLicenseApi(client) { loggedIn }
        runBlocking { tokenStore.setTokens(AuthTokens("access-1", "refresh-1", System.currentTimeMillis() + 3_600_000, user)) }
    }

    @After
    fun tearDown() {
        scope.cancel()
        server.shutdown()
    }

    private fun respond(body: String, status: Int = 200) = server.enqueue(MockResponse().setResponseCode(status).setBody(body))

    @Test
    fun request_matchesCmsContract() = runBlocking {
        respond(granted)
        val result = api.fetchLicense("video-1")

        val req = server.takeRequest(5, TimeUnit.SECONDS)!!
        assertEquals("POST", req.method)
        assertEquals("/authapi/drm/license", req.path)
        assertEquals("Bearer access-1", req.getHeader("Authorization"))
        assertTrue(req.getHeader("Content-Type")!!.startsWith("application/json"))
        val body = AppJson.parseToJsonElement(req.body.readUtf8()) as JsonObject
        // 필드(video·drmType·deviceType:'app'). 사용자 식별은 body.user 가 아니라 Bearer 로 한다(DrmLicenseApi 주석).
        assertEquals(mapOf("video" to "video-1", "drmType" to "Widevine", "deviceType" to "app"), body.mapValues { (it.value as JsonPrimitive).content })
        assertFalse(body.containsKey("user"))

        assertEquals(
            DrmLicenseResult.Granted(DrmLicense("tok64", "https://drm-license.doverunner.com/ri/licenseManager.do", "pallycon-customdata-v2")),
            result,
        )
    }

    @Test
    fun loggedOut_sendsNothing() = runBlocking {
        loggedIn = false
        assertEquals(DrmLicenseResult.LoginRequired, api.fetchLicense("video-1"))
        assertEquals(0, server.requestCount)
    }

    @Test
    fun needUnlock_isDistinguished() = runBlocking {
        respond("""{"result":false,"message":"시청 권한이 없습니다.","need_unlock":true}""")
        assertEquals(DrmLicenseResult.NeedUnlock, api.fetchLicense("video-1"))
    }

    @Test
    fun deniedWithServerMessage() = runBlocking {
        respond("""{"result":false,"message":"현재 관리자 전용 DRM 테스트 중입니다.","need_permission":true}""")
        assertEquals(DrmLicenseResult.Denied("현재 관리자 전용 DRM 테스트 중입니다."), api.fetchLicense("video-1"))
    }

    @Test
    fun non200_andMissingFields_areFailures() = runBlocking {
        respond("""{"result":true}""", status = 500)
        assertTrue(api.fetchLicense("video-1") is DrmLicenseResult.Failed)
        // token·license_url·header 중 하나라도 비면 형식 오류.
        respond("""{"result":true,"token":"t","license_url":"https://l"}""")
        assertTrue(api.fetchLicense("video-1") is DrmLicenseResult.Failed)
        respond("not json")
        assertTrue(api.fetchLicense("video-1") is DrmLicenseResult.Failed)
    }

    @Test
    fun expiredAccess_refreshesOnceAndRetriesWithNewBearer() = runBlocking {
        val seen = mutableListOf<String?>()
        server.dispatcher = object : Dispatcher() {
            override fun dispatch(request: RecordedRequest): MockResponse = when (request.path) {
                "/authapi/token/refresh" -> MockResponse().setBody("""{"result":true,"access_token":"access-2","refresh_token":"refresh-2","expires_in":1800}""")
                "/authapi/drm/license" -> {
                    val auth = request.getHeader("Authorization")
                    synchronized(seen) { seen += auth }
                    if (auth == "Bearer access-1") MockResponse().setResponseCode(401) else MockResponse().setBody(granted)
                }
                else -> MockResponse().setResponseCode(404)
            }
        }
        assertTrue(api.fetchLicense("video-1") is DrmLicenseResult.Granted)
        assertEquals(listOf("Bearer access-1", "Bearer access-2"), seen)
    }
}
