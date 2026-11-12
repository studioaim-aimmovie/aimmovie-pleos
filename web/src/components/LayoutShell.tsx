// 헤더/푸터 셸.
//
// apps/web 은 서버(app/layout.tsx)에서 메뉴를 미리 조회해 props 로 시딩했다.
// 이 앱은 서버 렌더가 없으므로 여기서 직접 조회한다. 조회 전에는 빈 배열을 넘겨
// 헤더 골격이 먼저 뜨게 한다(화면이 통째로 비는 것보다 낫다).
//
// ⚠️ 세로/가로로 셸을 갈라 그리지 않는다. 같은 Header·Footer 가 두 모드의 마크업을 함께 갖고
// CSS 가 나눈다 — 창 구역이 바뀌어도 셸과 본문이 리마운트되지 않아 스크롤·입력이 남는다.

import { usePathname } from "@/compat/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getMenuList } from "@aim/core/api/menu";
import type { MenuItem } from "@aim/core/types/menu";
import { useAsync } from "@/hooks/useAsync";
import { useMarketCountry } from "@/hooks/useMarketCountry";

// 헤더/푸터를 숨길 경로 (startsWith 매칭이라 하위 경로까지 포함)
//  - /play       : 재생 화면(웹 폴백 플레이어 — 네이티브로 넘기면 곧바로 떠난다)
//  - /login      : 페어링 화면. 아직 로그인 전이라 메뉴를 보여줄 이유가 없다
//  - /popcorn    : 팝콘 내역과 충전 안내(각자 back 버튼을 갖는다)
//  - /creator    : 크리에이터 지원 안내. apps/web 과 같다(본문이 자기 푸터를 그린다)
//  - /about      : 회사 정보. 위와 같다
//  - /pwinquiry  : 비밀번호 변경. 입력에 집중해야 해 메뉴를 띄우지 않는다(apps/tv 와 같다)
const HIDE_CHROME_PATHS = ["/play", "/login", "/popcorn", "/creator", "/about", "/pwinquiry"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const country = useMarketCountry();

    // 메뉴는 화면 전환마다 다시 받을 필요가 없다. 국가가 바뀔 때만 재조회한다.
    const { data } = useAsync<MenuItem[]>(
        async () => {
            const res = await getMenuList(country);
            return Array.isArray(res?.data) ? res.data : [];
        },
        [country],
        { errorMessage: "" },
    );

    const hideChrome = HIDE_CHROME_PATHS.some((p) => pathname.startsWith(p));
    // 상세(/contents/:id)는 세로에서만 헤더를 숨긴다(mobile_style 이 처리 — apps/web 과 같다).
    const isContents = pathname.startsWith("/contents");

    return (
        <div className={`total_wrap${isContents ? " contents_page" : ""}`}>
            {!hideChrome && <Header menus={data ?? []} />}
            {children}
            {!hideChrome && <Footer />}
        </div>
    );
}
