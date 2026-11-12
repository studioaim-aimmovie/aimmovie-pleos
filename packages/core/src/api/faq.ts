// FAQ 서버 조회. 다른 공개 조회(main/show 등)와 동일하게 RSC에서 CMS로 직접 요청.
// country는 resolveCountry 결과(게스트=KR, 로그인=country_code) — 백엔드가 ISO→국가 매핑 후
// 해당 국가 + 공용(country:null) 공개(open:1) FAQ를 반환한다.
import type { FaqItem, FaqListResponse } from "../types/faq";
import { apiRoot } from "../config";

export async function getFaqList(country: string): Promise<FaqItem[]> {
    try {
        const res = await fetch(
            `${apiRoot()}/api/faq?country=${encodeURIComponent(country)}`,
            { cache: "no-store" },
        );
        if (!res.ok) return [];
        const data = (await res.json()) as FaqListResponse;
        return Array.isArray(data?.data) ? data.data : [];
    } catch {
        return [];
    }
}
