// 내 정보 조회 — 마이페이지에 이메일을 보여 주려고 쓴다.
//
// 페어링 토큰 응답(`/authapi/device/token`)의 `user` 에는 이메일이 없고 `id` 가 DB `_id`(ObjectId) 다.
// 그 값을 이메일 자리에 그대로 보여 주던 문제를 고치려고 로그인 사용자 정보를 따로 조회한다.
//
// 계약(CMS aimmovie_admin `routes/api/user.js`, 브랜치 feat/user-me):
//   GET /authapi/user/me  (Authorization: Bearer <access>)
//   → { result: true, user: { email, name, country_code, country_dial, phone } }
//   이메일은 CMS 사용자 스키마의 `id` 필드("아이디(이메일)")다.
//   소셜 가입 여부는 CMS 스키마에 저장되지 않아 이 응답에 없다 — 세션 값을 그대로 쓴다.

import { pleosAuthFetch } from "@/auth/apiClient";

export interface MyInfo {
    email: string;
    name: string;
    countryCode: string;
    countryDial: string;
    phone: string;
}

/** 로그인 사용자 정보를 조회한다. 실패하거나 미로그인이면 null. */
export async function fetchMyInfo(): Promise<MyInfo | null> {
    try {
        const res = await pleosAuthFetch("/api/user/me", { method: "GET" });
        if (!res.ok) return null;
        const data = await res.json().catch(() => null);
        const u = data?.result ? data.user : null;
        if (!u) return null;
        return {
            email: String(u.email ?? ""),
            name: String(u.name ?? ""),
            countryCode: String(u.country_code ?? ""),
            countryDial: String(u.country_dial ?? ""),
            phone: String(u.phone ?? ""),
        };
    } catch {
        return null;
    }
}
