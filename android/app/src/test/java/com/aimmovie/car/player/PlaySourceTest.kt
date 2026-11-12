package com.aimmovie.car.player

import com.aimmovie.car.data.config.AppConfig
import com.aimmovie.car.data.model.Stream
import com.aimmovie.car.data.model.StreamDrm
import com.aimmovie.car.data.model.StreamManifests
import com.aimmovie.car.data.model.Video
import androidx.media3.common.PlaybackException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/** 재생 소스 판정 규칙. */
class PlaySourceTest {
    private val config = AppConfig(apiRoot = "https://cms.test", cdnUrl = "https://cdn.test")

    private fun video(hls: String = "", dash: String = "", encrypted: Boolean = false) = Video(
        id = "v1",
        stream = Stream(manifests = StreamManifests(hlsPath = hls, dashPath = dash), drm = StreamDrm(isEncrypted = encrypted)),
    )

    private val never: () -> Boolean = { error("비DRM 영상에서 Widevine 지원 여부를 조회하면 안 된다") }

    @Test
    fun clear_usesHlsWithCdnHost() {
        assertEquals(PlaySource.Hls("https://cdn.test/a/hls/f/master.m3u8"), PlaySources.select(config, video(hls = "/a/hls/f/master.m3u8"), never))
        // 절대 URL 은 그대로.
        assertEquals(PlaySource.Hls("https://x.test/m.m3u8"), PlaySources.select(config, video(hls = "https://x.test/m.m3u8"), never))
    }

    @Test
    fun clear_ignoresDashEvenIfPresent() {
        val v = video(hls = "/h/master.m3u8", dash = "/h/stream.mpd")
        assertEquals(PlaySource.Hls("https://cdn.test/h/master.m3u8"), PlaySources.select(config, v, never))
    }

    @Test
    fun encrypted_usesDashWhenWidevineSupported() {
        val v = video(hls = "/a/cmaf/master.m3u8", dash = "/a/cmaf/stream.mpd", encrypted = true)
        assertEquals(PlaySource.WidevineDash("https://cdn.test/a/cmaf/stream.mpd"), PlaySources.select(config, v) { true })
    }

    @Test
    fun encrypted_withoutWidevine_isUnsupported() {
        val v = video(hls = "/a/cmaf/master.m3u8", dash = "/a/cmaf/stream.mpd", encrypted = true)
        assertEquals(PlaySource.Unplayable(PlaySource.Reason.WidevineUnsupported), PlaySources.select(config, v) { false })
    }

    @Test
    fun encrypted_withoutDash_doesNotFallBackToEncryptedHls() {
        val v = video(hls = "/a/cmaf/master.m3u8", encrypted = true)
        assertEquals(PlaySource.Unplayable(PlaySource.Reason.NoManifest), PlaySources.select(config, v) { true })
    }

    @Test
    fun noStreamOrManifest_isNoSource() {
        assertEquals(PlaySource.Unplayable(PlaySource.Reason.NoManifest), PlaySources.select(config, Video(id = "v"), never))
        assertEquals(PlaySource.Unplayable(PlaySource.Reason.NoManifest), PlaySources.select(config, video(), never))
        assertEquals(PlaySource.Unplayable(PlaySource.Reason.NoManifest), PlaySources.select(config, null, never))
    }

    @Test
    fun isWidevinePlayable_followsMobile() {
        assertTrue(PlaySources.isWidevinePlayable(StreamDrm(isEncrypted = true, activeScheme = "MULTI_DRM"), "https://cdn/x.mpd"))
        assertFalse(PlaySources.isWidevinePlayable(StreamDrm(isEncrypted = true), ""))
        // active_scheme 은 보지 않는다(암호화 여부만).
        assertFalse(PlaySources.isWidevinePlayable(StreamDrm(isEncrypted = false, activeScheme = "WIDEVINE"), "https://cdn/x.mpd"))
    }

    @Test
    fun errorClassification() {
        assertEquals(PlaybackErrorKind.Network, PlaybackErrors.classify(PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED))
        assertEquals(PlaybackErrorKind.Network, PlaybackErrors.classify(PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS))
        assertEquals(PlaybackErrorKind.Drm, PlaybackErrors.classify(PlaybackException.ERROR_CODE_DRM_LICENSE_ACQUISITION_FAILED))
        assertEquals(PlaybackErrorKind.Drm, PlaybackErrors.classify(PlaybackException.ERROR_CODE_DRM_SCHEME_UNSUPPORTED))
        assertEquals(PlaybackErrorKind.Other, PlaybackErrors.classify(PlaybackException.ERROR_CODE_DECODING_FAILED))
        assertEquals(PlaybackErrorKind.Other, PlaybackErrors.classify(PlaybackException.ERROR_CODE_PARSING_MANIFEST_MALFORMED))
    }
}
