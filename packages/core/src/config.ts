// @aim/core의 환경 주입 지점.
//
// core는 환경변수를 직접 읽지 않는다. Next는 `process.env.NEXT_PUBLIC_*`를 빌드 시
// 리터럴로 인라인하지만 Vite는 `import.meta.env`라 서로 호환되지 않기 때문이다.
// 두 앱이 각자 부팅 시 configure()로 값을 주입한다.
//
//   apps/web  : lib/coreConfig.ts (layout.tsx / providers.tsx가 import)
//   apps/tv   : src/main.tsx
//
// ⚠️ 인증이 필요한 호출의 "전송자"도 여기서 주입한다.
// 같은 논리 경로(`/api/likestatus/mylist`)를 플랫폼별로 다르게 보내야 하기 때문이다.
//   - web/mobile : Next 프록시로 그대로 요청(세션 쿠키를 프록시가 CMS Bearer로 변환)
//   - tv         : 쿠키를 쓸 수 없는 file:// 오리진이라 CMS에 직접 요청하고
//                  `/api/` → `/authapi/` 접두어를 바꾼 뒤 Authorization 헤더를 붙인다

/**
 * 인증이 필요한 호출의 논리 경로. web의 Next 프록시 경로를 그대로 쓴다
 * (`/api/likestatus/mylist`, `/api/videostatus/play` …).
 * CMS의 실제 경로와는 `/api/` ↔ `/authapi/` 접두어만 다르다.
 */
export type AuthPath = string;

export interface CoreConfig {
    /** CMS(API) 호스트. 공개 조회와 이미지 경로에 사용. 끝에 `/`를 붙이지 않는다. */
    apiRoot: string;
    /** HLS/미디어 CDN 호스트. 끝에 `/`를 붙이지 않는다. */
    cdnUrl: string;
    /** 인증이 필요한 호출의 전송자. 기본값은 동일 오리진 fetch(= web/mobile 동작). */
    authFetch: (path: AuthPath, init?: RequestInit) => Promise<Response>;
    /**
     * 재생 진행률처럼 페이지 이탈 중에도 보내야 하는 호출의 beacon 전송자.
     * `true`를 반환하면 전송에 성공한 것으로 보고 fetch 폴백을 하지 않는다.
     * Authorization 헤더를 실을 수 없는 환경(TV)에서는 지정하지 않으면 된다.
     */
    sendBeacon?: (path: AuthPath, body: unknown) => boolean;
}

/** 기본 전송자 — 동일 오리진 상대 경로 요청. web/mobile은 이 동작 그대로다. */
const sameOriginFetch: CoreConfig["authFetch"] = (path, init) => fetch(path, init);

let current: CoreConfig = {
    apiRoot: "",
    cdnUrl: "",
    authFetch: sameOriginFetch,
};

let configured = false;

/**
 * 앱 부팅 시 1회 호출한다. 여러 번 호출하면 주어진 필드만 덮어쓴다
 * (Next는 서버/클라이언트 모듈 그래프가 나뉘어 각 그래프마다 한 번씩 호출된다).
 */
export function configure(next: Partial<CoreConfig>): void {
    current = { ...current, ...next };
    configured = true;
}

/** 현재 설정 전체. */
export function getConfig(): Readonly<CoreConfig> {
    return current;
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

/** configure()가 한 번이라도 호출됐는지 — 개발 중 누락 진단용. */
export function isConfigured(): boolean {
    return configured;
}
