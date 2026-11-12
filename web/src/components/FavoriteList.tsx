import { useEffect, useState } from "react";
import Image from "@/compat/Image";
import { useRouter } from "@/compat/navigation";
import { useSession } from "@/compat/session";
import { fetchFavorites } from "@aim/core/api/likeStatus";
import {
    fetchWatchStatus,
    lastWatchedProgress,
    type VideoStatusMap,
} from "@aim/core/api/videoStatus";
import { pickContents } from "@aim/core/domain/contents";
import { useCountry } from "@/hooks/useCountry";
import { useT } from "@/i18n/LocaleProvider";
import type { Content } from "@aim/core/types/contents";
import { useLikeStatusContext } from "@/components/LikeStatusProvider";
import ContentLabels from "@/components/ContentLabels";
import { useIsPortrait } from "@/hooks/useLayoutMode";

// 찜한 콘텐츠 그리드. /authapi/likestatus/mylist(favorite:true) 기반.
// apps/tv 의 FavoriteList 에서 옮겼다(원본: apps/web components/sub/FavoriteList.tsx).
// 카드 레이아웃은 나의 시청기록(list_type4)과 동일 — 시청 이력 있으면 포스터 하단에
// 이어보기 타임라인도 노출(완료 시 숨김). 탭하면 상세로 이동한다.
//
// 세로는 apps/web 모바일처럼 세로 포스터(언어별)와 라벨을, 가로는 TV 처럼 가로 포스터를 쓴다.
// TV 의 hover 미리보기 모달은 없다(터치에는 hover 가 없다). 찜 해제·재생은 상세가 맡는다.
export default function FavoriteList() {
    const isPortrait = useIsPortrait();
    const { data: session } = useSession();
    const isAuthed = !!session?.user;
    const router = useRouter();
    // 찜 해제(토글 off) 시 카드가 즉시 사라지도록 공유 컨텍스트의 favorite 상태를 구독한다.
    const likeCtx = useLikeStatusContext();
    const country = useCountry();
    const t = useT();
    const [items, setItems] = useState<Content[] | null>(null);
    const [statusMap, setStatusMap] = useState<VideoStatusMap>({});
    // 다른 리스트(시청기록 등)에서 찜을 추가하면 favVersion이 올라가 목록을 조용히 재조회한다.
    const favVersion = likeCtx?.favVersion ?? 0;
    useEffect(() => {
        if (!isAuthed) {
            setItems([]);
            return;
        }
        let cancelled = false;
        fetchFavorites().then((list) => {
            if (!cancelled) setItems(list);
        });
        return () => {
            cancelled = true;
        };
    }, [isAuthed, favVersion]);

    // 이어보기 진행바용 시청상태: 찜 콘텐츠들의 회차 영상 시청상태를 한 번에 조회.
    useEffect(() => {
        if (!isAuthed || !items || items.length === 0) return;
        const ids = items.flatMap((c) =>
            pickContents({ contents: c }, 0).episodes.map((e) => e.id),
        );
        if (ids.length === 0) return;
        let cancelled = false;
        fetchWatchStatus([...new Set(ids)]).then((m) => {
            if (!cancelled) setStatusMap(m);
        });
        return () => {
            cancelled = true;
        };
    }, [isAuthed, items]);

    // 조회 전(null)엔 아무것도 그리지 않음(깜빡임 방지).
    if (items === null) return null;

    // 슬라이드/리스트와 동일하게 pickContents로 가공(포스터·제목·등급·러닝타임 등).
    // 컨텍스트에서 favorite이 명시적으로 false가 된 항목(방금 토글 해제)은 즉시 숨긴다.
    // (아직 상태 미조회면 undefined → 노출 유지해 깜빡임 방지)
    const cards = items
        .map((c, i) => pickContents({ contents: c }, i, country))
        .filter((slide) => likeCtx?.map[slide.videoId]?.favorite !== false);

    if (cards.length === 0) {
        return (
            <div className="no_list">
                <p>{t("mypage.myfavorites.empty")}</p>
            </div>
        );
    }

    return (
        <ul className="list_type4 favorite_list">
            {cards.map((slide) => {
                // 이어보기 진행률: 마지막 본 회차 기준, 완료면 null(진행바 미노출).
                const prog = lastWatchedProgress(statusMap, slide.episodes);
                const card = (
                    <>
                        <div
                            className="bg_area"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                                slide.videoId && router.push(`/contents/${slide.videoId}`)
                            }
                        >
                            <div className="bg">
                                <Image
                                    src={isPortrait ? slide.imageVLocalized : slide.imageH}
                                    alt={slide.title}
                                    fill
                                    style={{ objectFit: "cover" }}
                                />
                            </div>
                            {/* 타임라인(진행바): 포스터 하단, 본 기록 있고 완료 전일 때만 */}
                            {prog && (
                                <span className="progress_bar">
                                    <i style={{ width: `${prog.percent}%` }} />
                                </span>
                            )}
                            <ContentLabels labels={slide.labels} />
                        </div>

                        <p className="tit">{slide.title}</p>
                    </>
                );
                return (
                    <li key={slide.key}>
                        {/* 가로는 TV 마크업(.focus_card)을 유지한다 — list4 와 같은 이유로 `li` 안쪽. */}
                        {isPortrait ? card : <div className="focus_card">{card}</div>}
                    </li>
                );
            })}
        </ul>
    );
}
