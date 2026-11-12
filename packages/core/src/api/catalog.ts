// 공개(비인증) 카탈로그 조회.
//
// 지금까지 각 페이지(app/page.tsx, contents/[id], list/[type], search)가 같은 형태의
// fetch 를 저마다 복붙해 갖고 있었다. apps/tv 도 같은 조회가 필요해 여기로 모은다.
//
// 인증이 필요 없으므로 authFetch 를 타지 않고 apiRoot 로 직접 요청한다.
// (인증이 필요한 호출은 api/likeStatus·videoStatus·popcorn 쪽이다)

import { apiRoot } from "../config";
import type { ContentShowResponse } from "../types/contents";
import type { MainShowResponse } from "../types/main";

/** 편성/검색 조회는 항상 최신을 받는다 — TV는 캐시된 편성이 오래 남으면 티가 크다. */
const NO_CACHE: RequestInit = { cache: "no-cache" };

async function getJson<T>(url: string): Promise<T> {
    const res = await fetch(url, NO_CACHE);
    if (!res.ok) throw new Error(`조회 실패(${res.status}): ${url}`);
    return res.json() as Promise<T>;
}

/**
 * 메인/페이지 편성 조회. `id` 는 /api/main/list 가 준 페이지 _id 또는 url_name.
 * 홈과 /list/[type] 이 같은 응답 형태를 쓴다.
 */
export function getMainShow(id: string, country: string): Promise<MainShowResponse> {
    return getJson<MainShowResponse>(
        `${apiRoot()}/api/main/show/${encodeURIComponent(id)}?country=${encodeURIComponent(country)}`,
    );
}

/** 콘텐츠 상세 조회. */
export function getContentShow(id: string, country: string): Promise<ContentShowResponse> {
    return getJson<ContentShowResponse>(
        `${apiRoot()}/api/contents/show/${encodeURIComponent(id)}?country=${encodeURIComponent(country)}`,
    );
}

/**
 * 검색.
 *
 * country(편성/시장)와 lang(표시·검색 언어)은 독립된 축이다.
 * 영문 모드에서 영문(US) 타이틀까지 검색되도록 lang 을 함께 보낸다 — 빼먹으면
 * 영문 화면에서 영문 제목이 검색되지 않는다.
 */
export function searchContents(str: string, country: string, lang: string): Promise<MainShowResponse> {
    return getJson<MainShowResponse>(
        `${apiRoot()}/api/search?str=${encodeURIComponent(str)}` +
            `&country=${encodeURIComponent(country)}&lang=${encodeURIComponent(lang)}`,
    );
}
