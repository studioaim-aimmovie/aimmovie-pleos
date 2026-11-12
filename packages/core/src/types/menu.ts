// /api/main/list 응답 타입.
// 상단 메뉴(페이지) 목록을 정의한다.
// components/common/Header.tsx (동적 메뉴)와 app/page.tsx (첫 페이지 조회)가 참조한다.

import type { ApiResponse } from "./api";
import type { LocalizedText } from "./contents";

/** 메뉴명 로컬라이즈. 콘텐츠 titles와 동일한 국가코드 맵({ default, KR, US, ... }). */
export type MenuName = LocalizedText;

/** 상단 메뉴(페이지) 항목. url_name이 /list/[slug] URL로 사용된다(없으면 _id). */
export interface MenuItem {
    menu_name: MenuName;
    /** URL 슬러그(예: "home"). /list/{url_name} 및 /api/main/show/{url_name} */
    url_name?: string;
    order: number;
    _id: string;
    created_at: string;
}

/** /api/main/list 최상위 응답. */
export type MenuListResponse = ApiResponse<MenuItem[]>;
