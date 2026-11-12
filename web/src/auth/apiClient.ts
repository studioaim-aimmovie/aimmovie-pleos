// 차량 앱의 인증 호출 전송자.
//
// @aim/core 의 api/* 는 `/api/likestatus/mylist` 같은 **논리 경로**를 호출한다.
// 이 앱은 APK 안 WebView 에서 패키지 파일로 떠 쿠키를 쓸 수 없으므로 여기서 CMS로 직접 보낸다.
//
//   /api/likestatus/mylist  →  {CMS}/authapi/likestatus/mylist  + Authorization: Bearer
//
// 논리 경로와 CMS 경로는 `/api/` ↔ `/authapi/` 접두어만 다르다.
//
// 토큰 갱신·로그아웃은 실행 환경에 따라 갈린다(tokenStore.ts 와 함께 이 파일이 교체 지점이다).
//  - 네이티브 셸: refresh 토큰은 네이티브만 갖는다(방식 A). 만료 임박이면 `getAccessToken`, 401 이면 `refreshAfter401`
//    로 네이티브에 맡긴다. 네이티브 ApiClient 가 refresh 를 단일 실행하므로 웹·네이티브 요청이 동시에 401 을 받아도
//    회전은 한 번만 일어난다. 웹이 직접 /authapi/token/refresh 를 부르면 안 된다(family 폐기).
//  - 브라우저 개발: 예전처럼 웹이 직접 refresh 한다(아래 in-flight 공유).

import { apiRoot } from "@aim/core/config";
import { onNativeEvent, request } from "../native/bridge";
import {
    clearTokens,
    fromNativeSession,
    getTokens,
    isAccessExpiring,
    isNativeTokenStore,
    replaceTokens,
    updateAccess,
} from "./tokenStore";

/** 토큰이 완전히 무효화됐을 때(로그아웃 필요) 알림 받을 구독자. */
type SessionEndedHandler = () => void;
let onSessionEnded: SessionEndedHandler | null = null;

export function setSessionEndedHandler(handler: SessionEndedHandler | null): void {
    onSessionEnded = handler;
}

function endSession(): void {
    clearTokens();
    onSessionEnded?.();
}

// 네이티브가 세션을 끝냈다(재생 중 refresh 실패·폐기 등). 웹도 미로그인으로 돌린다.
// 로그인 쪽 변화(user)는 웹이 페어링으로 직접 일으키므로 따로 반영할 것이 없다.
if (isNativeTokenStore()) {
    onNativeEvent("onAuthChanged", (user) => {
        if (user === null && getTokens() !== null) endSession();
    });
}

/** 논리 경로(`/api/...`)를 CMS 절대 URL(`{root}/authapi/...`)로 바꾼다. */
export function toCmsUrl(path: string): string {
    const mapped = path.startsWith("/api/") ? "/authapi/" + path.slice("/api/".length) : path;
    return mapped.startsWith("http") ? mapped : `${apiRoot()}${mapped}`;
}

// ── refresh 동시 실행 방지 ──
// access 가 만료된 순간 여러 요청이 동시에 401을 받으면 refresh 가 그 수만큼 나간다.
// refresh 는 회전하므로 두 번째 이후는 "이미 회전된 토큰 재사용"으로 판정돼
// **family 전체가 폐기되고 로그아웃된다.** 반드시 in-flight promise 를 공유해야 한다.
let refreshInFlight: Promise<boolean> | null = null;

/**
 * refresh 를 1회만 실행하고 결과를 공유한다. 성공하면 true.
 * @param failedAccessToken 401 을 받은 요청에 실은 access. 네이티브가 "이미 회전됨"을 가려내는 데 쓴다.
 */
export function refreshAccessToken(failedAccessToken?: string | null): Promise<boolean> {
    if (refreshInFlight) return refreshInFlight;

    if (isNativeTokenStore()) {
        refreshInFlight = (async () => {
            try {
                const res = await request("refreshAfter401", {
                    accessToken: failedAccessToken ?? getTokens()?.accessToken ?? null,
                });
                // 통신 실패(타임아웃 등)는 로그아웃 사유가 아니다 — 다음 요청에서 다시 시도한다.
                if (!res.ok) return false;
                if (!res.data) {
                    // 네이티브가 refresh 를 폐기 판정했다. onAuthChanged(null) 도 오지만 순서에 기대지 않는다.
                    endSession();
                    return false;
                }
                replaceTokens(fromNativeSession(res.data));
                return true;
            } finally {
                refreshInFlight = null;
            }
        })();
        return refreshInFlight;
    }

    refreshInFlight = (async () => {
        const tokens = getTokens();
        if (!tokens) return false;
        try {
            const res = await fetch(`${apiRoot()}/authapi/token/refresh`, {
                method: "POST",
                credentials: "omit",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: tokens.refreshToken }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.result || !data.access_token) {
                // invalid_refresh / revoked — 되살릴 방법이 없다. 로그아웃.
                endSession();
                return false;
            }
            updateAccess(data.access_token, data.refresh_token, Number(data.expires_in) || 3600);
            return true;
        } catch {
            // 네트워크 오류는 로그아웃 사유가 아니다 — 다음 요청에서 다시 시도한다.
            return false;
        } finally {
            refreshInFlight = null;
        }
    })();

    return refreshInFlight;
}

/**
 * @aim/core 의 configure({ authFetch }) 에 주입할 전송자.
 *
 * - 논리 경로를 CMS 경로로 바꾸고 Bearer 를 붙인다.
 * - access 가 곧 만료면 요청 전에 미리 갱신한다(불필요한 401 왕복 절약).
 * - 그래도 401 이면 refresh 후 **1회만** 재시도한다.
 * - credentials: "omit" — 쿠키를 아예 보내지 않는다. Origin: null 이라 서버가
 *   credentials 를 허용하지 않기 때문이다(허용하면 사칭 위험).
 */
export async function pleosAuthFetch(path: string, init?: RequestInit): Promise<Response> {
    let tokens = getTokens();

    if (tokens && isAccessExpiring(tokens)) {
        if (isNativeTokenStore()) {
            // 네이티브가 만료 임박이면 먼저 refresh 한 유효한 access 를 준다. 실패해도 지금 값으로 시도한다.
            const res = await request("getAccessToken", {});
            if (res.ok) {
                if (res.data) replaceTokens(fromNativeSession(res.data));
                else endSession();
            }
        } else {
            await refreshAccessToken();
        }
        tokens = getTokens();
    }

    const send = (accessToken: string | null) => {
        const headers = new Headers(init?.headers);
        if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
        if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
        return fetch(toCmsUrl(path), { ...init, headers, credentials: "omit" });
    };

    const res = await send(tokens?.accessToken ?? null);
    if (res.status !== 401 || !tokens) return res;

    // 만료 판정이 어긋났을 수 있다(기기 시계 오차 등). 한 번만 갱신 후 재시도한다.
    const refreshed = await refreshAccessToken(tokens.accessToken);
    if (!refreshed) return res;
    return send(getTokens()?.accessToken ?? null);
}

/** 서버에 로그아웃을 알리고(=refresh family 폐기) 로컬 토큰을 지운다. */
export async function logout(): Promise<void> {
    if (isNativeTokenStore()) {
        // refresh 토큰은 네이티브만 갖고 있으므로 서버 통지·보안 저장소 삭제를 네이티브가 한다.
        // 브릿지가 실패해도 웹 화면은 로그아웃 상태로 돌린다(사용자가 누른 동작을 무시하지 않는다).
        await request("logout", {});
        endSession();
        return;
    }
    const tokens = getTokens();
    if (tokens) {
        try {
            await fetch(`${apiRoot()}/authapi/token/logout`, {
                method: "POST",
                credentials: "omit",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: tokens.refreshToken }),
            });
        } catch {
            /* 서버에 못 알려도 로컬은 지운다 */
        }
    }
    endSession();
}
