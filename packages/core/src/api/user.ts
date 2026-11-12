// 유저 계정 관련 클라이언트 헬퍼.

import { authFetch } from "../config";
import type { PassChangeRequest, PassChangeResponse } from "../types/auth";

export interface WithdrawResult {
    result: boolean;
    message?: string;
    code?: string;
}

/** 회원 탈퇴 요청. 인증은 서버 프록시(/api/user/withdraw)가 세션에서 채운다. */
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
 * ⚠️ **호출 경로가 플랫폼마다 다르다.** apps/web 은 자체 프록시 라우트
 * `POST /join/pass` 를 쓰고(세션 쿠키에서 사용자 식별을 채워야 하므로), 이 함수는
 * 논리 경로 `/api/user/userpasschange` 로 보낸다. TV의 apiClient 가 이 경로를
 * `{CMS}/authapi/user/userpasschange` 로 바꾸고 Bearer 토큰을 붙인다.
 * 두 경로 모두 최종 목적지는 같은 CMS 엔드포인트다.
 *
 * 그래서 이 함수는 **TV 전용**이다. web 에서 부르면 존재하지 않는
 * `/api/user/userpasschange` 로 나가므로 기존 `/join/pass` 를 그대로 쓸 것.
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
