// 재생 소스 판정(DRM 이면 dash_path, 아니면 hls_path). 플레이어(Media3)에 의존하지 않는 순수 규칙이라 단위 테스트로 확인한다.
package com.aimmovie.car.player

import com.aimmovie.car.data.config.AppConfig
import com.aimmovie.car.data.model.StreamDrm
import com.aimmovie.car.data.model.Video
import com.aimmovie.car.domain.Contents

sealed interface PlaySource {
    /** 비DRM HLS(master.m3u8). */
    data class Hls(val url: String) : PlaySource

    /** DRM DASH(stream.mpd) + Widevine. 라이선스 토큰은 재생 직전에 CMS 에서 받는다. */
    data class WidevineDash(val url: String) : PlaySource

    /** 재생할 수 없다. */
    data class Unplayable(val reason: Reason) : PlaySource

    enum class Reason {
        /** 매니페스트가 없다(player_no_source). */
        NoManifest,

        /** 암호화 영상인데 이 기기가 Widevine 을 지원하지 않는다. */
        WidevineUnsupported,
    }
}

object PlaySources {
    /**
     * 암호화 영상을 Widevine + DASH 로 재생할 수 있는지.
     *
     * CMS 의 drm.active_scheme 은 실제 DRM 시스템 이름이 아니라 암호화 여부만 나타낸다(암호화 = 'MULTI_DRM').
     * 어떤 DRM 을 쓸지는 플랫폼이 정한다 — is_encrypted 와 manifest 유무만 본다.
     */
    fun isWidevinePlayable(drm: StreamDrm?, dashUrl: String): Boolean = drm?.isEncrypted == true && dashUrl.isNotEmpty()

    /**
     * 영상 하나의 재생 소스를 고른다.
     *
     * @param widevineSupported 기기의 Widevine 지원 여부. 암호화 영상일 때만 부른다(MediaDrm 조회 비용을 아끼려고 지연 평가).
     *
     * 암호화 영상인데 DASH 가 없으면 HLS 로 폴백하지 않는다. 그 HLS 는 cbcs 암호화(FairPlay 용)라
     * Android 에서 복호화할 수 없다. 재생 시도 후 실패하느니 처음부터 "재생할 수 없음"으로 둔다.
     */
    fun select(config: AppConfig, video: Video?, widevineSupported: () -> Boolean): PlaySource {
        val stream = video?.stream ?: return PlaySource.Unplayable(PlaySource.Reason.NoManifest)
        // CDN 호스트 결합 규칙은 HLS·DASH 가 같다(DRM 문서: manifest = CDN_URL + dash_path, 절대 URL 이면 그대로).
        val dashUrl = Contents.hlsUrl(config, stream.manifests.dashPath)
        val hlsUrl = Contents.hlsUrl(config, stream.manifests.hlsPath)
        if (stream.drm.isEncrypted) {
            if (!isWidevinePlayable(stream.drm, dashUrl)) return PlaySource.Unplayable(PlaySource.Reason.NoManifest)
            if (!widevineSupported()) return PlaySource.Unplayable(PlaySource.Reason.WidevineUnsupported)
            return PlaySource.WidevineDash(dashUrl)
        }
        if (hlsUrl.isEmpty()) return PlaySource.Unplayable(PlaySource.Reason.NoManifest)
        return PlaySource.Hls(hlsUrl)
    }
}
