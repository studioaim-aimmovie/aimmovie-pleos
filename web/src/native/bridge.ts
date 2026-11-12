// 네이티브 셸(APK 의 WebView) ↔ 웹 브릿지 계약 v2.
//
// 이 앱은 하이브리드다. 화면은 이 웹 번들을 WebView 로 띄우고, 네이티브는 셋만 맡는다.
//  - 영상 재생: Widevine(MediaDrm 보안 레벨)·MediaSession 필수 요건·구역 전환 중 재생 유지를 WebView 밖에서 처리한다.
//  - 토큰 소유·갱신(방식 A): refresh 토큰은 회전형이라 갱신 주체가 둘이면(웹·네이티브가 동시에 회전) family 가
//    폐기된다. 재생 중(DRM 라이선스·30초 이어보기 보고)에도 네이티브가 스스로 갱신해야 하므로 네이티브가 정본을 갖고,
//    웹은 access 토큰만 받아 쓴다. refresh 토큰은 웹 메모리·저장소 어디에도 남기지 않는다.
//  - 토큰 저장: Keystore 기반 보안 저장소(Pleos 요건).
//
// 셸은 `WebView.addJavascriptInterface(obj, "AimPleos")` 로 `window.AimPleos` 를 심는다.
// @JavascriptInterface 메서드는 동기 호출이라 refresh 같은 네트워크 작업을 기다리게 하면 JS 스레드가 멈춘다.
// 그래서 **요청 ID 기반 비동기 프로토콜**을 쓴다.
//
//   웹:     AimPleos.request(id, method, argsJson)            // 즉시 반환
//   네이티브: 작업 후 window.__aimPleosResolve(id, resultJson)  // evaluateJavascript
//   네이티브: 이벤트는 window.__aimPleosEvent(name, payloadJson)
//
// 결과 형태는 모바일 브릿지(@aim/bridge)와 같은 축의 `{ ok, data?, error? }` 다.
// 예외: `authSnapshot()` 은 네트워크 없이 네이티브 메모리 값만 돌려주는 **동기** 호출이다 — 첫 렌더에서 로그인
// 여부를 바로 알아야 게스트 게이트가 로그인 안내를 잘못 띄우지 않는다.

/** `window.AimPleos` 를 찾는 이름. 셸의 addJavascriptInterface 두 번째 인자와 같아야 한다. */
export const BRIDGE_NAME = "AimPleos";

/** 브릿지 계약 버전. 메서드·필드를 바꾸면 올린다. */
export const BRIDGE_VERSION = 2;

/**
 * 응답을 기다리는 최대 시간(ms). 네이티브도 자체 타임아웃(25초)으로 실패를 돌려주지만, 셸이 응답을 잃는 경우
 * (페이지 재로드·네이티브 예외)에도 웹 화면이 영원히 멈추지 않게 웹 쪽에도 안전망을 둔다.
 * refresh 는 OkHttp 연결 15초 + 읽기 20초가 걸릴 수 있어 그보다 넉넉히 둔다.
 */
const REQUEST_TIMEOUT_MS = 40_000;

/** 페어링·refresh 응답의 user. CMS routes/api/device.js 가 이 다섯 필드만 내려준다(id 는 사용자 _id). */
export interface NativeUser {
    id: string;
    name: string;
    country_code: string;
    country_dial: string;
    phone: string;
}

/** 네이티브가 돌려주는 웹용 세션. refresh 토큰은 들어 있지 않다. */
export interface NativeSession {
    accessToken: string;
    /** access 만료 시각(epoch ms). */
    accessExpiresAt: number;
    user: NativeUser;
}

/** `play` 인자. */
export interface NativePlayRequest {
    /** 콘텐츠 `_id` — `/contents/:id`, `/play/:id` 의 그 값. */
    contentId: string;
    /** 재생할 회차(Video 문서) `_id`. 단편이면 대표 영상의 `_id`. */
    videoId: string;
    /** 시작 위치(ms). 이어보기면 저장 위치, 처음부터면 0. */
    startPositionMs: number;
    /** 표시 언어(ko/en). 네이티브 플레이어의 제목·시스템 미디어 컨트롤 문구를 웹과 맞춘다. */
    lang?: string;
}

/** `savePairedTokens` 인자 — `/authapi/device/token` 응답 그대로. */
export interface PairedTokens {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: NativeUser;
}

/** 재생이 끝나 WebView 화면으로 돌아왔을 때의 이벤트 인자. */
export interface PlaybackFinished {
    contentId: string;
    videoId: string;
    positionMs: number;
    /** closed: 사용자가 닫음, ended: 끝까지 봄, blocked: 시청 권한 없음(대여 만료 등), error: 재생 실패. */
    reason: "closed" | "ended" | "blocked" | "error";
}

/** 메서드별 인자·반환 타입. */
export interface BridgeMethods {
    version: { args: Record<string, never>; data: number };
    play: { args: NativePlayRequest; data: null };
    /** 유효한 access(만료 임박이면 네이티브가 먼저 refresh). 로그아웃 상태면 data=null. */
    getAccessToken: { args: Record<string, never>; data: NativeSession | null };
    /**
     * 401 을 받은 뒤 부른다. `accessToken` 은 401 을 받은 요청에 실은 값 — 이미 다른 요청이 회전시켰으면 네이티브는
     * refresh 를 또 하지 않고 최신 값을 돌려준다. refresh 가 실패(폐기)하면 data=null 이고 onAuthChanged(null) 이 따라온다.
     */
    refreshAfter401: { args: { accessToken: string | null }; data: NativeSession | null };
    savePairedTokens: { args: PairedTokens; data: NativeSession };
    logout: { args: Record<string, never>; data: null };
}

export type BridgeMethod = keyof BridgeMethods;

/** 모든 요청의 결과 형태. */
export type NativeResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** 네이티브 → 웹 이벤트. */
export interface BridgeEvents {
    /** 세션이 바뀜 — refresh 실패(폐기)·로그아웃이면 null, 로그인이면 user. */
    onAuthChanged: NativeUser | null;
    onPlaybackFinished: PlaybackFinished;
}

/**
 * 셸이 심는 객체. `@JavascriptInterface` 는 원시값만 주고받을 수 있어(객체를 넘기면 null 이 된다)
 * 인자·결과를 모두 **JSON 문자열**로 주고받는다.
 */
export interface AimPleosBridge {
    /** 계약 버전. */
    version(): number;
    /** 비동기 요청 접수. 결과는 `window.__aimPleosResolve(id, resultJson)` 으로 온다. */
    request(id: string, method: string, argsJson: string): void;
    /** 네트워크 없이 지금 세션을 돌려준다(NativeSession JSON 또는 "null"). 첫 렌더용. */
    authSnapshot(): string;
}

declare global {
    interface Window {
        AimPleos?: AimPleosBridge;
        __aimPleosResolve?: (id: string, resultJson: string) => void;
        __aimPleosEvent?: (name: string, payloadJson: string) => void;
    }
}

/** 네이티브 셸 안에서 떠 있으면 브릿지를, 브라우저(개발)면 null. */
export function getBridge(): AimPleosBridge | null {
    if (typeof window === "undefined") return null;
    const bridge = window.AimPleos;
    // 셸이 아닌 곳에 같은 이름의 무언가가 있을 가능성까지 걸러 둔다(v2 메서드가 있어야 브릿지다).
    return bridge && typeof bridge.request === "function" ? bridge : null;
}

/** 네이티브 셸인가. 재생·토큰을 네이티브로 넘길지, 브라우저 개발용 경로로 돌릴지 가르는 유일한 판정이다. */
export function isNativeShell(): boolean {
    return getBridge() !== null;
}

// ── 요청 ID 매칭 ──

type Pending = { resolve: (r: NativeResult<unknown>) => void; timer: ReturnType<typeof setTimeout> };
const pending = new Map<string, Pending>();
let seq = 0;

/** 결과 JSON 을 읽는다. 깨진 응답은 실패로 본다. */
function parseResult(raw: unknown): NativeResult<unknown> {
    if (typeof raw !== "string") return { ok: false, error: "invalid_response" };
    try {
        const parsed = JSON.parse(raw) as { ok?: unknown; data?: unknown; error?: unknown } | null;
        if (parsed?.ok === true) return { ok: true, data: parsed.data ?? null };
        return { ok: false, error: parsed?.error != null ? String(parsed.error) : "unknown_error" };
    } catch {
        return { ok: false, error: "invalid_response" };
    }
}

function installResolver(): void {
    if (window.__aimPleosResolve) return;
    window.__aimPleosResolve = (id, resultJson) => {
        const entry = pending.get(String(id));
        // 이미 타임아웃됐거나 페이지가 다시 로드되기 전 요청의 응답이면 버린다.
        if (!entry) return;
        pending.delete(String(id));
        clearTimeout(entry.timer);
        entry.resolve(parseResult(resultJson));
    };
}

/** 네이티브에 요청하고 결과를 기다린다. 브릿지가 없으면 `no_bridge` 실패. */
export function request<M extends BridgeMethod>(
    method: M,
    args: BridgeMethods[M]["args"],
): Promise<NativeResult<BridgeMethods[M]["data"]>> {
    const bridge = getBridge();
    if (!bridge) return Promise.resolve({ ok: false, error: "no_bridge" });
    installResolver();
    const id = `${Date.now().toString(36)}-${++seq}`;
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            pending.delete(id);
            resolve({ ok: false, error: "timeout" });
        }, REQUEST_TIMEOUT_MS);
        pending.set(id, { resolve: resolve as Pending["resolve"], timer });
        try {
            bridge.request(id, method, JSON.stringify(args ?? {}));
        } catch (e) {
            // 셸 쪽 예외는 JS 예외로 올라온다. 화면이 멈추지 않게 실패로 바꿔 돌려준다.
            pending.delete(id);
            clearTimeout(timer);
            resolve({ ok: false, error: e instanceof Error ? e.message : "bridge_error" });
        }
    });
}

/** 첫 렌더용 동기 세션. 셸이 아니거나 로그아웃 상태면 null. */
export function authSnapshot(): NativeSession | null {
    const bridge = getBridge();
    if (!bridge) return null;
    try {
        const parsed = JSON.parse(bridge.authSnapshot()) as NativeSession | null;
        return parsed && parsed.accessToken ? parsed : null;
    } catch {
        return null;
    }
}

// ── 네이티브 → 웹 이벤트 ──

type Listener<E extends keyof BridgeEvents> = (payload: BridgeEvents[E]) => void;
// 이벤트 이름 → 구독자. 값 타입은 이름마다 다르지만 저장은 한 모양으로 하고, 꺼낼 때(onNativeEvent) 좁힌다.
const listeners = new Map<string, Set<(payload: unknown) => void>>();

function installEventSink(): void {
    if (window.__aimPleosEvent) return;
    window.__aimPleosEvent = (name, payloadJson) => {
        let payload: unknown = null;
        try {
            payload = JSON.parse(payloadJson);
        } catch {
            /* 깨진 이벤트는 null 로 넘긴다 */
        }
        listeners.get(name)?.forEach((fn) => fn(payload));
    };
}

/** 네이티브 이벤트를 구독한다. 반환값은 구독 해제 함수. */
export function onNativeEvent<E extends keyof BridgeEvents>(name: E, fn: Listener<E>): () => void {
    if (typeof window === "undefined") return () => {};
    installEventSink();
    let set = listeners.get(name);
    if (!set) listeners.set(name, (set = new Set()));
    const wrapped = fn as (payload: unknown) => void;
    set.add(wrapped);
    return () => {
        set.delete(wrapped);
    };
}
