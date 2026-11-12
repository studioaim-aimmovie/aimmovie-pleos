// FAQ.

import { getFaqList } from "@aim/core/api/faq";
import type { FaqItem } from "@aim/core/types/faq";

import Faq from "@/components/faq";
import AsyncBoundary from "@/components/AsyncBoundary";
import { useAsync } from "@/hooks/useAsync";
import { useMarketCountry } from "@/hooks/useMarketCountry";

export default function FaqPage() {
    const country = useMarketCountry();
    const { data, loading, error, reload } = useAsync<FaqItem[]>(
        () => getFaqList(country),
        [country],
        { errorMessage: "FAQ를 불러오지 못했습니다." },
    );

    return (
        <AsyncBoundary loading={loading} error={error} onRetry={reload}>
            <Faq faqs={data ?? []} />
        </AsyncBoundary>
    );
}
