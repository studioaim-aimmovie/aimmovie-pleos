// 재생 넘기기 — 네이티브 플레이어 또는 웹 플레이어.
//
// 재생 진입은 모두 `/play/:id(?v=)` 경로를 거친다(compat/playAction.ts → routes/Play.tsx).
// `/play` 화면이 로그인·유료 게이트·마지막 본 회차·이어보기 위치를 한 번에 해석하고(resolvePlaySetup),
// 그 결과를 **여기 한 곳**에서 네이티브로 넘길지 웹 플레이어로 돌릴지 정한다.
//
// 해석을 웹에 둔 이유: 게이트·이어보기 판정은 이미 웹이 갖고 있는 로직이고,
// 네이티브는 "무엇을 어디서부터 틀지"만 받으면 된다. 같은 판정이 두 곳에 생기면 어긋난다.
// (네이티브도 시청 권한을 한 번 더 확인한다 — 재실행 복원은 웹을 거치지 않고 플레이어로 바로 들어가기 때문이다.)

import { useEffect, useState } from "react";
import { getBridge, onNativeEvent, request, type NativeResult } from "./bridge";

export interface PlaybackTarget {
    contentId: string;
    videoId: string;
    /** 시작 위치(초). /play 화면의 startAt 그대로. */
    startAtSec: number;
    /** 표시 언어(ko/en). */
    lang: string;
}

/**
 * 네이티브 셸이면 재생을 넘기고 그 결과를, 아니면 null 을 돌려준다.
 * null 이면 호출부(`/play` 화면)가 웹 플레이어(hls.js)로 재생한다 — 브라우저 개발 환경용 폴백이다.
 */
export function startNativePlayback(target: PlaybackTarget): Promise<NativeResult<null>> | null {
    if (!getBridge()) return null;
    return request("play", {
        contentId: target.contentId,
        videoId: target.videoId,
        startPositionMs: Math.max(0, Math.round(target.startAtSec * 1000)),
        lang: target.lang,
    });
}

/**
 * 네이티브 플레이어가 닫힐 때마다 1씩 오르는 값.
 *
 * 시청 상태를 조회하는 화면(상세 진행바·회차 목록, 홈 KV·카드, 마이페이지 시청기록)이 이 값을 이펙트 의존값에
 * 넣어 다시 조회한다. WebView 는 플레이어가 위를 덮는 동안 그대로 살아 있어 화면이 다시 마운트되지 않으므로,
 * 알려 주지 않으면 방금 본 위치가 진행바에 반영되지 않는다. 브라우저 개발 환경에서는 늘 0 이다.
 */
let playbackEpoch = 0;
const epochListeners = new Set<(n: number) => void>();
if (typeof window !== "undefined") {
    onNativeEvent("onPlaybackFinished", () => {
        playbackEpoch += 1;
        epochListeners.forEach((fn) => fn(playbackEpoch));
    });
}

export function usePlaybackEpoch(): number {
    const [epoch, setEpoch] = useState(playbackEpoch);
    useEffect(() => {
        epochListeners.add(setEpoch);
        return () => {
            epochListeners.delete(setEpoch);
        };
    }, []);
    return epoch;
}
