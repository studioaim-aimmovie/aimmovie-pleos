// 팝콘 내역 클라이언트 헬퍼.
// 백엔드 /authapi/popcorn/history (프록시 /api/popcorn/history).

import type { LocalizedText } from "../types/contents";
import { resolveText } from "../domain/contents";
import { authFetch } from "../config";

export type PopcornTxType = "charge" | "use";
export type PopcornHistoryTab = "all" | "charge" | "use";

/** 제목 참조(영상/콘텐츠). 언어별 titles 보유. */
export interface PopcornRef {
    titles?: LocalizedText;
}

/** 팝콘 거래 1건. created_at은 표시문자열 또는 epoch(ms)/ISO 모두 허용. */
export interface PopcornTx {
    type: PopcornTxType;
    amount: number;
    balance_after: number;
    created_at: string | number;
    // 사용(use) 시 어떤 영상인지 표기. ref_title 우선, 없으면 영상→부모콘텐츠 titles.
    ref_title?: string;
    ref_video?: PopcornRef | null;
    ref_contents?: PopcornRef | null;
    source?: string;
    memo?: string;
    // 정규화(charge/use) 전 원시 type. admin 등 구분이 접히지 않도록 보존.
    rawType?: string;
}

/** 관리자(admin) 조정 거래인지. 원시 type 또는 source가 "admin". */
export function isAdminTx(tx: PopcornTx): boolean {
    const t = String(tx.rawType ?? "").toLowerCase().trim();
    const s = String(tx.source ?? "").toLowerCase().trim();
    return t === "admin" || s === "admin";
}

/**
 * 내역 행에 표시할 제목.
 * - 관리자(admin) 조정: "관리자-{메모}" (메모 없으면 "관리자").
 * - 시리즈(부모 콘텐츠 존재): "콘텐츠 제목 : 에피소드 제목".
 * - 단일 영상: 영상 제목만.
 * - 그 외(충전/결제 등): source/memo.
 */
export function resolvePopcornTitle(tx: PopcornTx, country: string): string {
    if (isAdminTx(tx)) {
        const memo = String(tx.memo ?? "").trim();
        return memo ? `관리자-${memo}` : "관리자";
    }
    const video = tx.ref_title || resolveText(tx.ref_video?.titles, country); // 에피소드/영상
    const content = resolveText(tx.ref_contents?.titles, country); // 부모 콘텐츠(시리즈)
    // 시리즈: 콘텐츠 제목 앞, 에피소드 제목 뒤. 이미 포함/동일하면 중복 결합 방지.
    if (content && video && content !== video && !video.startsWith(content)) {
        return `${content} : ${video}`;
    }
    return video || content || tx.source || tx.memo || "";
}

export interface PopcornHistoryResult {
    result: boolean;
    list: PopcornTx[];
    total: number;
    balance?: number;
}

/** 페이지당 항목 수 (백엔드 페이징 규약 확정 시 조정). */
export const POPCORN_PAGE_SIZE = 10;

const HISTORY_ENDPOINT = "/api/popcorn/history";

/**
 * 백엔드 type 값을 charge/use로 정규화(값 표기 편차 흡수).
 * 원장 원시값: 차감계열 spend·expire → use, 적립계열 earn·admin → charge.
 */
export function normalizePopcornType(raw: unknown): PopcornTxType {
    const s = String(raw ?? "").toLowerCase().trim();
    const use = ["use", "사용", "sub", "out", "minus", "spend", "expire", "deduct", "-"];
    const charge = ["charge", "충전", "add", "in", "plus", "deposit", "earn", "admin"];
    if (use.includes(s) || s.includes("사용") || s.includes("use") || s.startsWith("-"))
        return "use";
    if (charge.includes(s) || s.includes("충전") || s.includes("charge") || s.startsWith("+"))
        return "charge";
    return "charge";
}

/** 팝콘 내역 조회. 실패/파싱불가 시 빈 결과 → 빈 상태 노출. */
export async function getPopcornHistory(
    type: PopcornHistoryTab,
    page: number,
): Promise<PopcornHistoryResult> {
    try {
        const res = await authFetch(HISTORY_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, page }),
        });
        if (!res.ok) return { result: false, list: [], total: 0 };
        const data = await res.json().catch(() => null);
        if (!data || !data.result) return { result: false, list: [], total: 0 };

        // 응답 필드명 편차를 관용적으로 흡수.
        const rawList = data.list ?? data.data ?? data.items ?? data.rows ?? [];
        const list: PopcornTx[] = (Array.isArray(rawList) ? rawList : []).map(
            (it: Record<string, unknown>) => ({
                ...(it as unknown as PopcornTx),
                // 정규화 전 원시 type 보존(admin 판별용) 후 charge/use로 정규화.
                rawType: it.type != null ? String(it.type) : undefined,
                type: normalizePopcornType(it.type),
            }),
        );
        const total = Number(
            data.total ?? data.totalCount ?? data.count ?? data.totalCnt ?? list.length,
        );
        return {
            result: true,
            list,
            total: isNaN(total) ? list.length : total,
            balance: data.balance != null ? Number(data.balance) : undefined,
        };
    } catch {
        return { result: false, list: [], total: 0 };
    }
}

/** created_at → "YYYY.MM.DD HH:mm (KST)". 이미 표시문자열이면 그대로. */
export function formatPopcornDate(value: string | number): string {
    if (typeof value === "string") {
        // 이미 "2026.12.20 12:23 (KST)" 같은 표시문자열이면 그대로 사용.
        if (/\(KST\)/.test(value) || /^\d{4}\.\d{2}\.\d{2}/.test(value)) return value;
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const parts = new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("year")}.${get("month")}.${get("day")} ${get("hour")}:${get("minute")} (KST)`;
}
