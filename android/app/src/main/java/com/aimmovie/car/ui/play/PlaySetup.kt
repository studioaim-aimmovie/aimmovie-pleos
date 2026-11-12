// 짝: web/src/routes/Play.tsx 의 resolvePlaySetup · handleEndedImpl
//
// 재생 준비에 필요한 값(재생할 회차·권한 재확인·이어보기 위치·다음 회차)을 한 번에 해석한다. 네트워크·플레이어 없이
// 콘텐츠와 시청 상태만 받는 순수 함수라 단위 테스트로 확인한다.
//
// 권한을 여기서 다시 확인하는 이유: 웹(/play)이 권한을 확인한 회차만 넘기지만, 재실행 복원은 웹을 거치지
// 않고 저장해 둔 재생 요청으로 플레이어를 바로 연다. 그 사이 대여가 만료됐을 수 있어 막힌 영상이면 웹 화면으로 돌아간다.
package com.aimmovie.car.ui.play

import com.aimmovie.car.data.api.VideoStatusMap
import com.aimmovie.car.data.api.WatchProgress
import com.aimmovie.car.data.model.Content
import com.aimmovie.car.data.model.Video
import com.aimmovie.car.domain.Contents

/** 영상이 끝났을 때 다음 회차를 어떻게 할지(web handleEndedImpl 분기). */
enum class NextPlan {
    /** 무료, 또는 유료지만 시청권(able)이 있다 → 바로 이어 재생. */
    AutoPlay,

    /**
     * 유료 + 시청권 없음. 차량 앱은 대여를 끄고 있어(`VITE_RENT_ENABLED=false`) 플레이어에서 대여 창을 띄우지 않는다 —
     * 다음 회차 버튼을 숨기고, 끝나면 웹 화면(상세의 대여 안내)으로 돌아간다.
     */
    Rent,

    /** 결제 유형 미설정 등 — 아무것도 하지 않는다. */
    None,
}

data class NextEpisode(
    val videoId: String,
    val price: String,
    val season: Int?,
    val episode: Int?,
    val able: Boolean,
) {
    val plan: NextPlan
        get() = when {
            price == FREE -> NextPlan.AutoPlay
            price == PlaySetupResolver.PAID && able -> NextPlan.AutoPlay
            price == PlaySetupResolver.PAID -> NextPlan.Rent
            else -> NextPlan.None
        }

    companion object {
        const val FREE = "무료"
    }
}

data class PlaySetup(
    /** 재생할 영상. null 이면 재생할 영상이 없다(player_no_source). */
    val video: Video?,
    /** 유료 미구매 → 상세로 돌려보낸다. */
    val blocked: Boolean = false,
    /** 서버에 저장된 이어보기 위치(초). 시작 위치는 [StartPosition.resolveMs] 가 정한다. */
    val savedPlaySec: Double = 0.0,
    /** 현재 회차의 시즌/에피소드. 단편이면 null — 부제 문구는 화면이 만든다. */
    val season: Int? = null,
    val episode: Int? = null,
    val next: NextEpisode? = null,
)

object PlaySetupResolver {
    const val PAID = "유료"

    /** 대표 영상 + 모든 회차 영상 _id(중복 제거). 시청 상태를 한 번에 조회하는 데 쓴다. */
    fun episodeIds(content: Content): List<String> =
        (listOf(Contents.resolveVideo(content)?.id) + content.seasons.map { it.video?.id })
            .filterNotNull()
            .filter { it.isNotEmpty() }
            .distinct()

    /**
     * @param videoIdParam 라우트의 회차 _id. 비면 시리즈는 마지막 본 회차, 그 외는 대표 영상(상세 '바로보기'와 같다).
     * @param statusMap 회차 전체의 시청 상태(미로그인이면 빈 맵).
     */
    fun resolve(content: Content, videoIdParam: String, statusMap: VideoStatusMap): PlaySetup {
        val ids = episodeIds(content)
        val videoId = videoIdParam.ifEmpty {
            if (content.seasons.any { !it.video?.id.isNullOrEmpty() }) Contents.pickLastWatchedVideoId(statusMap, ids).orEmpty() else ""
        }
        val video = Contents.findVideoById(content, videoId.ifEmpty { null })
        if (video == null || video.id.isEmpty()) return PlaySetup(video = null)

        // 서버측 게이트가 없으므로 여기서 유료 권한을 확인한다.
        if (video.price == PAID && statusMap[video.id]?.able != true) return PlaySetup(video = video, blocked = true)

        val current = content.seasons.firstOrNull { it.video?.id == video.id }
        val nextEp = Contents.findNextEpisode(content, video.id)
        val nextVideo = nextEp?.video
        val next = nextVideo?.id?.takeIf { it.isNotEmpty() }?.let { nextId ->
            NextEpisode(
                videoId = nextId,
                price = nextVideo.price.orEmpty(),
                season = nextEp.season,
                episode = nextEp.episode,
                able = statusMap[nextId]?.able == true,
            )
        }
        return PlaySetup(
            video = video,
            savedPlaySec = statusMap[video.id]?.play ?: 0.0,
            season = current?.season,
            episode = current?.episode,
            next = next,
        )
    }
}

object StartPosition {
    /**
     * 시작 위치(ms).
     *  - [routeStartMs] 가 0 이상: 그 위치(웹이 해석한 이어보기 위치, 또는 재실행 복원 시 ShellStateStore 가 담아 둔 마지막 재생 위치).
     *  - [PlayRequest.RESUME]: 서버 이어보기 위치(다음 회차로 넘어갈 때). 0 이거나 사실상 끝(끝 3초 이내)이면 처음부터.
     * 명시 위치도 사실상 끝이면 처음부터 본다 — 다 본 영상을 다시 열었는데 바로 종료되면 안 되기 때문이다.
     */
    fun resolveMs(routeStartMs: Long, savedPlaySec: Double, durationSec: Double): Long {
        if (routeStartMs >= 0) {
            return if (WatchProgress.isWatchComplete(routeStartMs / 1000.0, durationSec)) 0 else routeStartMs
        }
        return if (savedPlaySec > 0 && !WatchProgress.isWatchComplete(savedPlaySec, durationSec)) (savedPlaySec * 1000).toLong() else 0
    }
}

/**
 * 재실행 복원용 재생 위치 기록(ShellStateStore 에 넣을 PlayRequest) 판정.
 *
 * [intervalMs] 마다 한 번, 초 단위로 내린 위치가 바뀌었을 때만 새 라우트를 낸다 — 일시정지 중에는 같은 값이라 쓰지 않는다.
 * 0 초는 기록하지 않는다. 0 을 명시 위치로 저장하면 재실행 때 서버 이어보기 위치 대신 처음부터 시작해 버린다.
 */
class RouteCheckpoint(private val intervalMs: Long = INTERVAL_MS) {
    private var lastAt = Long.MIN_VALUE
    private var last: PlayRequest? = null

    /** [force] 면 주기와 관계없이 판정한다(일시정지·백그라운드 전환 시). 저장할 라우트가 없으면 null. */
    fun next(contentId: String, videoId: String, positionMs: Long, nowMs: Long, force: Boolean = false): PlayRequest? {
        if (!force && lastAt != Long.MIN_VALUE && nowMs - lastAt < intervalMs) return null
        lastAt = nowMs
        val seconds = positionMs / 1000
        if (seconds <= 0 || videoId.isEmpty()) return null
        val route = PlayRequest(contentId = contentId, videoId = videoId, startPositionMs = seconds * 1000)
        if (route == last) return null
        last = route
        return route
    }

    companion object {
        const val INTERVAL_MS = 5_000L
    }
}
