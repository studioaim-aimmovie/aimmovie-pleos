// 홈.
//
// 메뉴 목록 → 첫 페이지 편성 순서로 클라이언트에서 조회해 MainWrap 에 넘긴다.

import { getMenuList } from "@aim/core/api/menu";
import { getMainShow } from "@aim/core/api/catalog";
import type { MainShowResponse } from "@aim/core/types/main";

import MainWrap from "@/components/main_wrap";
import AsyncBoundary from "@/components/AsyncBoundary";
import { useAsync } from "@/hooks/useAsync";
import { useMarketCountry } from "@/hooks/useMarketCountry";

export default function Home() {
    const country = useMarketCountry();

    const { data, loading, error, reload } = useAsync<MainShowResponse | null>(
        async () => {
            const list = await getMenuList(country);
            const firstId = list?.data?.[0]?._id;
            if (!firstId) return null;
            return getMainShow(firstId, country);
        },
        [country],
        { errorMessage: "편성을 불러오지 못했습니다." },
    );

    return (
        <AsyncBoundary loading={loading} error={error} onRetry={reload}>
            {data?.result ? (
                <div id="contents" className="main_page">
                    <MainWrap mainData={data} />
                </div>
            ) : (
                // 메뉴가 비어 있는 경우(로컬 DB가 비었을 때 등). 빈 화면 대신 안내를 남긴다.
                <div className="async_state">
                    <p className="async_state__msg">표시할 편성이 없습니다.</p>
                </div>
            )}
        </AsyncBoundary>
    );
}
