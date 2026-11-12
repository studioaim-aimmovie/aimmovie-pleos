package com.aimmovie.car.data.api

import com.aimmovie.car.data.auth.ApiClient
import com.aimmovie.car.data.auth.AuthTokens
import com.aimmovie.car.data.auth.InMemoryTokenStorage
import com.aimmovie.car.data.auth.StoredUser
import com.aimmovie.car.data.auth.TokenStore
import com.aimmovie.car.data.config.AppConfig
import com.aimmovie.car.data.net.ApiException
import com.aimmovie.car.data.net.HttpRequest
import com.aimmovie.car.data.net.HttpResponse
import com.aimmovie.car.data.net.HttpTransport
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * packages/core/src/api 의 함수 중 플레이어가 쓰는 것들이 원본과 같은 경로·본문으로 요청하고, 같은 규칙으로 응답을 해석하는지.
 * 전송 계층은 가짜로 바꿔 요청을 기록한다.
 */
class ApiFunctionsTest {
    private val config = AppConfig(apiRoot = "https://cms.test", cdnUrl = "")
    private val requests = mutableListOf<HttpRequest>()
    private var respond: (HttpRequest) -> HttpResponse = { HttpResponse(200, """{"result":true}""") }
    private val transport = HttpTransport { req ->
        requests += req
        respond(req)
    }

    private suspend fun loggedInClient(scope: kotlinx.coroutines.CoroutineScope): ApiClient {
        val store = TokenStore(InMemoryTokenStorage())
        store.setTokens(AuthTokens("tok", "ref", Long.MAX_VALUE, StoredUser(id = "u1")))
        return ApiClient(config, transport, store, scope)
    }

    // ── 공개 조회 ──

    @Test
    fun contentShow_buildsEncodedUrlAndThrowsOnHttpError() = runTest {
        val api = CatalogApi(config, transport)
        respond = { HttpResponse(200, """{"result":true,"data":{"_id":"c1"}}""") }
        assertEquals("c1", api.getContentShow("a b", "KR").data?.id)
        assertEquals(listOf("https://cms.test/api/contents/show/a%20b?country=KR"), requests.map { it.url })
        assertTrue(requests.all { it.method == "GET" && !it.headers.containsKey("Authorization") })

        respond = { HttpResponse(500, "oops") }
        val e = runCatching { api.getContentShow("c1", "KR") }.exceptionOrNull()
        assertTrue(e is ApiException && e.status == 500)
    }

    // ── 인증 호출 ──

    @Test
    fun videoStatus_requestsAndParsing() = runTest {
        val api = VideoStatusApi(loggedInClient(backgroundScope), backgroundScope)

        assertEquals(emptyMap<String, VideoStatus>(), api.fetchWatchStatus(listOf("", "")))
        assertTrue(requests.isEmpty()) // 빈 목록이면 요청하지 않는다

        respond = { HttpResponse(200, """{"result":true,"status":{"v1":{"play":3}},"list":[{"video":"v1","playAt":"t"}]}""") }
        assertEquals("t", api.fetchWatchStatus(listOf("v1", ""))["v1"]?.playAt)
        assertEquals("https://cms.test/authapi/videostatus/resume", requests.last().url)
        assertEquals("Bearer tok", requests.last().headers["Authorization"])
        assertEquals("""{"videos":["v1"]}""", requests.last().jsonBody)
        respond = { HttpResponse(500, "") }
        assertEquals(emptyMap<String, VideoStatus>(), api.fetchWatchStatus(listOf("v1")))

        api.sendWatchProgress("v1", 12.0, 30.0)
        testScheduler.runCurrent() // 앱 스코프(여기선 backgroundScope)에서 보낸다
        assertEquals("https://cms.test/authapi/videostatus/play", requests.last().url)
        assertEquals("""{"video":"v1","play":12.0,"play_percent":30.0}""", requests.last().jsonBody)
    }
}
