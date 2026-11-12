// 유저 계정 관련 클라이언트 헬퍼.

import { authFetch } from "../config";
import type { PassChangeRequest, PassChangeResponse } from "../types/auth";

export interface WithdrawResult {
    result: boolean;
    message?: string;
    code?: string;
}

/** 회원 탈퇴 요청. 논리 경로(/api/user/withdraw)로 보내면 전송자가 CMS 경로와 Bearer 를 채운다. */
export async function withdrawAccount(): Promise<WithdrawResult> {
    try {
        const res = await authFetch("/api/user/withdraw", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
        });
        const data = await res.json().catch(() => null);
        if (!data) return { result: false, message: "탈퇴 응답을 해석할 수 없습니다." };
        return data as WithdrawResult;
    } catch {
        return { result: false, message: "탈퇴 처리 중 오류가 발생했습니다." };
    }
}

/**
 * 비밀번호 변경.
 *
 * 논리 경로 `/api/user/userpasschange` 로 보낸다. 앱의 apiClient 가 이 경로를
 * `{CMS}/authapi/user/userpasschange` 로 바꾸고 Bearer 토큰을 붙인다.
 */
export async function changePassword(req: PassChangeRequest): Promise<PassChangeResponse> {
    try {
        const res = await authFetch("/api/user/userpasschange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req),
        });
        const data = await res.json().catch(() => null);
        if (!data) return { result: false, message: "비밀번호 변경 응답을 해석할 수 없습니다." };
        return data as PassChangeResponse;
    } catch {
        return { result: false, message: "비밀번호 변경 중 오류가 발생했습니다." };
    }
}
