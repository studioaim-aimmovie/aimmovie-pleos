// 메뉴별 편성 목록.
// 홈과 동일한 응답 형태를 쓰므로 MainWrap 을 그대로 재사용한다.

import { useParams } from "@/compat/navigation";
import { getMainShow } from "@aim/core/api/catalog";
import type { MainShowResponse } from "@aim/core/types/main";

import MainWrap from "@/components/main_wrap";
import AsyncBoundary from "@/components/AsyncBoundary";
import { useAsync } from "@/hooks/useAsync";
import { useMarketCountry } from "@/hooks/useMarketCountry";

export default function ListPage() {
    const { type = "" } = useParams<{ type?: string }>();
    const country = useMarketCountry();

    const { data, loading, error, reload } = useAsync<MainShowResponse>(
        () => getMainShow(type, country),
        [type, country],
        { enabled: !!type, errorMessage: "목록을 불러오지 못했습니다." },
    );

    return (
        <AsyncBoundary loading={loading} error={error} onRetry={reload}>
            {data?.result ? (
                <div id="contents" className="main_page">
                    <MainWrap mainData={data} />
                </div>
            ) : (
                <div className="async_state">
                    <p className="async_state__msg">표시할 콘텐츠가 없습니다.</p>
                </div>
            )}
        </AsyncBoundary>
    );
}
