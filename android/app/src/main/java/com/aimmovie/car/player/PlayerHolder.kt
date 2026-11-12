// 앱에 플레이어(ExoPlayer)와 MediaSession 을 하나만 둔다.
//
// 왜 Composable·ViewModel 밖(AppContainer)에 두는가:
//  - Pleos 는 동시 다중 스트림을 금지한다. 재생 화면이 겹쳐 열리는 순간(다음 회차 전환 등)에도 디코더를 둘 쓰지 않도록
//    인스턴스를 한곳에서만 만든다(TV 의 단일 하드웨어 디코더 문제와 같은 취지 — apps/tv/src/routes/Play.tsx 주석).
//  - 시스템 미디어 컨트롤은 PlaybackService(MediaSessionService)가 이 세션을 내보여 처리한다. 서비스와 화면이
//    같은 플레이어를 보려면 둘 다 꺼낼 수 있는 앱 수명 객체가 갖고 있어야 한다.
//
// 소유자(owner)를 기록해, 이전 소유자가 늦게 release 해도 새 소유자의 플레이어를 닫지 않게 한다.
// 모든 메서드는 메인 스레드에서 부른다(ExoPlayer 는 만든 스레드의 Looper 에서만 다룰 수 있다).
package com.aimmovie.car.player

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession

class PlayerHolder(context: Context) {
    private val context = context.applicationContext

    var player: ExoPlayer? = null
        private set
    var session: MediaSession? = null
        private set
    private var owner: Any? = null

    /** 플레이어를 받는다. 없으면 만들고 MediaSession·서비스를 함께 올린다. */
    @OptIn(UnstableApi::class)
    fun acquire(owner: Any): ExoPlayer {
        this.owner = owner
        player?.let { return it }
        val p = ExoPlayer.Builder(context)
            // handleAudioFocus = true — 내비 안내·통화가 오면 플레이어가 알아서 줄이거나 멈춘다.
            .setAudioAttributes(
                AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MOVIE).build(),
                true,
            )
            .setHandleAudioBecomingNoisy(true)
            .setSeekBackIncrementMs(SEEK_STEP_MS)
            .setSeekForwardIncrementMs(SEEK_STEP_MS)
            .build()
        player = p
        val activity = context.packageManager.getLaunchIntentForPackage(context.packageName)?.let {
            PendingIntent.getActivity(context, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        }
        session = MediaSession.Builder(context, p)
            .apply { if (activity != null) setSessionActivity(activity) }
            .build()
        try {
            // 화면이 앞에 있을 때만 부르므로 백그라운드 서비스 시작 제한에 걸리지 않는다. 그래도 실패하면
            // 세션 자체는 살아 있어 미디어 키는 받는다 — 재생을 막지 않고 로그만 남긴다.
            context.startService(Intent(context, PlaybackService::class.java))
        } catch (e: Exception) {
            Log.w(TAG, "PlaybackService 시작 실패", e)
        }
        return p
    }

    /** [owner] 가 지금 소유자일 때만 서비스·세션·플레이어를 정리한다. */
    fun release(owner: Any) {
        if (this.owner !== owner) return
        this.owner = null
        context.stopService(Intent(context, PlaybackService::class.java))
        session?.release()
        session = null
        player?.release()
        player = null
    }

    companion object {
        private const val TAG = "AimPlayer"
        /** 되감기/빨리감기 한 번의 이동량(TV Controls.tsx SEEK_STEP_SEC = 10). */
        const val SEEK_STEP_MS = 10_000L
    }
}
