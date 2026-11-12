package com.aimmovie.car.player

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/** 이어보기 보고 시점 — web/src/routes/Play.tsx 의 saveProgress 규칙 + 30초 주기 보고. */
class WatchReporterTest {
    private data class Sent(val video: String, val play: Double, val percent: Double)

    private var authed = true
    private val sent = mutableListOf<Sent>()
    private val reporter = WatchReporter(isAuthed = { authed }, send = { v, p, pct -> sent += Sent(v, p, pct) })

    @Test
    fun loggedOut_neverSends() {
        authed = false
        reporter.start("v1", nowMs = 0)
        assertFalse(reporter.save(120.0, 600.0))
        assertFalse(reporter.tick(130.0, 600.0, playing = true, nowMs = 60_000))
        assertFalse(reporter.markEnded(600.0))
        assertTrue(sent.isEmpty())
    }

    @Test
    fun save_floorsSecondsAndRoundsPercent_andSkipsSameSecond() {
        reporter.start("v1", nowMs = 0)
        assertTrue(reporter.save(100.9, 600.0))
        assertFalse(reporter.save(100.2, 600.0)) // 같은 초 — 중복 전송 안 함
        assertEquals(listOf(Sent("v1", 100.0, 17.0)), sent) // 100/600 = 16.67% → 17
    }

    @Test
    fun beforeStartOrAtZero_sendsNothing() {
        assertFalse(reporter.save(10.0, 600.0)) // start 전(영상 미정)
        reporter.start("v1", nowMs = 0)
        assertFalse(reporter.save(0.0, 600.0))
        assertFalse(reporter.save(0.7, 600.0)) // floor → 0
        assertTrue(sent.isEmpty())
    }

    @Test
    fun nearEnd_reports100Percent() {
        reporter.start("v1", nowMs = 0)
        reporter.save(598.0, 600.0) // 끝 3초 이내
        assertEquals(100.0, sent.single().percent, 0.0)
    }

    @Test
    fun ended_forcesCeilDuration_thenBlocksLowerOverwrites() {
        reporter.start("v1", nowMs = 0)
        assertTrue(reporter.markEnded(599.4))
        assertEquals(Sent("v1", 600.0, 100.0), sent.single())
        // 완료 이후 이탈·일시정지 저장은 막는다(완료값을 낮은 값으로 덮어쓰지 않게).
        assertFalse(reporter.save(10.0, 599.4))
        // 새 영상(다음 회차)을 시작하면 다시 보낸다.
        reporter.start("v2", nowMs = 0)
        assertTrue(reporter.save(10.0, 600.0))
        assertEquals("v2", sent.last().video)
    }

    @Test
    fun tick_sendsEvery30sOnlyWhilePlaying() {
        reporter.start("v1", nowMs = 1_000)
        assertFalse(reporter.tick(10.0, 600.0, playing = true, nowMs = 30_999)) // 아직 30초 전
        assertTrue(reporter.tick(30.0, 600.0, playing = true, nowMs = 31_000))
        assertFalse(reporter.tick(45.0, 600.0, playing = true, nowMs = 45_000))
        assertFalse(reporter.tick(60.0, 600.0, playing = false, nowMs = 90_000)) // 정지 중엔 주기 보고 안 함
        assertTrue(reporter.tick(61.0, 600.0, playing = true, nowMs = 90_000))
        assertEquals(listOf(30.0, 61.0), sent.map { it.play })
    }
}
