// 편성/시장(FILTER) 국가. `?country=` 파라미터에 쓴다.
//
// ⚠️ hooks/useCountry 와 혼동하지 말 것.
// useCountry(=useDisplayLocale)는 **표시 언어**(ko/en)를 돌려준다. 두 축은 독립이다.
//   - 표시 언어: 제목·요약 등 텍스트를 어느 언어로 보여줄지 (resolveText/pickContents)
//   - 편성 국가: 백엔드가 어느 국가 편성을 내려줄지 (?country=)
//
// 규칙: `resolveCountry(session?.user?.country_code)` — 게스트는 기본 국가(KR), 로그인 유저는 country_code.

import { resolveCountry } from "@aim/core/api/country";
import { useSession } from "@/compat/session";

export function useMarketCountry(): string {
    const { data: session } = useSession();
    return resolveCountry(session?.user?.country_code);
}
