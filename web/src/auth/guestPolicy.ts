// 게스트(미로그인) 접근 정책.
//
// 회원가입·아이디/비밀번호 찾기 경로는 없다. 로그인은 디바이스 페어링으로 한다.

/** 정확히 일치할 때 허용. */
const ALLOW_EXACT = new Set<string>([
    "/", // 홈
    "/list/home", // 홈 메뉴
    "/contact", // 고객지원
    "/faq",
    "/creator", // 크리에이터 지원 안내
    "/about", // 회사 정보
    "/login", // 페어링
]);

/** 접두사로 허용. */
// `/pwinquiry` 는 마이페이지 드롭다운(로그인 상태)에서만 들어온다.
const ALLOW_PREFIX = ["/policy", "/pwinquiry"];

/** 게스트가 접근할 수 있는 경로인가. */
export function isGuestAllowed(pathname: string): boolean {
    if (ALLOW_EXACT.has(pathname)) return true;
    return ALLOW_PREFIX.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
