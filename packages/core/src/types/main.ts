// /api/main/show/:id 응답 타입.
// 메뉴(페이지) 하나의 편성 데이터 — 대표 콘텐츠(main_contents), TOP10, 섹션 목록.
// app/page.tsx(홈)와 app/(view)/list/[type]/page.tsx 가 받아 components/main/main_wrap 으로 렌더한다.
//
// 실제 서버 응답(http://192.168.0.87:8066/api/main/show/:id)을 관찰해 정의했다.

import type { ApiResponse } from "./api";
import type { Content, LocalizedText } from "./contents";
import type { MenuName } from "./menu";

/** top10 / sections.list 의 각 항목. 편성 순서(order)와 콘텐츠 본문을 감싼다. */
export interface ContentEntry {
    order: number;
    contents: Content;
    _id: string;
}

/** TOP10 편성. open은 노출 여부 플래그. */
export interface Top10 {
    open: number;
    list: ContentEntry[];
}

/** 페이지 하단 섹션(가로 슬라이드 한 줄). */
export interface Section {
    /** 섹션(그룹) 타이틀. 국가코드 맵. titles[국가코드] || titles.default. */
    titles: LocalizedText;
    open: number;
    order: number;
    _id: string;
    list: ContentEntry[];
}

/** 메뉴(페이지) 편성 전체. */
export interface MainPage {
    menu_name: MenuName;
    /** URL 슬러그(예: "home"). isHome 판정 등에 사용. */
    url_name?: string;
    top10: Top10;
    open: number;
    order: number;
    /** 페이지 상단 대표 콘텐츠. */
    main_contents: Content;
    _id: string;
    sections: Section[];
    updated_at: string;
    created_at: string;
    __v: number;
}

/** /api/main/show/:id 최상위 응답. */
export type MainShowResponse = ApiResponse<MainPage>;
