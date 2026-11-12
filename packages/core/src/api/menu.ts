// /api/main/list — 상단 메뉴(페이지) 목록 조회 공용 함수.
// app/page.tsx(서버)와 components/common/Header.tsx(클라이언트)가 공통으로 사용한다.

import type { MenuListResponse } from "../types/menu";
import { apiRoot } from "../config";

/**
 * 상단 메뉴(페이지) 목록을 가져온다. 항상 최신 목록을 받도록 캐시를 사용하지 않는다.
 * country(ISO 코드)를 주면 국가별 노출 메뉴만 조회한다.
 */
export async function getMenuList(country?: string): Promise<MenuListResponse> {
    const qs = country ? `?country=${encodeURIComponent(country)}` : "";
    const res = await fetch(`${apiRoot()}/api/main/list${qs}`, { cache: "no-cache" });
    if (!res.ok) throw new Error("Failed to fetch menu list");
    return res.json();
}
