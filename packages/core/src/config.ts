// @aim/core의 환경 주입 지점.
//
// core는 환경변수를 직접 읽지 않는다. 앱이 부팅 시 configure()로 값을 주입한다(web/src/main.tsx).
//
// ⚠️ 인증이 필요한 호출의 "전송자"도 여기서 주입한다. 앱은 CMS에 직접 요청하고
// `/api/` → `/authapi/` 접두어를 바꾼 뒤 Authorization 헤더를 붙인다(web/src/auth/apiClient.ts).

/**
 * 인증이 필요한 호출의 논리 경로
 * (`/api/likestatus/mylist`, `/api/videostatus/play` …).
 * CMS의 실제 경로와는 `/api/` ↔ `/authapi/` 접두어만 다르다.
 */
export type AuthPath = string;

export interface CoreConfig {
    /** CMS(API) 호스트. 공개 조회와 이미지 경로에 사용. 끝에 `/`를 붙이지 않는다. */
    apiRoot: string;
    /** HLS/미디어 CDN 호스트. 끝에 `/`를 붙이지 않는다. */
    cdnUrl: string;
    /** 인증이 필요한 호출의 전송자. 기본값은 동일 오리진 fetch. */
    authFetch: (path: AuthPath, init?: RequestInit) => Promise<Response>;
    /**
     * 재생 진행률처럼 페이지 이탈 중에도 보내야 하는 호출의 beacon 전송자.
     * `true`를 반환하면 전송에 성공한 것으로 보고 fetch 폴백을 하지 않는다.
     * Authorization 헤더를 실을 수 없는 환경에서는 지정하지 않으면 된다.
     */
    sendBeacon?: (path: AuthPath, body: unknown) => boolean;
}

/** 기본 전송자 — 동일 오리진 상대 경로 요청. */
const sameOriginFetch: CoreConfig["authFetch"] = (path, init) => fetch(path, init);

let current: CoreConfig = {
    apiRoot: "",
    cdnUrl: "",
    authFetch: sameOriginFetch,
};

/**
 * 앱 부팅 시 1회 호출한다. 여러 번 호출하면 주어진 필드만 덮어쓴다.
 */
export function configure(next: Partial<CoreConfig>): void {
    current = { ...current, ...next };
}

/** CMS(API) 호스트. */
export function apiRoot(): string {
    return current.apiRoot;
}

/** 미디어 CDN 호스트. */
export function cdnUrl(): string {
    return current.cdnUrl;
}

/** 인증이 필요한 호출을 현재 플랫폼의 전송자로 보낸다. */
export function authFetch(path: AuthPath, init?: RequestInit): Promise<Response> {
    return current.authFetch(path, init);
}

/**
 * beacon 전송을 시도한다. 전송자가 없거나 실패하면 false —
 * 호출부가 fetch(keepalive)로 폴백한다.
 */
export function authBeacon(path: AuthPath, body: unknown): boolean {
    try {
        return current.sendBeacon?.(path, body) ?? false;
    } catch {
        return false;
    }
}
