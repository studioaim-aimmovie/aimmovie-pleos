import { useCallback, useEffect, useRef, useState } from "react";

export interface TransitionMount<T extends HTMLElement> {
    /** 가시성(transition) 제어 대상 요소에 연결할 ref. */
    ref: React.RefObject<T>;
    /** 논리적 열림 상태. */
    isOpen: boolean;
    /** 실제 DOM 마운트 여부(조건부 렌더링 게이트). */
    mounted: boolean;
    /** 가시 클래스(opacity 1) 적용 여부. */
    active: boolean;
    /** 열림 상태 직접 제어. */
    setOpen: (open: boolean) => void;
    /** 열림 상태 토글. */
    toggle: () => void;
}

interface Options {
    /** transitionend에서 감시할 CSS 프로퍼티. 기본 "opacity". */
    property?: string;
    /** transition이 발생하지 않는 경우(중복 토글 등) 대비 언마운트 폴백(ms). */
    fallbackMs?: number;
}

/**
 * 논리적 열림 상태에 따라 DOM 마운트를 제어하는 훅.
 * 열기: 마운트(opacity:0) → 다음 프레임에 active 부여(페이드-인).
 * 닫기: active 제거(페이드-아웃) → ref 요소의 transitionend 발화 시 언마운트.
 */
export function useTransitionMount<T extends HTMLElement = HTMLElement>({
    property = "opacity",
    fallbackMs = 400,
}: Options = {}): TransitionMount<T> {
    const ref = useRef<T>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [active, setActive] = useState(false);

    // 열기: 마운트 트리거 / 닫기: active 해제(페이드-아웃 시작)
    useEffect(() => {
        if (isOpen) setMounted(true);
        else setActive(false);
    }, [isOpen]);

    // 마운트(opacity:0 커밋·페인트) 이후 다음 프레임에 active → opacity 0→1 transition
    useEffect(() => {
        if (isOpen && mounted) {
            const raf = requestAnimationFrame(() => setActive(true));
            return () => cancelAnimationFrame(raf);
        }
    }, [isOpen, mounted]);

    // 닫히는 동안 transitionend(opacity)를 기다렸다가 언마운트. 폴백 타이머는 안전장치.
    useEffect(() => {
        const el = ref.current;
        if (!el || isOpen) return;
        const unmount = () => setMounted(false);
        const onEnd = (e: TransitionEvent) => {
            if (e.target === el && e.propertyName === property) unmount();
        };
        el.addEventListener("transitionend", onEnd);
        const fallback = setTimeout(unmount, fallbackMs);
        return () => {
            el.removeEventListener("transitionend", onEnd);
            clearTimeout(fallback);
        };
    }, [isOpen, property, fallbackMs]);

    const toggle = useCallback(() => setIsOpen((v) => !v), []);
    return { ref, isOpen, mounted, active, setOpen: setIsOpen, toggle };
}
