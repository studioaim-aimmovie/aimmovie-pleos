// 검색 결과.
//
// 검색어는 쿼리(`#/search?str=...`)로 받는다. Header 의 검색 UI 가 여기로 보낸다.
// 검색어가 URL 에 있으므로 창 구역이 바뀌어도(리사이즈) 결과·검색어가 그대로 남는다.

import { useSearchParams } from "@/compat/navigation";
import { searchContents } from "@aim/core/api/catalog";

import List4 from "@/components/list4";
import AsyncBoundary from "@/components/AsyncBoundary";
import { useAsync } from "@/hooks/useAsync";
import { useMarketCountry } from "@/hooks/useMarketCountry";
import { useT, useLang } from "@/i18n/LocaleProvider";

export default function Search() {
    const params = useSearchParams();
    const queryStr = params.get("str") ?? "";
    const country = useMarketCountry();
    const { lang } = useLang();
    const t = useT();

    // country(편성)와 lang(표시·검색 언어)은 독립된 축이다. 둘 다 보내야
    // 영문 모드에서 영문 타이틀이 검색된다.
    const { data, loading, error, reload } = useAsync(
        () => searchContents(queryStr, country, lang),
        [queryStr, country, lang],
        { enabled: !!queryStr, errorMessage: "검색에 실패했습니다." },
    );

    const list = Array.isArray(data?.data) ? data.data : [];

    return (
        <div id="contents" className="sub_page search_page">
            <h2 className="tit">
                <span>“{queryStr}”</span> {t("search.results")}
            </h2>
            <AsyncBoundary loading={loading} error={error} onRetry={reload}>
                {list.length === 0 ? (
                    <div className="no_result">
                        <p>{t("search.no_result")}</p>
                        <ul>
                            <li>•{t("search.tip1")}</li>
                            <li>•{t("search.tip2")}</li>
                            <li>•{t("search.tip3")}</li>
                        </ul>
                    </div>
                ) : (
                    <List4 data={list} />
                )}
            </AsyncBoundary>
        </div>
    );
}
