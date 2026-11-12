// 웹 브릿지 v2 의 토큰 메서드(방식 A — 네이티브가 토큰을 소유·갱신한다). 짝: web/src/auth/{tokenStore,apiClient}.ts
//
// 왜 네이티브가 정본인가: CMS refresh 토큰은 회전형이라 웹과 네이티브가 각자 refresh 하면 한쪽이 "이미 회전된 토큰
// 재사용"으로 판정돼 family 전체가 폐기된다. 재생 중(DRM 라이선스·30초 이어보기 보고)에도 네이티브가 스스로 갱신해야
// 하므로 정본을 네이티브에 두고, 웹은 access 만 받아 쓴다. refresh 는 [ApiClient.refreshAccessToken] 의 단일 실행을
// 그대로 타므로 웹 요청과 네이티브 요청이 동시에 401 을 받아도 회전은 한 번만 일어난다.
package com.aimmovie.car.shell

import com.aimmovie.car.data.auth.ApiClient
import com.aimmovie.car.data.auth.AuthTokens
import com.aimmovie.car.data.auth.StoredUser
import com.aimmovie.car.data.auth.TokenStore
import com.aimmovie.car.data.net.AppJson
import com.aimmovie.car.data.net.jsNumber
import com.aimmovie.car.data.net.stringOrNull
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject

/** 웹에 넘기는 세션. refresh 토큰은 넣지 않는다 — 웹이 refresh 할 수 없게 하는 것이 이 구조의 핵심이다. */
@Serializable
data class WebSession(
    val accessToken: String,
    /** access 만료 시각(epoch ms). 웹이 만료 임박을 판단해 [AuthBridge.getAccessToken] 을 부르는 데 쓴다. */
    val accessExpiresAt: Long,
    val user: StoredUser,
)

class AuthBridge(
    private val tokenStore: TokenStore,
    private val apiClient: ApiClient,
    private val clock: () -> Long = System::currentTimeMillis,
) {
    /** 네트워크 없이 지금 세션(동기). 셸은 페이지를 열기 전에 토큰 복원을 끝내 두므로 첫 렌더부터 맞는 값이다. */
    fun snapshot(): WebSession? = tokenStore.tokens.value?.toWebSession()

    /** 유효한 access. 만료 임박이면 먼저 refresh 한다. 로그아웃 상태면 null. refresh 가 통신 오류면 지금 값을 준다. */
    suspend fun getAccessToken(): WebSession? {
        val tokens = tokenStore.getTokens() ?: return null
        if (tokenStore.isAccessExpiring(tokens)) apiClient.refreshAccessToken()
        return tokenStore.getTokens()?.toWebSession()
    }

    /**
     * 웹 요청이 401 을 받았다.
     *  - [failedAccessToken] 이 이미 교체됐다면(다른 요청 — 네이티브 재생 보고 포함 — 이 먼저 회전시킴) refresh 하지 않고 최신 값을 준다.
     *  - refresh 가 폐기 판정이면 null(로그아웃). 통신 오류면 로그아웃 사유가 아니므로 [ERR_REFRESH_FAILED] 로 실패시킨다.
     */
    suspend fun refreshAfter401(failedAccessToken: String?): WebSession? {
        val current = tokenStore.getTokens() ?: return null
        if (failedAccessToken != null && current.accessToken != failedAccessToken) return current.toWebSession()
        val refreshed = apiClient.refreshAccessToken()
        val after = tokenStore.getTokens() ?: return null
        if (!refreshed) throw BridgeException(ERR_REFRESH_FAILED)
        return after.toWebSession()
    }

    /** 웹 QR 페어링이 받은 토큰(`/authapi/device/token` 응답)을 보안 저장소에 넣는다. */
    suspend fun savePairedTokens(args: JsonObject): WebSession {
        val access = args["access_token"].stringOrNull().orEmpty()
        val refresh = args["refresh_token"].stringOrNull().orEmpty()
        if (access.isEmpty() || refresh.isEmpty()) throw BridgeException(BridgeDispatcher.ERR_INVALID_ARGS)
        val expiresIn = args["expires_in"].jsNumber().let { if (it.isNaN() || it <= 0) DEFAULT_EXPIRES_SEC else it }
        val user = (args["user"] as? JsonObject)?.let {
            runCatching { AppJson.decodeFromJsonElement(StoredUser.serializer(), it) }.getOrNull()
        } ?: throw BridgeException(BridgeDispatcher.ERR_INVALID_ARGS)
        val tokens = AuthTokens(access, refresh, clock() + (expiresIn * 1000).toLong(), user)
        tokenStore.setTokens(tokens)
        return tokens.toWebSession()
    }

    /** 서버에 refresh family 폐기를 알리고 보안 저장소를 비운다. */
    suspend fun logout() {
        apiClient.logout()
    }

    /** 브릿지 메서드 표. `play`·`version` 은 셸(MainActivity)이 더한다. */
    fun methods(): Map<String, BridgeMethod> = mapOf(
        "getAccessToken" to { _ -> getAccessToken().toJson() },
        "refreshAfter401" to { args -> refreshAfter401(args["accessToken"].stringOrNull()).toJson() },
        "savePairedTokens" to { args -> savePairedTokens(args).toJson() },
        "logout" to { _ ->
            logout()
            null
        },
    )

    companion object {
        const val ERR_REFRESH_FAILED = "refresh_failed"
        private const val DEFAULT_EXPIRES_SEC = 3600.0

        fun AuthTokens.toWebSession(): WebSession = WebSession(accessToken, accessExpiresAt, user)

        fun WebSession?.toJson(): JsonElement =
            this?.let { AppJson.encodeToJsonElement(WebSession.serializer(), it) } ?: JsonNull
    }
}
