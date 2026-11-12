package com.aimmovie.car.shell

import com.aimmovie.car.data.auth.ApiClient
import com.aimmovie.car.data.auth.AuthTokens
import com.aimmovie.car.data.auth.InMemoryTokenStorage
import com.aimmovie.car.data.auth.StoredUser
import com.aimmovie.car.data.auth.TokenStore
import com.aimmovie.car.data.config.AppConfig
import com.aimmovie.car.data.net.HttpRequest
import com.aimmovie.car.data.net.HttpResponse
import com.aimmovie.car.data.net.HttpTransport
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.async
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.IOException

/**
 * 토큰 방식 A — 웹은 access 만 받고, refresh 는 네이티브 ApiClient 의 단일 실행을 탄다.
 * 웹 요청(브릿지)과 네이티브 요청(재생 보고 등)이 동시에 401 을 받아도 회전이 한 번만 일어나는지가 핵심이다.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class AuthBridgeTest {
    private val config = AppConfig(apiRoot = "https://cms.test", cdnUrl = "")
    private val user = StoredUser(id = "u1", name = "홍길동", countryCode = "KR", countryDial = "+82", phone = "01012345678")
    private val now = 1_000_000L
    private val requests = mutableListOf<HttpRequest>()

    /** refresh 응답을 붙잡아 두는 문. 열리기 전까지 다른 요청이 401 을 받고 refresh 를 시도하게 만든다. */
    private var refreshGate: CompletableDeferred<Unit>? = null
    private var refreshResponse: () -> HttpResponse = {
        HttpResponse(200, """{"result":true,"access_token":"new-access","refresh_token":"new-refresh","expires_in":1800}""")
    }

    private val transport = HttpTransport { req ->
        requests += req
        when (req.url.removePrefix(config.apiRoot)) {
            "/authapi/token/refresh" -> {
                refreshGate?.await()
                refreshResponse()
            }
            "/authapi/token/logout" -> HttpResponse(200, """{"result":true}""")
            // 옛 access 로 오면 401, 새 access 면 200 — 만료된 access 로 동시에 보낸 요청을 흉내 낸다.
            else -> if (req.headers["Authorization"] == "Bearer new-access") HttpResponse(200, """{"result":true}""") else HttpResponse(401, "")
        }
    }

    private class Env(val store: TokenStore, val api: ApiClient, val bridge: AuthBridge)

    private fun TestScope.env(): Env {
        val store = TokenStore(InMemoryTokenStorage(), clock = { now })
        val api = ApiClient(config, transport, store, backgroundScope)
        return Env(store, api, AuthBridge(store, api, clock = { now }))
    }

    private fun tokens(access: String = "old-access", expiresAt: Long = now + 3_600_000) =
        AuthTokens(access, "old-refresh", expiresAt, user)

    private fun refreshCount() = requests.count { it.url.endsWith("/authapi/token/refresh") }

    @Test
    fun loggedOut_returnsNullWithoutNetwork() = runTest {
        val e = env()
        assertNull(e.bridge.getAccessToken())
        assertNull(e.bridge.refreshAfter401("x"))
        assertNull(e.bridge.snapshot())
        assertTrue(requests.isEmpty())
    }

    @Test
    fun webSessionNeverContainsRefreshToken() = runTest {
        val e = env()
        e.store.setTokens(tokens())
        val json = AuthBridge.run { e.bridge.getAccessToken().toJson() }.jsonObject
        assertEquals(setOf("accessToken", "accessExpiresAt", "user"), json.keys)
        assertEquals("old-access", json["accessToken"]!!.jsonPrimitive.content)
        // user 는 웹 NativeUser 와 같은 snake_case 필드명이다.
        assertEquals("KR", json["user"]!!.jsonObject["country_code"]!!.jsonPrimitive.content)
        assertFalse(json.toString().contains("old-refresh"))
        assertEquals("old-access", e.bridge.snapshot()?.accessToken)
    }

    @Test
    fun getAccessToken_refreshesOnlyWhenExpiring() = runTest {
        val e = env()
        e.store.setTokens(tokens())
        assertEquals("old-access", e.bridge.getAccessToken()?.accessToken)
        assertEquals(0, refreshCount())

        e.store.setTokens(tokens(expiresAt = now + 10_000)) // 30초 안에 만료
        val s = e.bridge.getAccessToken()
        assertEquals("new-access", s?.accessToken)
        assertEquals(now + 1_800_000, s?.accessExpiresAt)
        assertEquals(1, refreshCount())
        assertEquals("new-refresh", e.store.getTokens()?.refreshToken) // 회전 결과는 네이티브에만 있다
    }

    @Test
    fun refreshAfter401_skipsRefreshWhenAccessAlreadyRotated() = runTest {
        val e = env()
        e.store.setTokens(tokens(access = "rotated"))
        // 웹은 옛 access 로 401 을 받았지만 그 사이 네이티브가 이미 회전시켰다 → refresh 없이 최신 값.
        assertEquals("rotated", e.bridge.refreshAfter401("old-access")?.accessToken)
        assertEquals(0, refreshCount())
    }

    @Test
    fun concurrentWebAndNative401_rotateOnce() = runTest(StandardTestDispatcher()) {
        val e = env()
        e.store.setTokens(tokens())
        refreshGate = CompletableDeferred()
        val emitted = mutableListOf<String>()
        val dispatcher = BridgeDispatcher(this, { emitted += it }, e.bridge.methods())

        // 웹 요청 세 개가 각자 401 을 받고 refreshAfter401 을 부른다 + 네이티브 재생 보고도 같은 순간 401.
        repeat(3) { dispatcher.request("w$it", "refreshAfter401", """{"accessToken":"old-access"}""") }
        val native = async { e.api.authPost("/api/videostatus/play", "{}") }
        runCurrent()
        assertEquals("refresh 는 하나만 나가 있어야 한다", 1, refreshCount())

        refreshGate!!.complete(Unit)
        runCurrent()
        assertEquals(1, refreshCount())
        assertEquals(200, native.await().status)
        val results = emitted.map { script ->
            val args = Json.parseToJsonElement("[" + script.substringAfter("__aimPleosResolve(").removeSuffix(")") + "]") as JsonArray
            Json.parseToJsonElement(args[1].jsonPrimitive.content) as JsonObject
        }
        assertEquals(3, results.size)
        results.forEach {
            assertEquals(true, it["ok"]!!.jsonPrimitive.content.toBoolean())
            assertEquals("new-access", it["data"]!!.jsonObject["accessToken"]!!.jsonPrimitive.content)
        }
    }

    @Test
    fun revokedRefresh_endsSession_networkError_keepsIt() = runTest {
        val e = env()
        e.store.setTokens(tokens())
        refreshResponse = { throw IOException("down") }
        val err = runCatching { e.bridge.refreshAfter401("old-access") }.exceptionOrNull()
        assertEquals(AuthBridge.ERR_REFRESH_FAILED, (err as BridgeException).code)
        assertEquals("통신 오류는 로그아웃 사유가 아니다", "old-access", e.store.getTokens()?.accessToken)

        refreshResponse = { HttpResponse(401, """{"result":false,"code":"invalid_refresh"}""") }
        assertNull(e.bridge.refreshAfter401("old-access"))
        assertNull(e.store.getTokens())
    }

    @Test
    fun savePairedTokens_storesFullTokensAndRejectsBadArgs() = runTest {
        val e = env()
        val args = Json.parseToJsonElement(
            """{"access_token":"a1","refresh_token":"r1","expires_in":600,
               "user":{"id":"u1","name":"홍길동","country_code":"KR","country_dial":"+82","phone":"010"}}""",
        ) as JsonObject
        val s = e.bridge.savePairedTokens(args)
        assertEquals("a1", s.accessToken)
        assertEquals(AuthTokens("a1", "r1", now + 600_000, user.copy(phone = "010")), e.store.getTokens())

        val missingRefresh = Json.parseToJsonElement("""{"access_token":"a1","user":{"id":"u1"}}""") as JsonObject
        val err = runCatching { e.bridge.savePairedTokens(missingRefresh) }.exceptionOrNull()
        assertEquals(BridgeDispatcher.ERR_INVALID_ARGS, (err as BridgeException).code)
    }

    @Test
    fun logout_revokesOnServerAndClearsStore() = runTest {
        val e = env()
        e.store.setTokens(tokens())
        e.bridge.logout()
        val req = requests.single()
        assertEquals("https://cms.test/authapi/token/logout", req.url)
        assertEquals("""{"refresh_token":"old-refresh"}""", req.jsonBody)
        assertNull(e.store.getTokens())
    }
}
