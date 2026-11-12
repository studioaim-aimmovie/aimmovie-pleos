// 짝: web/src/auth/apiClient.ts
//
// 인증 호출 전송자. packages/core 의 api/* 는 `/api/likestatus/mylist` 같은 **논리 경로**를 호출한다.
// 차량 앱은 쿠키가 없으므로 CMS 로 직접 보낸다.
//
//   /api/likestatus/mylist  →  {CMS}/authapi/likestatus/mylist  + Authorization: Bearer
package com.aimmovie.car.data.auth

import com.aimmovie.car.data.config.AppConfig
import com.aimmovie.car.data.net.HttpRequest
import com.aimmovie.car.data.net.HttpResponse
import com.aimmovie.car.data.net.HttpTransport
import com.aimmovie.car.data.net.isTruthy
import com.aimmovie.car.data.net.jsNumber
import com.aimmovie.car.data.net.parseJsonObjectOrNull
import com.aimmovie.car.data.net.stringOrNull
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.io.IOException

class ApiClient(
    private val config: AppConfig,
    private val transport: HttpTransport,
    private val tokenStore: TokenStore,
    /**
     * refresh 를 실행할 스코프. 앱 수명 스코프를 넘긴다 — refresh 를 처음 시작한 화면이 사라져도
     * 회전 결과(새 refresh 토큰)는 반드시 저장돼야 하기 때문이다. 중간에 끊기면 서버는 회전했는데
     * 앱은 옛 토큰을 들고 있게 되고, 다음 refresh 가 "재사용"으로 판정돼 family 전체가 폐기된다.
     */
    private val refreshScope: CoroutineScope,
) {
    /** 논리 경로(`/api/...`)를 CMS 절대 URL(`{root}/authapi/...`)로 바꾼다. */
    fun toCmsUrl(path: String): String {
        val mapped = if (path.startsWith("/api/")) "/authapi/" + path.removePrefix("/api/") else path
        return if (mapped.startsWith("http")) mapped else "${config.apiRoot}$mapped"
    }

    private suspend fun endSession() {
        // TokenStore.tokens 가 null 이 되면 AuthRepository 가 미로그인으로 바뀐다.
        tokenStore.clearTokens()
    }

    // ── refresh 동시 실행 방지 ──
    // access 가 만료된 순간 여러 요청이 동시에 401을 받으면 refresh 가 그 수만큼 나간다.
    // refresh 는 회전하므로 두 번째 이후는 "이미 회전된 토큰 재사용"으로 판정돼
    // **family 전체가 폐기되고 로그아웃된다.** 반드시 in-flight 작업을 공유해야 한다.
    private val refreshLock = Any()
    private var refreshInFlight: Deferred<Boolean>? = null

    /** refresh 를 1회만 실행하고 결과를 공유한다. 성공하면 true. */
    suspend fun refreshAccessToken(): Boolean {
        val deferred = synchronized(refreshLock) {
            refreshInFlight ?: refreshScope.async(start = CoroutineStart.LAZY) {
                try {
                    doRefresh()
                } finally {
                    // 자기 자신일 때만 비운다(그 사이 새 refresh 가 시작됐을 수는 없지만 방어적으로).
                    val self = coroutineContext[Job]
                    synchronized(refreshLock) {
                        if (refreshInFlight === self) refreshInFlight = null
                    }
                }
            }.also { refreshInFlight = it }
        }
        // LAZY 로 만들어 refreshInFlight 에 먼저 걸어 둔 뒤 시작한다. 즉시 시작하면 아주 빨리 끝난 작업이
        // finally 에서 비운 뒤에 위 also 가 다시 걸어 "끝난 작업"이 계속 공유되는 경합이 생긴다.
        deferred.start()
        return deferred.await()
    }

    private suspend fun doRefresh(): Boolean {
        val tokens = tokenStore.getTokens() ?: return false
        return try {
            val res = transport.execute(
                HttpRequest(
                    url = "${config.apiRoot}/authapi/token/refresh",
                    method = "POST",
                    headers = mapOf("Content-Type" to "application/json"),
                    jsonBody = buildJsonObject { put("refresh_token", tokens.refreshToken) }.toString(),
                ),
            )
            val data = parseJsonObjectOrNull(res.body)
            if (!res.isSuccessful || data == null || !data["result"].isTruthy() || !data["access_token"].isTruthy()) {
                // invalid_refresh / revoked — 되살릴 방법이 없다. 로그아웃.
                endSession()
                return false
            }
            val expiresIn = data["expires_in"].jsNumber().let { if (it.isNaN() || it == 0.0) 3600.0 else it }
            tokenStore.updateAccess(
                accessToken = data["access_token"].stringOrNull().orEmpty(),
                refreshToken = data["refresh_token"].stringOrNull().orEmpty(),
                expiresInSec = expiresIn.toLong(),
            )
            true
        } catch (e: CancellationException) {
            throw e
        } catch (_: IOException) {
            // 네트워크 오류는 로그아웃 사유가 아니다 — 다음 요청에서 다시 시도한다.
            false
        }
    }

    /**
     * 인증이 필요한 호출. core 의 인증 API 는 모두 JSON POST 라 그 형태만 둔다.
     *
     * - 논리 경로를 CMS 경로로 바꾸고 Bearer 를 붙인다.
     * - access 가 곧 만료면 요청 전에 미리 갱신한다(불필요한 401 왕복 절약).
     * - 그래도 401 이면 refresh 후 **1회만** 재시도한다.
     *
     * 연결 실패는 IOException 으로 던진다(fetch 의 reject 와 같다). 각 API 함수가 원본처럼 삼킨다.
     */
    suspend fun authPost(path: String, jsonBody: String): HttpResponse {
        var tokens = tokenStore.getTokens()

        if (tokens != null && tokenStore.isAccessExpiring(tokens)) {
            refreshAccessToken()
            tokens = tokenStore.getTokens()
        }

        suspend fun send(accessToken: String?): HttpResponse {
            val headers = buildMap {
                put("Content-Type", "application/json")
                if (accessToken != null) put("Authorization", "Bearer $accessToken")
            }
            return transport.execute(HttpRequest(url = toCmsUrl(path), method = "POST", headers = headers, jsonBody = jsonBody))
        }

        val sentToken = tokens?.accessToken
        val res = send(sentToken)
        if (res.status != 401 || tokens == null) return res

        // 원본과 다른 점: 내가 보낸 access 가 이미 다른 요청의 refresh 로 교체됐다면 refresh 를 또 하지 않고
        // 새 토큰으로 바로 재시도한다. 원본은 앞선 refresh 가 끝난 뒤 도착한 401 이 refresh 를 한 번 더
        // 일으킬 수 있다(최신 refresh 토큰이라 family 가 폐기되지는 않지만 불필요한 회전이다).
        val current = tokenStore.getTokens()
        if (current != null && current.accessToken != sentToken) return send(current.accessToken)

        // 만료 판정이 어긋났을 수 있다(기기 시계 오차 등). 한 번만 갱신 후 재시도한다.
        val refreshed = refreshAccessToken()
        if (!refreshed) return res
        return send(tokenStore.getTokens()?.accessToken)
    }

    /** 서버에 로그아웃을 알리고(=refresh family 폐기) 로컬 토큰을 지운다. */
    suspend fun logout() {
        val tokens = tokenStore.getTokens()
        if (tokens != null) {
            try {
                transport.execute(
                    HttpRequest(
                        url = "${config.apiRoot}/authapi/token/logout",
                        method = "POST",
                        headers = mapOf("Content-Type" to "application/json"),
                        jsonBody = buildJsonObject { put("refresh_token", tokens.refreshToken) }.toString(),
                    ),
                )
            } catch (e: CancellationException) {
                throw e
            } catch (_: Exception) {
                // 서버에 못 알려도 로컬은 지운다
            }
        }
        endSession()
    }
}
