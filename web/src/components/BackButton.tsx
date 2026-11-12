
import { useRouter } from "@/compat/navigation";
import type { ReactNode } from "react";

interface BackButtonProps {
    className?: string;
    children?: ReactNode;
    /** 뒤로 갈 기록이 없을 때 이동할 경로 (기본: "/") */
    fallbackHref?: string;
}

/** 뒤로가기 버튼. 히스토리가 있으면 back(), 없으면 fallbackHref 로 이동한다. */
export default function BackButton({ className, children, fallbackHref = "/" }: BackButtonProps) {
    const router = useRouter();

    const handleClick = () => {
        // 해시 라우팅이라 history.length 대신 react-router 의 idx 로 "앱 안에서 돌아갈 곳"을 본다.
        // (셸이 index.html 을 처음 띄우면 length 가 1 보다 클 수 있다 — 그때 back() 하면 앱 밖으로 나간다.)
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
        if (idx > 0) {
            router.back();
        } else {
            router.push(fallbackHref);
        }
    };

    return (
        <button type="button" className={className} onClick={handleClick} aria-label="뒤로가기">
            {children}
        </button>
    );
}
