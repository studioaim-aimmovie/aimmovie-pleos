// 시스템 뒤로가기(Android Back → WebView history.back)로 열린 모달을 닫는다.
//
// 모달이 열리면 지금 주소·라우터 상태를 그대로 복사한 history 항목을 하나 쌓는다(표식 `__aimModal`).
// 뒤로가기는 그 항목을 꺼낼 뿐이라 HashRouter 가 보기에는 같은 위치·같은 idx 로 돌아온 것이어서
// 화면이 바뀌지 않는다. popstate 를 받으면 가장 위 모달 하나만 닫는다.
//
// 등록·해제 때 history 를 바로 건드리지 않고, "열린 모달 수"와 "쌓아 둔 항목 수"를 다음 틱에 맞춘다.
//  - StrictMode 는 개발 중 effect 를 등록→해제→등록으로 두 번 실행한다. 해제 때 바로 history.back() 을
//    부르면, back() 이 비동기라 뒤이은 pushState 보다 늦게 처리되는데 Chrome 은 back() 을 "호출한 시점의
//    위치"에서 한 칸 물러서므로 방금 쌓은 항목까지 건너뛰어 화면 자체를 떠난다(실측).
//  - 같은 틱 안의 해제·등록은 서로 상쇄되어 history 를 건드리지 않는다.
//  - 모달이 겹쳐도(대여 모달 위 안내 모달) 뒤로가기 한 번에 위의 것만 닫힌다.

import { useEffect, useRef } from "react";

const MARK = "__aimModal";

interface Entry {
    id: number;
    /** 뒤로가기로 닫기를 요청한다. false 를 돌려주면 거부(모달 유지). */
    requestClose: () => boolean | void;
}

/** 열린(가로챌) 모달. 마지막이 가장 위. */
const stack: Entry[] = [];
let nextId = 1;
/** 우리가 쌓아 두었고 아직 history 에 남아 있는 항목 수. */
let pushed = 0;
/** 우리가 직접 일으킨 history 이동 수. 그만큼의 popstate 는 무시한다. */
let ignorePops = 0;
let reconcileScheduled = false;
let listening = false;

function isModalEntry(state: unknown): boolean {
    return typeof state === "object" && state !== null && MARK in state;
}

function pushEntry() {
    // 라우터 상태(usr·key·idx)를 그대로 복사해 둔다 — idx 가 같아야 꺼낼 때 라우터가 이동으로 보지 않는다.
    const base = (window.history.state ?? {}) as Record<string, unknown>;
    window.history.pushState({ ...base, [MARK]: true }, "", window.location.href);
    pushed++;
}

/** 쌓아 둔 항목 수를 열린 모달 수에 맞춘다. */
function reconcile() {
    reconcileScheduled = false;
    const target = stack.length;
    while (pushed < target) pushEntry();
    if (pushed > target) {
        const extra = pushed - target;
        if (isModalEntry(window.history.state)) {
            // 버튼·딤 탭으로 닫혔다. 쌓아 둔 항목을 한 번에 걷어낸다(popstate 는 한 번 온다).
            ignorePops++;
            window.history.go(-extra);
        }
        // 지금 위치가 우리 항목이 아니면 모달 안에서 다른 화면으로 이동한 것이다(예: 확인 → /play).
        // 되돌리면 그 이동이 취소되므로 남겨 두고 잊는다. 남은 항목은 onPopState 가 지날 때 건너뛴다.
        pushed = target;
    }
}

function scheduleReconcile() {
    if (reconcileScheduled) return;
    reconcileScheduled = true;
    setTimeout(reconcile, 0);
}

function onPopState(e: PopStateEvent) {
    if (ignorePops > 0) {
        ignorePops--;
        return;
    }
    if (pushed > 0) pushed--; // 사용자가 우리 항목 하나를 꺼냈다.
    const top = stack[stack.length - 1];
    if (!top) {
        // 다른 화면으로 이동하느라 정리하지 못하고 남은 항목(같은 주소)에 내려앉았다.
        // 사용자에게는 아무 변화 없는 뒤로가기로 보이므로 한 번 더 건너뛴다.
        if (isModalEntry(e.state)) {
            ignorePops++;
            window.history.back();
        }
        return;
    }
    if (top.requestClose() === false) {
        // 닫을 수 없는 상태(결제 처리 중 등) — 꺼낸 항목을 다시 쌓아 다음 뒤로가기도 여기서 받는다.
        scheduleReconcile();
        return;
    }
    // 닫힌 모달은 곧 unregister 되지만, 그 전에 다음 뒤로가기가 와도 같은 모달을 또 닫지 않게 미리 뺀다.
    stack.pop();
}

function register(requestClose: Entry["requestClose"]): number {
    if (!listening) {
        window.addEventListener("popstate", onPopState);
        listening = true;
    }
    const id = nextId++;
    stack.push({ id, requestClose });
    scheduleReconcile();
    return id;
}

function unregister(id: number) {
    const i = stack.findIndex((e) => e.id === id);
    if (i < 0) return; // 이미 뒤로가기로 닫혀 빠진 항목이다.
    stack.splice(i, 1);
    scheduleReconcile();
}

/**
 * 모달이 열려 있는 동안 시스템 뒤로가기를 가로채 [onClose] 를 부른다.
 *
 * @param open 모달이 열려 있는지. false 면 아무 것도 하지 않는다.
 * @param onClose 뒤로가기로 닫을 때 부른다. false 를 돌려주면 닫지 않고 모달을 유지한다.
 * @param enabled false 면 가로채지 않는다(닫을 수 없는 강제 모달).
 */
export function useBackClose(open: boolean, onClose: () => boolean | void, enabled = true) {
    // 최신 콜백을 참조한다 — 콜백이 바뀔 때마다 등록을 다시 하지 않으려고.
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!open || !enabled) return;
        const id = register(() => onCloseRef.current());
        return () => unregister(id);
    }, [open, enabled]);
}
