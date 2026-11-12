// 세로/가로 레이아웃 판정 — CSS 믹스인(styles/globals.scss 의 mobile/desktop)과 같은 기준.
//
// 대부분의 분기는 CSS 미디어쿼리가 맡는다. 이 훅은 **마크업 자체가 달라야 하는 곳**에서만 쓴다
// (세로는 세로 포스터 이미지, 카드 행의 Swiper 설정, 하단 탭 노출 등).
//
// 기준: 폭 ≤ 높이 또는 폭 < 600px → 세로. 차량 네이티브 앱의 LayoutMode.kt 와 같다.
// `(orientation: portrait)` 는 "높이 ≥ 폭"이라 첫 조건과 정확히 같다.
//
// ⚠️ 이 훅을 쓰는 컴포넌트는 **모드가 바뀌어도 언마운트되지 않게** 둔다. 창 구역이 바뀔 때마다
// 화면을 통째로 다시 그리면 스크롤·입력값·조회 결과가 사라진다. 그래서 라우트·데이터를 쥔
// 상위(화면 컴포넌트)는 모드와 무관하게 같은 트리를 유지하고, 모양이 갈리는 말단에서만 이 값을 본다.

import { useSyncExternalStore } from "react";

export type LayoutMode = "portrait" | "landscape";

/** CSS `@include mobile` 과 같은 쿼리. 바꾸면 globals.scss 도 함께 바꾼다. */
export const PORTRAIT_QUERY = "(orientation: portrait), (max-width: 599px)";

function subscribe(onChange: () => void): () => void {
    const mql = window.matchMedia(PORTRAIT_QUERY);
    // resize 를 직접 듣지 않는다 — 경계를 넘을 때만 바뀌어야 리렌더가 창 크기 조절에 끌려가지 않는다.
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): LayoutMode {
    return window.matchMedia(PORTRAIT_QUERY).matches ? "portrait" : "landscape";
}

export function useLayoutMode(): LayoutMode {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** 세로 레이아웃인가. apps/web 의 `useDevice().isMobile` 자리에 쓴다. */
export function useIsPortrait(): boolean {
    return useLayoutMode() === "portrait";
}
