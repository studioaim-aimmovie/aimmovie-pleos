/**
 * List4 (그리드 목록) — 검색 결과·목록 페이지의 포스터 그리드.
 *
 * 세로 = 세로 포스터 imageV, 가로 = 가로 포스터 imageH. 카드 탭 → 상세.
 *
 * 터치에는 hover 가 없으므로 미리보기 모달을 두지 않는다. 카드 정보와 재생·찜·좋아요는 상세 화면이 맡는다.
 */

import { useRouter } from "@/compat/navigation";
import Image from "@/compat/Image";
import ContentLabels from "@/components/ContentLabels";
import { pickContents } from "@aim/core/domain/contents";
import { useCountry } from "@/hooks/useCountry";
import { useIsPortrait } from "@/hooks/useLayoutMode";

interface dataProps {
    // 검색/목록 API의 콘텐츠 배열
    data?: any[];
}

export default function List4({ data = [] }: dataProps) {
    const router = useRouter();
    const country = useCountry();
    const isPortrait = useIsPortrait();

    // 다른 슬라이드/뷰와 동일하게 pickContents로 가공(각 항목이 콘텐츠 객체).
    const items = (Array.isArray(data) ? data : []).map((item, i) =>
        pickContents({ contents: item }, i, country),
    );

    const goToDetail = (videoId: string) => {
        if (!videoId) return;
        router.push(`/contents/${videoId}`);
    };

    return (
        <ul className="list_type4">
            {items.map((item) => {
                const card = (
                    <div
                        className="bg_area"
                        style={{ cursor: "pointer" }}
                        onClick={() => goToDetail(item.videoId)}
                    >
                        <div className="bg">
                            <Image
                                src={isPortrait ? item.imageV : item.imageH}
                                alt={item.title}
                                fill
                                style={{ objectFit: "cover" }}
                            />
                        </div>
                        <ContentLabels labels={item.labels} />
                    </div>
                );
                return (
                    <li key={item.key}>
                        {/* 가로는 .focus_card(레이아웃 중립 박스)로 감싼다.
                            ⚠️ 감싸는 위치는 `li` 안쪽이어야 한다 — web_style 의 `.list_type4 > li`
                            직접자식 선택자와 `:nth-child(5n)` 규칙이 `li` 기준이다. */}
                        {isPortrait ? card : <div className="focus_card">{card}</div>}
                    </li>
                );
            })}
        </ul>
    );
}
