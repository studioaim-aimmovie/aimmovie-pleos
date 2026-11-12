// 네이티브 재생 화면. 웹 셸(MainActivity)이 브릿지 `play` 또는 재실행 복원으로 띄우고, 닫히면 결과를 돌려준다.
//
// 왜 별도 Activity 인가: WebView 와 같은 창에 Compose 플레이어를 겹쳐 두면 웹 화면이 뒤에서 계속 그려지고(차량 CPU),
// 시스템 뒤로가기·화면 꺼짐 유지·생명주기(멈춤)를 웹과 나눠 처리해야 한다. Activity 를 나누면 웹은 멈춘 채 그대로 남고,
// 플레이어를 닫는 순간 보던 웹 화면이 그대로 드러난다.
//
// 구역 전환(840↔1700↔2560)은 매니페스트 configChanges 로 받아 재생성하지 않는다 — ViewModel·PlayerHolder 가 플레이어를
// 들고 있어 재생이 끊기지 않는다(MainActivity 와 같은 선언).
package com.aimmovie.car.ui.play

import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.aimmovie.car.AimMovieApplication
import com.aimmovie.car.R
import com.aimmovie.car.data.net.AppJson
import com.aimmovie.car.player.WidevineSupport
import com.aimmovie.car.ui.common.displayLocale
import com.aimmovie.car.ui.theme.AimMovieTheme
import kotlinx.serialization.Serializable
import java.util.Locale

/** 플레이어가 닫힐 때 웹에 알리는 값(브릿지 이벤트 onPlaybackFinished 인자). */
@Serializable
data class PlaybackFinished(
    val contentId: String,
    val videoId: String,
    val positionMs: Long,
    /** closed / ended / blocked / error ([PlayExit.wire]). */
    val reason: String,
)

class PlayerActivity : ComponentActivity() {
    private val request: PlayRequest by lazy { readRequest(intent) ?: PlayRequest(contentId = "") }

    /** 웹이 고른 표시 언어(ko/en). 콘텐츠 제목·플레이어 문구·시스템 미디어 컨트롤 부제를 이 언어로 맞춘다. */
    private val lang: String by lazy { displayLocale(request.lang) }

    /** [lang] 으로 리소스를 고르는 Context. 시스템 언어와 웹 언어가 다르면 플레이어 문구가 웹과 어긋나지 않게 한다. */
    private val localized: Context by lazy {
        val config = Configuration(resources.configuration).apply { setLocale(Locale.forLanguageTag(lang)) }
        createConfigurationContext(config)
    }

    /**
     * 프로세스가 죽은 뒤 시스템이 이 화면을 되살린 경우(태스크 복원) 마지막 회차·위치. Intent 의 요청은 처음 연 시점의 값이라
     * 그대로 쓰면 처음 위치로 되돌아간다.
     */
    private var restored: PlayRequest? = null
    private var started = false

    private val vm: PlayViewModel by viewModels {
        viewModelFactory {
            initializer {
                val c = (application as AimMovieApplication).container
                PlayViewModel(
                    request = restored ?: request,
                    config = c.config,
                    catalogApi = c.catalogApi,
                    videoStatusApi = c.videoStatusApi,
                    drmLicenseApi = c.drmLicenseApi,
                    auth = c.authRepository,
                    playerHolder = c.playerHolder,
                    stateStore = c.shellState,
                    persistScope = c.appScope,
                    drmSupport = WidevineSupport,
                    locale = lang,
                    episodeLabel = { season, episode ->
                        localized.getString(R.string.player_episode_label, season.toString(), episode.toString())
                    },
                )
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (request.contentId.isEmpty()) {
            // 잘못된 진입(인자 없음). 빈 플레이어를 띄우지 않고 바로 돌아간다.
            finish()
            return
        }
        restored = savedInstanceState?.let { state ->
            val position = state.getLong(STATE_POSITION, -1)
            val videoId = state.getString(STATE_VIDEO).orEmpty()
            if (position > 0 && videoId.isNotEmpty()) request.copy(videoId = videoId, startPositionMs = position) else null
        }
        started = true
        setContent {
            CompositionLocalProvider(
                LocalContext provides localized,
                LocalConfiguration provides localized.resources.configuration,
            ) {
                AimMovieTheme {
                    PlayScreen(vm, onExit = ::exit)
                }
            }
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        if (!started) return
        outState.putString(STATE_VIDEO, vm.currentVideoId)
        outState.putLong(STATE_POSITION, vm.currentPositionMs)
    }

    private fun exit(reason: PlayExit) {
        val result = PlaybackFinished(
            contentId = request.contentId,
            videoId = vm.currentVideoId,
            positionMs = vm.currentPositionMs,
            reason = reason.wire,
        )
        setResult(RESULT_OK, Intent().putExtra(EXTRA_RESULT, AppJson.encodeToString(PlaybackFinished.serializer(), result)))
        finish()
    }

    companion object {
        private const val EXTRA_REQUEST = "com.aimmovie.car.PLAY_REQUEST"
        private const val EXTRA_RESULT = "com.aimmovie.car.PLAY_RESULT"
        private const val STATE_VIDEO = "video"
        private const val STATE_POSITION = "position"

        fun intent(context: Context, request: PlayRequest): Intent =
            Intent(context, PlayerActivity::class.java)
                .putExtra(EXTRA_REQUEST, AppJson.encodeToString(PlayRequest.serializer(), request))

        private fun readRequest(intent: Intent?): PlayRequest? = intent?.getStringExtra(EXTRA_REQUEST)?.let {
            runCatching { AppJson.decodeFromString(PlayRequest.serializer(), it) }.getOrNull()
        }

        /** 결과 Intent → 웹 이벤트 인자. 결과 없이 닫혔으면(프로세스 정리 등) null. */
        fun readResult(data: Intent?): PlaybackFinished? = data?.getStringExtra(EXTRA_RESULT)?.let {
            runCatching { AppJson.decodeFromString(PlaybackFinished.serializer(), it) }.getOrNull()
        }
    }
}
