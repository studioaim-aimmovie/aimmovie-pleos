/**
 * 웹 플레이어 어댑터 공통 인터페이스.
 *
 * ⚠️ 차량에서 실제 재생은 **네이티브 Media3 플레이어**가 맡는다(`src/native/playback.ts`).
 * 이 웹 플레이어는 브라우저 개발 환경(브릿지 없음)과 브릿지 실패 시의 폴백이다.
 *
 * 구현은 둘이다 — `hlsjs`(`<video>` + hls.js/MSE)와 `html5`(네이티브 HLS `<video src>`).
 * 같은 계약을 지키게 해서 `/play` 화면이 어느 쪽이 붙었는지 몰라도 되게 한다.
 *
 * video.js 는 쓰지 않는다 — 폴백 경로에 스킨·플러그인까지 실을 이유가 없고, 컨트롤은
 * 터치용으로 직접 만든다(`player/Controls.tsx`).
 *
 * ### 단위 규약
 * 인터페이스 경계의 시간은 **모두 초(seconds)** 다. 네이티브 브릿지로 넘길 때만 ms 로 바꾼다
 * (`src/native/playback.ts`).
 */

/** 어댑터 구현 종류. 로그·디버깅 표시용. */
export type PlayerKind = "html5" | "hlsjs";

/**
 * 어댑터가 올려 보내는 이벤트 묶음.
 *
 * 모든 콜백은 선택이며, `on()` 으로 **부분 갱신**한다(넘긴 키만 교체).
 * React 에서 최신 클로저를 꽂아 넣을 때 어댑터를 다시 만들지 않아도 되게 하기 위한 형태다.
 */
export interface PlayerEvents {
    /** 메타데이터 확보(길이 확정) — duration 은 초. 알 수 없으면 0. */
    onReady?: (duration: number) => void;
    /** 재생 위치 갱신 — currentTime 은 초. */
    onTimeUpdate?: (currentTime: number) => void;
    /** 재생 시작/재개. */
    onPlay?: () => void;
    /** 일시정지. */
    onPause?: () => void;
    /** 끝까지 재생 완료. */
    onEnded?: () => void;
    /** 버퍼링 진입/이탈. 스피너 표시용. */
    onBuffering?: (buffering: boolean) => void;
    /** 복구 불가한 오류. message 는 사용자에게 보여도 되는 짧은 문구. */
    onError?: (message: string) => void;
}

/** `load()` 옵션. */
export interface PlayerLoadOptions {
    /**
     * 이어보기 시작 위치(초). 0/미지정이면 처음부터.
     *
     * 어댑터가 이 값을 **로드 단계에서** 받는 이유: hls.js 는 `startLoad(position)` 로
     * 그 지점부터 세그먼트를 받는 게 맞고(앞부분을 받아 버리고 seek 하면 차량 통신 대역폭이
     * 아깝다), 네이티브 `src` 는 메타데이터 이후 seek 해야 하므로 시점이 어댑터마다 다르다.
     */
    startAt?: number;
}

/** 플랫폼 재생 수단 하나를 감싼 어댑터. */
export interface PlayerAdapter {
    readonly kind: PlayerKind;

    /**
     * 소스를 열고 재생 준비까지 마친다(자동 재생은 하지 않는다 — `play()` 를 호출할 것).
     * 실패하면 reject 하며, `onError` 도 함께 발화한다.
     */
    load(src: string, options?: PlayerLoadOptions): Promise<void>;

    play(): void;
    pause(): void;

    /** 절대 위치(초)로 이동. 범위를 벗어나면 어댑터가 clamp 한다. */
    seek(seconds: number): void;

    /** 현재 위치(초). 아직 준비 전이면 0. */
    getCurrentTime(): number;
    /** 전체 길이(초). 알 수 없으면 0. */
    getDuration(): number;
    /** 지금 정지 상태인가(= `play()` 를 눌러야 하는 상태인가). */
    isPaused(): boolean;

    /** 이벤트 핸들러 부분 갱신. 넘긴 키만 교체한다. */
    on(events: PlayerEvents): void;

    /**
     * 자원 해제. **반드시 호출해야 한다.**
     * 미디어 요소·MSE 버퍼를 남겨 두면 다음 재생이 디코더를 다투고, 차량 WebView 의 디코더
     * 여유는 데스크탑보다 훨씬 작다.
     */
    destroy(): void;
}

/** 어댑터 생성 인자. */
export interface PlayerAdapterInit {
    /** 미디어 요소를 심을 컨테이너. 어댑터가 자기 요소를 만들어 append 한다. */
    container: HTMLElement;
    /** 초기 이벤트 핸들러. 이후 갱신은 `on()`. */
    events?: PlayerEvents;
}

/**
 * `PlayerEvents` 를 담고 안전하게 호출해 주는 작은 보관함.
 *
 * 세 어댑터가 똑같이 필요해서 여기 둔다. 핸들러에서 throw 가 나도 재생 파이프라인이
 * 죽지 않게 삼킨다 — 진행률 저장 실패 따위로 화면이 멈추면 안 된다.
 */
export class EventHub {
    private handlers: PlayerEvents;

    constructor(initial: PlayerEvents = {}) {
        this.handlers = { ...initial };
    }

    /** 넘긴 키만 교체(부분 갱신). */
    update(next: PlayerEvents): void {
        this.handlers = { ...this.handlers, ...next };
    }

    emit<K extends keyof PlayerEvents>(
        key: K,
        ...args: Parameters<NonNullable<PlayerEvents[K]>>
    ): void {
        const fn = this.handlers[key] as ((...a: unknown[]) => void) | undefined;
        if (!fn) return;
        try {
            fn(...(args as unknown[]));
        } catch (e) {
            // 콜백 예외가 어댑터 상태를 오염시키지 않게 격리한다.
            console.error("[player] 이벤트 핸들러 예외:", key, e);
        }
    }

    clear(): void {
        this.handlers = {};
    }
}

/** 유한한 숫자만 통과시키고 나머지는 0 으로. duration/currentTime 정규화 공용. */
export function finiteOrZero(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * 네이티브 `audioTracks` 가 노출된 환경에서 **활성 오디오 트랙을 정확히 1개로** 맞춘다.
 *
 * 배경(커밋 `c430a4c`): Chromium 은 비표준 `HTMLMediaElement.audioTracks` 를 노출하는데,
 * MSE 경로에서 트랙이 미러링되며 복제 트랙이 하나 더 생긴다. 복제가 추가되는 순간 기존
 * 트랙이 비활성화되어 **활성 트랙 0개** 구간이 생기고, 그 찰나 오디오 세그먼트 로더가
 * abort 된 뒤 재시작되지 못해 무한 버퍼링에 걸린다.
 *
 * VHS 를 쓰지 않으므로 미러링을 끄는 스위치(`overrideNative`)가 없다. 대신 결과 상태(활성 0개 / 활성 2개 이상)를 직접 교정한다.
 *
 * ⚠️ **건강한 상태는 건드리지 않는다.** 활성이 이미 1개면 즉시 반환한다 —
 * 사용자가(또는 hls.js 가) 고른 트랙을 임의로 바꾸지 않기 위한 가드다.
 *
 * @returns 교정을 실제로 수행했으면 true.
 */
export function normalizeAudioTracks(media: HTMLMediaElement): boolean {
    // audioTracks 는 표준 TS DOM 타입에 없다(비표준 확장).
    const tracks = (media as unknown as { audioTracks?: NativeAudioTrackList }).audioTracks;
    if (!tracks || tracks.length <= 1) return false;

    const list: NativeAudioTrack[] = [];
    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (track) list.push(track);
    }
    const enabled = list.filter((t) => t.enabled);
    if (enabled.length === 1) return false; // 정상 — 관여하지 않는다

    // 활성 0개면 첫 트랙을, 2개 이상이면 첫 활성 트랙을 남기고 나머지를 끈다.
    const keep = enabled[0] ?? list[0];
    if (!keep) return false;
    list.forEach((t) => {
        t.enabled = t === keep;
    });
    console.warn(
        `[player] 오디오 트랙 교정: ${tracks.length}개 중 활성 ${enabled.length}개 → 1개 ` +
            "(Chromium 복제 트랙 대응, 커밋 c430a4c 참고)",
    );
    return true;
}

/** 비표준 `HTMLMediaElement.audioTracks` 최소 선언. */
interface NativeAudioTrack {
    id?: string;
    language?: string;
    enabled: boolean;
}
interface NativeAudioTrackList {
    readonly length: number;
    [index: number]: NativeAudioTrack | undefined;
    addEventListener?: (type: string, listener: () => void) => void;
    removeEventListener?: (type: string, listener: () => void) => void;
}
