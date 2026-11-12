# @aim/pleos

Pleos Connect(현대차그룹 Android Automotive) 차량 앱의 **웹 화면 번들**. Vite + React SPA.
`apps/tv`(@aim/tv)를 바탕으로 만들었다.

## 목적 — 하이브리드

- 화면은 이 번들의 `dist/` 를 APK 안에 패키지 파일로 싣고 WebView 로 띄운다(androidtv 래퍼와 같은 패키지형).
- **영상 재생만** 네이티브 Media3 플레이어(`car/pleos/AimMovie/app/src/main/java/com/aimmovie/car/player/`)로 넘긴다.
  Widevine(MediaDrm 보안 레벨), MediaSession 필수 요건, 구역 전환 중 재생 유지를 WebView 밖에서 처리하려는 것이다.
- 네이티브 셸·브릿지는 `car/pleos` 에 있다(아래 "네이티브 셸 · 브릿지 계약 (v2)"). 브릿지가 없으면(브라우저) 웹 플레이어(hls.js)와
  localStorage 토큰으로 폴백해 브라우저에서 개발할 수 있다.

## 실행

```bash
npm run dev       -w @aim/pleos   # http://localhost:5174 (apps/web 3000 · apps/tv 5173 과 겹치지 않는다)
npm run typecheck -w @aim/pleos
npm run build     -w @aim/pleos   # dist/ — 차량 APK 셸이 싣는다(car/pleos/scripts/build.sh 가 스테이징까지 한다)
```

- 환경변수는 모드별 기본값이 커밋돼 있다(`.env.development` = 로컬 CMS `http://localhost:8066`, `.env.production` = 운영 CMS).
  개인 오버라이드는 `.env.local`(`.env.example` 참고).
- 로컬 CMS(aimmovie_admin) 기동·테스트 계정은 `apps/tv/LOCAL_DEV.md` 와 같다.
- 개발 중 확인은 브라우저 DevTools 의 기기 툴바에서 **터치 에뮬레이션**을 켜고 840×1212 / 1700×1212 / 2560×1380 으로 본다.
- 페어링 로그인: 이 앱(5174)의 `#/login` 코드 → `apps/web` 에 로그인한 뒤 `/tv` 에서 승인(apps/tv 와 같은 흐름).
  CMS 에는 `platform: "pleos"`, 기기 이름 "AIMMOVIE 차량 앱"으로 기록된다(네이티브 차량 앱과 같은 값).

### 로컬 CMS · CORS

CMS `WEB_ORIGINS` 화이트리스트에는 5174 가 **없지만 CMS 변경은 필요 없다.** 화이트리스트 밖 오리진(그리고 패키지
오리진 `Origin: null`)에는 CMS 가 `Access-Control-Allow-Origin: *`(credentials 불가)로 답하고, 이 앱은 모든 호출을
`credentials: "omit"` + Bearer 로 보낸다(`src/auth/apiClient.ts`). 2026-10-13 로컬 CMS 로 `/api/main/list`(GET),
`/authapi/device/code` preflight(Origin 5174·null)를 확인했고, 페어링→로그인→마이페이지까지 실제로 동작했다.

## 레이아웃 규칙 — 창 비율로 나눈다

| 모드 | 조건 | 디자인 | 스타일 |
|---|---|---|---|
| 세로(portrait) | 폭 ≤ 높이, 또는 폭 < 600px | `apps/web` 모바일 | `mobile_style.scss` + `tablet_style.scss` (apps/web 그대로) |
| 가로(landscape) | 그 외 | `apps/tv` TV 디자인 | `web_style.scss`(apps/tv 판) + `index.scss` 의 가로 보정 |

- 차량 네이티브 앱의 `ui/layout/LayoutMode.kt` 와 같은 규칙이다.
- CSS: `styles/globals.scss` 의 믹스인 `mobile`/`desktop`/`phone`/`tablet` 을 **폭 대신 비율**로 재정의했다
  (`(orientation: portrait), (max-width: 599px)` ↔ `(orientation: landscape) and (min-width: 600px)`).
  그래서 apps/web 의 mobile/tablet 스타일을 한 줄도 고치지 않고 옮겨 쓸 수 있다. 840 세로 구역은 apps/web 의
  "태블릿"(768↑) 규칙까지 걸리는데, apps/web 모바일을 같은 840 폭으로 열었을 때와 같은 결과다.
- JS: 마크업이 달라야 하는 곳(세로/가로 포스터, Swiper 장수)만 `src/hooks/useLayoutMode.ts` 를 쓴다(같은 쿼리).
- **리마운트하지 않는다.** 라우트 트리·LayoutShell·Header 는 모드와 무관하게 하나다. 분기는 CSS 와 말단(카드)에서만 한다.
  모드가 바뀌면 카드 행의 Swiper 만 다시 만든다(`key={mode}` — 가로 스와이프 위치만 처음으로 돌아간다).
  창 스크롤·검색 입력값·라우트·조회 결과는 유지된다(실측).
- 가로는 TV 의 1920 고정 뷰포트(`width=1920`)를 버리고 `width=device-width` 로 바꿨다. web_style 이 원래 유동 폭이라
  1700×1212·2560×1380 모두 레터박스 없이 창을 채운다(가로 넘침 0, 실측).

### 세로 디자인에 옮긴 원본

| 원본(apps/web) | 이 앱 |
|---|---|
| `styles/mobile_style.scss`, `styles/tablet_style.scss` | 그대로 복사(`url(../public/images/…)` → `/images/…` 만 바꿈) |
| `styles/common.scss` 의 `:root` 안전영역 변수·`.account_box` 자동링크·`.badge_type1` 숨김·`.content_label` | `styles/index.scss` |
| `styles/globals.scss` 의 `en` 자간·`.en_br`·`$gray_11`·line-clamp 보정 | `styles/globals.scss` |
| `components/slide/Slide1.mobile.tsx`, `Slide2.mobile.tsx` | `components/Slide1.tsx`, `Slide2.tsx` 의 세로 분기 |
| `components/main/main_wrap.tsx`(세로 포스터) | `components/main_wrap.tsx` |
| `components/sub/{view_wrap,list4,FavoriteList,WatchHistoryList,mylist_wrap,WithdrawSheet,about_wrap,creator_wrap}.tsx` | 같은 이름 |
| `components/common/{Header,Footer,ConfirmModal,BackButton,faq,ContentLabels}.tsx`, `lib/labelPosition.ts` | 같은 이름(`ContentLabels` 에 합침) |
| `components/popcorn/RentModal.tsx` | `components/RentModal.tsx` |

840×1212 에서 apps/web 모바일(dev:mobile)과 픽셀 비교했다 — 홈은 Next 개발 배지 외 차이 0, 상세·마이페이지·로그인 안내 모달도 일치.

## 네이티브 셸 · 브릿지 계약 (v2)

차량 APK(`car/pleos`, 하이브리드 셸)는 이 번들을 `WebViewAssetLoader` 로 `https://appassets.androidplatform.net/assets/index.html#/…`
에서 띄우고 `window.AimPleos` 를 심는다. 이 앱은 `window.AimPleos` 가 있으면 셸 모드, 없으면 브라우저 개발 모드로 돈다
(`src/native/bridge.ts` 의 `isNativeShell()` 하나로 판정). 계약 정본·타입은 `src/native/bridge.ts`, 네이티브 쪽은
`car/pleos/.../shell/`(README "브릿지 v2").

`@JavascriptInterface` 는 동기 호출이라 네트워크(refresh)를 기다리게 하면 JS 가 멈춘다. 그래서 **요청 ID 기반 비동기 프로토콜**이다.

```
AimPleos.request(id, method, argsJson)            // 즉시 반환
window.__aimPleosResolve(id, resultJson)          // 네이티브가 evaluateJavascript 로 부름. {ok, data?, error?}
window.__aimPleosEvent(name, payloadJson)         // 네이티브 → 웹 이벤트
AimPleos.authSnapshot()                           // 동기, 네트워크 없음 — 첫 렌더의 로그인 여부
```

| 메서드 | 인자 | `data` |
|---|---|---|
| `version` | – | `2` |
| `play` | `{contentId, videoId, startPositionMs, lang?}` | `null` — 네이티브 플레이어(별도 Activity)를 띄운다. 겹쳐 열면 `player_busy` |
| `getAccessToken` | – | `{accessToken, accessExpiresAt, user} \| null` — 만료 임박이면 네이티브가 먼저 refresh |
| `refreshAfter401` | `{accessToken}`(401 받은 요청의 값) | 세션 \| `null`(폐기 = 로그아웃). 통신 오류는 `refresh_failed` |
| `savePairedTokens` | `/authapi/device/token` 응답 그대로 | 세션 — 네이티브 Keystore 저장소에 저장 |
| `logout` | – | `null` — 서버 family 폐기 + 로컬 삭제 |

| 이벤트 | payload |
|---|---|
| `onAuthChanged` | `user \| null` — 재생 중 refresh 폐기 등으로 세션이 끝나면 null |
| `onPlaybackFinished` | `{contentId, videoId, positionMs, reason: closed\|ended\|blocked\|error}` |

타임아웃: 네이티브가 25초에 `timeout` 으로 답하고, 웹은 응답을 잃는 경우를 위해 40초 안전망을 둔다.

### 토큰 — 방식 A (네이티브 소유·갱신)

- CMS refresh 토큰은 회전형이라 웹·네이티브가 각자 refresh 하면 family 가 폐기된다. 재생 중에도 네이티브가 갱신해야 하므로
  **정본은 네이티브**(Keystore)다. 셸 모드의 웹은 access·만료·사용자만 **메모리**에 들고 refresh 토큰을 갖지 않는다.
  WebView localStorage 에는 토큰을 쓰지 않는다(예전 빌드가 남긴 `aim.pleos.auth` 는 셸 모드에서 지운다).
- 교체 지점은 `src/auth/tokenStore.ts`·`src/auth/apiClient.ts` 두 파일뿐이다. 다른 코드는 이 모듈 함수만 부른다.
  - 만료 임박 → `getAccessToken`, 401 → `refreshAfter401`(네이티브 `ApiClient` 의 refresh 단일 실행을 탄다), 로그아웃 → `logout`.
  - 페어링(`DevicePairing`)은 웹 화면 그대로이고, 받은 토큰을 `setTokens()` → `savePairedTokens` 로 넘긴 뒤 저장이 끝나면 로그인 상태로 바꾼다.
- 브라우저 개발 모드(`npm run dev`)는 예전처럼 localStorage(`aim.pleos.auth`)에 두고 웹이 직접 refresh 한다.

### 재생 넘기기

재생 진입은 모두 `compat/playAction.ts` → `/play/:id(?v=)` 를 지난다. `/play`(`routes/Play.tsx`)가 콘텐츠 조회·유료 게이트·
마지막 본 회차·이어보기 위치를 해석한 뒤 `src/native/playback.ts` 에서 셸이면 `play` 로 넘기고, 아니면 웹 플레이어(hls.js)로 재생한다.

- 웹은 **권한이 확인된 회차만** 넘긴다. 성공하면 `/play` 를 떠나 들어오기 전 화면(없으면 상세)으로 돌아가 둔다 — 플레이어를 닫으면
  그 화면이 보인다. 셸은 `/play/*` 해시를 마지막 화면으로 저장하지 않는다. 실패하면 사유를 화면에 보여 준다(셸 안에서 웹 재생으로
  몰래 폴백하지 않는다 — DRM·MediaSession 요건을 못 지킨다).
- 네이티브가 맡는 것: 진행률 보고(30초 주기 포함)·무료/권한 있는 다음 회차·권한 재확인·재실행 복원. 대여 창은 없다.
- 플레이어가 닫히면 `onPlaybackFinished` → `usePlaybackEpoch()` 가 오르고, 시청 상태를 조회하는 화면(`view_wrap`·`Slide1`·`Slide2`·
  `WatchHistoryList`)이 다시 조회해 진행바를 갱신한다(WebView 는 플레이어 뒤에서 그대로 살아 있어 리마운트되지 않는다).

## 입력 — 터치 전용

- 카드 행·KV 는 Swiper 터치 스와이프, 목록은 창 스크롤. hover·focus 전제 로직이 없다(마이페이지 드롭다운도 탭으로 연다).
- 뒤로 가기는 Android 시스템 뒤로가기 → 셸이 `history.back()` 으로 넘긴다(해시 라우팅이라 그대로 이전 화면). 웹에 키 처리가 없다.
- 검색은 화면 키보드 전제: 패널을 열면 입력칸에 바로 포커스, 엔터 키 힌트는 "검색", 검색 실행 시 키보드를 내린다.
- 터치 영역: 원본 디자인의 **보이는 크기는 그대로 두고** 작은 조작 요소만 투명 히트 영역을 48×48 로 넓혔다
  (헤더 햄버거·검색·마이페이지 아이콘, 시청기록 삭제 X). 이 앱에만 있는 버튼(페어링 재시도, 웹 플레이어 컨트롤, 조회 실패 재시도)은 52~96px.
- `window.alert` 을 쓰지 않는다 — 셸이 `WebChromeClient.onJsAlert` 를 구현하지 않으면 삼켜진다. 안내는 `ConfirmModal`·인라인 문구.

## apps/tv 와 다른 점

| 항목 | apps/tv | apps/pleos |
|---|---|---|
| 입력 | 리모컨 D-pad(Norigin 공간 탐색), 휠 내비 | 터치. `remote/**`, `Focusable.tsx`, `RemoteController.tsx`, `focus_nav.scss`, `lib/escapeToHeader.ts`, `@noriginmedia/norigin-spatial-navigation`, `@aim/core/domain/focusKeys` 사용 제거 |
| 뒤로 가기 | backStack + 홈에서 종료 확인 다이얼로그 | 시스템 뒤로가기(history). **종료 확인은 뺐다** — AAOS 에서 루트 뒤로가기는 앱을 백그라운드로 보내는 표준 동작이고, 차량 네이티브 앱도 묻지 않는다. 주행 화면에서 한 번 더 누르게 하는 것은 오히려 방해다 |
| 재생 | Tizen AVPlay / webOS html5 / hls.js | 네이티브 Media3(브릿지). 웹은 hls.js 폴백(+MSE 없으면 html5). `player/avplay.ts`·플랫폼 감지 제거 |
| 레이아웃 | 1920 고정, web_style 만 | 세로=apps/web 모바일, 가로=TV, 창 비율로 분기 |
| KV·카드 미리보기 영상 | KV 반복 재생 | **정적 포스터** — 차량 네이티브 앱과 같은 정책(주행 중 움직이는 이미지·본편과 디코더 경합 회피). `kvPlayback` 조정자도 뺐다 |
| `/about`·`/creator` | 리모컨용 단계 전환·정적 격자 | apps/web 판 그대로(스크롤 연출). 단 외부 구글 폼 "지원하기" 버튼은 뺐다(WebView 에서 외부 링크를 열 브릿지가 없다) |
| 푸터 | 옛 구조 | apps/web 현재 구조(f_top/f_bottom + 사업자 정보). 가로 배치 규칙은 index.scss 에 apps/web 값으로 둠 |
| 시청기록 삭제 | 닿을 수 없음 | 포스터 위 X 버튼(세로·가로) |
| 상세 회차 배지 | 유료/무료 | apps/web 처럼 "구매" 배지 추가 |
| 저장 키 | `aim.tv.auth`, `aim.tv.lang` | `aim.pleos.auth`, `aim.pleos.lang` |
| 페어링 | platform `tizen/webos/androidtv` | `pleos`, 문구는 차량용(`i18n/pleosMessages.ts` — core 사전의 TV 문구를 덮어씀, 네이티브 `car_*` 문자열과 같은 문장) |
| 결제 | 충전 불가 안내(alert) | 충전 불가 안내(모달, 차량 문구) |

## Pleos 회신 반영 (2026-10-19)

| 항목 | Pleos 회신 | 이 앱에 반영한 것 |
|---|---|---|
| WebView + 네이티브 재생 구조 | 지원 가능(네이버 등 기존 앱도 사용). 일반 앱과 같은 보안·기능 검증을 받는다 | 이 구조로 확정 |
| WebView 버전 | 차량 OTA 로만 업데이트된다(모바일처럼 수시로 오르지 않음) | `build.target` 은 `chrome108` 로 보수적으로 유지. 에뮬레이터·실차의 WebView 버전을 확인한 뒤에만 올린다 |
| WebView 화면의 UI/DO 기준 | 네이티브와 똑같이 적용(터치 영역·글자 크기·주의 분산) | 12px 미만 글자 25곳을 12px 로 올림(디자인 가이드: 최소 12sp, CSS 1px = 1dp). 터치 영역은 48px 이상 유지 |
| 멀티윈도우 | 영상 앱은 가로 고정 제공 가능. 세로 1구역 대응 대신 가로 기준으로 개발해도 된다 | 가로를 기준으로 검증한다. 이미 만든 세로 레이아웃은 남겨 두되 필수 검증 대상에서 뺀다 |
| 결제·포인트 | 결제 모듈 없음, 정책은 2027년 확정. 팝콘 차감 대여 허용 여부도 미정 | `VITE_RENT_ENABLED=false` 로 대여를 끌 수 있게 함(아래) |
| 카테고리 | Entertainment | 스토어 제출 메타데이터에 반영 |
| Widevine 보안 레벨 | 내부 확인 중 | 재생은 네이티브 Media3 가 맡으므로 웹 쪽 변경 없음 |

### 대여 끄기 — `VITE_RENT_ENABLED`

`"false"` 로 빌드하면 유료 콘텐츠의 "바로보기"가 대여 창 대신 "aimmovie.com 또는 모바일 앱에서 대여하면 차량에서도 바로 볼 수 있다"는 안내를 띄운다.
이미 대여해 권한(able)이 있는 콘텐츠는 대여 흐름을 거치지 않으므로 그대로 재생된다. `.env.development`·`.env.production` 에 `false` 로 커밋해 두었다(2026-10-19 결정: 정책 확정 전까지 끔). 변수 자체를 지우면 켜진다.

```bash
npm run build -w @aim/pleos                          # 기본: 대여 끔
VITE_RENT_ENABLED=true npm run build -w @aim/pleos    # 대여 켜서 확인할 때
```

## 남은 일 · 알려진 한계

- 네이티브 셸·브릿지 v2·방식 A 토큰은 구현했다(2026-10-19, `car/pleos`). Pleos 에뮬레이터(WebView 131)에서 홈·페어링 로그인·
  마이페이지 이메일·무료 재생·모달 뒤로가기·재실행 복원을 확인했다. 에뮬레이터 실측 뷰포트는 가로 2구역 CSS 1224×880(DPR 1.375).
- 마이페이지 이메일은 CMS `GET /authapi/user/me`(aimmovie_admin `feat/user-me`)가 배포돼야 보인다. 그 전에는 비어 있다.
- 모달 안에서 다른 화면으로 이동하면 쌓아 둔 history 항목이 남는다. 다음 뒤로가기 때 자동으로 건너뛰지만 실기에서 확인이 필요하다.
- 실차 검증 전이다(density 에 따라 CSS 뷰포트 크기가 위 표의 px 와 다르다 — 에뮬레이터 가로 2구역은 1224×880).
