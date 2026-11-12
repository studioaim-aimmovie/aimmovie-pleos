// 재생 오류 분류. TV 는 어댑터 오류 문구를 그대로 보였지만, 차량 앱은 원인별로 다음 행동이 달라
// (네트워크 → 다시 시도 / DRM → 상세로 돌아가기) 오류 코드 대역으로 나눈다.
package com.aimmovie.car.player

import androidx.media3.common.PlaybackException

enum class PlaybackErrorKind {
    /** 네트워크·HTTP(IO 대역 2xxx). 다시 시도로 회복할 수 있다. */
    Network,

    /** DRM(6xxx) — 라이선스 거부·기기 보안 레벨 부족 등. 다시 시도해도 같은 결과일 가능성이 높아 상세로 돌려보낸다. */
    Drm,

    /** 그 밖(파싱·디코더 등). 한 번 더 시도해 볼 수 있게 둔다. */
    Other,
}

object PlaybackErrors {
    fun classify(errorCode: Int): PlaybackErrorKind = when (errorCode) {
        in IO_RANGE -> PlaybackErrorKind.Network
        in DRM_RANGE -> PlaybackErrorKind.Drm
        else -> PlaybackErrorKind.Other
    }

    // PlaybackException 의 오류 코드 대역(ERROR_CODE_IO_* = 2000~2999, ERROR_CODE_DRM_* = 6000~6999).
    private val IO_RANGE = PlaybackException.ERROR_CODE_IO_UNSPECIFIED until 3000
    private val DRM_RANGE = PlaybackException.ERROR_CODE_DRM_UNSPECIFIED until 7000
}
