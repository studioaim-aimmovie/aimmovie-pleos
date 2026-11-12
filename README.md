# AimMovie — Pleos Connect 차량 앱

Pleos Connect 차량 앱(`com.aimmovie.car`)을 빌드·실행하는 저장소다.

| 폴더 | 내용 |
|---|---|
| `web/` | 화면 — Vite React SPA(`@aim/pleos`). APK assets 에 실려 WebView 로 뜬다 |
| `packages/core/` | `web/` 이 쓰는 비-UI 계층(도메인·API·i18n, `@aim/core`) |
| `android/` | 하이브리드 셸 — WebView + 네이티브 재생(Media3)·DRM·토큰 저장 |
| `scripts/stage-web.sh` | 웹 빌드 → `android/app/src/<빌드 타입>/assets` 스테이징 |

## 준비물

- Node.js 20 이상 + npm (`build.sh` 가 `node_modules` 가 없으면 `npm ci` 를 먼저 돌린다)
- JDK 17 이상 — 없으면 Android Studio 내장 JBR 을 자동으로 쓴다
- Android SDK — `ANDROID_HOME`, 없으면 `~/Library/Android/sdk`
- 설치 대상: Pleos Connect Emulator(반드시 **cold boot**) 또는 실기. `adb` 는 PATH 나 SDK `platform-tools` 에서 찾는다

## 빌드·실행

```bash
./build.sh                 # debug: 로컬 CMS(http://localhost:8066) 를 보는 APK
./deploy.sh                # 제거 → 설치 → adb reverse tcp:8066 → 실행

./build.sh release         # release: 운영 CMS(https://cms.aimmovie.com), 스토어 제출용
./deploy.sh release [<adb 시리얼>]
```

- 산출물: `android/app/build/outputs/apk/<debug|release>/app-<debug|release>.apk`
- debug 는 웹·네이티브 모두 로컬 CMS 를 기기의 `localhost:8066` 으로 부른다. PC 에서 CMS(aimmovie_admin)를 8066 으로 띄워 둔다.
- `deploy.sh` 는 서명 충돌을 피하려고 **기존 앱을 항상 제거**한다(앱 데이터도 지워진다). 기기가 여러 대면 시리얼을 지정한다.
- 기어(P·D)는 **Pleos Connect Virtual Console** 에서 바꾼다. 아래 명령을 실행한 뒤 PC 브라우저에서 `http://127.0.0.1:8088/` 을 열고
  Motion → Gear Selection 을 쓴다. 런처의 P R N D 표시는 눌러도 바뀌지 않고, 포워딩은 에뮬레이터를 다시 띄우면 풀린다.
  ```bash
  adb -s emulator-5554 forward tcp:8088 tcp:8088
  ```
- 환경변수: `SKIP_WEB_BUILD=1`(기존 `web/dist` 재사용), `ALLOW_LOCAL_ENV=1`(`web/.env*.local` 허용), `ALLOW_STALE_APK=1`(소스보다 오래된 APK 설치 허용).

## 릴리스 서명

`android/key.properties`(비밀번호 평문)와 `android/pleos-upload.jks`(차량 앱 전용 업로드 키)가 들어 있다.
`./build.sh release` 는 이 키로 서명한다(APK Signature Scheme v3).

⚠️ 이 두 파일이 함께 새면 누구나 정식 앱과 같은 서명으로 APK 를 만들 수 있다. 이 폴더를 압축·공유·커밋할 때는
두 파일을 반드시 빼고(`.gitignore` 에는 이미 들어 있다), 원본은 별도 보안 저장소에 백업해 둔다.
두 파일이 없으면 release APK 가 debug 키로 서명되므로 제출하면 안 된다(`key.properties.example` 참고).

## 문서

- 웹 구조·브릿지 계약: `web/README.md`
- 네이티브 셸: `docs/android-shell.md`
