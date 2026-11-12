# compat — 라우팅·이미지·세션 래퍼

화면 컴포넌트가 쓰는 얇은 래퍼 모음이다. import 경로는 `@/compat/*` 다.

| 모듈                  | 내용                                                     |
| --------------------- | -------------------------------------------------------- |
| `@/compat/Link`       | `href` 를 받아 react-router 의 `Link` 로 넘긴다          |
| `@/compat/Image`      | `<img>` 렌더(lazy 기본, `priority` 면 즉시 로딩)          |
| `@/compat/navigation` | `useRouter`·`usePathname`·`useSearchParams`·`useParams` |
| `@/compat/session`    | `useSession` — AuthContext 의 사용자 정보                 |
| `@/compat/playAction` | 재생 진입점(`/play/:id` 로 이동)                         |

## 동작

- **`<Image>`** — 이미지 최적화 서버가 없다. 그냥 `<img>` 다.
  `fill`/`sizes`/`priority` 는 받되 무시하거나 CSS 로 대응한다.
  화면 크기는 구역마다 바뀌지만 이미지 크기는 CMS 축소본(w640·w1920)으로 줄인다.
- **`useRouter()`** — react-router 의 `navigate()` 위의 `push`/`replace`/`back` 이다.
- **`useSearchParams()`** — HashRouter 의 쿼리다. 해시 뒤의 `?` 를 읽는다.
- **`useSession()`** — 쿠키 세션이 아니라 `AuthContext`(localStorage 토큰)를 읽는다.
  `status` 는 `authenticated` / `unauthenticated` 둘만 나온다.
  이 앱은 서버 렌더가 없어 `loading` 상태가 존재하지 않는다.
