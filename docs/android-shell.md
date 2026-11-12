# AimMovie — Pleos Connect 차량 앱 (하이브리드 셸)

현대차그룹 차량 인포테인먼트 플랫폼 **Pleos Connect**(Android Automotive OS 기반) 앱 마켓에 올리는 AimMovie 앱이다.
**화면은 `web/`(@aim/pleos) 웹 번들을 WebView 로 띄우고**, 네이티브(Kotlin)는 재생·DRM·MediaSession·토큰 저장만 맡는다.

- 앱 ID: `com.aimmovie.car`.
- 산출물: **APK**(Pleos App Market 은 aab 를 받지 않는다, 최대 600MB).
- minSdk 28(서명 키 rotation 요건), targetSdk 34(Pleos Connect Emulator 기준), versionCode 2000~.

## 왜 하이브리드인가

- 화면은 웹 번들(`web/`)이 맡는다. `packages/core` 를 그대로 쓰므로 화면 규칙을 Kotlin 으로 따로 동기화하지 않는다.
- 재생은 WebView 밖(Media3)에 둔다 — Widevine(MediaDrm 보안 레벨), MediaSession 필수 요건, 구역 전환 중 재생 유지를
  한곳에서 처리하려는 것이다.
- Pleos 가 2026-10-19 회신으로 "WebView + 네이티브 재생" 구조를 지원한다고 확인했다. WebView 화면에도 네이티브와 같은
  UI/DO 기준을 적용하고, **WebView 는 차량 OTA 로만 업데이트된다.**

## 플랫폼 제약 (document.pleos.ai)

- **영상 앱은 P단·속도 0에서만 쓸 수 있다.** `distractionOptimized`를 선언하지 않은 앱은 P단을 벗어나면 시스템이 종료한다.
  그래서 주행 제한 로직을 직접 만들지 않고, 매니페스트에 DO 를 일부러 선언하지 않는다.
- 화면은 3구역 멀티윈도우다(세로 1구역 약 840×1212, 가로 2구역 1700×1212, 전체 2560×1380). 영상 앱은 가로 고정이
  허용되지만(2026-10-19 회신) 웹이 세로·가로를 모두 지원하므로 **방향을 고정하지 않는다**. `resizeableActivity` 와
  `configChanges`(재생성 없음)로 구역 전환을 받는다.
- 결제 모듈이 없다(2027년 도입 예정). 대여는 웹에서 끈다(`web/.env.*` 의 `VITE_RENT_ENABLED=false`).
- 카테고리는 **Entertainment**. 심사 기준: https://document.pleos.ai/docs/pleos-only/distribute/app-review-guide
- 영상 앱은 MediaSession 연동(play/pause/stop)이 필수다. 다시 실행하면 마지막 상태를 복원해야 한다.

## 구조

```
app/src/main/java/com/aimmovie/car/
├── MainActivity.kt          # WebView 셸 — WebViewAssetLoader, 뒤로가기, 해시 기록, 브릿지 주입, 플레이어 띄우기·결과 → 웹 이벤트
├── AimMovieApplication.kt   # AppContainer 보유
├── AppContainer.kt          # 수동 DI(토큰·재생 API·플레이어·복원 저장소)
├── shell/
│   ├── BridgeDispatcher.kt  # 브릿지 v2 프로토콜: 요청 ID 매칭·타임아웃(25초)·결과/이벤트 스크립트(이스케이프)
│   ├── ShellBridge.kt       # window.AimPleos (@JavascriptInterface: version / request / authSnapshot)
│   ├── AuthBridge.kt        # 토큰 메서드(getAccessToken·refreshAfter401·savePairedTokens·logout) — 방식 A
│   └── ShellStateStore.kt   # 재실행 복원: 마지막 웹 해시 + "재생 중 종료" 재생 요청(DataStore)
├── ui/play/
│   ├── PlayerActivity.kt    # 네이티브 재생 화면(Activity 분리). 결과(PlaybackFinished)를 셸에 돌려준다
│   ├── PlayScreen.kt        # 터치 컨트롤(Compose) — 탭 표시/숨김, ±10초, 시크바, 다음 회차
│   ├── PlayViewModel.kt     # 콘텐츠 조회 → 권한 재확인 → 소스 선택 → 재생·진행률 보고·복원 기록
│   ├── PlaySetup.kt         # 회차·권한·시작 위치·다음 회차 판정(순수 함수), RouteCheckpoint(5초 주기 복원 기록)
│   └── PlayRequest.kt       # 재생 요청(웹 play 인자 = 복원 기록)
├── player/                  # PlayerHolder(단일 ExoPlayer+MediaSession), PlaybackService, PlaySource(HLS/DASH), WatchReporter, DrmSupport
├── data/auth/               # ApiClient(Bearer·refresh 단일 실행), TokenStore(Keystore AES-GCM + DataStore), AuthRepository
├── data/api/                # CatalogApi(getContentShow), VideoStatusApi(fetchWatchStatus·sendWatchProgress), DrmLicenseApi, Country
├── data/{model,net,config}  # packages/core 타입 일부, HTTP, BuildConfig 호스트
├── domain/Contents.kt       # 플레이어가 쓰는 도메인 규칙(resolveText·hlsUrl·회차 선택·다음 회차·마지막 본 회차)
└── ui/{common,theme}        # 플레이어가 쓰는 버튼·테마·표시 언어
```

- `data/`·`domain/` 의 파일은 `packages/core` 의 Kotlin 판이다. **파일 첫 줄 주석에 원본 TS 경로가 있다** — TS 를 고치면 같이 고친다.
  플레이어가 쓰는 함수만 둔다. 홈·검색·팝콘·찜 등은 웹이 `@aim/core` 를 그대로 쓴다.
- 문자열은 플레이어 문구뿐이다(`res/values{,-en}/strings.xml`). `common_*`·`player_*` 는 core i18n 사전과 같은 문장이다.

### WebView 셸 (`MainActivity`)

| 항목 | 내용 |
|---|---|
| 로드 | `androidx.webkit.WebViewAssetLoader` — `https://appassets.androidplatform.net/assets/index.html#<해시>`. file:// 는 오리진이 `null` 이라 `allowFileAccess` 를 켜야 하고 모듈·fetch 제약이 많다. https 가상 오리진이면 파일 접근을 끈 채 일반 웹과 같은 보안 모델로 돈다 |
| CORS | CMS 는 화이트리스트 밖 오리진에 `Access-Control-Allow-Origin: *` 로 답하고, 웹은 `credentials: "omit"` + Bearer 로 부른다. `Origin: https://appassets.androidplatform.net` 로 로컬 CMS 의 `/api/main/list`(GET)·`/authapi/device/code`·`/authapi/user/me` preflight 를 확인했다(2026-10-19) |
| 설정 | JS·DOM storage 켬, `allowFileAccess`/`allowContentAccess` 끔, 줌 금지. mixed content 는 debug 만 허용(로컬 CMS `http://localhost:8066`), release 는 금지. 웹 디버깅(`setWebContentsDebuggingEnabled`)·콘솔 logcat(`AimWeb`)은 debug 만 |
| 외부 링크 | 앱 번들 오리진 밖으로의 이동은 막는다(브릿지가 외부 페이지에 노출되지 않게). 웹 번들에는 외부 링크·iframe 이 없다 |
| 뒤로가기 | `canGoBack()` 이면 `goBack()`(웹 `useBackClose` 가 popstate 로 모달을 닫는다). 더 갈 곳이 없으면 홈이 아니면 홈으로(복원으로 상세에서 시작한 경우), 홈이면 `moveTaskToBack`(AAOS 표준, 종료 확인 없음) |
| 복원 | `doUpdateVisitedHistory` 로 해시가 바뀔 때마다 `ShellStateStore` 에 적는다(`/login`·`/play/*` 제외). 실행 시 그 해시로 연다. 재생 중 종료됐으면(복원 기록 남음) 플레이어를 그 위치에서 다시 연다 |
| 렌더 프로세스 종료 | `onRenderProcessGone` 에서 Activity 를 다시 만든다(앱을 같이 죽이지 않는다) |

### 플레이어 (`PlayerActivity`, Media3 1.8.0)

- 웹 `/play` 가 로그인·유료 게이트·마지막 본 회차·이어보기 위치를 해석해 브릿지 `play` 로 넘긴다. 셸은 `PlayerActivity` 를
  띄우고, 닫히면 `onPlaybackFinished` 이벤트로 웹에 알린다(웹은 상세 진행바·홈 카드·시청기록을 다시 조회한다).
- 네이티브도 시청 권한을 한 번 더 확인한다 — 재실행 복원은 웹을 거치지 않기 때문이다. 막힌 영상이면 `blocked` 로 닫는다.
- 대여 창은 없다(웹에서 대여를 끔). 유료 미구매 다음 회차는 "다음 회차" 버튼을 숨기고, 끝나면 웹으로 돌아간다.
- 비DRM → HLS(`hls_path`), DRM → DASH(`dash_path`) + Widevine. 라이선스는 CMS `/authapi/drm/license`(`deviceType:'app'`).
- 단일 `ExoPlayer` + `MediaSession`(`PlayerHolder`) + `MediaSessionService`. 이어보기 보고: 일시정지·종료·이탈 + 재생 중 30초 주기.
- 재실행 복원: 재생 중 5초마다(그리고 여는 순간) 재생 요청을 `ShellStateStore` 에 적고, 정상적으로 닫으면 지운다.
  시스템이 태스크를 되살린 경우는 `onSaveInstanceState` 의 회차·위치로 이어 간다.
- 웹이 넘긴 표시 언어(`lang`)로 제목·플레이어 문구·시스템 미디어 컨트롤 부제를 맞춘다.

## 브릿지 v2 (`window.AimPleos`)

짝: `web/src/native/bridge.ts`(계약 정본·타입), `web/README.md` "브릿지 계약". `@JavascriptInterface` 는 동기라
네트워크(refresh)를 기다리면 JS 가 멈추므로 **요청 ID 기반 비동기 프로토콜**을 쓴다.

```
웹 → 네이티브   AimPleos.request(id, method, argsJson)          // 즉시 반환
네이티브 → 웹   window.__aimPleosResolve(id, resultJson)        // evaluateJavascript, 결과 {ok, data?, error?}
네이티브 → 웹   window.__aimPleosEvent(name, payloadJson)       // 이벤트
동기           AimPleos.authSnapshot() → WebSession JSON|"null"  // 네트워크 없음, 첫 렌더용
               AimPleos.version() → 2
```

| 메서드 | 인자 | `data` | 비고 |
|---|---|---|---|
| `version` | – | `2` | |
| `play` | `{contentId, videoId, startPositionMs, lang?}` | `null` | 플레이어를 띄운다. 이미 열려 있으면 `player_busy` |
| `getAccessToken` | – | `WebSession \| null` | 만료 30초 전이면 네이티브가 먼저 refresh. 로그아웃이면 null |
| `refreshAfter401` | `{accessToken}` | `WebSession \| null` | 그 access 가 이미 교체됐으면 refresh 없이 최신 값. 폐기면 null(+`onAuthChanged(null)`), 통신 오류면 `refresh_failed` |
| `savePairedTokens` | `/authapi/device/token` 응답(`access_token, refresh_token, expires_in, user`) | `WebSession` | Keystore 저장소에 저장 |
| `logout` | – | `null` | 서버 family 폐기(`/authapi/token/logout`) + 로컬 삭제 |

| 이벤트 | payload | 언제 |
|---|---|---|
| `onAuthChanged` | `user \| null` | 세션이 바뀔 때(재생 중 refresh 폐기 등). 첫 값은 `authSnapshot` 으로 이미 안다 |
| `onPlaybackFinished` | `{contentId, videoId, positionMs, reason}` | 플레이어가 닫혀 웹으로 돌아올 때. reason = `closed`/`ended`/`blocked`/`error` |

- `WebSession` = `{accessToken, accessExpiresAt(epoch ms), user}` — **refresh 토큰은 웹에 주지 않는다.**
- 오류 코드: `unknown_method`, `invalid_args`, `timeout`(네이티브 25초 · 웹 안전망 40초), `internal_error`, `player_busy`, `refresh_failed`.
- id·결과는 JS 문자열 리터럴로 이스케이프해 넣는다(웹이 보낸 id 로 스크립트를 깨지 못한다).

### 토큰 — 방식 A (네이티브 소유·갱신)

CMS refresh 토큰은 회전형이라 웹과 네이티브가 각자 refresh 하면 family 가 폐기된다. 재생 중(DRM 라이선스·30초 보고)에도
네이티브가 스스로 갱신해야 하므로 **정본은 네이티브**(`TokenStore` = Keystore AES-GCM + DataStore)에 두고, 웹은 access 만
메모리에 든다(WebView localStorage 에 토큰을 쓰지 않는다). refresh 는 `ApiClient.refreshAccessToken` 의 단일 실행을 타므로
웹 요청과 네이티브 요청이 동시에 401 을 받아도 회전은 한 번이다(`AuthBridgeTest.concurrentWebAndNative401_rotateOnce`).
QR 페어링 화면은 웹(`DevicePairing`)이고, 받은 토큰을 `savePairedTokens` 로 한 번 넘긴다.

## 빌드·설치

빌드·설치 명령은 루트 `README.md` 를 본다.

- 웹 번들은 `scripts/stage-web.sh` 가 빌드해 **빌드 타입별 소스셋**(`app/src/debug/assets`, `app/src/release/assets`)에 넣는다.
  웹과 네이티브는 같은 CMS 를 봐야 하므로(토큰 공유) debug 는 `vite build --mode development`(.env.development = 로컬 CMS),
  release 는 운영 CMS 로 빌드한다. 소스셋을 나눠 debug 웹 번들이 release APK 에 섞이지 않게 한다. 스테이징 산출물은 커밋하지 않는다.
  - `web/.env*.local` 이 있으면 중단한다(`ALLOW_LOCAL_ENV=1` 로 허용). release 산출물에 로컬/사설 주소가 있으면 실패한다.
  - `SKIP_WEB_BUILD=1` 이면 기존 `web/dist` 를 그대로 쓴다(모드가 맞는지는 직접 확인).
  - `gradlew assemble*` 를 바로 돌리면 웹 번들이 없을 수 있다(경고만 남긴다). 설치용 APK 는 `build.sh` 로 만든다.
- 단위 테스트·lint: `cd android && ./gradlew testDebugUnitTest lintDebug`
- debug 네이티브가 다른 CMS 를 보게 하려면 `-Paim.apiRoot.debug=http://192.168.x.x:8066` + `web/.env.local` 의 `VITE_API_ROOT` 를
  같은 값으로(평문 HTTP 는 `src/debug/res/xml/network_security_config.xml` 에 그 호스트 추가).
- 디버깅: debug 빌드는 `chrome://inspect` 로 WebView 에 붙는다. `adb logcat -s AimWeb AimShell AimPlayer`.

### Pleos Connect Emulator

2026-10-19 부터 공개 배포된다. 설치 가이드:
https://document.pleos.ai/docs/connect/guide/getting-started/application-development/setup-connect-sdk-emulator

- Android Studio > SDK Manager > SDK Update Sites 에 추가한다.
  - Mac: `https://nexus-playground.pleos.ai/repository/raw-releases/connect-avd/2.x/crp-arm64-sys-img.xml`
  - Windows/Linux: `https://nexus-playground.pleos.ai/repository/raw-releases/connect-avd/2.x/crp-sys-img.xml`
- AVD: Automotive > **Pleos Connect v2.1.0**, **Cold boot**(quick boot 는 VHAL 이 꺼진다), RAM 4GB.
  `emulator -avd Pleos_Connect_v2.1.0 -no-snapshot-load -no-snapshot-save`
- 기어·주행 상태는 **Pleos Connect Virtual Console** 에서 바꾼다(루트 `README.md` 참고).
- 실측(2026-10-19): Android 14, 화면 2560×1440 @160dpi, **WebView = `ai.pleos.android.webview` 131.0.6752.0**
  (`web/vite.config.ts` 의 `build.target` chrome108 보다 높다). 앱은 가로 2구역에 1683×1210px(CSS 1224×880, DPR 1.375)로 뜬다.
- 앱은 **사용자 10**으로 돈다(AAOS 멀티유저). 데이터 확인은 `adb shell run-as com.aimmovie.car --user 10 …`.
- **에뮬레이터에는 Widevine 이 없다**(DRM HAL 은 `android.hardware.drm-service-lazy.clearkey` 뿐). DRM 콘텐츠는
  "이 차량에서는 보호된(DRM) 영상을 재생할 수 없습니다"로 막히는 것이 정상이다. Widevine 재생은 실차(또는 Pleos 가 안내할
  지원 사양)에서만 확인할 수 있다.
- debug 는 웹 번들과 네이티브가 **같은 로컬 CMS**를 봐야 한다. 토큰은 네이티브가 로컬 CMS 에서 받으므로, 웹만 운영 CMS 를 보면
  웹에서 고른 운영 콘텐츠를 플레이어가 로컬에서 찾다가 404("영상 정보를 불러오지 못했습니다")가 난다. `stage-web.sh` 가
  debug 번들에 운영 CMS 주소가 있으면 빌드를 멈춘다.
- 디스크: 에뮬레이터 데이터(qcow2)가 한 세션에 3GB 가까이 늘어난다. 호스트 디스크가 차면 에뮬레이터가 꺼진다.
- 신규 에뮬레이터에는 Navigation·Virtual Driving 이 들어 있다. 화면 크기 시험은 FormFactorConsole(가상 디스플레이)로 한다.

## 진행 상태

| 단계 | 내용 | 상태 |
|---|---|---|
| 0 | Pleos 문의 | 회신 완료(2026-10-19). Widevine 레벨·결제 정책은 추가 안내 대기 |
| 1~2 | 프로젝트 골격, 데이터 계층(`packages/core` Kotlin 판·Keystore 토큰) | 완료 |
| 4 | 플레이어(Media3 HLS·DASH Widevine, MediaSession) | 완료(셸의 `PlayerActivity`). DRM 실기 검증 전 |
| 5 | 하이브리드 셸(WebView + 브릿지 v2 + 방식 A 토큰 + 재실행 복원) | 완료(2026-10-19). Pleos 에뮬레이터에서 홈·페어링 로그인·마이페이지·무료 재생·모달 뒤로가기·force-stop 복원 확인 |
| 6 | 스토어 제출 | 예정 |

남은 확인: 로그아웃(에뮬레이터), Virtual Driving/VHAL 로 기어 P→D 종료·복원, DRM(Widevine) 재생, 세로 1구역·전체 화면 레이아웃.

1차 제외: Pleos Vehicle/NaviHelper/Gleo AI SDK, 주행 중 오디오 재생, DO 선언, 앱 내 팝콘 충전(결제), 자막, KV·카드 미리보기 영상.
