// 원본: apps/tv/src/auth/tokenStore.ts
//
// 토큰 영속 저장소 + 메모리 캐시. TV 는 localStorage 를 readRaw/writeRaw 로 감쌌고,
// 여기서는 그 자리를 [TokenStorage] 인터페이스가 맡는다(운영: KeystoreTokenStorage, 테스트: InMemoryTokenStorage).
//
// TV 와 다른 점: 저장소 읽기가 비동기(DataStore)라 getTokens 가 suspend 다. 첫 접근에서 한 번만 읽고
// 이후로는 메모리 캐시를 본다. 상태는 StateFlow 로도 노출해 AuthRepository 가 따라가게 한다
// (TV 의 setSessionEndedHandler 콜백 대신 — 토큰이 지워지면 구독자가 자동으로 미로그인으로 바뀐다).
package com.aimmovie.car.data.auth

import com.aimmovie.car.data.net.AppJson
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** 페어링 응답의 user. CMS routes/api/device.js 가 이 다섯 필드만 내려준다(id 는 사용자 _id). */
@Serializable
data class StoredUser(
    val id: String = "",
    val name: String = "",
    @SerialName("country_code") val countryCode: String = "",
    @SerialName("country_dial") val countryDial: String = "",
    val phone: String = "",
)

@Serializable
data class AuthTokens(
    val accessToken: String,
    val refreshToken: String,
    /** access 만료 시각(epoch ms). 만료 직전에 미리 갱신하는 데 쓴다. */
    val accessExpiresAt: Long,
    val user: StoredUser,
)

/** 암호문/평문 한 덩어리를 읽고 쓰는 저장소. 실패는 조용히 삼킨다(TV readRaw/writeRaw 와 같다). */
interface TokenStorage {
    suspend fun read(): String?
    suspend fun write(value: String?)
}

/** 테스트·미리보기용. 프로세스가 끝나면 사라진다. */
class InMemoryTokenStorage(private var value: String? = null) : TokenStorage {
    override suspend fun read(): String? = value
    override suspend fun write(value: String?) {
        this.value = value
    }
}

class TokenStore(
    private val storage: TokenStorage,
    private val clock: () -> Long = System::currentTimeMillis,
) {
    private val loadLock = Mutex()
    @Volatile private var loaded = false

    private val _tokens = MutableStateFlow<AuthTokens?>(null)
    /** 현재 토큰. [restore] 전에는 null 이므로 "아직 모름" 은 [isRestored] 로 구분한다. */
    val tokens: StateFlow<AuthTokens?> = _tokens.asStateFlow()

    private val _restored = MutableStateFlow(false)
    val isRestored: StateFlow<Boolean> = _restored.asStateFlow()

    /** 저장소에서 한 번만 읽어 캐시에 올린다. 여러 곳에서 동시에 불러도 읽기는 한 번이다. */
    suspend fun restore() {
        if (loaded) return
        loadLock.withLock {
            if (loaded) return
            val raw = storage.read()
            _tokens.value = raw?.let {
                try {
                    val parsed = AppJson.decodeFromString(AuthTokens.serializer(), it)
                    // 형태가 깨진 값(구버전 등)은 없는 것으로 취급한다.
                    parsed.takeIf { t -> t.accessToken.isNotEmpty() && t.refreshToken.isNotEmpty() }
                } catch (_: Exception) {
                    null
                }
            }
            loaded = true
            _restored.value = true
        }
    }

    /** 저장된 토큰. 없으면 null. */
    suspend fun getTokens(): AuthTokens? {
        restore()
        return _tokens.value
    }

    suspend fun setTokens(next: AuthTokens) {
        restore()
        _tokens.value = next
        storage.write(AppJson.encodeToString(AuthTokens.serializer(), next))
    }

    /** access 토큰만 교체(refresh 회전 결과 반영). */
    suspend fun updateAccess(accessToken: String, refreshToken: String, expiresInSec: Long) {
        val current = getTokens() ?: return
        setTokens(
            current.copy(
                accessToken = accessToken,
                refreshToken = refreshToken,
                accessExpiresAt = clock() + expiresInSec * 1000,
            ),
        )
    }

    suspend fun clearTokens() {
        restore()
        _tokens.value = null
        storage.write(null)
    }

    /**
     * access 토큰이 곧 만료되는가.
     * 만료 30초 전부터 참으로 본다 — 요청이 날아가는 중에 만료되는 경계를 피한다.
     */
    fun isAccessExpiring(tokens: AuthTokens): Boolean = clock() >= tokens.accessExpiresAt - 30_000
}
