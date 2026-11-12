// next/navigation 대체 — react-router 위에 같은 인터페이스를 올린다.

import { useMemo } from "react";
import {
    useLocation,
    useNavigate,
    useParams as useRouterParams,
    useSearchParams as useRouterSearchParams,
} from "react-router-dom";

export interface AppRouter {
    push: (href: string) => void;
    replace: (href: string) => void;
    back: () => void;
    forward: () => void;
    /** RSC 재검증이 없으므로 no-op. 호출부를 고치지 않으려고 남겨 둔다. */
    refresh: () => void;
    prefetch: (href: string) => void;
}

export function useRouter(): AppRouter {
    const navigate = useNavigate();
    return useMemo<AppRouter>(
        () => ({
            push: (href) => navigate(href),
            replace: (href) => navigate(href, { replace: true }),
            back: () => navigate(-1),
            forward: () => navigate(1),
            refresh: () => {
                /* SPA에는 서버 재검증이 없다 — 데이터 갱신은 각 화면이 직접 다시 조회한다 */
            },
            prefetch: () => {
                /* 번들이 하나라 프리페치 개념이 없다 */
            },
        }),
        [navigate],
    );
}

export function usePathname(): string {
    return useLocation().pathname;
}

/** HashRouter 의 쿼리(해시 뒤 `?`)를 읽는다. */
export function useSearchParams(): URLSearchParams {
    const [params] = useRouterSearchParams();
    return params;
}

export function useParams<T extends Record<string, string | undefined>>(): T {
    return useRouterParams() as T;
}

/**
 * next/navigation 의 useSelectedLayoutSegment 상당물.
 *
 * Next 에서는 "현재 레이아웃 아래의 활성 세그먼트"였다. 라우트 그룹 개념이 없는
 * SPA 에서는 경로의 첫 세그먼트로 근사한다(루트면 null).
 * 예: "/contents/123" → "contents", "/" → null
 */
export function useSelectedLayoutSegment(): string | null {
    const { pathname } = useLocation();
    const first = pathname.split("/").filter(Boolean)[0];
    return first ?? null;
}

/**
 * next/navigation 의 redirect 상당물.
 *
 * ⚠️ Next 의 redirect() 는 예외를 던져 렌더를 중단시킨다. 여기서는 그런 장치가 없으므로
 * 컴포넌트에서는 <Navigate> 를 쓰고, 이 함수는 이벤트 핸들러에서만 쓴다.
 */
export function redirect(href: string): void {
    window.location.hash = href.startsWith("#") ? href : `#${href}`;
}
