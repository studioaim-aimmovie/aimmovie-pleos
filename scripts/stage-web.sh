#!/usr/bin/env bash
# web/(@aim/pleos, Vite SPA) 빌드 → 차량 APK assets 로 산출물 스테이징.
#
# 사용법:  scripts/stage-web.sh <debug|release> <대상 디렉터리>
#
# 모드 — 웹과 네이티브는 **같은 CMS** 를 봐야 한다. 토큰을 네이티브가 갖고 웹은 그 access 로 CMS 를 부르므로,
# 네이티브는 로컬 CMS 인데 웹은 운영 CMS 를 부르면 로그인이 통째로 어긋난다.
#   debug   → `vite build --mode development` : web/.env.development(로컬 CMS http://localhost:8066). 네이티브 debug 와 같다.
#             (Vite 는 --mode 와 무관하게 vite build 의 NODE_ENV 를 production 으로 둔다 — React 는 운영 빌드다.)
#   release → `vite build`                   : web/.env.production(운영 CMS). 네이티브 release 와 같다.
#
# 환경변수:
#   SKIP_WEB_BUILD=1   이미 빌드된 web/dist 를 그대로 쓴다(반복 패키징 시 시간 절약. 모드가 맞는지는 직접 확인)
#   ALLOW_LOCAL_ENV=1  .env*.local 이 있어도 진행한다(아래 가드 참고)
set -euo pipefail

MODE="${1:?debug 또는 release 를 지정할 것}"
TARGET="${2:?대상 디렉터리를 지정할 것}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/web"
DIST="$APP/dist"

# dist 최상위 항목. 여기 없는 항목은 APK 에 실리지 않는다.
STAGED=(index.html assets fonts images)

case "$MODE" in
  debug) VITE_ARGS=(--mode development) ;;
  release) VITE_ARGS=() ;;
  *)
    echo "❌ 알 수 없는 모드: $MODE (debug|release)"
    exit 1
    ;;
esac

# ── 가드: 개발용 env 오버라이드가 산출물에 박히는 것을 막는다 ──
# Vite 는 `.env.local`·`.env.<mode>.local` 을 커밋된 값보다 우선 적용한다. 실차 테스트용 LAN IP 를 넣어 둔 채로
# 패키징하면 스토어 산출물에 개발 PC 의 사설 IP 가 박혀 나간다. 기본은 중단, 테스트 패키지에서만 명시적으로 허용한다.
LOCAL_ENVS="$(ls "$APP"/.env*.local 2>/dev/null || true)"
if [ -n "$LOCAL_ENVS" ] && [ "${ALLOW_LOCAL_ENV:-}" != "1" ]; then
  echo "❌ web/ 에 로컬 env 오버라이드가 있습니다:"
  echo "$LOCAL_ENVS" | sed 's|^|     |'
  echo "   이 값이 빌드에 인라인되어 APK 에 그대로 박힙니다."
  echo "   • 출시용이면  → 위 파일을 지우고 다시 실행"
  echo "   • 테스트용이면 → ALLOW_LOCAL_ENV=1 을 붙여 다시 실행"
  exit 1
fi

# ── 1) 웹 빌드 ──
if [ "${SKIP_WEB_BUILD:-}" = "1" ]; then
  echo "▶ SKIP_WEB_BUILD=1 — 기존 dist 사용"
else
  if [ ! -d "$ROOT/node_modules" ]; then
    echo "▶ 의존성 설치 (npm $( [ -f "$ROOT/package-lock.json" ] && echo ci || echo install ))"
    if [ -f "$ROOT/package-lock.json" ]; then
      ( cd "$ROOT" && npm ci )
    else
      ( cd "$ROOT" && npm install )
    fi
  fi
  echo "▶ web 빌드 ($MODE${VITE_ARGS[*]:+: vite build ${VITE_ARGS[*]}})"
  # npm run 의 `--` 뒤 인자는 스크립트 끝(vite build)에 붙는다.
  ( cd "$ROOT" && npm run build -w @aim/pleos -- ${VITE_ARGS[@]+"${VITE_ARGS[@]}"} )
fi

if [ ! -f "$DIST/index.html" ]; then
  echo "❌ $DIST/index.html 이 없습니다. 웹 빌드가 실패했는지 확인하세요."
  exit 1
fi

# ── 2) 스테이징 ──
mkdir -p "$TARGET"
echo "▶ 스테이징 → $TARGET"
for item in "${STAGED[@]}"; do
  # 묵은 산출물(옛 해시 파일 등)이 남지 않도록 대상을 먼저 비운다.
  rm -rf "${TARGET:?}/$item"
  if [ -e "$DIST/$item" ]; then
    cp -R "$DIST/$item" "$TARGET/$item"
    printf "   + %s\n" "$item"
  fi
done

# ── 3) 무엇이 박혔는지 보여 준다 ──
echo "▶ 산출물에 인라인된 호스트:"
grep -ohoE '"https?://[A-Za-z0-9._-]+(:[0-9]+)?"' "$TARGET"/assets/*.js 2>/dev/null \
  | sort -u | sed 's|^|     |' || echo "     (탐지 실패 — 수동 확인 필요)"
# react-router 가 기본값으로 "http://localhost"(포트 없음)를 갖고 있어 포트가 붙은 주소와 사설 IP 만 본다.
if [ "$MODE" = "release" ] && grep -qE 'https?://((localhost|127\.0\.0\.1):[0-9]+|(10|192\.168)\.[0-9.]+)' "$TARGET"/assets/*.js 2>/dev/null; then
  echo "❌ release 산출물에 로컬/사설 주소가 들어 있습니다. web/ 의 env 를 확인하세요."
  exit 1
fi
# 반대 방향: debug 웹 번들이 운영 CMS 를 보면 네이티브(debug = 로컬 CMS)와 어긋난다.
if [ "$MODE" = "debug" ] && grep -q '"https://cms\.aimmovie\.com"' "$TARGET"/assets/*.js 2>/dev/null; then
  echo "❌ debug 산출물이 운영 CMS(https://cms.aimmovie.com)를 가리킵니다. 네이티브 debug 는 로컬 CMS 를 쓰므로 둘이 어긋납니다."
  echo "   web/.env.development 의 VITE_API_ROOT 를 로컬 CMS(http://localhost:8066)로 맞추세요."
  exit 1
fi
