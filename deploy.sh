#!/usr/bin/env bash
# AimMovie Pleos Connect(차량) 앱 설치 + 실행
#
# 사용법: ./deploy.sh [debug|release] [<adb 시리얼>]
#         (빌드 타입 생략 시 debug, 시리얼 생략 시 연결된 기기가 하나일 때 그 기기)
#
# 주 대상은 Pleos Connect Emulator 다. AVD 는 반드시 cold boot 로 띄운다(quick boot 는 VHAL 이 꺼진다).
#
# ⚠️ debug 와 release 는 서명이 달라 서로 덮어쓸 수 없으므로(INSTALL_FAILED_UPDATE_INCOMPATIBLE)
#    설치 전에 기존 앱을 항상 제거한다. 앱 데이터(로그인 상태 등)도 함께 초기화된다.
#
# 환경변수:
#   ALLOW_STALE_APK=1   소스가 산출물보다 최신이어도 그대로 설치한다
set -euo pipefail

BUILD_TYPE="debug"
case "$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]')" in
  debug|release)
    BUILD_TYPE="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
    shift
    ;;
esac
SERIAL="${1:-}"

ROOT="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$ROOT/android"
APK="$PROJECT_DIR/app/build/outputs/apk/$BUILD_TYPE/app-$BUILD_TYPE.apk"
# android/app/build.gradle.kts 의 applicationId·namespace 와 맞춘다.
APP_ID="com.aimmovie.car"
COMPONENT="$APP_ID/.MainActivity"

# adb 는 PATH 에 없으면 SDK 의 platform-tools 에서 찾는다.
if ! command -v adb >/dev/null 2>&1; then
  SDK_DIR="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
  if [ -x "$SDK_DIR/platform-tools/adb" ]; then
    export PATH="$SDK_DIR/platform-tools:$PATH"
  else
    echo "❌ adb 를 찾지 못했습니다. Android SDK platform-tools 를 설치하거나 PATH 에 추가하세요."
    exit 1
  fi
fi

if [ ! -f "$APK" ]; then
  echo "❌ $APK 가 없습니다."
  echo "   먼저 빌드하세요: ./build.sh $BUILD_TYPE"
  exit 1
fi

# ── 신선도 가드: 소스가 산출물보다 최신이면 설치하지 않는다 ─────────────────
# 빌드 실패를 지나쳐 옛 APK 가 조용히 설치되면 "고쳤는데 반영이 안 된다"고 헤매게 된다.
# 화면은 웹 번들이므로 web/·packages/core 소스도 함께 본다(build.sh 가 스테이징한 뒤 APK 를 만든다).
STALE_SRC="$(
  find "$PROJECT_DIR/app/src" \
       "$ROOT/web/src" \
       "$ROOT/web/index.html" \
       "$ROOT/packages/core/src" \
       "$PROJECT_DIR/app/build.gradle.kts" \
       "$PROJECT_DIR/build.gradle.kts" \
       "$PROJECT_DIR/settings.gradle.kts" \
       -newer "$APK" -print -quit 2>/dev/null || true
)"
if [ -n "$STALE_SRC" ] && [ "${ALLOW_STALE_APK:-}" != "1" ]; then
  echo "❌ $(basename "$APK") 이 소스보다 오래되었습니다 — 설치를 중단합니다."
  echo "   최신 소스: $STALE_SRC"
  echo "   • 다시 빌드하려면 → ./build.sh $BUILD_TYPE"
  echo "   • 의도한 것이라면 → ALLOW_STALE_APK=1 ./deploy.sh $BUILD_TYPE ${SERIAL}"
  exit 1
fi

# ── 기기 선택 ────────────────────────────────────────────────────────────
if [ -z "$SERIAL" ]; then
  DEVICES="$(adb devices | awk 'NR>1 && $2=="device" {print $1}')"
  COUNT="$(printf '%s' "$DEVICES" | grep -c . || true)"
  if [ "$COUNT" -eq 0 ]; then
    echo "❌ 연결된 기기가 없습니다. Pleos Connect Emulator 를 cold boot 로 띄운 뒤 다시 실행하세요."
    exit 1
  elif [ "$COUNT" -gt 1 ]; then
    echo "❌ 기기가 여러 대 연결되어 있습니다. 시리얼을 지정하세요:"
    printf '   %s\n' $DEVICES
    exit 1
  fi
  SERIAL="$DEVICES"
fi
echo "✅ 기기: $SERIAL ($BUILD_TYPE)"

# ── 제거 → 설치 → 실행 ───────────────────────────────────────────────────
if adb -s "$SERIAL" shell pm list packages | tr -d '\r' | grep -qx "package:$APP_ID"; then
  echo "▶ 기존 앱 제거: $APP_ID (앱 데이터도 함께 지워집니다)"
  adb -s "$SERIAL" uninstall "$APP_ID"
fi

echo "▶ 설치: $(basename "$APK")"
adb -s "$SERIAL" install "$APK"

# debug 빌드는 네이티브(android/app/build.gradle.kts)와 웹 번들(web/.env.development) 모두 로컬 CMS 를 기기의
# localhost:8066 으로 부른다. 기기의 8066 을 PC 로 넘긴다.
# reverse 는 기기 재연결·adb 재시작 때 풀리므로 배포마다 다시 건다.
if [ "$BUILD_TYPE" = "debug" ]; then
  echo "▶ adb reverse tcp:8066 tcp:8066 (로컬 CMS)"
  adb -s "$SERIAL" reverse tcp:8066 tcp:8066 >/dev/null
fi

echo "▶ 실행: $COMPONENT"
# am start 는 액티비티를 찾지 못해도 종료 코드 0 을 돌려준다 — 출력으로 판별한다.
START_OUT="$(adb -s "$SERIAL" shell am start -n "$COMPONENT" 2>&1 | tr -d '\r')"
printf '%s\n' "$START_OUT"
if printf '%s\n' "$START_OUT" | grep -qi 'error'; then
  echo "❌ 실행에 실패했습니다: $COMPONENT"
  exit 1
fi
echo "✅ 실행됨: $COMPONENT ($BUILD_TYPE)"
