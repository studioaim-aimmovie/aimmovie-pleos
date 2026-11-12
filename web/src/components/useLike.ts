import { useCallback, useEffect, useRef } from "react";
import { useSession } from "@/compat/session";
import { setLike, setFavorite, type LikeState } from "@aim/core/api/likeStatus";
import { useLikeStatusContext } from "@/components/LikeStatusProvider";
import { useLoginRequired } from "@/components/LoginRequiredProvider";

type Kind = "like" | "favorite";

// 좋아요/즐겨찾기 공통 토글. 상태는 LikeStatusProvider(공유 컨텍스트)에서 읽고,
// 마운트 시 ensure()로 저장된 상태를 조회, 토글 시 낙관적 업데이트 + 저장(실패 롤백).
function useToggleStatus(
    contentId: string | undefined,
    kind: Kind,
    save: (contents: string, value: boolean) => Promise<boolean>,
): { active: boolean; toggle: () => void } {
    const { data: session } = useSession();
    const ctx = useLikeStatusContext();
    const requireLogin = useLoginRequired();
    const pendingRef = useRef(false);

    // 마운트/콘텐츠 변경 시 저장된 상태 배치 조회 요청.
    useEffect(() => {
        if (contentId) ctx?.ensure(contentId);
    }, [contentId, ctx]);

    const active = !!(contentId ? ctx?.map[contentId]?.[kind] : false);

    const toggle = useCallback(() => {
        if (!contentId) return;
        if (!session?.user) {
            requireLogin(); // 공용 모달("로그인 후 이용가능합니다.")
            return;
        }
        if (pendingRef.current) return;
        pendingRef.current = true;

        const next = !active;
        ctx?.setLocal(contentId, { [kind]: next } as Partial<LikeState>); // 낙관적 반영(공유)
        void save(contentId, next)
            .then((ok) => {
                if (!ok) {
                    ctx?.setLocal(contentId, { [kind]: !next } as Partial<LikeState>); // 실패 롤백
                } else if (kind === "favorite") {
                    ctx?.bumpFav(); // 찜 저장 성공 → 찜 목록 재조회 트리거
                }
            })
            .finally(() => {
                pendingRef.current = false;
            });
    }, [contentId, kind, active, session, save, ctx, requireLogin]);

    return { active, toggle };
}

/** 좋아요 토글 훅. */
export function useLike(contentId?: string): { liked: boolean; toggle: () => void } {
    const { active, toggle } = useToggleStatus(contentId, "like", setLike);
    return { liked: active, toggle };
}

/** 즐겨찾기 토글 훅. */
export function useFavorite(contentId?: string): { favorited: boolean; toggle: () => void } {
    const { active, toggle } = useToggleStatus(contentId, "favorite", setFavorite);
    return { favorited: active, toggle };
}
