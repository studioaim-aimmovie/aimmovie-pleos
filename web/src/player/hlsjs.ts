/**
 * hls.js 어댑터 — `<video>` + hls.js(MSE).
 *
 * Android WebView 는 Chromium 기반이라 **네이티브 HLS 를 지원하지 않는다.** 그래서 hls.js 로
 * 매니페스트를 파싱하고 MSE 로 세그먼트를 넣어 준다. 데스크탑 브라우저(Safari 제외)도 같은
 * 조건이라 개발 중 실제로 검증되는 경로다. (차량 실사용 재생은 네이티브 Media3 — README 참고.)
 *
 * ## ⚠️ Chromium 오디오 트랙 버그 (커밋 `c430a4c`)
 *
 * 증상: 오디오 세그먼트 로더가 abort 된 뒤 재시작되지 못해 **무한 버퍼링**에 걸린다.
 * 원인: Chromium 이 비표준 `HTMLMediaElement.audioTracks` 를 노출하고,
 * MSE 재생기가 그것을 자체 트랙 목록으로 미러링하며 복제 트랙을 만든다. 복제가 추가되는
 * 찰나 기존 트랙이 비활성화되어 "활성 오디오 트랙 0개" 구간이 생기고 로더가 죽는다.
 *
 * hls.js 에는 미러링을 끄는 스위치가 없다(애초에 네이티브 `audioTracks` 를 미러링하지 않고 매니페스트의
 * `EXT-X-MEDIA:TYPE=AUDIO` 로 자체 트랙 목록을 만든다). 따라서 **원인 경로는 동일하지 않지만
 * 실패 모드(로더 abort 후 미재시작)는 그대로 재현될 수 있다.** 그래서 원인 한 곳을 끄는 대신
 * 아래 3중 방어를 건다.
 *
 * | 방어 | 내용 |
 * |---|---|
 * | ① 트랙 고정 | 매니페스트에 오디오 렌디션이 2개 이상이면 기본 트랙 하나로 **고정**한다. 트랙 전환(`AUDIO_TRACK_SWITCH`)이 로더 abort 를 유발하는 경로 자체를 없앤다 |
 * | ② 네이티브 트랙 교정 | `normalizeAudioTracks()` 로 활성 트랙이 0개/2개 이상이면 1개로 되돌린다(공통 기반이 로드·스톨 시 호출) |
 * | ③ 스톨 복구 | 위치가 6초간 멈추면 `hls.startLoad(현재위치)` 로 **로더를 강제 재시작**한다. 죽은 로더를 되살리는 직접적인 조치다. 2회 실패하면 `recoverMediaError()` 로 승격 |
 *
 * ⚠️ 로컬 HLS 덤프(`localhost:8066/hls/...`)는 오디오 그룹이 분리돼 있지만 **영어 하나뿐**이라
 * ①의 다중 트랙 분기는 타지 않는다. *복제 트랙* 시나리오 재현에는 다국어 오디오 콘텐츠가
 * 별도로 필요하다 — 실기 검증 시 그 조건으로 확인할 것.
 */

import Hls, { type ErrorData } from "hls.js";

import { createVideoElementAdapter } from "./html5";
import { normalizeAudioTracks, type PlayerAdapter, type PlayerAdapterInit } from "./PlayerAdapter";

/**
 * 저메모리 기기 지향 hls.js 설정.
 *
 * 데스크탑 기본값은 버퍼를 넉넉히 잡는데, 차량 인포테인먼트는 앱 몫 메모리가 수백 MB 라
 * 버퍼를 크게 두면 GC 압박으로 오히려 끊긴다. 앞/뒤 버퍼를 모두 좁게 잡는다.
 */
const LOW_MEMORY_CONFIG = {
    // 시작 위치를 우리가 직접 주려면 자동 로드를 끄고 startLoad(pos) 를 불러야 한다.
    autoStartLoad: false,

    // ── 버퍼 (메모리 절약) ──
    maxBufferLength: 20,
    maxMaxBufferLength: 60,
    maxBufferSize: 30 * 1000 * 1000, // 30MB
    // 지나간 버퍼를 오래 들고 있지 않는다. 되감기는 컨트롤이 10초 단위라 30초면 충분하다.
    backBufferLength: 30,

    // ── 스톨 대응 ──
    // 기본(2초)보다 관대하게 둔다. 세그먼트 요청 왕복이 느리면 성급한 넛지가 오히려
    // 재생을 더 흔든다. 대신 nudge 재시도 횟수를 늘려 포기하지 않게 한다.
    highBufferWatchdogPeriod: 3,
    nudgeMaxRetry: 8,

    // ── 화질 ──
    // 플레이어 크기를 넘는 레벨을 받아 하드웨어 디코더를 낭비하지 않게 한다.
    capLevelToPlayerSize: true,

    // VOD 전용 서비스다. 저지연 모드가 켜지면 라이브 엣지 로직이 개입한다.
    lowLatencyMode: false,
} as const;

/** 이 환경에서 hls.js(MSE)를 쓸 수 있는가. 팩토리(index.ts)가 어댑터를 고를 때 쓴다. */
export function isHlsJsSupported(): boolean {
    return Hls.isSupported();
}

/** 스톨 복구를 이만큼 연속 실패하면 recoverMediaError() 로 승격한다. */
const RECOVER_ESCALATE_AFTER = 2;

/**
 * hls.js 어댑터 팩토리(Android WebView·네이티브 HLS 미지원 데스크탑).
 *
 * hls.js 가 지원되지 않는 환경(MSE 부재)에서는 네이티브 `<video src>` 로 폴백한다 —
 * Safari 처럼 네이티브 HLS 만 되는 브라우저에서 개발자가 화면을 열어 볼 수 있게 하는 안전망이다.
 */
export function createHlsJsPlayer(init: PlayerAdapterInit): PlayerAdapter {
    let hls: Hls | null = null;
    let recoverFailures = 0;
    /** 비치명적 버퍼 스톨 누적 횟수. 첫 건(콜드 스타트)은 로그를 남기지 않는다. */
    let stallReports = 0;

    return createVideoElementAdapter(init, {
        kind: "hlsjs",

        attach(video, src, options) {
            if (!Hls.isSupported()) {
                // MSE 가 없다 → 네이티브 HLS 를 기대할 수밖에 없다.
                console.warn("[player:hlsjs] hls.js 미지원 환경 — 네이티브 <video src> 로 폴백");
                video.src = src;
                try {
                    video.load();
                } catch {
                    /* 무시 */
                }
                return { handlesStartAt: false };
            }

            const instance = new Hls(LOW_MEMORY_CONFIG);
            hls = instance;

            // ① 오디오 렌디션이 여러 개면 기본 트랙 하나로 고정한다.
            //    (전환 경로를 없애 로더 abort 유발 지점을 제거 — 위 표 ① 참고)
            instance.on(Hls.Events.MANIFEST_PARSED, () => {
                const tracks = instance.audioTracks;
                if (tracks.length <= 1) return;
                const target = tracks.find((t) => t.default) ?? tracks[0];
                if (!target) return;
                console.warn(
                    `[player:hlsjs] 오디오 렌디션 ${tracks.length}개 감지 — ` +
                        `"${target.name || target.lang || target.id}" 로 고정한다 ` +
                        "(Chromium 복제 트랙 대응, 커밋 c430a4c 참고)",
                );
                if (instance.audioTrack !== target.id) instance.audioTrack = target.id;
            });

            // ② 오디오 트랙 전환이 실제로 일어났다면 네이티브 트랙 상태를 즉시 점검한다.
            //    (복제가 생기는 순간이 바로 이 타이밍이다)
            instance.on(Hls.Events.AUDIO_TRACK_SWITCHED, () => {
                normalizeAudioTracks(video);
            });

            instance.on(Hls.Events.ERROR, (_event, data: ErrorData) => {
                if (!data.fatal) {
                    // 비치명적 오류는 hls.js 가 자체 재시도한다. 버퍼 스톨은 콜드 스타트에서
                    // 거의 항상 1회 발생하므로(실측) 첫 건은 흘리고, 반복될 때만 남긴다 —
                    // 매 재생마다 경고가 찍히면 실기 로그에서 진짜 스톨이 묻힌다.
                    if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
                        stallReports += 1;
                        if (stallReports > 1) {
                            console.warn(
                                `[player:hlsjs] BUFFER_STALLED_ERROR ${stallReports}회(비치명적)`,
                            );
                        }
                    }
                    return;
                }

                console.error(`[player:hlsjs] 치명적 오류 ${data.type}/${data.details}`);
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        // 매니페스트 자체를 못 받은 경우는 재시도해도 같으므로 실패로 올린다.
                        if (
                            data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
                            data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT ||
                            data.details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR
                        ) {
                            return; // 공통 기반의 load() 타임아웃/미디어 error 로 귀결된다
                        }
                        instance.startLoad(video.currentTime);
                        return;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        // 버퍼/디코더 오류. 1차는 미디어 재생성, 2차는 오디오 코덱 스왑.
                        if (recoverFailures >= RECOVER_ESCALATE_AFTER) {
                            instance.swapAudioCodec();
                        }
                        recoverFailures += 1;
                        instance.recoverMediaError();
                        return;
                    default:
                        instance.destroy();
                        hls = null;
                        return;
                }
            });

            instance.loadSource(src);
            instance.attachMedia(video);
            // 이어보기 위치부터 세그먼트를 받는다. 앞부분을 받아 버리고 seek 하면
            // 대역폭과 디코더 워밍업을 그대로 낭비한다.
            instance.startLoad(Math.max(0, options.startAt ?? 0));

            // ⚠️ `handlesStartAt: false` — startLoad(위치) 는 **로드 지점만** 옮긴다.
            // 미디어 요소를 그 위치로 seek 하는 것까지는 보장되지 않는다(실측: 12초를 넘겼는데
            // 0초부터 재생됐다). 그래서 공통 기반의 "loadedmetadata 이후 1회 seek" 폴백을
            // 그대로 켜 둔다. 두 조치는 상충하지 않는다 —
            // startLoad 가 대역폭을, 폴백 seek 가 실제 시작 위치를 보장한다.
            return { handlesStartAt: false };
        },

        /**
         * ③ 스톨 복구 — 죽은 세그먼트 로더를 강제 재시작한다.
         *
         * `startLoad(pos)` 는 로더를 멈추고 그 위치부터 다시 파이프라인을 세운다.
         * "abort 후 재시작되지 못한" 상태를 정확히 겨냥한 조치다.
         */
        recover(video, currentTime) {
            if (!hls) return false;
            recoverFailures += 1;
            if (recoverFailures > RECOVER_ESCALATE_AFTER) {
                console.warn(
                    "[player:hlsjs] startLoad 복구 반복 실패 — recoverMediaError() 로 승격",
                );
                hls.recoverMediaError();
                recoverFailures = 0;
                return true;
            }
            console.warn(`[player:hlsjs] startLoad(${currentTime.toFixed(1)}) 로 로더 재시작`);
            hls.startLoad(currentTime);
            void video.play().catch(() => {
                /* 재시작 직후 play 실패는 다음 감시 주기에서 다시 다룬다 */
            });
            return true;
        },

        detach() {
            if (!hls) return;
            hls.destroy(); // detachMedia + 모든 로더 정리 (디코더 반납)
            hls = null;
        },
    });
}
