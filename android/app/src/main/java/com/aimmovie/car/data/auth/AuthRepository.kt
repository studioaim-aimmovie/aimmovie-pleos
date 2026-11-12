// 원본: apps/tv/src/auth/AuthContext.tsx
//
// 로그인 상태. TV 의 AuthProvider/useAuth 를 StateFlow 로 옮겼다.
//  - TV 의 refresh()(페어링 성공 후 저장소 값을 상태에 반영)는 필요 없다. TokenStore.tokens 를 그대로 따라가므로
//    페어링이 토큰을 저장하는 순간 LoggedIn 이 된다.
//  - TV 의 setSessionEndedHandler 도 같은 이유로 필요 없다. refresh 가 폐기되면 ApiClient 가 토큰을 지우고,
//    그 변화가 곧 LoggedOut 이다.
//  - 로그아웃 후 홈으로 보내는 navigate("/") 는 화면 계층(3단계)이 상태 변화를 보고 처리한다.
package com.aimmovie.car.data.auth

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed interface AuthState {
    /** 저장소에서 토큰을 읽는 중. TV 는 동기 읽기라 이 상태가 없었다 — 스플래시를 띄울 구간이다. */
    data object Restoring : AuthState
    data object LoggedOut : AuthState
    data class LoggedIn(val user: StoredUser) : AuthState
}

class AuthRepository(
    private val tokenStore: TokenStore,
    private val apiClient: ApiClient,
    scope: CoroutineScope,
) {
    val state: StateFlow<AuthState> =
        combine(tokenStore.isRestored, tokenStore.tokens) { restored, tokens ->
            when {
                !restored -> AuthState.Restoring
                tokens == null -> AuthState.LoggedOut
                else -> AuthState.LoggedIn(tokens.user)
            }
        }.stateIn(scope, SharingStarted.Eagerly, AuthState.Restoring)

    init {
        // 앱 시작과 함께 저장된 토큰을 읽어 둔다(첫 화면이 로그인 여부를 바로 알 수 있게).
        scope.launch { tokenStore.restore() }
    }

    /** 로그인한 사용자. 미로그인(또는 복원 중)이면 null. */
    val user: StoredUser? get() = (state.value as? AuthState.LoggedIn)?.user

    val isLoggedIn: Boolean get() = state.value is AuthState.LoggedIn

    /** 서버에 refresh family 폐기를 알리고 로컬 토큰을 지운다. */
    suspend fun logout() {
        apiClient.logout()
    }
}
