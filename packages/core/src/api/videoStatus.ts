"use client";

// 시청 진행률 저장 클라이언트 유틸.
// 재생 중 pause/ended/이탈 시점에 프론트 API 프록시(/api/videostatus/play)로
// { video, play } 를 보낸다. 사용자 식별(user)은 프록시가 세션에서 채워 CMS로 전달한다.
//
// play = 재생 위치(초). 이어보기에 그대로 seek할 수 있도록 %가 아닌 초로 저장한다.

import type { LocalizedText, ContentLabel } from "../types/contents";
import { authBeacon, authFetch } from "../config";

/** 프론트 API 프록시 경로. 여기서 세션 user를 붙여 CMS authapi로 포워딩한다. */
const ENDPOINT = "/api/videostatus/play";
const RESUME_ENDPOINT = "/api/videostatus/resume";
const ABLE_ENDPOINT = "/api/videostatus/able";
const UNLOCK_ENDPOINT = "/api/popcorn/unlock";
const BALANCE_ENDPOINT = "/api/popcorn/balance";
const WATCHED_ENDPOINT = "/api/videostatus/watched";

/** 시청기록 항목(백엔드 /authapi/videostatus/watched row). */
export interface WatchHistoryItem {
    /** 이 비디오가 속한 콘텐츠. 재생 링크(_id)·포스터·제목의 정본. */
    contents?: {
        _id: string;
        titles?: LocalizedText;
        images?: { poster_horizontal?: string; poster_vertical?: string };
        /** 콘텐츠 등급 — 배지(badge_type1) 표기용. */
        content_rating?: string;
        /** 개봉연도 — video_info 표기용. */
        release_year?: number | string | null;
        /** 제작사 — video_info 표기용. */
        production_company?: string;
        /** 시리즈 여부 — true면 러닝타임 숨김(백엔드 경량 플래그). */
        is_series?: boolean;
        /** 포스터 위 오버레이 라벨(populate된 label 필요). 없을 수 있다. */
        labels?: ContentLabel[];
    };
    video: {
        _id: string;
        titles?: LocalizedText;
        images?: { poster_horizontal?: string; poster_vertical?: string };
        /** 재생 링크용 콘텐츠 _id (있으면 사용). */
        parent?: string | null;
        stream?: { duration?: number };
        price?: string;
        /** 유료 시 필요한 팝콘 수(대여 모달 표시용). 응답에 없을 수 있다. */
        popcorn?: number;
    };
    play?: number;
    play_percent?: number;
    playAt?: string | null;
    able?: boolean;
}

/** 로그인 유저의 시청기록 전체(최신순)를 조회한다. 미로그인/실패/없음이면 빈 배열. */
export async function fetchWatchHistory(): Promise<WatchHistoryItem[]> {
    try {
        const res = await authFetch(WATCHED_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data?.result && Array.isArray(data.list) ? (data.list as WatchHistoryItem[]) : [];
    } catch {
        return [];
    }
}

/**
 * 시청기록을 삭제한다. videos(영상 _id 배열)를 주면 그 영상들만, 비우면 전체 삭제.
 * able(시청 권한)은 보존된다. 성공 시 true.
 */
export async function deleteWatchHistory(videos: string[] = []): Promise<boolean> {
    try {
        const res = await authFetch(`${WATCHED_ENDPOINT}/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videos }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        return !!data?.result;
    } catch {
        return false;
    }
}

/** 현재 팝콘 잔고를 조회한다. 미로그인/실패 시 null. */
export async function getPopcornBalance(): Promise<number | null> {
    try {
        const res = await authFetch(BALANCE_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data?.result ? Number(data.balance ?? 0) : null;
    } catch {
        return null;
    }
}

/** 유료 콘텐츠 시청 권한 열람(팝콘 차감) 응답. */
export interface UnlockResult {
    result: boolean;
    /** 시청 권한 부여됨 */
    able?: boolean;
    /** 이미 시청 가능(재차감 없이 통과) */
    already?: boolean;
    /** 이번에 차감된 팝콘 */
    charged?: number;
    /** 차감 후 잔고 */
    balance_after?: number;
    /** 멱등키로 중복 요청이었음 */
    duplicated?: boolean;
    /** 실패 사유 코드(잔고 부족 등) */
    reason?: string;
    message?: string;
}

/**
 * 유료 콘텐츠 시청 권한을 연다(서버가 video.popcorn 기준으로 팝콘 차감 후 able 부여).
 * 가격은 서버가 소유하며, 이미 able이면 재차감 없이 통과(already). 잔고 부족 시 result:false + reason.
 */
export async function unlockVideo(
    video: string,
    opts: { days?: number; idempotencyKey?: string } = {},
): Promise<UnlockResult> {
    if (!video) return { result: false, message: "영상 정보가 필요합니다." };
    try {
        const res = await authFetch(UNLOCK_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                video,
                days: opts.days ?? 0,
                idempotencyKey: opts.idempotencyKey,
            }),
        });
        return (await res.json().catch(() => ({ result: false }))) as UnlockResult;
    } catch {
        return { result: false, message: "네트워크 연결을 확인해주세요." };
    }
}

/**
 * 시청 가능 여부(able)를 기록한다. (팝콘 구매 등)
 * days > 0 이면 그 기간 후 자동 만료(TTL). 성공 시 true.
 */
export async function setWatchAble(
    video: string,
    able: boolean,
    days = 0,
): Promise<boolean> {
    if (!video) return false;
    try {
        const res = await authFetch(ABLE_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ video, able, days }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        return !!data?.result;
    } catch {
        return false;
    }
}

/** 영상 1건의 시청 상태. (CMS videostatus/resume 응답의 status 값) */
export interface VideoStatus {
    /** 마지막 재생 위치(초) */
    play: number;
    /** 마지막 시청 진행률(%) 0~100 — 진행바 표시용. (CMS가 내려주면 이 값을 우선 사용) */
    play_percent?: number;
    /** 재생 가능 여부 */
    able?: boolean;
    /** able 만료 시각(ISO) */
    ableExpireAt?: string | null;
    /** 마지막 재생 이벤트 시각(ISO). "마지막으로 본 회차" 판정용. */
    playAt?: string | null;
    /** 이 영상이 속한 콘텐츠 _id. 콘텐츠 단위로 "마지막 본 회차"를 묶을 때 사용. */
    parent?: string | null;
}

/** { videoId: VideoStatus } 맵 */
export type VideoStatusMap = Record<string, VideoStatus>;

/**
 * 사용자 + 영상 id 목록으로 시청 상태를 조회한다.
 * 미로그인/실패 시 빈 맵({})을 돌려준다(호출부에서 별도 분기 불필요).
 */
export async function fetchWatchStatus(videos: string[]): Promise<VideoStatusMap> {
    const list = (videos ?? []).filter(Boolean);
    if (list.length === 0) return {};

    try {
        const res = await authFetch(RESUME_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videos: list }),
        });
        if (!res.ok) return {};
        const data = await res.json();
        return mergeResumeStatus(data);
    } catch {
        return {};
    }
}

/**
 * resume 응답(data.status 맵 + data.list rows)을 병합해 VideoStatusMap으로 만든다.
 * status 맵엔 playAt/parent가 없을 수 있어 list rows에서 보강한다.
 */
function mergeResumeStatus(data: unknown): VideoStatusMap {
    const d = data as { result?: boolean; status?: VideoStatusMap; list?: unknown };
    if (!d?.result || !d?.status) return {};
    const status = d.status;
    if (Array.isArray(d.list)) {
        d.list.forEach((row) => {
            const r = row as { video?: string; playAt?: string | null; parent?: string | null };
            if (!r?.video || !status[r.video]) return;
            status[r.video].playAt = r.playAt ?? status[r.video].playAt ?? null;
            status[r.video].parent = r.parent ?? status[r.video].parent ?? null;
        });
    }
    return status;
}

/** 재생 위치(초) → 0~100 진행률(%). 진행바 표시용. duration이 없으면 0. */
export function secondsToPercent(seconds: number, duration: number): number {
    if (!duration || !isFinite(duration) || duration <= 0) return 0;
    const pct = (seconds / duration) * 100;
    return Math.min(100, Math.max(0, pct));
}

/**
 * 회차 목록 중 "마지막으로 본 회차"의 이어보기 진행률을 계산한다.
 *  - 영화는 회차 1개, 시리즈는 전체 회차 중 playAt 최신(재생 이력 있는) 회차 기준.
 *  - 시청 기록이 하나도 없으면 null(진행바 미노출).
 */
export function lastWatchedProgress(
    statusMap: VideoStatusMap,
    episodes: { id: string; duration: number }[],
): { percent: number; remaining: number } | null {
    let best: { id: string; duration: number; at: string; idx: number } | null = null;
    episodes.forEach((e, idx) => {
        const s = statusMap[e.id];
        if (!s) return;
        if ((s.play ?? 0) <= 0 && (s.play_percent ?? 0) <= 0) return; // 본 기록 없음
        const at = s.playAt ?? "";
        // playAt(마지막 재생 시각) 최신 우선. playAt이 없어 동률이면
        // 뒤 회차(인덱스 큰 = 최근 시청으로 추정)를 우선한다.
        if (!best || at > best.at || (at === best.at && idx > best.idx)) {
            best = { id: e.id, duration: e.duration, at, idx };
        }
    });
    if (!best) return null;
    const chosen: { id: string; duration: number } = best;
    const s = statusMap[chosen.id];
    const percent = watchPercent(s, chosen.duration);
    // 끝까지 본 회차는 진행바 숨김(이어볼 게 없으므로). 끝 3초 이내 or 100%.
    if (percent >= 100 || isWatchComplete(s.play ?? 0, chosen.duration)) return null;
    return {
        percent,
        remaining: Math.max(0, chosen.duration - (s.play ?? 0)),
    };
}

/**
 * 시청 진행률(%) 계산. CMS play_percent가 있으면 우선, 없으면 위치/길이로 계산(끝 수 초 이내면 100).
 * 기록 없으면(status undefined) 0. 진행바 공용.
 */
export function watchPercent(status: VideoStatus | undefined, duration: number): number {
    if (!status) return 0;
    if (typeof status.play_percent === "number") {
        return Math.min(100, Math.max(0, status.play_percent));
    }
    const play = status.play ?? 0;
    if (isWatchComplete(play, duration)) return 100;
    return secondsToPercent(play, duration);
}

// 시청 완료 판정: 영상 끝에서 이 초(秒) 이내면 "다 봄"으로 간주한다.
// 비율(%)이 아닌 절대 초를 쓰는 이유 — floor 버림·ended 미발화로 생기는 끝자락 오차는
// 영상 길이와 무관하게 수 초 단위다. 비율 기준(예: 95%)은 긴 영상에서 완료 구간이
// 수 분이 되어 "덜 봤는데 완료" 오판이 생긴다. 진행바 표시와 이어보기 판정에 공용.
export const WATCH_COMPLETE_EPSILON_SEC = 3;

/** 재생 위치(초)가 영상 끝(EPSILON 이내)에 도달했으면 완료로 본다. */
export function isWatchComplete(seconds: number, duration: number): boolean {
    if (!duration || !isFinite(duration) || duration <= 0) return false;
    return seconds >= duration - WATCH_COMPLETE_EPSILON_SEC;
}

/**
 * 시청 진행률을 저장한다. play=재생 위치(초), playPercent=진행률(%, 0~100, 진행바용).
 *  - useBeacon=true: 페이지 이탈/탭 숨김처럼 언로드 직전에는 navigator.sendBeacon 사용
 *    (일반 fetch는 언로드 중 취소될 수 있음).
 *  - 그 외(pause/ended)에는 keepalive fetch.
 * 저장 실패는 재생 UX를 방해하지 않도록 조용히 무시한다.
 */
export function sendWatchProgress(
    video: string,
    play: number,
    playPercent: number,
    opts: { useBeacon?: boolean } = {},
): void {
    if (!video) return;
    const payload = JSON.stringify({ video, play, play_percent: playPercent });

    // beacon 전송자는 플랫폼이 주입한다(web/mobile=navigator.sendBeacon).
    // TV는 Authorization 헤더를 실을 수 없어 beacon을 쓰지 않고 아래 keepalive fetch로 폴백한다.
    if (opts.useBeacon && authBeacon(ENDPOINT, payload)) return;

    void authFetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
    }).catch(() => {
        /* 저장 실패 무시 */
    });
}
