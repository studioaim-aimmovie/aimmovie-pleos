/**
 * KV(메인 영웅) 영상 ↔ 슬라이드 카드 미리보기 영상의 디코더 경합 조정자.
 *
 * TV(Tizen/webOS/AndroidTV)는 동시 하드웨어 비디오 디코더가 1개뿐이라,
 * KV 영상이 재생 중인 상태에서 슬라이드 카드 미리보기가 재생되면 디코더를 다투다
 * KV가 검게 죽는다(자세한 배경은 [[tv-single-video-decoder]]).
 *
 * 그래서 슬라이드 카드에 포커스가 가 있는 동안에는 KV를 멈춰(디코더 반납) 슬라이드
 * 미리보기가 디코더를 쓰게 하고, 슬라이드에서 벗어나면 KV를 다시 재생한다.
 *
 * main_wrap이 KV 컨트롤러를 등록하고, Slide1/Slide2가 카드 focus/blur 시
 * request/release를 호출한다. web/mobile은 디코더 여유가 있어 호출부에서 TV만 게이팅한다.
 */

type KvController = {
    /** KV 정지(디코더 반납). */
    pause: () => void;
    /** KV 재생 재개(디코더 재취득). */
    resume: () => void;
};

let controller: KvController | null = null;
// 여러 슬라이드 카드가 focus/blur를 주고받는 동안 KV 정지 요청을 카운트로 관리한다.
// (카드 A→B 이동 시 blur A + focus B가 함께 발생해도 net으로 유지되도록 한다.)
let holders = 0;
// 카드 간 이동 중 순간적으로 holders가 0이 되더라도 KV가 깜빡 재개되지 않도록
// resume은 마이크로태스크로 미뤄, 곧바로 들어오는 pause 요청이 취소할 수 있게 한다.
let resumeScheduled = false;

/** main_wrap이 마운트/언마운트 시 KV 컨트롤러를 등록/해제한다. */
export function registerKvController(c: KvController | null): void {
    controller = c;
}

/** 슬라이드 카드 포커스 진입 → KV 정지 요청. */
export function requestKvPause(): void {
    holders += 1;
    resumeScheduled = false; // 대기 중이던 재개 취소
    controller?.pause();
}

/** 슬라이드 카드 포커스 이탈 → KV 정지 해제(마지막 홀더가 빠지면 재개). */
export function releaseKvPause(): void {
    holders = Math.max(0, holders - 1);
    if (holders > 0) return;
    resumeScheduled = true;
    queueMicrotask(() => {
        if (resumeScheduled && holders === 0) {
            resumeScheduled = false;
            controller?.resume();
        }
    });
}
