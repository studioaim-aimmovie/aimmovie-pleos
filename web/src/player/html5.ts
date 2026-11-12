/**
 * 네이티브 HLS 어댑터 — `<video src="…m3u8">` 로 직접 재생한다.
 *
 * Android WebView(Chromium)는 네이티브 HLS 를 지원하지 않으므로 차량에서 이 경로를 타는 일은
 * 거의 없다. MSE 가 없는 환경(`Hls.isSupported()` 가 false)의 마지막 폴백으로만 남긴다.
 *
 * ### ⚠️ 오디오 트랙 버그(커밋 `c430a4c`)와의 관계 — **실기 검증 필요**
 * 원래 버그는 VHS(MSE)가 네이티브 트랙을 자체 목록으로 미러링하며 복제 트랙을 만들어
 * "활성 트랙 0개" 구간이 생기던 것이다. 여기는 MSE 를 아예 거치지 않으므로 미러링 주체가
 * 없어 재현 가능성이 낮다. 다만 확증이 없으므로 `normalizeAudioTracks()` 로 결과 상태
 * (활성 트랙 개수)만 감시·교정한다. 정상(활성 1개)이면 아무것도 하지 않는다.
 *
 * ### 이 파일이 `<video>` 공통 기반을 함께 갖는 이유
 * `hlsjs.ts` 도 결국 같은 `<video>` 요소를 쓴다. 이벤트 배선·이어보기 seek·스톨 감시는
 * 완전히 동일해서, 아래 `createVideoElementAdapter()` 를 `hlsjs.ts` 가 재사용한다.
 * 두 어댑터의 차이는 "소스를 어떻게 붙이고 떼는가"(`VideoSourceHooks`) 하나뿐이다.
 */

import {
    EventHub,
    finiteOrZero,
    normalizeAudioTracks,
    type PlayerAdapter,
    type PlayerAdapterInit,
    type PlayerEvents,
    type PlayerKind,
    type PlayerLoadOptions,
} from "./PlayerAdapter";

/** 메타데이터가 이 시간(ms) 안에 안 오면 로드 실패로 본다. */
const LOAD_TIMEOUT_MS = 30_000;
/** 재생 중인데 위치가 이만큼(초) 그대로면 스톨로 판정하고 복구를 시도한다. */
const STALL_SEC = 6;
/** 스톨 감시 주기(ms). */
const STALL_TICK_MS = 1_000;

/**
 * 소스 부착/해제 전략. 어댑터마다 이 두 개만 다르다.
 *  - html5: `video.src = url` (네이티브 HLS)
 *  - hlsjs: hls.js `loadSource` + `attachMedia`
 */
export interface VideoSourceHooks {
    kind: PlayerKind;
    /**
     * 소스를 붙인다. 로드 시작까지 이 안에서 책임진다(완료 대기는 공통 기반이 한다).
     *
     * `startAt` 을 로드 단계에서 살릴 수 있는 구현(hls.js)은 여기서 처리하고
     * `handlesStartAt: true` 를 돌려줘 공통 기반의 seek 폴백을 끈다.
     *
     * ⚠️ 네이티브 `src` 를 쓰는 구현은 **여기서** `video.load()` 를 불러야 한다.
     * 공통 기반이 부르면 MSE 경로(hls.js)까지 리셋해 버린다.
     */
    attach(
        video: HTMLVideoElement,
        src: string,
        options: PlayerLoadOptions,
    ): void | { handlesStartAt: boolean };
    /** 소스를 뗀다(디코더 반납). destroy 시 호출된다. */
    detach(video: HTMLVideoElement): void;
    /**
     * 스톨 복구 시도. 구현이 있으면 스톨 감지 시 호출된다.
     * @returns 복구를 시도했으면 true. false 면 공통 기반이 seek 넛지로 폴백한다.
     */
    recover?(video: HTMLVideoElement, currentTime: number): boolean;
}

/**
 * `<video>` 기반 어댑터 공통 기반. `html5.ts`(네이티브 HLS)와 `hlsjs.ts`(MSE)가 공유한다.
 *
 * 하는 일:
 *  - `<video>` 생성/삭제와 이벤트 → `PlayerEvents` 변환
 *  - 이어보기(`startAt`) — 메타데이터 이후 1회 seek (hooks 가 직접 처리하면 생략)
 *  - 스톨 감시 — 재생 중 위치가 멈추면 hooks.recover() → 실패 시 seek 넛지
 *  - `destroy()` 에서 소스 해제까지 확실히 수행(디코더 반납)
 */
export function createVideoElementAdapter(
    init: PlayerAdapterInit,
    hooks: VideoSourceHooks,
): PlayerAdapter {
    const hub = new EventHub(init.events);
    const video = document.createElement("video");

    // 항상 전체화면 재생이고 자체 터치 컨트롤(Controls.tsx)을 쓴다.
    // 네이티브 컨트롤까지 켜면 탭이 두 컨트롤에 동시에 먹혀 표시/숨김이 엉킨다.
    video.controls = false;
    video.autoplay = false;
    video.preload = "auto";
    video.playsInline = true;
    video.className = "web_player__video";
    // ⚠️ crossOrigin 은 지정하지 않는다. file:// 오리진(Origin: null)에서 CORS 모드를 켜면
    // CDN 응답에 자격 조건이 맞지 않아 로드가 통째로 막힌다.
    init.container.appendChild(video);

    let destroyed = false;
    let ended = false;
    /** 이어보기 대기 위치(초). 적용하면 null 로 비운다. */
    let pendingSeek: number | null = null;
    let stallTimer: number | null = null;
    let lastTime = -1;
    let stalledFor = 0;
    let buffering = false;

    const setBuffering = (next: boolean) => {
        if (buffering === next) return;
        buffering = next;
        hub.emit("onBuffering", next);
    };

    /** 메타데이터 확보 후 1회 이어보기 seek. 끝자락이면 호출부가 미리 걸러 준다. */
    const applyPendingSeek = () => {
        if (pendingSeek == null) return;
        const duration = finiteOrZero(video.duration);
        if (!duration) return; // 아직 길이를 모른다 — durationchange 에서 재시도
        const target = Math.min(pendingSeek, Math.max(0, duration - 1));
        pendingSeek = null;
        if (target <= 0) return;
        try {
            video.currentTime = target;
        } catch {
            /* 아직 seek 불가한 상태면 포기한다 — 처음부터 재생 */
        }
    };

    const onLoadedMetadata = () => {
        // 네이티브 트랙 상태 점검(복제/0개 교정). 정상이면 아무 일도 하지 않는다.
        normalizeAudioTracks(video);
        applyPendingSeek();
        hub.emit("onReady", finiteOrZero(video.duration));
    };
    const onDurationChange = () => {
        applyPendingSeek();
        hub.emit("onReady", finiteOrZero(video.duration));
    };
    const onTimeUpdate = () => hub.emit("onTimeUpdate", finiteOrZero(video.currentTime));
    const onPlay = () => {
        ended = false;
        hub.emit("onPlay");
    };
    const onPlaying = () => {
        setBuffering(false);
        hub.emit("onPlay");
    };
    const onPause = () => {
        // ended 직후에도 pause 가 함께 발화한다. 종료를 일시정지로 오해하지 않게 건너뛴다.
        if (ended) return;
        hub.emit("onPause");
    };
    const onEnded = () => {
        ended = true;
        setBuffering(false);
        hub.emit("onEnded");
    };
    const onWaiting = () => setBuffering(true);
    const onCanPlay = () => setBuffering(false);
    const onError = () => {
        const code = video.error?.code;
        hub.emit("onError", `재생할 수 없습니다. (media ${code ?? "unknown"})`);
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("error", onError);

    /**
     * 스톨 감시.
     *
     * 오디오 트랙 버그의 증상이 정확히 이것이다 — 세그먼트 로더가 abort 된 뒤 재시작되지
     * 못해 재생 위치가 영구히 멈춘다. `waiting` 이 오지 않는 경우도 있어(로더가 죽으면
     * 요청 자체가 없다) 이벤트에 의존하지 않고 위치를 직접 본다.
     */
    const startStallWatch = () => {
        if (stallTimer !== null) return;
        stallTimer = window.setInterval(() => {
            if (destroyed || video.paused || ended) {
                stalledFor = 0;
                return;
            }
            const now = finiteOrZero(video.currentTime);
            if (Math.abs(now - lastTime) > 0.05) {
                lastTime = now;
                stalledFor = 0;
                return;
            }
            stalledFor += STALL_TICK_MS / 1000;
            if (stalledFor < STALL_SEC) return;

            stalledFor = 0;
            setBuffering(true);
            console.warn(`[player:${hooks.kind}] ${STALL_SEC}초간 진행 없음 — 복구 시도`);
            // 트랙 상태가 망가져 있을 수 있으니 먼저 교정한다(활성 0개 → 1개).
            normalizeAudioTracks(video);
            const recovered = hooks.recover?.(video, now) ?? false;
            if (recovered) return;
            // 폴백: 아주 짧게 앞으로 밀어 파이프라인을 다시 깨운다.
            try {
                video.currentTime = now + 0.1;
                void video.play();
            } catch {
                /* 넛지 실패 — 다음 주기에 다시 시도한다 */
            }
        }, STALL_TICK_MS);
    };

    const stopStallWatch = () => {
        if (stallTimer === null) return;
        clearInterval(stallTimer);
        stallTimer = null;
    };

    return {
        kind: hooks.kind,

        load(src, options = {}) {
            if (destroyed) return Promise.reject(new Error("이미 파기된 플레이어입니다."));
            if (!src) return Promise.reject(new Error("재생 주소가 없습니다."));

            const result = hooks.attach(video, src, options);
            // hls.js 처럼 로드 단계에서 시작 위치를 처리하는 구현은 seek 폴백을 끈다.
            pendingSeek = result?.handlesStartAt ? null : (options.startAt ?? 0) || null;

            setBuffering(true);
            return new Promise<void>((resolve, reject) => {
                let settled = false;
                const timer = window.setTimeout(() => {
                    if (settled) return;
                    settled = true;
                    cleanup();
                    reject(new Error("재생 준비 시간이 초과되었습니다."));
                }, LOAD_TIMEOUT_MS);

                const cleanup = () => {
                    clearTimeout(timer);
                    video.removeEventListener("loadedmetadata", onOk);
                    video.removeEventListener("error", onFail);
                };
                const onOk = () => {
                    if (settled) return;
                    settled = true;
                    cleanup();
                    lastTime = finiteOrZero(video.currentTime);
                    startStallWatch();
                    resolve();
                };
                const onFail = () => {
                    if (settled) return;
                    settled = true;
                    cleanup();
                    reject(
                        new Error(`재생할 수 없습니다. (media ${video.error?.code ?? "unknown"})`),
                    );
                };

                video.addEventListener("loadedmetadata", onOk);
                video.addEventListener("error", onFail);
                // ⚠️ 여기서 video.load() 를 부르지 않는다.
                // load() 는 미디어 요소의 리소스 선택 알고리즘을 처음부터 다시 돌린다.
                // MSE(hls.js)가 붙은 요소에서 부르면 방금 붙인 MediaSource 와 startLoad(위치)가
                // 통째로 무효화된다 — 실측에서 이어보기가 12초 → 0초로 되돌아갔다.
                // 네이티브 src 를 쓰는 구현이 자기 attach() 안에서 직접 호출한다.
            });
        },

        play() {
            if (destroyed) return;
            ended = false;
            void video.play().catch((e: unknown) => {
                // 상태 전이 중 호출은 실패할 수 있다.
                console.warn(`[player:${hooks.kind}] play() 실패`, e);
            });
        },

        pause() {
            if (destroyed) return;
            try {
                video.pause();
            } catch {
                /* 이미 정지 상태 */
            }
        },

        seek(seconds) {
            if (destroyed) return;
            const duration = finiteOrZero(video.duration);
            // 끝(-1초)을 넘겨 seek 하면 ended 로 튀어 자동 다음화가 오발화한다.
            const max = duration ? Math.max(0, duration - 1) : Number.MAX_SAFE_INTEGER;
            const target = Math.min(Math.max(0, seconds), max);
            try {
                video.currentTime = target;
                ended = false;
            } catch {
                /* seek 불가 상태 — 무시 */
            }
        },

        getCurrentTime: () => finiteOrZero(video.currentTime),
        getDuration: () => finiteOrZero(video.duration),
        isPaused: () => video.paused,

        on(events: PlayerEvents) {
            hub.update(events);
        },

        destroy() {
            if (destroyed) return;
            destroyed = true;
            stopStallWatch();
            hub.clear();

            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("durationchange", onDurationChange);
            video.removeEventListener("timeupdate", onTimeUpdate);
            video.removeEventListener("play", onPlay);
            video.removeEventListener("playing", onPlaying);
            video.removeEventListener("pause", onPause);
            video.removeEventListener("ended", onEnded);
            video.removeEventListener("waiting", onWaiting);
            video.removeEventListener("canplay", onCanPlay);
            video.removeEventListener("error", onError);

            try {
                video.pause();
            } catch {
                /* 이미 정지 */
            }
            // 소스 해제(hls.destroy 또는 src 비우기) — 디코더를 확실히 반납한다.
            hooks.detach(video);
            video.removeAttribute("src");
            try {
                video.load();
            } catch {
                /* 무시 */
            }
            video.remove();
        },
    };
}

/**
 * 네이티브 HLS 어댑터 팩토리.
 *
 * `video.src` 에 m3u8 을 그대로 넣는다. 플랫폼이 매니페스트 파싱·ABR·디코딩을 모두 처리한다.
 */
export function createHtml5Player(init: PlayerAdapterInit): PlayerAdapter {
    return createVideoElementAdapter(init, {
        kind: "html5",
        attach(video, src) {
            video.src = src;
            // preload 정책에 따라 src 지정만으로는 로드가 지연될 수 있다.
            try {
                video.load();
            } catch {
                /* load() 가 무의미한 구현이면 무시한다 */
            }
        },
        detach(video) {
            // src 비우기는 공통 기반의 destroy 가 이어서 수행한다.
            video.removeAttribute("src");
        },
        // 네이티브 파이프라인에는 우리가 재시작시킬 로더가 없다.
        // 공통 기반의 seek 넛지 폴백에 맡긴다(recover 미구현).
    });
}
