package com.aimmovie.car.ui.play

import com.aimmovie.car.data.api.VideoStatus
import com.aimmovie.car.data.model.Content
import com.aimmovie.car.data.net.AppJson
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** web/src/routes/Play.tsx resolvePlaySetup(권한 재확인·이어보기·다음 회차) + 시작 위치·복원 기록. */
class PlaySetupTest {
    private val series: Content = AppJson.decodeFromString(
        Content.serializer(),
        """{"_id":"c1","seasons":[
            {"_id":"s1","season":1,"episode":1,"video":{"_id":"v1","price":"무료","stream":{"duration":600}}},
            {"_id":"s2","season":1,"episode":2,"video":{"_id":"v2","price":"유료","popcorn":3,"stream":{"duration":600}}},
            {"_id":"s3","season":1,"episode":3,"video":{"_id":"v3","price":"무료","stream":{"duration":600}}},
            {"_id":"s4","season":1,"episode":4,"video":{"_id":"v4","price":"","stream":{"duration":600}}}]}""",
    )
    private val paidMovie: Content = AppJson.decodeFromString(
        Content.serializer(),
        """{"_id":"m1","video":{"_id":"mv","price":"유료","popcorn":5,"stream":{"duration":1200}}}""",
    )

    // ── 권한 재확인(시청기록·재실행 복원으로 바로 들어온 경우) ──

    @Test
    fun paidWithoutAble_isBlocked() {
        assertTrue(PlaySetupResolver.resolve(paidMovie, "", emptyMap()).blocked)
        assertTrue(PlaySetupResolver.resolve(paidMovie, "", mapOf("mv" to VideoStatus(able = false))).blocked)
        // 시리즈의 유료 회차를 직접 연 경우도 같다.
        assertTrue(PlaySetupResolver.resolve(series, "v2", emptyMap()).blocked)
    }

    @Test
    fun paidWithAble_orFree_isAllowed() {
        assertFalse(PlaySetupResolver.resolve(paidMovie, "", mapOf("mv" to VideoStatus(able = true))).blocked)
        assertFalse(PlaySetupResolver.resolve(series, "v1", emptyMap()).blocked)
    }

    @Test
    fun noVideo_isNoSource() {
        val empty = Content(id = "x")
        assertNull(PlaySetupResolver.resolve(empty, "", emptyMap()).video)
    }

    // ── 회차 선택 ──

    @Test
    fun emptyVideoId_seriesResumesLastWatched_elseFirst() {
        val status = mapOf(
            "v1" to VideoStatus(play = 590.0, playAt = "2026-10-01T00:00:00Z"),
            "v3" to VideoStatus(play = 120.0, playAt = "2026-10-05T00:00:00Z"),
        )
        val s = PlaySetupResolver.resolve(series, "", status)
        assertEquals("v3", s.video?.id)
        assertEquals(120.0, s.savedPlaySec, 0.0)
        assertEquals(1, s.season)
        assertEquals(3, s.episode)
        // 이력이 없으면 대표(첫) 회차.
        assertEquals("v1", PlaySetupResolver.resolve(series, "", emptyMap()).video?.id)
    }

    // ── 다음 회차(handleEndedImpl) ──

    @Test
    fun nextPlans_followTv() {
        // 무료 다음화 → 자동 재생
        assertEquals(NextPlan.AutoPlay, PlaySetupResolver.resolve(series, "v2", mapOf("v2" to VideoStatus(able = true))).next?.plan)
        // 유료 다음화 + 권한 없음 → 대여
        val toPaid = PlaySetupResolver.resolve(series, "v1", emptyMap()).next!!
        assertEquals("v2", toPaid.videoId)
        assertEquals(NextPlan.Rent, toPaid.plan)
        // 유료 다음화 + 권한 있음 → 자동 재생
        assertEquals(NextPlan.AutoPlay, PlaySetupResolver.resolve(series, "v1", mapOf("v2" to VideoStatus(able = true))).next?.plan)
        // 결제 유형 미설정 → 아무것도 안 함
        assertEquals(NextPlan.None, PlaySetupResolver.resolve(series, "v3", emptyMap()).next?.plan)
        // 마지막 회차·단편 → 다음 없음
        assertNull(PlaySetupResolver.resolve(series, "v4", emptyMap()).next)
        assertNull(PlaySetupResolver.resolve(paidMovie, "", mapOf("mv" to VideoStatus(able = true))).next)
    }

    // ── 시작 위치 ──

    @Test
    fun startPosition_resumeUsesServerUnlessNearEnd() {
        assertEquals(120_000L, StartPosition.resolveMs(PlayRequest.RESUME, 120.0, 600.0))
        assertEquals(0L, StartPosition.resolveMs(PlayRequest.RESUME, 0.0, 600.0))
        assertEquals(0L, StartPosition.resolveMs(PlayRequest.RESUME, 598.0, 600.0)) // 끝 3초 이내 → 처음부터
    }

    @Test
    fun startPosition_explicitWinsOverServer() {
        // 재실행 복원: 라우트에 담긴 위치가 서버 값보다 우선한다(서버 보고는 30초 주기라 더 오래됐을 수 있다).
        assertEquals(245_000L, StartPosition.resolveMs(245_000L, 120.0, 600.0))
        assertEquals(0L, StartPosition.resolveMs(0L, 120.0, 600.0))
        assertEquals(0L, StartPosition.resolveMs(599_000L, 120.0, 600.0)) // 사실상 끝 → 처음부터
        // 길이를 모르면 그대로 쓴다.
        assertEquals(30_000L, StartPosition.resolveMs(30_000L, 0.0, 0.0))
    }

    // ── 재실행 복원용 위치 기록 ──

    @Test
    fun checkpoint_everyIntervalOnChangedSecond() {
        val cp = RouteCheckpoint(intervalMs = 5_000)
        assertEquals(PlayRequest("c1", "v1", 12_000), cp.next("c1", "v1", 12_345, nowMs = 0))
        assertNull(cp.next("c1", "v1", 14_000, nowMs = 4_999)) // 주기 전
        assertEquals(PlayRequest("c1", "v1", 17_000), cp.next("c1", "v1", 17_900, nowMs = 5_000))
        assertNull(cp.next("c1", "v1", 17_100, nowMs = 10_000)) // 일시정지 — 같은 초는 다시 쓰지 않는다
        assertEquals(PlayRequest("c1", "v1", 18_000), cp.next("c1", "v1", 18_000, nowMs = 10_001, force = true))
    }

    @Test
    fun checkpoint_skipsZeroAndMissingVideo() {
        val cp = RouteCheckpoint()
        assertNull(cp.next("c1", "v1", 900, nowMs = 0, force = true)) // 0초 — 저장하면 서버 이어보기 대신 처음부터 시작해 버린다
        assertNull(cp.next("c1", "", 50_000, nowMs = 0, force = true))
    }

    @Test
    fun formatClock_matchesTvControls() {
        assertEquals("00:00", formatClock(-5))
        assertEquals("02:03", formatClock(123_900))
        assertEquals("1:02:03", formatClock(3_723_000))
    }
}
