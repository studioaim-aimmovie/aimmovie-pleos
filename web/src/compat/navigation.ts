// 라우팅 훅 — react-router 위에 얇은 인터페이스를 올린다.

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
}

export function useRouter(): AppRouter {
    const navigate = useNavigate();
    return useMemo<AppRouter>(
        () => ({
            push: (href) => navigate(href),
            replace: (href) => navigate(href, { replace: true }),
            back: () => navigate(-1),
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
