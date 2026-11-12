// 네이티브 플레이어에 넘기는 재생 요청. 웹 브릿지 `play` 인자(apps/pleos src/native/bridge.ts 의 NativePlayRequest)와 같은 모양이다.
//
// 재실행 복원(ShellStateStore)도 같은 값을 저장했다가 그대로 플레이어에 넘긴다 — 진입 경로가 둘이어도 플레이어가 받는
// 입력은 하나로 둔다.
package com.aimmovie.car.ui.play

import kotlinx.serialization.Serializable

@Serializable
data class PlayRequest(
    /** 콘텐츠 _id. */
    val contentId: String,
    /** 회차 영상 _id. 비우면 마지막 본 회차 → 대표 영상 순으로 고른다. */
    val videoId: String = "",
    /**
     * 시작 위치(ms). [RESUME] 이면 서버에 저장된 이어보기 위치에서 시작한다(다음 회차로 넘어갈 때).
     * 0 이상이면 그 위치에서 시작한다 — 웹이 해석한 이어보기 위치나 재실행 복원 위치다.
     */
    val startPositionMs: Long = RESUME,
    /** 표시 언어(ko/en). 웹이 고른 언어로 제목·시스템 미디어 컨트롤 문구를 맞춘다. 비면 시스템 언어. */
    val lang: String = "",
) {
    companion object {
        const val RESUME = -1L
    }
}
