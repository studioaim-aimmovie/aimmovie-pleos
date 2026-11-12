package com.aimmovie.car

import android.content.Context
import com.aimmovie.car.data.api.CatalogApi
import com.aimmovie.car.data.api.DrmLicenseApi
import com.aimmovie.car.data.api.VideoStatusApi
import com.aimmovie.car.data.auth.ApiClient
import com.aimmovie.car.data.auth.AuthRepository
import com.aimmovie.car.data.auth.KeystoreTokenStorage
import com.aimmovie.car.data.auth.TokenStore
import com.aimmovie.car.data.config.AppConfig
import com.aimmovie.car.data.net.HttpTransport
import com.aimmovie.car.data.net.OkHttpTransport
import com.aimmovie.car.player.PlayerHolder
import com.aimmovie.car.shell.AuthBridge
import com.aimmovie.car.shell.DataStoreKeyValueStorage
import com.aimmovie.car.shell.ShellStateStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

/**
 * 수동 DI 컨테이너. Application 이 하나를 보유하고 셸(MainActivity)·플레이어(PlayerActivity)가 여기서 의존성을 꺼낸다.
 *
 * Hilt 같은 프레임워크를 쓰지 않는 이유: 웹 셸 전환 뒤 의존 그래프가 더 작아졌고(토큰·재생 API·플레이어 정도),
 * 애노테이션 처리(kapt/ksp)로 빌드 시간과 설정을 늘리는 것보다 생성자 주입을 한곳에 적는 편이 읽기 쉽다.
 */
class AppContainer(context: Context) {
    /**
     * 앱 수명 스코프. 화면보다 오래 살아야 하는 작업(refresh 회전 저장, 시청 진행률 전송, 복원 기록 삭제)이 여기서 돈다.
     * SupervisorJob — 작업 하나가 실패해도 다른 작업까지 취소되지 않게 한다.
     */
    val appScope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val config: AppConfig = AppConfig.fromBuildConfig()

    private val okHttpClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    val transport: HttpTransport = OkHttpTransport(okHttpClient)

    /** 토큰 정본(방식 A). 웹은 브릿지(AuthBridge)로 access 만 받아 쓴다. */
    val tokenStore: TokenStore = TokenStore(KeystoreTokenStorage(context))
    val apiClient: ApiClient = ApiClient(config, transport, tokenStore, appScope)
    val authRepository: AuthRepository = AuthRepository(tokenStore, apiClient, appScope)
    val authBridge: AuthBridge = AuthBridge(tokenStore, apiClient)

    val catalogApi: CatalogApi = CatalogApi(config, transport)
    val videoStatusApi: VideoStatusApi = VideoStatusApi(apiClient, appScope)
    val drmLicenseApi: DrmLicenseApi = DrmLicenseApi(apiClient) { authRepository.isLoggedIn }

    /** 앱 전체에 하나뿐인 플레이어·MediaSession(동시 다중 스트림 금지). 재생 화면이 빌려 쓰고 떠날 때 돌려준다. */
    val playerHolder: PlayerHolder = PlayerHolder(context)

    /** 마지막 웹 화면·재생 위치(시스템 종료 후 재실행 복원). */
    val shellState: ShellStateStore = ShellStateStore(DataStoreKeyValueStorage(context))
}
