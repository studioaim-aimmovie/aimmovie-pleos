// 원본: apps/web/components/player/player.tsx 의 saveProgress, apps/tv/src/routes/Play.tsx 의 saveProgress · handleEndedImpl
//
// 이어보기(videostatus/play) 보고 시점 판정. 플레이어 객체 없이 "지금 위치·길이"만 받아 보낼지 정한다 —
// 그래서 단위 테스트로 원본 규칙(중복 방지·완료 후 덮어쓰기 금지·미로그인 미전송)을 그대로 확인할 수 있다.
//
// 보고 시점(원본과 같다): 일시정지 / 종료(완료값 강제) / 화면 이탈 / 백그라운드 전환.
// 원본에 없는 것: 재생 중 주기 보고([periodicMs]). 원본(web·TV·모바일)에는 주기 보고가 없다 — 브라우저는 pagehide 가
// 마지막 기회를 주지만, Pleos 는 기어를 P 에서 빼는 순간 앱 프로세스를 종료해 아무 콜백도 오지 않는다.
// 그때 잃는 시청 위치를 줄이려고 30초마다 보낸다(서버 쓰기 부담과 손실 폭의 절충. 같은 초는 다시 보내지 않는다).
package com.aimmovie.car.player

import com.aimmovie.car.data.api.WatchProgress
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.roundToInt

class WatchReporter(
    /** 로그인 여부. 미로그인이면 아무것도 보내지 않는다(web authedRef 와 같다). */
    private val isAuthed: () -> Boolean,
    /** 실제 전송. play = 재생 위치(초, 정수), percent = 0~100 정수. */
    private val send: (videoId: String, play: Double, percent: Double) -> Unit,
    private val periodicMs: Long = PERIODIC_MS,
) {
    private var videoId = ""
    /** 동일 위치(초) 중복 전송 방지용 마지막 전송값. */
    private var lastSent = -1L
    /** 완료(ended) 이후엔 강제 저장만 허용한다. */
    private var ended = false
    private var lastPeriodicAt = 0L

    /** 새 영상 재생을 시작할 때 부른다. */
    fun start(videoId: String, nowMs: Long) {
        this.videoId = videoId
        lastSent = -1
        ended = false
        lastPeriodicAt = nowMs
    }

    /**
     * 현재 위치를 보고한다. 보냈으면 true.
     * @param force 이 위치(초)를 강제로 저장한다(종료 시 영상 길이). 완료 이후에도 허용된다.
     */
    fun save(positionSec: Double, durationSec: Double, force: Double? = null): Boolean {
        if (videoId.isEmpty()) return false
        if (!isAuthed()) return false
        // 완료 이후의 일시정지·이탈 저장이 완료값(100%)을 더 낮은 값으로 덮어쓰지 않게 한다.
        if (force == null && ended) return false
        // 재생 시작 전(0초)이면 저장할 게 없다.
        if (force == null && positionSec <= 0) return false
        val play = floor(force ?: positionSec).toLong()
        if (play <= 0 || play == lastSent) return false
        val percent = if (WatchProgress.isWatchComplete(play.toDouble(), durationSec)) {
            100.0
        } else {
            WatchProgress.secondsToPercent(play.toDouble(), durationSec).roundToInt().toDouble()
        }
        lastSent = play
        send(videoId, play.toDouble(), percent)
        return true
    }

    /** 재생 중 주기 보고. [periodicMs] 가 지났을 때만 [save] 한다. 보냈으면 true. */
    fun tick(positionSec: Double, durationSec: Double, playing: Boolean, nowMs: Long): Boolean {
        if (!playing || nowMs - lastPeriodicAt < periodicMs) return false
        lastPeriodicAt = nowMs
        return save(positionSec, durationSec)
    }

    /** 끝까지 봤다. 영상 길이(올림)로 강제 저장해 진행바가 정확히 100% 가 되게 한다(원본 force: Math.ceil(full)). */
    fun markEnded(durationSec: Double): Boolean {
        ended = true
        return save(durationSec, durationSec, force = ceil(durationSec))
    }

    companion object {
        const val PERIODIC_MS = 30_000L
    }
}
