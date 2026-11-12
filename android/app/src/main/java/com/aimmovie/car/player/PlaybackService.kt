// 시스템 미디어 컨트롤 연동(Pleos 필수 요건: MediaSession play/pause/stop).
//
// 세션과 플레이어는 PlayerHolder 가 소유한다. 이 서비스는 그 세션을 시스템(미디어 센터·알림·외부 컨트롤러)에
// 내보이고, 재생 중에 미디어 포그라운드 서비스로 올라가는 일만 한다. 재생 화면을 떠나면 PlayerHolder.release 가
// 이 서비스를 멈춘다 — 주행 중 오디오(백그라운드 재생)는 1차 범위에서 제외했다.
package com.aimmovie.car.player

import android.content.Intent
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.aimmovie.car.AimMovieApplication

class PlaybackService : MediaSessionService() {
    private val holder: PlayerHolder get() = (application as AimMovieApplication).container.playerHolder

    override fun onCreate() {
        super.onCreate()
        // 시작 요청과 생성 사이에 화면이 이미 떠났으면(세션 없음) 바로 끝낸다.
        val session = holder.session ?: return stopSelf()
        // 컨트롤러가 붙기 전에도 알림·포그라운드 관리를 받도록 미리 등록한다.
        addSession(session)
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = holder.session

    /** 최근 앱 목록에서 앱을 지우면 재생도 멈춘다(백그라운드 재생을 하지 않는다). */
    override fun onTaskRemoved(rootIntent: Intent?) {
        holder.player?.pause()
        stopSelf()
    }
}
