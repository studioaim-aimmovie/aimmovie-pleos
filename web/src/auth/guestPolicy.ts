// 게스트(미로그인) 접근 정책.
//
// apps/web 의 components/common/AuthGuard.tsx 규칙을 그대로 옮겼다.
// **두 곳이 어긋나면 같은 서비스가 플랫폼마다 다르게 동작한다** — web 정책이 바뀌면
// 여기도 같이 고칠 것.
//
// web 과 다른 점은 회원가입·아이디/비밀번호 찾기 경로가 없다는 것뿐이다.
// 이 앱은 그 흐름을 디바이스 페어링으로 대체하므로 애초에 화면이 없다.

/** 정확히 일치할 때 허용. */
const ALLOW_EXACT = new Set<string>([
    "/", // 홈
    "/list/home", // 홈 메뉴
    "/contact", // 고객지원
    "/faq",
    "/creator", // 크리에이터 지원 안내
    "/about", // 회사 정보
    "/login", // 페어링(web 의 로그인 화면 대응)
]);

/** 접두사로 허용. */
// `/pwinquiry` 는 web 에서 비로그인 재설정 흐름과 화면을 공유해 게스트에게 열려 있다.
// 이 앱은 그 흐름이 없어 마이페이지 드롭다운(로그인 상태)에서만 들어오지만, 두 정책이
// 어긋나면 안 되므로 web 과 같은 목록을 유지한다.
const ALLOW_PREFIX = ["/policy", "/pwinquiry"];

/** 게스트가 접근할 수 있는 경로인가. */
export function isGuestAllowed(pathname: string): boolean {
    if (ALLOW_EXACT.has(pathname)) return true;
    return ALLOW_PREFIX.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
