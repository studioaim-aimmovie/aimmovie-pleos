package com.aimmovie.car.data.api

import com.aimmovie.car.data.net.parseJsonObjectOrNull
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/** packages/core/src/api/videoStatus.ts 의 순수 계산 함수. */
class WatchProgressTest {

    @Test
    fun secondsToPercent_clampsAndGuardsDuration() {
        assertEquals(50.0, WatchProgress.secondsToPercent(50.0, 100.0), 0.0)
        assertEquals(100.0, WatchProgress.secondsToPercent(150.0, 100.0), 0.0)
        assertEquals(0.0, WatchProgress.secondsToPercent(-5.0, 100.0), 0.0)
        assertEquals(0.0, WatchProgress.secondsToPercent(50.0, 0.0), 0.0)
        assertEquals(0.0, WatchProgress.secondsToPercent(50.0, Double.POSITIVE_INFINITY), 0.0)
        assertEquals(0.0, WatchProgress.secondsToPercent(50.0, Double.NaN), 0.0)
    }

    @Test
    fun isWatchComplete_usesThreeSecondEpsilon() {
        assertTrue(WatchProgress.isWatchComplete(97.0, 100.0))
        assertFalse(WatchProgress.isWatchComplete(96.9, 100.0))
        assertFalse(WatchProgress.isWatchComplete(100.0, 0.0))
    }

    @Test
    fun mergeResumeStatus_fillsPlayAtAndParentFromList() {
        val data = parseJsonObjectOrNull(
            """
            {"result":true,
             "status":{"v1":{"play":12,"play_percent":10,"able":true},"v2":{"play":3,"playAt":"old","parent":"p0"}},
             "list":[{"video":"v1","playAt":"2026-01-01T00:00:00Z","parent":"c1"},
                     {"video":"v2"},
                     {"video":"ghost","playAt":"x"}]}
            """.trimIndent(),
        )
        val merged = WatchProgress.mergeResumeStatus(data)
        assertEquals(setOf("v1", "v2"), merged.keys)
        assertEquals(VideoStatus(play = 12.0, playPercent = 10.0, able = true, playAt = "2026-01-01T00:00:00Z", parent = "c1"), merged["v1"])
        assertEquals("old", merged["v2"]?.playAt)
        assertEquals("p0", merged["v2"]?.parent)
        assertEquals(emptyMap<String, VideoStatus>(), WatchProgress.mergeResumeStatus(parseJsonObjectOrNull("""{"result":false,"status":{}}""")))
        assertEquals(emptyMap<String, VideoStatus>(), WatchProgress.mergeResumeStatus(null))
    }
}
