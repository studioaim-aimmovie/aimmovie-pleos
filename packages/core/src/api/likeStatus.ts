"use client";

// 좋아요(like)·즐겨찾기(favorite) 저장 클라이언트 유틸.
// 프론트 API 프록시(/api/likestatus/*)로 { contents, <field> }를 보낸다.
// 사용자 식별(user)은 프록시가 세션에서 채워 CMS로 전달한다.

import type { Content } from "../types/contents";
import { authFetch } from "../config";

const LIKE_ENDPOINT = "/api/likestatus/like";
const FAVORITE_ENDPOINT = "/api/likestatus/favorite";
const MYLIST_ENDPOINT = "/api/likestatus/mylist";

/** 콘텐츠 1건의 좋아요/즐겨찾기 상태. */
export interface LikeState {
    like: boolean;
    favorite: boolean;
}

/**
 * 콘텐츠 목록의 좋아요/즐겨찾기 상태를 조회한다. { contentsId: {like, favorite} } 맵.
 * 미로그인/실패/빈 목록이면 빈 맵({}).
 */
export async function fetchLikeStatus(contents: string[]): Promise<Record<string, LikeState>> {
    const list = [...new Set((contents ?? []).filter(Boolean))];
    if (list.length === 0) return {};
    try {
        const res = await authFetch(MYLIST_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: list }),
        });
        if (!res.ok) return {};
        const data = await res.json();
        if (!data?.result || !data?.status) return {};
        return data.status as Record<string, LikeState>;
    } catch {
        return {};
    }
}

/**
 * 로그인 유저가 "찜한(favorite:true)" 콘텐츠 전체를 조회한다(최신순).
 * mylist를 contents 없이 호출 → 전체 레코드에서 favorite=true 인 항목의 콘텐츠 객체를 반환.
 * 백엔드가 list[].contents 를 콘텐츠 객체로 populate 한다(미연결/삭제 항목은 목록에서 제외됨).
 * 미로그인/실패/없음이면 빈 배열.
 */
export async function fetchFavorites(): Promise<Content[]> {
    try {
        const res = await authFetch(MYLIST_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}", // contents 생략 → 전체 레코드
        });
        if (!res.ok) return [];
        const data = await res.json();
        if (!data?.result || !Array.isArray(data.list)) return [];
        const seen = new Set<string>();
        const out: Content[] = [];
        for (const row of data.list as Array<{ contents?: Content | string | null; favorite?: boolean }>) {
            if (row?.favorite !== true) continue; // 찜 = favorite:true 만
            const c = row.contents;
            // populate된 콘텐츠 객체만 사용(문자열 id·미연결 항목은 제외).
            if (!c || typeof c === "string" || !c._id || seen.has(c._id)) continue;
            seen.add(c._id);
            out.push(c);
        }
        return out;
    } catch {
        return [];
    }
}

async function postStatus(endpoint: string, body: object): Promise<boolean> {
    try {
        const res = await authFetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) return false;
        const data = await res.json();
        return !!data?.result;
    } catch {
        return false;
    }
}

/** 좋아요 값을 저장한다. like=true(좋아요)/false(취소). 성공 시 true. */
export async function setLike(contents: string, like: boolean): Promise<boolean> {
    if (!contents) return false;
    return postStatus(LIKE_ENDPOINT, { contents, like });
}

/** 즐겨찾기 값을 저장한다. favorite=true(추가)/false(해제). 성공 시 true. */
export async function setFavorite(contents: string, favorite: boolean): Promise<boolean> {
    if (!contents) return false;
    return postStatus(FAVORITE_ENDPOINT, { contents, favorite });
}
