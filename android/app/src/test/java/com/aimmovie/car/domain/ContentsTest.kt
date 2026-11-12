package com.aimmovie.car.domain

import com.aimmovie.car.data.api.VideoStatus
import com.aimmovie.car.data.config.AppConfig
import com.aimmovie.car.data.model.Content
import com.aimmovie.car.data.model.LocalizedText
import com.aimmovie.car.data.model.Season
import com.aimmovie.car.data.model.Stream
import com.aimmovie.car.data.model.StreamDrm
import com.aimmovie.car.data.model.StreamManifests
import com.aimmovie.car.data.model.Video
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/** packages/core/src/domain/contents.ts 의 분기마다 같은 입력에 같은 결과가 나오는지 본다. */
class ContentsTest {
    private val config = AppConfig(apiRoot = "https://cms.test", cdnUrl = "https://cdn.test")

    // ── resolveText ──

    @Test
    fun resolveText_picksLocaleCandidatesThenDefaultThenKorean() {
        val loc = LocalizedText.of("default" to "기본", "KR" to "국문", "US" to "English")
        assertEquals("국문", Contents.resolveText(loc, "ko"))
        assertEquals("English", Contents.resolveText(loc, "en"))
        // 후보에 없는 locale("") → default
        assertEquals("기본", Contents.resolveText(loc, ""))
        // 언어코드(ko/en)가 국가코드보다 먼저다
        assertEquals("en-code", Contents.resolveText(LocalizedText.of("en" to "en-code", "US" to "us"), "en"))
        // en 값이 비어 있으면 default, default 도 없으면 국문
        assertEquals("국문", Contents.resolveText(LocalizedText.of("US" to "", "KR" to "국문"), "en"))
        assertEquals("ko-code", Contents.resolveText(LocalizedText.of("ko" to "ko-code", "KR" to "국문"), "en"))
        assertEquals("", Contents.resolveText(null, "ko"))
        assertEquals("", Contents.resolveText(LocalizedText(), "ko"))
    }

    // ── imageUrl / resizedPath ──

    @Test
    fun hlsUrl_prefixesCdn() {
        assertEquals("https://cdn.test/v/master.m3u8", Contents.hlsUrl(config, "/v/master.m3u8"))
        assertEquals("https://x/m.m3u8", Contents.hlsUrl(config, "https://x/m.m3u8"))
        assertEquals("", Contents.hlsUrl(config, null))
        assertEquals("", Contents.hlsUrl(config, ""))
    }

    // ── 영상 선택 ──

    private fun video(id: String, duration: Double = 100.0, encrypted: Boolean = false, hls: String = "/$id.m3u8") =
        Video(id = id, stream = Stream(manifests = StreamManifests(hlsPath = hls), drm = StreamDrm(isEncrypted = encrypted), duration = duration))

    @Test
    fun resolveVideo_andFindVideoById() {
        val movie = Content(video = video("m"))
        val series = Content(seasons = listOf(Season(1, 1, video("e1")), Season(1, 2, video("e2"))))
        assertEquals("m", Contents.resolveVideo(movie)?.id)
        assertEquals("e1", Contents.resolveVideo(series)?.id)
        assertNull(Contents.resolveVideo(Content()))
        assertNull(Contents.resolveVideo(null))

        assertEquals("e2", Contents.findVideoById(series, "e2")?.id)
        assertEquals("m", Contents.findVideoById(movie, "m")?.id)
        // 못 찾으면/없으면 기본 영상
        assertEquals("e1", Contents.findVideoById(series, "nope")?.id)
        assertEquals("e1", Contents.findVideoById(series, null)?.id)
    }

    @Test
    fun findNextEpisode_sortsBySeasonThenEpisode() {
        val series = Content(
            seasons = listOf(
                Season(2, 1, video("s2e1")),
                Season(1, 2, video("s1e2")),
                Season(1, 1, video("s1e1")),
                Season(1, 3, null), // 영상 없는 회차는 제외
            ),
        )
        assertEquals("s1e2", Contents.findNextEpisode(series, "s1e1")?.video?.id)
        assertEquals("s2e1", Contents.findNextEpisode(series, "s1e2")?.video?.id)
        assertNull(Contents.findNextEpisode(series, "s2e1")) // 마지막
        assertNull(Contents.findNextEpisode(series, "unknown"))
        assertNull(Contents.findNextEpisode(series, null))
        assertNull(Contents.findNextEpisode(Content(video = video("m")), "m"))
        // season 누락은 1, episode 누락은 0 으로 본다
        val loose = Content(seasons = listOf(Season(null, 2, video("b")), Season(1, null, video("a"))))
        assertEquals("b", Contents.findNextEpisode(loose, "a")?.video?.id)
    }

    @Test
    fun pickLastWatchedVideoId_choosesLatestPlayAtWithProgress() {
        val map = mapOf(
            "a" to VideoStatus(play = 10.0, playAt = "2026-01-02T00:00:00Z"),
            "b" to VideoStatus(play = 20.0, playAt = "2026-01-03T00:00:00Z"),
            "c" to VideoStatus(play = 0.0, playAt = "2026-01-09T00:00:00Z"), // 재생 위치 0 → 제외
            "d" to VideoStatus(play = 5.0, playAt = null), // playAt 없음 → 제외
        )
        assertEquals("b", Contents.pickLastWatchedVideoId(map, listOf("a", "b", "c", "d", "")))
        assertEquals("a", Contents.pickLastWatchedVideoId(map, listOf("a", "c")))
        assertNull(Contents.pickLastWatchedVideoId(map, listOf("c", "d", "x")))
    }
}
