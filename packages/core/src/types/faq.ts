// FAQ 목록 응답 타입. GET /api/faq?country=<ISO> (국가별 공개 FAQ).
import type { ApiResponse } from "./api";

/** FAQ 1건. 백엔드 FaqSchema 대응. contents는 HTML(리치텍스트). */
export interface FaqItem {
    _id: string;
    /** 국가(단일 ObjectId). null이면 공용. 표시엔 미사용(백엔드가 country로 필터). */
    country?: string | null;
    open?: number;
    /** 카테고리(현재 UI 숨김). */
    category?: string;
    title: string;
    /** 상세내용(HTML). */
    contents: string;
    created_at?: string;
    updated_at?: string;
}

export type FaqListResponse = ApiResponse<FaqItem[]>;
