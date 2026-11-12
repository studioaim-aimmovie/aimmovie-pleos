// 원본: packages/core/src/domain/contents.ts
//
// 콘텐츠 가공 공용 규칙 중 **네이티브 플레이어가 쓰는 것만** 옮겨 둔다(제목 언어 선택, HLS/DASH 호스트 결합,
// 재생 영상 선택, 다음 회차, 마지막 본 회차). 이미지·등급 배지·카드 가공 등 화면 규칙은 웹 번들(apps/pleos)이
// @aim/core 를 그대로 쓰므로 웹 셸 전환(2026-10) 때 지웠다. 원본 TS 를 고치면 여기 남은 함수도 같이 맞춘다.
//
// 원본은 config 의 apiRoot()/cdnUrl() 전역을 읽는다. 여기서는 전역 대신 [AppConfig] 를 받는 함수로 둔다
// (테스트에서 호스트를 바꿔 끼우기 쉽고, 숨은 전역 상태가 없다).
package com.aimmovie.car.domain

import com.aimmovie.car.data.api.VideoStatusMap
import com.aimmovie.car.data.config.AppConfig
import com.aimmovie.car.data.model.Content
import com.aimmovie.car.data.model.LocalizedText
import com.aimmovie.car.data.model.Season
import com.aimmovie.car.data.model.Video

object Contents {
    // 표시 언어 → 조회 키 후보. 백엔드 로컬라이즈 값은 국가코드(국문 KR / 영문 US)로 저장되며,
    // 콘텐츠가 언어코드(ko/en)로 오는 경우도 있어 둘 다 후보에 둔다.
    private val LOCALE_CANDIDATES = mapOf(
        "ko" to listOf("ko", "KR"),
        "en" to listOf("en", "US"),
    )

    /**
     * 다국어 문자열에서 표시값을 고른다.
     * ko→KR, en→US로 매핑해 조회하고(언어코드 ko/en도 후보), 없으면 default → 최후엔 국문(KR)으로 폴백한다.
     */
    fun resolveText(loc: LocalizedText?, locale: String = ""): String {
        if (loc == null) return ""
        for (k in LOCALE_CANDIDATES[locale].orEmpty()) {
            loc[k]?.takeIf { it.isNotEmpty() }?.let { return it }
        }
        loc.default?.takeIf { it.isNotEmpty() }?.let { return it }
        return loc["ko"]?.takeIf { it.isNotEmpty() } ?: loc["KR"] ?: ""
    }

    /** HLS(m3u8) 경로에 CDN 호스트를 붙여 절대 URL로. 절대 URL이면 그대로. */
    fun hlsUrl(config: AppConfig, path: String?): String {
        if (path.isNullOrEmpty()) return ""
        return if (path.startsWith("http")) path else "${config.cdnUrl}$path"
    }

    /** 재생할 영상을 고른다. video에 값이 있으면 video로, 없으면 seasons의 첫 번째 영상으로 연결한다. */
    fun resolveVideo(contents: Content?): Video? = contents?.video ?: contents?.seasons?.firstOrNull()?.video

    /**
     * 콘텐츠 안에서 _id가 일치하는 영상을 찾는다(top video + seasons 전체 탐색).
     * videoId가 없거나 못 찾으면 기본 영상(resolveVideo)으로 폴백한다.
     */
    fun findVideoById(contents: Content?, videoId: String?): Video? {
        if (!videoId.isNullOrEmpty()) {
            if (contents?.video?.id == videoId) return contents.video
            contents?.seasons?.firstOrNull { it.video?.id == videoId }?.video?.let { return it }
        }
        return resolveVideo(contents)
    }

    /**
     * 시리즈에서 현재 에피소드 "다음" 에피소드를 (season, episode) 순으로 찾는다.
     * 영상이 있는 에피소드만 대상으로 하며, 다음이 없으면(마지막 회차/단편) null. 자동 재생용.
     */
    fun findNextEpisode(contents: Content?, currentVideoId: String?): Season? {
        val seasons = contents?.seasons.orEmpty().filter { !it.video?.id.isNullOrEmpty() }
        if (seasons.isEmpty() || currentVideoId.isNullOrEmpty()) return null
        // 원본: (a.season ?? 1) - (b.season ?? 1) || (a.episode ?? 0) - (b.episode ?? 0). sortedWith 는 안정 정렬이라 동률 순서도 같다.
        val sorted = seasons.sortedWith(compareBy<Season> { it.season ?: 1 }.thenBy { it.episode ?: 0 })
        val idx = sorted.indexOfFirst { it.video?.id == currentVideoId }
        if (idx < 0 || idx + 1 >= sorted.size) return null
        return sorted[idx + 1]
    }

    /**
     * ids 중 가장 최근에 재생한(playAt 최신, play>0) 영상 _id. 이력 없으면 null.
     * 웹 상세 '바로보기'와 플레이어가 "마지막 본 회차"를 동일 규칙으로 고르도록 원본과 같게 둔다.
     */
    fun pickLastWatchedVideoId(statusMap: VideoStatusMap, ids: List<String>): String? {
        var bestId: String? = null
        var bestAt = ""
        ids.filter { it.isNotEmpty() }.forEach { id ->
            val st = statusMap[id] ?: return@forEach
            val at = st.playAt
            if (at.isNullOrEmpty() || st.play <= 0) return@forEach // 재생 이력 없으면 제외
            if (at > bestAt) {
                bestAt = at
                bestId = id
            }
        }
        return bestId
    }
}
