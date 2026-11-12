// 앱 진입점.
//
// 여기서 하는 일은 두 가지다.
//  1) @aim/core 환경 주입 — core 는 환경변수를 직접 읽지 않는다.
//  2) HashRouter 마운트.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { configure } from "@aim/core/config";

import { pleosAuthFetch } from "./auth/apiClient";
import App from "./App";
import "./styles/index.scss";

configure({
    // Vite 는 import.meta.env 로 빌드 타임에 치환한다.
    apiRoot: import.meta.env.VITE_API_ROOT ?? "",
    cdnUrl: import.meta.env.VITE_CDN_URL ?? "",
    // 인증 호출은 CMS 직접 + Bearer. 논리 경로(/api/**)를 /authapi/** 로 바꿔 보낸다.
    authFetch: pleosAuthFetch,
    // sendBeacon 은 주입하지 않는다 — Authorization 헤더를 실을 수 없어
    // Bearer 인증인 이 앱에서는 쓸 수 없다. core 가 keepalive fetch 로 폴백한다.
});

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root 를 찾을 수 없습니다.");

createRoot(rootEl).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
