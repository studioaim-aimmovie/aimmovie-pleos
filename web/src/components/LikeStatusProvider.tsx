import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { useSession } from "@/compat/session";
import { fetchLikeStatus, type LikeState } from "@aim/core/api/likeStatus";

// 좋아요/즐겨찾기 상태 공유 컨텍스트.
// 여러 버튼이 각자 조회하지 않도록 마운트된 contentId를 모아 마이크로태스크에서 1회 배치 조회한다.
// 낙관적 업데이트도 여기서 관리해, 같은 콘텐츠의 상세/카드 버튼이 상태를 공유한다.
interface LikeStatusCtx {
    map: Record<string, LikeState>;
    ensure: (contentId: string) => void;
    setLocal: (contentId: string, patch: Partial<LikeState>) => void;
    // 찜(favorite) 저장이 성공할 때마다 증가. 찜 목록 재조회 트리거로 사용.
    favVersion: number;
    bumpFav: () => void;
}

const LikeStatusContext = createContext<LikeStatusCtx | null>(null);

export function LikeStatusProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const isAuthed = !!session?.user;
    const [map, setMap] = useState<Record<string, LikeState>>({});
    const [favVersion, setFavVersion] = useState(0);
    const bumpFav = useCallback(() => setFavVersion((v) => v + 1), []);
    const requestedRef = useRef<Set<string>>(new Set()); // 이미 조회 요청한 id
    const pendingRef = useRef<Set<string>>(new Set()); // 다음 flush 대기 id
    const scheduledRef = useRef(false);

    const merge = useCallback((status: Record<string, LikeState>) => {
        if (Object.keys(status).length) setMap((prev) => ({ ...prev, ...status }));
    }, []);

    const ensure = useCallback(
        (contentId: string) => {
            if (!isAuthed || !contentId || requestedRef.current.has(contentId)) return;
            requestedRef.current.add(contentId);
            pendingRef.current.add(contentId);
            if (scheduledRef.current) return;
            scheduledRef.current = true;
            // 같은 틱에 마운트된 버튼들의 id를 모아 1회 요청.
            queueMicrotask(() => {
                scheduledRef.current = false;
                const ids = [...pendingRef.current];
                pendingRef.current.clear();
                void fetchLikeStatus(ids).then(merge);
            });
        },
        [isAuthed, merge],
    );

    // 로그인 상태가 늦게 확정되면(미로그인 → 로그인) 그동안 요청됐던 id들을 다시 조회.
    useEffect(() => {
        if (!isAuthed) return;
        const ids = [...requestedRef.current];
        if (ids.length) void fetchLikeStatus(ids).then(merge);
    }, [isAuthed, merge]);

    const setLocal = useCallback((contentId: string, patch: Partial<LikeState>) => {
        setMap((prev) => {
            const base: LikeState = prev[contentId] ?? { like: false, favorite: false };
            return { ...prev, [contentId]: { ...base, ...patch } };
        });
    }, []);

    return (
        <LikeStatusContext.Provider value={{ map, ensure, setLocal, favVersion, bumpFav }}>
            {children}
        </LikeStatusContext.Provider>
    );
}

export function useLikeStatusContext() {
    return useContext(LikeStatusContext);
}
