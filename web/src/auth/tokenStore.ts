// 토큰 저장소.
//
// 저장 매체는 실행 환경에 따라 둘로 갈린다. **교체 지점은 이 파일과 apiClient.ts 두 곳뿐이다** — 앱의 다른 코드는
// 저장소에 직접 닿지 않고 이 모듈의 함수만 부른다.
//
//  - 네이티브 셸(차량 APK): 토큰의 정본은 네이티브(Keystore 보안 저장소)에 있다(방식 A, native/bridge.ts 주석).
//    여기는 access 토큰·만료 시각·사용자만 **메모리**에 들고, refresh 토큰은 갖지 않는다. 페어링 직후에만
//    받은 토큰을 네이티브로 넘긴다(savePairedTokens). WebView 저장소(localStorage)에는 토큰을 쓰지 않는다 —
//    Pleos 는 토큰을 Keystore 기반 보안 저장소에 두라고 요구한다.
//  - 브라우저 개발(`npm run dev`): 셸이 없으므로 예전처럼 localStorage 에 전부 둔다. sessionStorage 는 탭을 닫을
//    때마다 로그아웃돼 개발 중 페어링을 계속 다시 해야 한다.

import { authSnapshot, isNativeShell, request, type NativeSession } from "../native/bridge";

const STORAGE_KEY = "aim.pleos.auth";

export interface StoredUser {
    id: string;
    name: string;
    country_code: string;
    country_dial: string;
    phone: string;
}

export interface AuthTokens {
    accessToken: string;
    /** 브라우저 개발 경로에서만 채워진다. 네이티브 셸에서는 빈 문자열이다(정본은 네이티브). */
    refreshToken: string;
    /** access 만료 시각(epoch ms). 만료 직전에 미리 갱신하는 데 쓴다. */
    accessExpiresAt: number;
    user: StoredUser;
}

/** 실행 환경 판정은 한 번만 한다 — 셸은 페이지가 뜨기 전에 브릿지를 심고 바뀌지 않는다. */
const native = isNativeShell();

/** 네이티브 세션 → 이 모듈의 모양. */
export function fromNativeSession(s: NativeSession | null): AuthTokens | null {
    if (!s || !s.accessToken) return null;
    return { accessToken: s.accessToken, refreshToken: "", accessExpiresAt: s.accessExpiresAt, user: s.user };
}

// ── 브라우저 개발 경로의 영속 저장소 ──

function readRaw(): string | null {
    try {
        return window.localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

function writeRaw(value: string | null): void {
    try {
        if (value === null) window.localStorage.removeItem(STORAGE_KEY);
        else window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
        /* 저장 실패는 조용히 무시 — 메모리 캐시로는 세션이 유지된다 */
    }
}

function readStored(): AuthTokens | null {
    if (native) {
        // 예전 빌드(브릿지 v1 이전)가 localStorage 에 남긴 토큰이 있으면 지운다 — 셸에서는 쓰지 않는다.
        if (readRaw() !== null) writeRaw(null);
        return fromNativeSession(authSnapshot());
    }
    const raw = readRaw();
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as AuthTokens;
        // 형태가 깨진 값(구버전 등)은 없는 것으로 취급한다.
        return parsed && parsed.accessToken && parsed.refreshToken ? parsed : null;
    } catch {
        return null;
    }
}

// 메모리 캐시. 매 요청마다 저장소(또는 브릿지)를 읽지 않도록 한다.
let cached: AuthTokens | null | undefined;

/** 지금 토큰. 없으면 null. */
export function getTokens(): AuthTokens | null {
    if (cached === undefined) cached = readStored();
    return cached;
}

/**
 * 메모리 값만 바꾼다. 네이티브가 이미 정본을 갖고 있을 때(getAccessToken·refreshAfter401 결과 반영) 쓴다.
 * 브라우저 개발 경로에서는 영속 저장소에도 쓴다.
 */
export function replaceTokens(next: AuthTokens | null): void {
    cached = next;
    if (!native) writeRaw(next ? JSON.stringify(next) : null);
}

/**
 * 페어링으로 받은 토큰을 저장한다. 네이티브 셸이면 네이티브 보안 저장소에 넘기고 끝날 때까지 기다린다 —
 * 저장이 끝나기 전에 웹이 refresh 를 요청하면 네이티브는 아직 토큰이 없어 "로그아웃"으로 판정한다.
 * 실패하면 false(로그인 실패로 다룬다).
 */
export async function setTokens(next: AuthTokens): Promise<boolean> {
    if (!native) {
        replaceTokens(next);
        return true;
    }
    const res = await request("savePairedTokens", {
        access_token: next.accessToken,
        refresh_token: next.refreshToken,
        expires_in: Math.max(1, Math.round((next.accessExpiresAt - Date.now()) / 1000)),
        user: next.user,
    });
    if (!res.ok) return false;
    replaceTokens(fromNativeSession(res.data));
    return true;
}

/** access 토큰만 교체(브라우저 개발 경로의 refresh 회전 결과 반영). */
export function updateAccess(
    accessToken: string,
    refreshToken: string,
    expiresInSec: number,
): void {
    const current = getTokens();
    if (!current) return;
    replaceTokens({
        ...current,
        accessToken,
        refreshToken,
        accessExpiresAt: Date.now() + expiresInSec * 1000,
    });
}

export function clearTokens(): void {
    replaceTokens(null);
}

/** 네이티브 셸인가(apiClient 가 갱신·로그아웃을 어디로 보낼지 정할 때 쓴다). */
export function isNativeTokenStore(): boolean {
    return native;
}

/**
 * access 토큰이 곧 만료되는가.
 * 만료 30초 전부터 참으로 본다 — 요청이 날아가는 중에 만료되는 경계를 피한다.
 */
export function isAccessExpiring(tokens: AuthTokens): boolean {
    return Date.now() >= tokens.accessExpiresAt - 30_000;
}
