import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * apps/pleos — apps/tv 의 vite.config.ts 를 옮겼다. 빌드 산출물(dist)을 차량 APK 셸이
 * 패키지 파일로 싣고 WebView 로 띄운다(androidtv 래퍼와 같은 패키지형).
 *
 * ⚠️ file:// 에서는 ES 모듈 스크립트가 로드되지 않는다.
 *
 * Vite 는 기본으로 `<script type="module" crossorigin>` 을 내보내는데, file:// 문서는
 * 오리진이 opaque(null)이라 모듈 스크립트 요청이 CORS 로 차단된다. 화면이 흰색으로
 * 뜨고 콘솔 오류도 잘 남지 않아 원인을 찾기 어렵다.
 * (헤드리스 Chrome 으로 dist/index.html 을 file:// 로 열어 #root 가 비는 것을 확인했다.)
 *
 * 그래서 번들을 IIFE(클래식 스크립트)로 뽑고, index.html 의 module 표식을 걷어낸다.
 * 인라인 스크립트로 만드는 방법(single-file)도 있지만 그러면 CSP 에 'unsafe-inline' 이
 * 다시 필요해져, 패키지형으로 옮긴 이점이 줄어든다. 외부 .js 파일을 유지한다.
 */
function fileProtocolClassicScript(): Plugin {
    return {
        name: "aim-file-protocol-classic-script",
        enforce: "post",
        // ⚠️ 빌드 산출물에만 적용한다.
        // dev 서버는 http 로 서빙하며 ESM 소스를 그대로 내려주고 /@vite/client 도 모듈로
        // 주입한다. 거기서 type="module" 을 떼면 "Cannot use import statement outside a
        // module" 로 전부 깨진다(흰 화면). file:// 제약은 빌드 산출물에만 해당한다.
        apply: "build",
        transformIndexHtml(html) {
            return (
                html
                    // ⚠️ type="module" 은 자동으로 defer 된다. 그냥 떼면 <head> 의 스크립트가
                    // <body> 파싱 전에 실행돼 #root 를 찾지 못한다(실측: "#root 를 찾을 수 없습니다").
                    // 클래식 스크립트에서 같은 실행 시점을 유지하려면 defer 를 명시해야 한다.
                    .replace(/\stype="module"/g, " defer")
                    .replace(/\scrossorigin(?:="[^"]*")?/g, "")
                    // modulepreload 는 클래식 스크립트에 의미가 없고 file:// 에서 경고만 남긴다.
                    .replace(/\s*<link[^>]+rel="modulepreload"[^>]*>/g, "")
            );
        },
    };
}

export default defineConfig({
    plugins: [react(), fileProtocolClassicScript()],
    resolve: {
        // tsconfig 의 paths 는 Vite 가 읽지 않는다. 같은 별칭을 여기에도 정의한다
        // (apps/web 에서 이식한 컴포넌트가 "@/lib/cn" 형태를 그대로 쓴다).
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },

    // ⚠️ file:// 오리진에서 로드되므로 상대경로여야 한다.
    // 기본값 "/" 로 두면 자산 경로가 /assets/... 가 되어 디스크 루트를 가리키고 전부 404 난다.
    base: "./",

    build: {
        // 엔진 하한. 차량 셸은 minSdk 28(Android 9, car/pleos 와 같은 값)이라 Android System WebView 가
        // 따로 업데이트되며, Android 9 의 WebView 상한은 TV 표의 "Android 8.0 이상 = 138" 보다 높다.
        // 그래도 TV 와 같은 chrome108 로 둔다 — `packages/core` 를 apps/tv 와 함께 쓰므로 같은 문법
        // 하한을 지키는 편이 안전하고, AAOS 이미지에 내장된 WebView 가 Play 업데이트를 받지 못하는
        // 기기(제조사 이미지 고정)가 있을 수 있다. 실기 WebView 버전을 확인하면 올려도 된다.
        target: "chrome108",
        outDir: "dist",
        // 패키지 앱은 CDN 캐시가 없고 스토어 심사마다 통째로 교체된다.
        // 파일명 해시가 없으면 WebView 캐시가 옛 파일을 물고 있을 수 있어 해시는 유지한다.
        assetsInlineLimit: 0,
        sourcemap: false,
        // modulepreload 는 클래식 스크립트에서 의미가 없다.
        modulePreload: false,
        // IIFE 로 뽑으면 Vite 가 CSS 를 JS 에 인라인해 런타임에 <style> 로 주입한다.
        // 차량 CPU 에서 무스타일 깜빡임이 눈에 띄고, 인라인 <style> 은 CSP 에
        // style-src 'unsafe-inline' 을 계속 요구한다. 별도 .css 파일로 뽑는다.
        cssCodeSplit: false,
        rollupOptions: {
            output: {
                // file:// 로드를 위해 단일 클래식 스크립트로 뽑는다(위 플러그인 주석 참고).
                format: "iife",
                inlineDynamicImports: true,
                entryFileNames: "assets/[name]-[hash].js",
                assetFileNames: "assets/[name]-[hash][extname]",
            },
        },
    },

    server: {
        host: true,
        // apps/web(3000)·apps/tv(5173)와 겹치지 않게 5174 로 고정한다.
        //
        // CMS(app.js)의 CORS 화이트리스트(WEB_ORIGINS)에는 5174 가 없지만 추가할 필요가 없다.
        // 화이트리스트 밖 오리진에는 CMS 가 `Access-Control-Allow-Origin: *`(credentials 불가)로
        // 답하고, 이 앱은 모든 호출을 `credentials: "omit"` + Bearer 로 보내기 때문이다
        // (패키지 오리진 `Origin: null` 도 같은 경로 — 2026-10-13 로컬 CMS 로 확인, README 참고).
        port: 5174,
        // 포트가 점유돼 있으면 조용히 다른 포트로 미끄러지지 않고 실패시킨다.
        strictPort: true,
    },
});
