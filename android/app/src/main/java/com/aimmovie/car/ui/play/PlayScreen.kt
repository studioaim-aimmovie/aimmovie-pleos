// 터치 전용 재생 화면(PlayerActivity 가 띄운다). 탭하면 컨트롤을 보이거나 숨기고, 재생 중이면 몇 초 뒤 저절로 숨긴다(정지 중에는 숨기지 않는다).
// 버튼은 Pleos 터치 기준 76dp 이상이다.
//
// 영상 표면(PlayerView)은 RESIZE_MODE_FIT 로 비율을 지키며 화면 안에 맞춘다. 남는 검은 여백은 플레이어 안의 것이고
// 앱 창 자체는 구역 크기를 그대로 채운다(레터박스 아님). 구역 전환(세로 1구역 ↔ 가로 2구역)은 Activity 재생성 없이
// 이 Composable 만 다시 그려지고, 플레이어는 ViewModel·PlayerHolder 가 들고 있어 재생이 끊기지 않는다.
package com.aimmovie.car.ui.play

import androidx.activity.compose.BackHandler
import androidx.annotation.OptIn
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.aimmovie.car.R
import com.aimmovie.car.domain.Contents
import com.aimmovie.car.player.PlayerHolder
import com.aimmovie.car.ui.common.CarButton
import com.aimmovie.car.ui.theme.CarDimens
import com.aimmovie.car.ui.theme.Purple
import com.aimmovie.car.ui.theme.TextSecondary
import com.aimmovie.car.ui.theme.TextStrong
import kotlinx.coroutines.delay

/** 조작이 없으면 이만큼 뒤에 컨트롤을 감춘다. */
private const val CONTROLS_HIDE_MS = 5_000L

/** 버퍼링·준비가 이만큼 넘게 걸리면 "불러오는 중…" 문구를 더한다. 짧은 끊김에 글자가 번쩍이지 않게 한다. */
private const val LONG_WAIT_MS = 2_000L

/** 플레이어를 닫는 이유. 웹에 onPlaybackFinished 의 reason 으로 그대로 전달된다(web/src/native/bridge.ts). */
enum class PlayExit(val wire: String) {
    Closed("closed"),
    Ended("ended"),
    Blocked("blocked"),
    Error("error"),
}

/** @param onExit 화면을 닫고 웹 화면으로 돌아간다. */
@Composable
fun PlayScreen(vm: PlayViewModel, onExit: (PlayExit) -> Unit) {
    val state by vm.state.collectAsStateWithLifecycle()
    val exit = { reason: PlayExit ->
        vm.leave()
        onExit(reason)
    }
    val leave = { exit(PlayExit.Closed) }
    val toWeb = { exit(PlayExit.Error) }
    BackHandler(onBack = leave)

    // 앱이 뒤로 가거나 다른 화면이 위에 올라오면 멈춘다 — 백그라운드 재생을 하지 않는다.
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_START -> vm.onScreenStarted()
                Lifecycle.Event.ON_STOP -> vm.onScreenStopped()
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    // 유료 미구매(재실행 복원 사이 대여가 만료된 경우 등)는 웹 화면으로 돌려보낸다.
    LaunchedEffect(state.phase) { if (state.phase == PlayPhase.Blocked) exit(PlayExit.Blocked) }
    // 끝까지 봤고 이어 볼 회차가 없다.
    LaunchedEffect(state.finished) { if (state.finished) exit(PlayExit.Ended) }

    var controlsVisible by rememberSaveable { mutableStateOf(true) }
    // 조작할 때마다 올려 자동 숨김 타이머를 처음부터 다시 센다.
    var interaction by remember { mutableIntStateOf(0) }
    val poke: () -> Unit = { interaction++ }
    // 정지 상태에서는 감추지 않는다 — 화면만 멈춰 있으면 사용자가 조작 방법을 잃는다.
    // 시스템 미디어 컨트롤로 멈춘 경우에도 컨트롤을 다시 띄운다.
    LaunchedEffect(state.paused) { if (state.paused) controlsVisible = true }
    LaunchedEffect(controlsVisible, state.paused, interaction) {
        if (controlsVisible && !state.paused) {
            delay(CONTROLS_HIDE_MS)
            controlsVisible = false
        }
    }

    Box(Modifier.fillMaxSize().background(Color.Black)) {
        VideoSurface(vm.player, keepScreenOn = state.playing)
        // 탭 영역은 영상 위에 따로 둔다 — PlayerView 의 터치 처리에 기대지 않는다.
        Box(
            Modifier.fillMaxSize().pointerInput(Unit) {
                detectTapGestures {
                    controlsVisible = !controlsVisible
                    interaction++
                }
            },
        )

        when (val phase = state.phase) {
            PlayPhase.Loading -> BusyIndicator(busy = true)
            PlayPhase.Blocked -> Unit
            PlayPhase.LoadFailed -> FailurePanel(
                message = stringResource(R.string.player_load_failed),
                primary = stringResource(R.string.common_retry) to vm::retry,
                secondary = stringResource(R.string.player_back) to leave,
            )
            is PlayPhase.Failed -> FailureFor(phase.failure, retry = vm::retry, back = leave, toWeb = toWeb)
            PlayPhase.Ready -> {
                BusyIndicator(busy = state.buffering)
                AnimatedVisibility(visible = controlsVisible, enter = fadeIn(), exit = fadeOut()) {
                    val locale = vm.locale
                    Controls(
                        state = state,
                        title = Contents.resolveText(state.titles, locale),
                        subtitle = if (state.season != null && state.episode != null) {
                            stringResource(R.string.player_episode_label, state.season.toString(), state.episode.toString())
                        } else {
                            ""
                        },
                        actions = ControlActions(
                            back = leave,
                            togglePlay = { poke(); vm.togglePlay() },
                            seekBy = { poke(); vm.seekBy(it) },
                            seekTo = { poke(); vm.seekTo(it) },
                            next = { poke(); vm.playNext() },
                            interact = poke,
                        ),
                    )
                }
            }
        }
    }
}

@OptIn(UnstableApi::class)
@Composable
private fun VideoSurface(player: Player, keepScreenOn: Boolean) {
    AndroidView(
        factory = { ctx ->
            PlayerView(ctx).apply {
                // 컨트롤은 Compose 로 직접 그린다(PlayerView 기본 컨트롤은 터치 영역이 작고 차량 글자 크기와 맞지 않는다).
                useController = false
                resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
                setShutterBackgroundColor(android.graphics.Color.BLACK)
                // 회차 전환으로 소스가 바뀌는 동안 마지막 프레임을 남겨 검은 화면 깜빡임을 줄인다.
                setKeepContentOnPlayerReset(true)
                // Compose 안의 SurfaceView 가 크기 변경(구역 전환) 때 한 프레임 늦게 그려지는 문제를 피한다(Media3 권장 설정).
                setEnableComposeSurfaceSyncWorkaround(true)
                this.player = player
            }
        },
        update = {
            it.player = player
            it.keepScreenOn = keepScreenOn
        },
        onRelease = { it.player = null },
        modifier = Modifier.fillMaxSize(),
    )
}

/** 버퍼링 표시. 오래 걸리면 문구를 더한다. */
@Composable
private fun BusyIndicator(busy: Boolean) {
    var long by remember { mutableStateOf(false) }
    LaunchedEffect(busy) {
        long = false
        if (busy) {
            delay(LONG_WAIT_MS)
            long = true
        }
    }
    if (!busy) return
    // 가운데 재생 버튼(112dp)을 둘러싸는 크기로 그리고, 문구는 버튼 줄 아래에 둬서 컨트롤과 겹치지 않게 한다.
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = Purple, strokeWidth = 5.dp, modifier = Modifier.size(128.dp))
        if (long) {
            Text(
                stringResource(R.string.player_buffering),
                style = MaterialTheme.typography.bodyLarge,
                color = TextStrong,
                modifier = Modifier.padding(top = 200.dp),
            )
        }
    }
}

@Composable
private fun FailureFor(failure: PlayFailure, retry: () -> Unit, back: () -> Unit, toWeb: () -> Unit) {
    val retryLabel = stringResource(R.string.common_retry)
    val backLabel = stringResource(R.string.player_back)
    // DRM 실패는 다시 시도해도 같은 결과일 가능성이 높아 돌아가기만 둔다(웹에는 error 사유로 알린다).
    when (failure) {
        PlayFailure.NoSource -> FailurePanel(stringResource(R.string.player_no_source), primary = backLabel to back)
        PlayFailure.WidevineUnsupported -> FailurePanel(stringResource(R.string.car_player_drm_unsupported), primary = backLabel to toWeb)
        is PlayFailure.DrmDenied -> FailurePanel(
            failure.serverMessage ?: stringResource(R.string.car_player_drm_failed),
            primary = backLabel to toWeb,
        )
        PlayFailure.Drm -> FailurePanel(stringResource(R.string.car_player_drm_failed), primary = backLabel to toWeb)
        PlayFailure.Network -> FailurePanel(
            stringResource(R.string.common_network_error),
            primary = retryLabel to retry,
            secondary = backLabel to back,
        )
        PlayFailure.Playback -> FailurePanel(
            stringResource(R.string.player_error),
            primary = retryLabel to retry,
            secondary = backLabel to back,
        )
    }
}

@Composable
private fun FailurePanel(message: String, primary: Pair<String, () -> Unit>, secondary: Pair<String, () -> Unit>? = null) {
    Column(
        Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.7f)).padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(message, style = MaterialTheme.typography.titleMedium, color = TextStrong, textAlign = TextAlign.Center)
        Spacer(Modifier.height(32.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            CarButton(text = primary.first, onClick = primary.second)
            if (secondary != null) CarButton(text = secondary.first, onClick = secondary.second, primary = false)
        }
    }
}

private class ControlActions(
    val back: () -> Unit,
    val togglePlay: () -> Unit,
    val seekBy: (Long) -> Unit,
    val seekTo: (Long) -> Unit,
    val next: () -> Unit,
    val interact: () -> Unit,
)

@Composable
private fun Controls(state: PlayUiState, title: String, subtitle: String, actions: ControlActions) {
    // 위·아래를 어둡게 깔아 밝은 장면에서도 글자·버튼이 보이게 한다.
    val scrim = Brush.verticalGradient(
        0f to Color.Black.copy(alpha = 0.7f),
        0.3f to Color.Transparent,
        0.6f to Color.Transparent,
        1f to Color.Black.copy(alpha = 0.8f),
    )
    Box(Modifier.fillMaxSize().background(scrim)) {
        Row(
            Modifier.align(Alignment.TopStart).fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = actions.back, modifier = Modifier.size(CarDimens.Touch)) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = stringResource(R.string.player_back), tint = TextStrong, modifier = Modifier.size(40.dp))
            }
            Spacer(Modifier.width(8.dp))
            Column(Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleLarge, color = TextStrong, maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (subtitle.isNotEmpty()) Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = TextSecondary, maxLines = 1)
            }
        }

        Row(
            Modifier.align(Alignment.Center),
            horizontalArrangement = Arrangement.spacedBy(40.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            val step = (PlayerHolder.SEEK_STEP_MS / 1000).toString()
            SeekButton(forward = false, label = step, contentDescription = stringResource(R.string.player_rewind, step)) { actions.seekBy(-PlayerHolder.SEEK_STEP_MS) }
            RoundButton(
                icon = if (state.paused) Icons.Filled.PlayArrow else PauseIcon,
                contentDescription = stringResource(if (state.paused) R.string.player_play else R.string.player_pause),
                size = 112.dp,
                onClick = actions.togglePlay,
            )
            SeekButton(forward = true, label = step, contentDescription = stringResource(R.string.player_forward, step)) { actions.seekBy(PlayerHolder.SEEK_STEP_MS) }
        }

        Column(Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(horizontal = 24.dp, vertical = 16.dp)) {
            if (state.hasNext) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    CarButton(text = stringResource(R.string.car_player_next), onClick = actions.next, primary = false, icon = SkipNextIcon)
                }
                Spacer(Modifier.height(8.dp))
            }
            SeekBar(state.positionMs, state.durationMs, onSeek = actions.seekTo, onInteract = actions.interact)
            Row(Modifier.fillMaxWidth()) {
                Text(formatClock(state.positionMs), style = MaterialTheme.typography.bodyMedium, color = TextStrong)
                Spacer(Modifier.weight(1f))
                Text(formatClock(state.durationMs), style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
            }
        }
    }
}

/** 시크바. 끄는 동안은 손가락 위치를 보여 주고, 놓을 때 한 번만 이동한다(끄는 내내 seek 하면 버퍼링이 겹친다). */
@Composable
private fun SeekBar(positionMs: Long, durationMs: Long, onSeek: (Long) -> Unit, onInteract: () -> Unit) {
    var dragging by remember { mutableStateOf(false) }
    var dragValue by remember { mutableFloatStateOf(0f) }
    val fraction = if (durationMs > 0) (positionMs.toFloat() / durationMs).coerceIn(0f, 1f) else 0f
    Slider(
        value = if (dragging) dragValue else fraction,
        onValueChange = {
            dragging = true
            dragValue = it
            onInteract()
        },
        onValueChangeFinished = {
            if (durationMs > 0) onSeek((dragValue * durationMs).toLong())
            dragging = false
        },
        enabled = durationMs > 0,
        colors = SliderDefaults.colors(thumbColor = Purple, activeTrackColor = Purple, inactiveTrackColor = Color.White.copy(alpha = 0.35f)),
        modifier = Modifier.fillMaxWidth().height(CarDimens.Touch),
    )
}

@Composable
private fun RoundButton(icon: ImageVector, contentDescription: String, size: Dp, onClick: () -> Unit) {
    IconButton(
        onClick = onClick,
        modifier = Modifier.size(size).clip(CircleShape).background(Color.Black.copy(alpha = 0.45f)),
        colors = IconButtonDefaults.iconButtonColors(contentColor = TextStrong),
    ) {
        Icon(icon, contentDescription = contentDescription, modifier = Modifier.size(size * 0.6f))
    }
}

/** ±10초 버튼 — 원형 화살표 안에 초를 적는다. */
@Composable
private fun SeekButton(forward: Boolean, label: String, contentDescription: String, onClick: () -> Unit) {
    IconButton(
        onClick = onClick,
        modifier = Modifier.size(CarDimens.Touch + 12.dp).clip(CircleShape).background(Color.Black.copy(alpha = 0.45f)),
        colors = IconButtonDefaults.iconButtonColors(contentColor = TextStrong),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(if (forward) ForwardIcon else ReplayIcon, contentDescription = contentDescription, modifier = Modifier.size(56.dp))
            Text(label, color = TextStrong, fontSize = 14.sp, modifier = Modifier.padding(top = 6.dp))
        }
    }
}

/** 초 → "1:02:03" / "02:03". */
internal fun formatClock(ms: Long): String {
    val total = (ms.coerceAtLeast(0) / 1000)
    val h = total / 3600
    val m = (total % 3600) / 60
    val s = total % 60
    val mm = m.toString().padStart(2, '0')
    val ss = s.toString().padStart(2, '0')
    return if (h > 0) "$h:$mm:$ss" else "$mm:$ss"
}

// material-icons-core 에 없는 아이콘 몇 개. extended 묶음(수천 개)을 통째로 넣지 않으려고 Material 경로만 옮겨 둔다.
private fun icon(name: String, path: String): ImageVector =
    ImageVector.Builder(name = name, defaultWidth = 24.dp, defaultHeight = 24.dp, viewportWidth = 24f, viewportHeight = 24f)
        .addPath(pathData = addPathNodes(path), fill = SolidColor(Color.Black))
        .build()

private val PauseIcon = icon("Pause", "M6,19h4L10,5L6,5v14zM14,5v14h4L18,5h-4z")
private val SkipNextIcon = icon("SkipNext", "M6,18l8.5,-6L6,6v12zM16,6v12h2L18,6h-2z")
private val ReplayIcon = icon(
    "Replay",
    "M12,5V1L7,6l5,5V7c3.31,0 6,2.69 6,6s-2.69,6 -6,6 -6,-2.69 -6,-6H4c0,4.42 3.58,8 8,8s8,-3.58 8,-8 -3.58,-8 -8,-8z",
)
private val ForwardIcon = icon(
    "Forward",
    "M12,5V1l5,5 -5,5V7c-3.31,0 -6,2.69 -6,6s2.69,6 6,6 6,-2.69 6,-6h2c0,4.42 -3.58,8 -8,8s-8,-3.58 -8,-8 3.58,-8 8,-8z",
)
