# compat — apps/web 이식용 호환 계층

`apps/web`의 컴포넌트를 옮겨 오면 Next.js 전용 모듈(`next/link`, `next/image`,
`next/navigation`)과 `next-auth/react`에 의존한다. 그 의존을 여기서 흡수한다.

**왜 `next/*`를 alias 로 가로채지 않았나** — 그러면 "Next 가 있는 것처럼" 보여서
이 앱이 Vite SPA 라는 사실이 코드에서 사라진다. 대신 실제 모듈을 두고 import 경로를
`@/compat/*` 로 바꾼다. 이식된 파일과 원본의 diff 가 import 줄에만 남아,
나중에 web 쪽 변경을 따라가기도 쉽다.

| web               | pleos                 |
| ----------------- | --------------------- |
| `next/link`       | `@/compat/Link`       |
| `next/image`      | `@/compat/Image`      |
| `next/navigation` | `@/compat/navigation` |
| `next-auth/react` | `@/compat/session`    |

## 의미가 달라지는 지점

- **`<Image>`** — Next 이미지 최적화기가 없다. 그냥 `<img>` 다.
  `fill`/`sizes`/`priority` 는 받되 무시하거나 CSS 로 대응한다.
  화면 크기는 구역마다 바뀌지만 이미지 크기는 CMS 축소본(w640·w1920)으로 줄인다.
- **`useRouter().push()`** — react-router 의 `navigate()` 다. `refresh()` 는 no-op
  (RSC 재검증이 없다).
- **`useSearchParams()`** — HashRouter 의 쿼리다. 해시 뒤의 `?` 를 읽는다.
- **`useSession()`** — 쿠키 세션이 아니라 `AuthContext`(localStorage 토큰)를 읽는다.
  `status` 는 `authenticated` / `unauthenticated` 둘만 나온다.
  이 앱은 서버 렌더가 없어 `loading` 상태가 존재하지 않는다.
