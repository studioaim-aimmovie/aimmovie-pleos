#!/usr/bin/env bash
# AimMovie Pleos Connect(차량) 앱 빌드 — web/ 웹 번들 스테이징 + Gradle APK
#
# 사용법: ./build.sh [debug|release]
#         (생략 시 debug — 에뮬레이터 사이드로드 테스트가 주 용도다)
#
# 앱은 하이브리드 셸이다. 화면은 web/(@aim/pleos) 빌드 산출물을 APK assets 에 싣고 WebView 로 띄운다.
#   1) scripts/stage-web.sh 가 (필요하면 npm 의존성을 설치하고) web/ 을 빌드해
#      빌드 타입별 소스셋(android/app/src/<debug|release>/assets)에 복사한다.
#   2) Gradle 로 APK 를 만든다.
#
# 환경변수: SKIP_WEB_BUILD=1(이미 빌드된 web/dist 재사용), ALLOW_LOCAL_ENV=1 — scripts/stage-web.sh 참고.
#
#   debug   → android/app/build/outputs/apk/debug/app-debug.apk
#   release → android/app/build/outputs/apk/release/app-release.apk  (Pleos App Market 업로드용)
#
# release 빌드에는 차량 앱 전용 키가 필요하다(android/key.properties). 없으면 debug 키로 서명된다.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$ROOT/android"

BUILD_TYPE="$(printf '%s' "${1:-debug}" | tr '[:upper:]' '[:lower:]')"
case "$BUILD_TYPE" in
  debug)
    GRADLE_TASK="assembleDebug"
    ARTIFACT="app/build/outputs/apk/debug/app-debug.apk"
    ;;
  release)
    GRADLE_TASK="assembleRelease"
    ARTIFACT="app/build/outputs/apk/release/app-release.apk"
    ;;
  *)
    echo "❌ 알 수 없는 빌드 타입: $1"
    echo "   사용법: $0 [debug|release]"
    exit 1
    ;;
esac

# ── 필수 도구 확인 ──
command -v npm >/dev/null 2>&1 || { echo "❌ npm 이 없습니다. Node.js 20 이상을 설치하세요."; exit 1; }

# AGP 8.x는 JDK 17 이상이 필요하다. 시스템 java가 구버전일 수 있으므로 Android Studio 내장 JBR을 우선 사용.
if [ -z "${JAVA_HOME:-}" ] || ! "$JAVA_HOME/bin/java" -version 2>&1 | grep -qE '"(1[7-9]|2[0-9])'; then
  JBR="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  if [ -d "$JBR" ]; then
    export JAVA_HOME="$JBR"
  fi
fi
echo "▶ JAVA_HOME=${JAVA_HOME:-(system default)}"

# Android SDK 경로 자동 설정 (local.properties 미존재 시 생성)
SDK_DIR="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
if [ ! -f "$PROJECT_DIR/local.properties" ]; then
  if [ ! -d "$SDK_DIR" ]; then
    echo "❌ Android SDK 를 찾지 못했습니다: $SDK_DIR"
    echo "   ANDROID_HOME 을 지정하거나 Android Studio 로 SDK 를 설치하세요."
    exit 1
  fi
  echo "sdk.dir=$SDK_DIR" > "$PROJECT_DIR/local.properties"
  echo "▶ local.properties 생성: sdk.dir=$SDK_DIR"
fi

if [ "$GRADLE_TASK" = "assembleRelease" ] && [ ! -f "$PROJECT_DIR/key.properties" ]; then
  echo "⚠️  key.properties 가 없어 release APK 가 debug 키로 서명된다 — 스토어 제출용이 아니다."
fi

# ── 웹 번들 스테이징 ──
"$ROOT/scripts/stage-web.sh" "$BUILD_TYPE" "$PROJECT_DIR/app/src/$BUILD_TYPE/assets"

cd "$PROJECT_DIR"
chmod +x ./gradlew
./gradlew "$GRADLE_TASK"

OUT="$PROJECT_DIR/$ARTIFACT"
if [ ! -f "$OUT" ]; then
  echo ""
  echo "❌ 산출물이 생성되지 않았다: $OUT"
  exit 1
fi
# up-to-date 로 재패키징을 건너뛰어도 빌드 성공 시점을 산출물에 남긴다(deploy.sh 신선도 가드용).
touch "$OUT"

echo ""
echo "✅ 생성 완료: $OUT"
echo "   설치·실행: ./deploy.sh $BUILD_TYPE"
