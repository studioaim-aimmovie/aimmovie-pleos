# @aim/core

`web/`(@aim/pleos)이 쓰는 **비-UI 계층**이다.
타입 · CMS 호출 · i18n 사전 · 도메인 가공 유틸만 담는다.

유일한 React 의존이 `i18n/rich.tsx`다. 컴포넌트가 아니라 문자열 → `ReactNode` 변환 함수이고,
마커 문법(`{hl}` / `{br}` / `{brm}`)이 사전 문자열과 한 몸이다. `@aim/core/i18n/rich` 서브패스로만 노출한다.

## 빌드 단계가 없다

TS 소스를 그대로 노출하고 Vite 가 트랜스파일한다. 진입점은 `package.json` 의 `exports` 서브패스다.

## 구조

```
src/
├── config.ts     configure() — 환경/전송자 주입 지점
├── types/        api · auth · contents · faq · main · menu
├── api/          menu · faq · popcorn · likeStatus · videoStatus · user · country · popcornProducts · catalog
├── domain/       contents(가공 유틸)
└── i18n/         locale · index(t) · ko · en · rich
```

## ⚠️ core는 환경변수를 직접 읽지 않는다

값은 앱이 부팅 시 `configure()`로 주입한다(`web/src/main.tsx`).

```ts
import { configure } from "@aim/core/config";

configure({
    apiRoot: "https://cms.example.com",
    cdnUrl: "https://cdn.example.com",
    authFetch: (path, init) => fetch(path, init),
});
```

## ⚠️ `authFetch` — 인증 호출의 전송자

`api/{likeStatus,videoStatus,popcorn,user}.ts`는 `/api/likestatus/mylist` 같은 **논리 경로**를 쓴다.
앱은 쿠키를 쓸 수 없는 패키지 오리진이라 CMS로 직접 요청하되 `/api/` → `/authapi/` 접두어를 바꾸고
`Authorization: Bearer`를 붙인다(`web/src/auth/apiClient.ts`).

`sendBeacon`은 선택 주입이다. `navigator.sendBeacon`은 Authorization 헤더를 실을 수 없어
주입하지 않고, `sendWatchProgress`가 `keepalive` fetch로 폴백한다.

## 표시 축은 국가가 아니라 언어다

`resolveText(loc, locale)` / `pickContents(item, i, locale)`는 표시 **언어**(`ko` | `en`)를 받아
`ko→KR`, `en→US`로 매핑해 조회하고 없으면 국문으로 폴백한다. 편성(`?country=`)과는 별개 축이다.
`country`로 되돌리지 말 것.
