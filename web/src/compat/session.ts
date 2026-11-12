// 세션 훅 — AuthContext(tokenStore 의 토큰)를 `const { data: session } = useSession()` 모양으로 읽는다.
//
//  - `status` 는 "authenticated" / "unauthenticated" 둘뿐이다.
//    이 앱은 서버 렌더가 없어 세션을 비동기로 확인하는 "loading" 구간이 없다.
//  - `_id` 는 **사용자 ObjectId 문자열**이다. 토큰은 Authorization 헤더로 따로 싣는다.
//  - `is_social` / `provider` 는 이 앱에서 OAuth 를 하지 않으므로 항상 비어 있다.

import { useMemo } from "react";
import { useAuth } from "../auth/AuthContext";

export interface SessionUser {
    _id: string;
    id: string;
    name?: string | null;
    country_code?: string;
    country_dial?: string;
    phone?: string;
    is_social?: boolean;
    provider?: "google" | "apple" | "credentials";
}

export interface Session {
    user: SessionUser;
}

export type SessionStatus = "authenticated" | "unauthenticated";

export function useSession(): { data: Session | null; status: SessionStatus } {
    const { user } = useAuth();

    return useMemo(() => {
        if (!user) return { data: null, status: "unauthenticated" as const };
        return {
            data: {
                user: {
                    _id: user.id,
                    id: user.id,
                    name: user.name,
                    country_code: user.country_code,
                    country_dial: user.country_dial,
                    phone: user.phone,
                },
            },
            status: "authenticated" as const,
        };
    }, [user]);
}
