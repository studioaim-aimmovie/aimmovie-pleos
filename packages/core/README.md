# @aim/core

`apps/web`(Next.js — web·mobile)과 `apps/tv`(Vite React SPA)가 공유하는 **비-UI 계층**이다.
타입 · CMS 호출 · i18n 사전 · 도메인 가공 유틸만 담는다.

## 왜 UI를 넣지 않나

공유 UI 패키지를 만들면 TV가 web에 다시 묶여, TV를 별도 앱으로 분리한 의미가 사라진다.
컴포넌트는 필요한 것만 각 앱으로 복사해 시작하고, **영구히 동일할 것만** 나중에 승격한다.

유일한 예외가 `i18n/rich.tsx`다. 컴포넌트가 아니라 문자열 → `ReactNode` 변환 함수이고,
마커 문법(`{hl}` / `{br}` / `{brm}`)이 사전 문자열과 한 몸이라 분리하면 두 앱에서 어긋난다.
배럴(`@aim/core`)에는 넣지 않고 `@aim/core/i18n/rich` 서브패스로만 노출한다(React 의존 격리).

## 빌드 단계가 없다

`@aim/bridge`와 동일하게 TS 소스를 그대로 노출한다.

- `apps/web` — `next.config.mjs`의 `transpilePackages`에 `@aim/core` 등록
- `apps/tv` — Vite가 그대로 트랜스파일

## 구조

```
src/
├── config.ts     configure() — 환경/전송자 주입 지점
├── types/        api · auth · contents · faq · main · menu
├── api/          menu · faq · popcorn · likeStatus · videoStatus · user · country · popcornProducts · catalog
├── domain/       contents(가공 유틸) · kvPlayback · focusKeys
└── i18n/         locale · index(t) · ko · en · rich
```

## ⚠️ core는 환경변수를 직접 읽지 않는다

Next는 `process.env.NEXT_PUBLIC_*`를 빌드 시 리터럴로 인라인하지만 Vite는 `import.meta.env`라
서로 호환되지 않는다. 그래서 값은 앱이 부팅 시 `configure()`로 주입한다.

```ts
import { configure } from "@aim/core/config";

configure({
    apiRoot: "https://cms.example.com",
    cdnUrl: "https://cdn.example.com",
    authFetch: (path, init) => fetch(path, init),
});
```

주입 지점:

| 앱 | 파일 |
|---|---|
| `apps/web` | `lib/coreConfig.ts` — `app/layout.tsx`(서버 그래프)와 `components/common/providers{,.mobile}.tsx`(클라이언트 그래프)가 각각 import |
| `apps/tv` | `src/main.tsx` |

Next는 서버(RSC)와 클라이언트 모듈 그래프가 분리돼 있어 **각 그래프마다 한 번씩** 호출돼야 한다.

## ⚠️ `authFetch` — 인증 호출의 전송자

`api/{likeStatus,videoStatus,popcorn,user}.ts`는 `/api/likestatus/mylist` 같은 **논리 경로**를 쓴다.
같은 경로를 플랫폼마다 다르게 보내야 하기 때문에 전송자를 주입받는다.

| 플랫폼 | 전송 방식 |
|---|---|
| web · mobile | 논리 경로 그대로 Next 프록시로 요청. 세션 쿠키 → CMS Bearer 변환은 프록시가 담당 |
| tv | `file://` 오리진이라 쿠키를 쓸 수 없다. CMS로 직접 요청하되 `/api/` → `/authapi/` 접두어를 바꾸고 `Authorization: Bearer`를 붙인다 |

논리 경로와 CMS 경로는 접두어만 다르므로 TV 전송자는 접두어 교체 + 헤더 부착이면 충분하다.

`sendBeacon`은 선택 주입이다. `navigator.sendBeacon`은 Authorization 헤더를 실을 수 없어
TV에서는 주입하지 않고, `sendWatchProgress`가 `keepalive` fetch로 폴백한다.

## 표시 축은 국가가 아니라 언어다

`resolveText(loc, locale)` / `pickContents(item, i, locale)`는 표시 **언어**(`ko` | `en`)를 받아
`ko→KR`, `en→US`로 매핑해 조회하고 없으면 국문으로 폴백한다. 편성(`?country=`)과는 별개 축이다.
이식하면서 `country`로 되돌리지 말 것.
