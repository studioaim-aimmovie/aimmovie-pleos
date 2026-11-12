/**
 * 웹 플레이어 팩토리 — **폴백 전용**.
 *
 * 차량(네이티브 셸)에서는 `/play` 화면이 재생을 네이티브 Media3 로 넘기므로 여기까지 오지 않는다
 * (`src/native/playback.ts`). 이 팩토리는 브라우저 개발 환경과 브릿지 실패 시에만 쓰인다.
 *
 * | 조건 | 어댑터 | 이유 |
 * |---|---|---|
 * | MSE 있음(`Hls.isSupported()`) | `hlsjs` | Android WebView·데스크탑 Chrome 은 네이티브 HLS 가 없다 |
 * | MSE 없음 | `html5` | 네이티브 HLS 에 맡기는 마지막 폴백 |
 *
 * ⚠️ `canPlayType("application/vnd.apple.mpegurl")` 로 갈라서는 **안 된다.**
 * Chrome(데스크탑)은 실제로 HLS 를 재생하지 못하면서 `"maybe"` 를 돌려준다. MSE 지원 여부(`Hls.isSupported()`)만 본다.
 */

import { createHlsJsPlayer, isHlsJsSupported } from "./hlsjs";
import { createHtml5Player } from "./html5";
import type { PlayerAdapter, PlayerAdapterInit, PlayerKind } from "./PlayerAdapter";

export type {
    PlayerAdapter,
    PlayerAdapterInit,
    PlayerEvents,
    PlayerKind,
    PlayerLoadOptions,
} from "./PlayerAdapter";

/** 이 환경에서 쓸 어댑터 종류. 로그/디버그 표시에도 쓴다. */
export function resolvePlayerKind(): PlayerKind {
    return isHlsJsSupported() ? "hlsjs" : "html5";
}

/**
 * 웹 플레이어 어댑터를 만든다.
 *
 * ⚠️ 반환된 어댑터는 반드시 `destroy()` 로 정리해야 한다(미디어 요소·MSE 버퍼 반납).
 */
export function createPlayer(init: PlayerAdapterInit): PlayerAdapter {
    const kind = resolvePlayerKind();
    console.info(`[player] web fallback adapter=${kind}`);
    return kind === "hlsjs" ? createHlsJsPlayer(init) : createHtml5Player(init);
}
