// 로그인 상태 컨텍스트.
//
// 이 앱은 패키지 파일 오리진이라 쿠키 세션을 쓸 수 없다. 대신 페어링으로 받은 토큰을 tokenStore(네이티브 셸이면 네이티브 보안 저장소, 브라우저
// 개발이면 localStorage)에 두고 여기서 상태만 노출한다.

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { logout as apiLogout, setSessionEndedHandler } from "./apiClient";
import { getTokens, type StoredUser } from "./tokenStore";
import { useNavigate } from "react-router-dom";

interface AuthValue {
    /** 로그인한 사용자. 미로그인이면 null. */
    user: StoredUser | null;
    isLoggedIn: boolean;
    /** 페어링 성공 후 호출 — 저장소의 최신 토큰을 상태에 반영한다. */
    refresh: () => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<StoredUser | null>(() => getTokens()?.user ?? null);
    const navigate = useNavigate();

    const refresh = useCallback(() => {
        setUser(getTokens()?.user ?? null);
    }, []);

    const logout = useCallback(async () => {
        await apiLogout();
        setUser(null);
        navigate("/", { replace: true });
    }, []);

    // refresh 가 무효화(폐기/재사용 감지)되면 apiClient 가 세션을 끝낸다.
    // 그 시점에 화면 상태도 미로그인으로 돌려야 로그인 화면으로 빠진다.
    useEffect(() => {
        setSessionEndedHandler(() => setUser(null));
        return () => setSessionEndedHandler(null);
    }, []);

    const value = useMemo<AuthValue>(
        () => ({ user, isLoggedIn: !!user, refresh, logout }),
        [user, refresh, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth 는 AuthProvider 안에서만 사용할 수 있습니다.");
    return ctx;
}
