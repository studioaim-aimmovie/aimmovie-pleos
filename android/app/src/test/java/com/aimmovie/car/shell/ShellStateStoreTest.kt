package com.aimmovie.car.shell

import com.aimmovie.car.ui.play.PlayRequest
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** 재실행 복원 — 마지막 웹 해시 경로와 "재생 중 종료" 기록. */
class ShellStateStoreTest {
    @Test
    fun restorableRoutes_skipLoginPlayAndNonHash() {
        listOf("/", "/contents/abc", "/list/movie?x=1", "/mypage", "/search").forEach { assertTrue(it, ShellStateStore.isRestorableRoute(it)) }
        listOf("/login", "/login?next=/mypage", "/play/abc", "/play/abc?v=v1", "", "https://evil.test/").forEach {
            assertFalse(it, ShellStateStore.isRestorableRoute(it))
        }
    }

    @Test
    fun webRoute_keepsLastRestorableValue() = runTest {
        val storage = InMemoryKeyValueStorage()
        val store = ShellStateStore(storage)
        assertNull(store.loadWebRoute())
        store.saveWebRoute("/contents/abc")
        // /play 경유·로그인 화면은 마지막 화면으로 덮어쓰지 않는다 — 재실행하면 상세로 돌아와야 한다.
        store.saveWebRoute("/play/abc?v=v1")
        store.saveWebRoute("/login")
        assertEquals("/contents/abc", ShellStateStore(storage).loadWebRoute())

        // 저장소에 옛 버전이 남긴 이상한 값이 있어도 복원하지 않는다.
        storage.write("web_route", "/play/zzz")
        assertNull(store.loadWebRoute())
    }

    @Test
    fun playback_roundTripsAndClears() = runTest {
        val storage = InMemoryKeyValueStorage()
        val store = ShellStateStore(storage)
        val req = PlayRequest(contentId = "c1", videoId = "v1", startPositionMs = 12_000, lang = "en")
        store.savePlayback(req)
        assertEquals(req, ShellStateStore(storage).loadPlayback())
        store.clearPlayback()
        assertNull(store.loadPlayback())

        store.savePlayback(req)
        storage.write("playback", "{broken")
        assertNull(store.loadPlayback())
        storage.write("playback", """{"contentId":""}""")
        assertNull(store.loadPlayback())
    }

    @Test
    fun playback_expiresAfterRestoreWindow() = runTest {
        val storage = InMemoryKeyValueStorage()
        var now = 1_000_000L
        val store = ShellStateStore(storage) { now }
        val req = PlayRequest(contentId = "c1", videoId = "v1", startPositionMs = 4_000)
        store.savePlayback(req)

        now += ShellStateStore.PLAYBACK_RESTORE_WINDOW_MS
        assertEquals(req, store.loadPlayback())
        // 창을 넘기면 플레이어를 자동으로 열지 않는다(몇 시간 뒤 재생이 저절로 시작되지 않게).
        now += 1
        assertNull(store.loadPlayback())
        // 시계가 뒤로 간 경우도 믿지 않는다.
        now = 0
        assertNull(store.loadPlayback())
    }

    @Test
    fun playback_withoutSavedAt_isIgnored() = runTest {
        // 저장 시각을 남기기 전 버전이 쓴 기록 — 실측에서 지워진 콘텐츠를 실행마다 다시 열던 원인이다.
        val storage = InMemoryKeyValueStorage()
        storage.write("playback", """{"contentId":"c1","videoId":"v1","startPositionMs":4000,"lang":"ko"}""")
        assertNull(ShellStateStore(storage).loadPlayback())
    }
}
