// next-auth/react 대체 — 쿠키 세션이 아니라 AuthContext(tokenStore 의 토큰)를 읽는다.
//
// 이식된 컴포넌트가 `const { data: session } = useSession()` 형태를 그대로 쓰도록
// 모양만 맞춘다.
//
// ⚠️ web 과 다른 점
//  - `status` 는 "authenticated" / "unauthenticated" 둘뿐이다.
//    이 앱은 서버 렌더가 없어 세션을 비동기로 확인하는 "loading" 구간이 없다.
//  - `_id` 는 web 에서 CMS JWT 문자열이었지만, 이 앱에서는 **사용자 ObjectId 문자열**이다.
//    이 앱은 토큰을 Authorization 헤더로 따로 싣기 때문에 본문에 JWT 를 넣을 일이 없다.
//    (`_id` 를 그대로 CMS 로 넘기는 코드가 있으면 이식 시 제거할 것)
//  - `is_social` / `provider` 는 이 앱에서 OAuth 를 하지 않으므로 항상 비어 있다.

import { useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import { logout as apiLogout } from "../auth/apiClient";

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

/**
 * next-auth 의 signOut 상당물. 훅이 아닌 모듈 함수라 이벤트 핸들러에서 바로 부를 수 있다.
 *
 * 서버에 refresh 폐기를 알리고 로컬 토큰을 지운다. 토큰이 지워지면 apiClient 가
 * AuthContext 에 알려 화면도 미로그인 상태로 바뀌므로, 호출부가 따로 상태를 손댈 필요가 없다.
 *
 * `options` 는 next-auth 시그니처를 맞추기 위한 것으로 무시한다.
 * (`redirect`/`callbackUrl` 은 Next 라우팅 전용 개념이다)
 */
export async function signOut(_options?: {
    redirect?: boolean;
    callbackUrl?: string;
}): Promise<void> {
    await apiLogout();
}

/** 훅 형태가 필요할 때. 내부적으로 AuthContext 의 logout 을 쓴다. */
export function useSignOut(): () => Promise<void> {
    return useAuth().logout;
}
