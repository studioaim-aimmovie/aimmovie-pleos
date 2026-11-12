// /authapi/user/* 응답 타입 (회원/인증).

import type { ApiMessageResponse } from "./api";

// ─────────────────────────────────────────────────────────────
// 비밀번호 변경 — POST /authapi/user/userpasschange
// ─────────────────────────────────────────────────────────────

// 사용자 식별은 서버가 토큰/JWT로 처리(body.id 미사용).
// - 로그인(마이페이지) 변경: JWT 인증 + { new_password }
// - 비로그인 리셋 플로우: { reset_token, new_password } (verify 응답의 reset_token)
export interface PassChangeRequest {
    new_password: string;
    reset_token?: string;
}

export type PassChangeResponse = ApiMessageResponse;
