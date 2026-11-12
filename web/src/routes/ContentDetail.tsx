// 콘텐츠 상세.

import { useParams } from "@/compat/navigation";
import { getContentShow } from "@aim/core/api/catalog";
import type { ContentShowResponse } from "@aim/core/types/contents";

import ViewWrap from "@/components/view_wrap";
import AsyncBoundary from "@/components/AsyncBoundary";
import { useAsync } from "@/hooks/useAsync";
import { useMarketCountry } from "@/hooks/useMarketCountry";

export default function ContentDetail() {
    const { id = "" } = useParams<{ id?: string }>();
    const country = useMarketCountry();

    const { data, loading, error, reload } = useAsync<ContentShowResponse>(
        () => getContentShow(id, country),
        [id, country],
        { enabled: !!id, errorMessage: "콘텐츠 정보를 불러오지 못했습니다." },
    );

    return (
        <AsyncBoundary loading={loading} error={error} onRetry={reload}>
            {data ? (
                <div id="contents" className="sub_page">
                    <ViewWrap viewData={data} />
                </div>
            ) : null}
        </AsyncBoundary>
    );
}
