// 원본: apps/tv/src/routes/Play.tsx (콘텐츠 조회 → resolvePlaySetup → 플레이어 생성·진행률 저장·다음 회차),
//       mobile/lib/pages/player_page.dart (DRM 이면 라이선스 발급 → Widevine DASH)
//
// 재생 화면 상태. 플레이어는 PlayerHolder(앱 수명)에서 빌려 쓰고 이 ViewModel 이 사라질 때 돌려준다 —
// ViewModel 은 구역 전환(Configuration 변경, Activity 재생성 없음)에도 남으므로 재생이 끊기지 않는다.
// 화면은 웹 셸(MainActivity) 위에 뜨는 PlayerActivity 다. 웹이 브릿지 `play` 로 넘긴 요청, 또는 재실행 복원이 저장해 둔 요청으로 연다.
//
// TV 와 다른 점:
//  - 다음 회차를 라우트 교체(router.replace)가 아니라 같은 화면에서 소스만 바꿔 연다. 플레이어·세션을 새로 만들지 않아
//    "화면 두 개가 잠깐 겹치며 플레이어 두 개가 존재"하는 구간이 생기지 않는다(Pleos 동시 다중 스트림 금지).
//  - 재실행 복원을 위해 재생 위치를 ShellStateStore 에 주기적으로 적는다(RouteCheckpoint). 정상적으로 닫으면 지운다.
//  - 유료 다음 회차에 권한이 없으면 대여 창을 띄우지 않는다(차량 앱은 대여를 끔 — NextPlan.Rent 주석).
//  - 재생 중 30초마다 이어보기를 보고한다(WatchReporter 주석 — 기어 변경 시 프로세스가 콜백 없이 종료된다).
package com.aimmovie.car.ui.play

import android.os.SystemClock
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import com.aimmovie.car.BuildConfig
import com.aimmovie.car.data.api.CatalogApi
import com.aimmovie.car.data.api.DrmLicenseApi
import com.aimmovie.car.data.net.ApiException
import com.aimmovie.car.data.api.DrmLicenseResult
import com.aimmovie.car.data.api.VideoStatusApi
import com.aimmovie.car.data.api.VideoStatusMap
import com.aimmovie.car.data.auth.AuthRepository
import com.aimmovie.car.data.config.AppConfig
import com.aimmovie.car.data.model.Content
import com.aimmovie.car.data.model.LocalizedText
import com.aimmovie.car.data.model.Video
import com.aimmovie.car.domain.Contents
import com.aimmovie.car.player.DrmSupport
import com.aimmovie.car.player.PlaySource
import com.aimmovie.car.player.PlaySources
import com.aimmovie.car.player.PlaybackErrorKind
import com.aimmovie.car.player.PlaybackErrors
import com.aimmovie.car.player.PlayerHolder
import com.aimmovie.car.player.WatchReporter
import com.aimmovie.car.shell.ShellStateStore
import com.aimmovie.car.ui.common.marketCountry
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/** 재생할 수 없는 이유. 화면은 이유마다 문구와 다음 행동(다시 시도 / 상세로)을 다르게 보여 준다. */
sealed interface PlayFailure {
    data object NoSource : PlayFailure
    data object WidevineUnsupported : PlayFailure

    /** 라이선스 발급 거부. [serverMessage] 가 있으면 그대로 보여 준다(관리자 전용 테스트 기간 등). */
    data class DrmDenied(val serverMessage: String?) : PlayFailure

    /** 재생 중 DRM 오류(라이선스 서버 거부·보안 레벨 부족 등). */
    data object Drm : PlayFailure
    data object Network : PlayFailure
    data object Playback : PlayFailure
}

sealed interface PlayPhase {
    data object Loading : PlayPhase

    /** 콘텐츠 정보 조회 실패 → 다시 시도. */
    data object LoadFailed : PlayPhase

    /** 유료 미구매 → 웹 화면으로 돌아간다. */
    data object Blocked : PlayPhase
    data object Ready : PlayPhase
    data class Failed(val failure: PlayFailure) : PlayPhase
}

data class PlayUiState(
    val phase: PlayPhase = PlayPhase.Loading,
    /** 제목은 화면이 표시 언어로 고른다(언어가 바뀌어도 재조회·재생 중단이 없게 — TV 주석과 같은 취지). */
    val titles: LocalizedText = LocalizedText(),
    val season: Int? = null,
    val episode: Int? = null,
    val hasNext: Boolean = false,
    val playing: Boolean = false,
    /** 사용자가 멈춘 상태(playWhenReady=false). 버퍼링 중에는 playing 이 false 여도 paused 는 아니다 — 버튼 모양·자동 숨김 기준. */
    val paused: Boolean = true,
    val buffering: Boolean = false,
    val positionMs: Long = 0,
    val durationMs: Long = 0,
    /** 끝까지 봤고 이어 볼 회차가 없다 → 화면을 닫고 웹으로 돌아간다. */
    val finished: Boolean = false,
)

class PlayViewModel(
    request: PlayRequest,
    private val config: AppConfig,
    private val catalogApi: CatalogApi,
    private val videoStatusApi: VideoStatusApi,
    private val drmLicenseApi: DrmLicenseApi,
    private val auth: AuthRepository,
    private val playerHolder: PlayerHolder,
    private val stateStore: ShellStateStore,
    /**
     * 복원 기록을 쓰는 스코프(앱 수명). 화면을 닫는 순간 viewModelScope 가 취소되므로, "정상 종료 → 기록 삭제"가
     * 끝까지 가려면 화면보다 오래 사는 스코프여야 한다. 지우지 못하면 다음 실행에 플레이어가 다시 열린다.
     */
    private val persistScope: CoroutineScope,
    private val drmSupport: DrmSupport,
    /** 콘텐츠 제목 언어 키(ko/en). 웹이 넘긴 표시 언어를 쓴다. */
    val locale: String,
    /** "시즌 1 · 2회차" — 시스템 미디어 컨트롤에 보일 부제. */
    private val episodeLabel: (season: Int, episode: Int) -> String,
    private val clock: () -> Long = SystemClock::elapsedRealtime,
) : ViewModel() {
    private val _state = MutableStateFlow(PlayUiState())
    val state: StateFlow<PlayUiState> = _state.asStateFlow()

    private val contentId = request.contentId
    private val lang = request.lang

    /** 화면(PlayerView)이 붙일 플레이어. 이 ViewModel 이 살아 있는 동안만 유효하다. */
    val player: ExoPlayer = playerHolder.acquire(this)

    private val reporter = WatchReporter(isAuthed = { auth.isLoggedIn }, send = ::sendProgress)
    private val checkpoint = RouteCheckpoint()

    private var content: Content? = null
    private var setup: PlaySetup? = null
    private var statusMap: VideoStatusMap = emptyMap()
    private var requestedVideoId = request.videoId
    private var requestedStartMs = request.startPositionMs
    private var loadJob: Job? = null

    /** 화면이 보이는 동안만 재생 위치를 기록한다(앱이 뒤로 갔을 때는 쉰다). */
    private var screenVisible = true

    /** 화면을 떠나는 중 — 이후에는 위치를 기록하지 않는다. 떠난 뒤 기록이 다시 써지면 재실행 때 플레이어가 다시 열린다. */
    private var leaving = false

    /**
     * 복원 기록 쓰기를 부른 순서대로 실행한다. 주기 기록(저장)이 늦게 끝나 닫을 때의 삭제를 덮어쓰면 안 된다 —
     * Mutex 는 대기 순서(FIFO)를 지키고, 호출은 모두 메인 스레드에서 UNDISPATCHED 로 시작해 잠금 요청 순서가 호출 순서와 같다.
     */
    private val persistLock = Mutex()

    private val listener = object : Player.Listener {
        override fun onIsPlayingChanged(isPlaying: Boolean) {
            _state.update { it.copy(playing = isPlaying) }
        }

        // 일시정지(화면 버튼·시스템 미디어 컨트롤·오디오 포커스 상실 모두) 시점에 보고한다(원본 onPause → saveProgress).
        override fun onPlayWhenReadyChanged(playWhenReady: Boolean, reason: Int) {
            _state.update { it.copy(paused = !playWhenReady) }
            if (!playWhenReady) saveNow()
        }

        override fun onPlaybackStateChanged(playbackState: Int) {
            _state.update { it.copy(buffering = playbackState == Player.STATE_BUFFERING) }
            when (playbackState) {
                Player.STATE_READY -> updatePosition()
                Player.STATE_ENDED -> handleEnded()
                // 시스템 미디어 컨트롤의 stop — playWhenReady 는 그대로라 위 콜백이 오지 않는다.
                Player.STATE_IDLE -> if (player.playerError == null) saveNow()
                Player.STATE_BUFFERING -> Unit
            }
        }

        override fun onPlayerError(error: PlaybackException) {
            saveNow()
            Log.w(TAG, "재생 오류 ${error.errorCodeName}", error)
            val failure = when (PlaybackErrors.classify(error.errorCode)) {
                PlaybackErrorKind.Network -> PlayFailure.Network
                PlaybackErrorKind.Drm -> PlayFailure.Drm
                PlaybackErrorKind.Other -> PlayFailure.Playback
            }
            _state.update { it.copy(phase = PlayPhase.Failed(failure), buffering = false) }
        }
    }

    init {
        player.addListener(listener)
        load()
        viewModelScope.launch {
            while (isActive) {
                delay(TICK_MS)
                onTick()
            }
        }
    }

    // ── 조작 ──

    fun togglePlay() {
        when (player.playbackState) {
            // 시스템 stop 이후: 다시 준비부터.
            Player.STATE_IDLE -> {
                player.prepare()
                player.play()
            }
            // 끝까지 본 뒤 다시 재생: 처음부터, 보고도 새로 시작한다.
            Player.STATE_ENDED -> {
                setup?.video?.id?.let { reporter.start(it, clock()) }
                player.seekToDefaultPosition()
                player.play()
            }
            else -> if (player.playWhenReady) player.pause() else player.play()
        }
    }

    fun seekBy(deltaMs: Long) = seekTo(player.currentPosition + deltaMs)

    fun seekTo(positionMs: Long) {
        val duration = player.duration.takeIf { it != C.TIME_UNSET && it > 0 } ?: _state.value.durationMs
        player.seekTo(if (duration > 0) positionMs.coerceIn(0, duration) else positionMs.coerceAtLeast(0))
        updatePosition()
    }

    /** 다음 회차 버튼. 무료·권한 있음만 보인다(유료 미구매는 대여를 끈 차량 앱에서 버튼을 숨긴다). */
    fun playNext() {
        val next = setup?.next?.takeIf { it.plan == NextPlan.AutoPlay } ?: return
        switchEpisode(next.videoId)
    }

    /** 같은 화면에서 다른 회차로 바꾼다. 서버 이어보기 위치에서 시작한다. */
    fun switchEpisode(videoId: String) {
        saveNow()
        requestedVideoId = videoId
        requestedStartMs = PlayRequest.RESUME
        player.stop()
        player.clearMediaItems()
        if (!leaving) persist { stateStore.savePlayback(PlayRequest(contentId = contentId, videoId = videoId, lang = lang)) }
        load()
    }

    /** 다시 시도. 보던 영상이면 보던 위치에서 이어 간다(라이선스·콘텐츠도 다시 받는다). */
    fun retry() {
        val current = setup?.video?.id
        if (current != null && player.currentMediaItem != null) {
            requestedVideoId = current
            player.currentPosition.takeIf { it > 0 }?.let { requestedStartMs = it }
        }
        load()
    }

    /** 화면이 다시 보인다(백 스택에서 돌아옴·앱이 앞으로). 재생은 사용자가 다시 누른다. */
    fun onScreenStarted() {
        screenVisible = true
    }

    /** 화면이 가려진다(앱이 뒤로·다른 화면이 위에). 백그라운드 재생을 하지 않으므로 멈추고 위치를 남긴다. */
    fun onScreenStopped() {
        saveNow()
        screenVisible = false
        player.pause()
    }

    /** 화면을 떠난다(뒤로 가기·끝·권한 없음·실패). 위치를 보고하고, 복원 기록을 지운 뒤 더 이상 기록하지 않는다. */
    fun leave() {
        if (leaving) return
        leaving = true
        reporter.save(positionSec(), durationSec())
        player.pause()
        persist { stateStore.clearPlayback() }
    }

    /** 지금 보고 있는 회차와 위치(웹에 돌려줄 onPlaybackFinished 인자). */
    val currentVideoId: String get() = setup?.video?.id ?: requestedVideoId
    val currentPositionMs: Long get() = player.currentPosition.coerceAtLeast(0)

    override fun onCleared() {
        // 화면 이탈 직전 위치를 저장한 뒤 파기한다(원본 이펙트 cleanup). 전송은 앱 스코프라 끝까지 간다.
        reporter.save(positionSec(), durationSec())
        player.removeListener(listener)
        playerHolder.release(this)
    }

    // ── 내부 ──

    private fun load() {
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            _state.update { it.copy(phase = PlayPhase.Loading, buffering = false) }
            val c = content ?: fetchContent()
            if (c == null) {
                _state.update { it.copy(phase = PlayPhase.LoadFailed) }
                // 서버에 콘텐츠가 없다(삭제·비노출). 다시 시도해도 안 되므로 복원 기록을 지운다 — 남겨 두면 앱을 열 때마다
                // 이 플레이어가 다시 떠서 같은 오류를 보여 준다. 네트워크 오류는 다음 실행에 다시 시도하도록 남긴다.
                if (contentGone) persist { stateStore.clearPlayback() }
                return@launch
            }
            content = c
            // 회차 전체의 시청 상태를 한 번에 받는다 — 마지막 본 회차·권한 재확인·이어보기·다음 회차 권한이 모두 여기서 나온다.
            // 미로그인(debug 미리보기)이면 요청하지 않는다.
            statusMap = if (auth.isLoggedIn) videoStatusApi.fetchWatchStatus(PlaySetupResolver.episodeIds(c)) else emptyMap()
            val s = PlaySetupResolver.resolve(c, requestedVideoId, statusMap)
            setup = s
            _state.update {
                it.copy(titles = c.titles, season = s.season, episode = s.episode, hasNext = s.next?.plan == NextPlan.AutoPlay)
            }
            val video = s.video ?: run {
                fail(PlayFailure.NoSource)
                return@launch
            }
            if (s.blocked) {
                _state.update { it.copy(phase = PlayPhase.Blocked) }
                return@launch
            }
            val item = buildMediaItem(c, s, video) ?: return@launch
            val startMs = StartPosition.resolveMs(requestedStartMs, s.savedPlaySec, video.stream?.duration ?: 0.0)
            reporter.start(video.id, clock())
            player.setMediaItem(item, startMs)
            player.prepare()
            player.playWhenReady = true
            _state.update { it.copy(phase = PlayPhase.Ready, positionMs = startMs, durationMs = cmsDurationMs()) }
        }
    }

    /** 마지막 콘텐츠 조회가 "없음"(404)으로 실패했는지. 네트워크 오류와 구분해 복원 기록 정리에 쓴다. */
    private var contentGone = false

    private suspend fun fetchContent(): Content? = try {
        contentGone = false
        val res = catalogApi.getContentShow(contentId, auth.marketCountry())
        res.data?.takeIf { res.result }
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        contentGone = e is ApiException && e.status == 404
        Log.w(TAG, "콘텐츠 조회 실패: $contentId", e)
        null
    }

    /** 재생 소스 → MediaItem. 재생할 수 없으면 상태를 바꾸고 null. */
    private suspend fun buildMediaItem(c: Content, s: PlaySetup, video: Video): MediaItem? {
        val builder = MediaItem.Builder()
            .setMediaId(video.id)
            .setMediaMetadata(
                MediaMetadata.Builder()
                    .setTitle(title(c))
                    .setArtist(if (s.season != null && s.episode != null) episodeLabel(s.season, s.episode) else null)
                    .build(),
            )
        return when (val src = PlaySources.select(config, video) { drmSupport.isWidevineSupported() }) {
            is PlaySource.Hls -> builder.setUri(src.url).setMimeType(MimeTypes.APPLICATION_M3U8).build()
            is PlaySource.WidevineDash -> {
                drmSupport.logWidevineSecurityLevel()
                when (val r = drmLicenseApi.fetchLicense(video.id)) {
                    is DrmLicenseResult.Granted -> builder
                        .setUri(src.url)
                        .setMimeType(MimeTypes.APPLICATION_MPD)
                        .setDrmConfiguration(
                            MediaItem.DrmConfiguration.Builder(C.WIDEVINE_UUID)
                                .setLicenseUri(r.license.licenseUrl)
                                // DoveRunner 토큰을 응답이 알려 준 헤더에 싣는다(모바일 BetterPlayerDrmConfiguration.headers 와 같다).
                                .setLicenseRequestHeaders(mapOf(r.license.headerName to r.license.token))
                                .build(),
                        )
                        .build()
                    DrmLicenseResult.NeedUnlock -> {
                        _state.update { it.copy(phase = PlayPhase.Blocked) }
                        null
                    }
                    DrmLicenseResult.LoginRequired -> fail(PlayFailure.DrmDenied(null))
                    is DrmLicenseResult.Denied -> fail(PlayFailure.DrmDenied(r.serverMessage))
                    is DrmLicenseResult.Failed -> {
                        Log.w(TAG, "DRM 라이선스 발급 실패: ${r.reason}")
                        fail(PlayFailure.Network)
                    }
                }
            }
            is PlaySource.Unplayable -> fail(
                if (src.reason == PlaySource.Reason.WidevineUnsupported) PlayFailure.WidevineUnsupported else PlayFailure.NoSource,
            )
        }
    }

    private fun fail(failure: PlayFailure): MediaItem? {
        _state.update { it.copy(phase = PlayPhase.Failed(failure)) }
        return null
    }

    private fun title(c: Content): String = Contents.resolveText(c.titles, locale)

    /** 종료: 완료값 강제 저장 + 다음 회차(TV handleEndedImpl). */
    private fun handleEnded() {
        updatePosition()
        reporter.markEnded(durationSec())
        val next = setup?.next
        if (next?.plan == NextPlan.AutoPlay) {
            switchEpisode(next.videoId)
            return
        }
        // 이어 볼 회차가 없다(마지막 회차·단편·유료 미구매 다음 회차) → 웹 화면으로 돌아간다.
        // 웹 상세가 회차 목록·대여 안내를 보여 준다.
        _state.update { it.copy(finished = true) }
    }

    private fun onTick() {
        if (_state.value.phase != PlayPhase.Ready) return
        updatePosition()
        val now = clock()
        reporter.tick(positionSec(), durationSec(), player.isPlaying, now)
        recordCheckpoint(now, force = false)
    }

    /** 일시정지·이탈·백그라운드 시점의 보고 + 위치 기록. */
    private fun saveNow() {
        if (!auth.isLoggedIn && BuildConfig.DEBUG) Log.d(TAG, "미로그인 — 이어보기 보고 생략")
        reporter.save(positionSec(), durationSec())
        recordCheckpoint(clock(), force = true)
    }

    private fun recordCheckpoint(now: Long, force: Boolean) {
        if (leaving || !screenVisible) return
        val videoId = setup?.video?.id ?: return
        val route = checkpoint.next(contentId, videoId, player.currentPosition, now, force) ?: return
        persist { stateStore.savePlayback(route.copy(lang = lang)) }
    }

    private fun persist(block: suspend () -> Unit) {
        persistScope.launch(start = CoroutineStart.UNDISPATCHED) { persistLock.withLock { block() } }
    }

    private fun sendProgress(videoId: String, play: Double, percent: Double) {
        if (BuildConfig.DEBUG) Log.d(TAG, "이어보기 보고 video=$videoId play=$play percent=$percent")
        videoStatusApi.sendWatchProgress(videoId, play, percent)
    }

    private fun updatePosition() {
        val duration = player.duration.takeIf { it != C.TIME_UNSET && it > 0 } ?: cmsDurationMs()
        _state.update { it.copy(positionMs = player.currentPosition.coerceAtLeast(0), durationMs = duration) }
    }

    private fun positionSec(): Double = player.currentPosition.coerceAtLeast(0) / 1000.0

    /** CMS stream.duration 우선(원본과 같다 — 종료 시 이 값으로 저장해 진행바가 정확히 100% 가 되게 한다). */
    private fun durationSec(): Double {
        val cms = setup?.video?.stream?.duration ?: 0.0
        if (cms > 0) return cms
        return player.duration.takeIf { it != C.TIME_UNSET && it > 0 }?.let { it / 1000.0 } ?: 0.0
    }

    private fun cmsDurationMs(): Long = ((setup?.video?.stream?.duration ?: 0.0) * 1000).toLong()

    private companion object {
        const val TAG = "AimPlayer"
        /** 진행 시간·시크바 갱신 주기. 초 단위 표시라 0.5초면 충분하다. */
        const val TICK_MS = 500L
    }
}
