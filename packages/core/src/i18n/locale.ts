// 표시 언어(로케일) 단일 출처. 국가(country_code)와 독립된 "UI 표시 언어" 축.
// - 쿠키 `lang`(ko|en)로 관리 → 서버(layout/RSC)와 클라이언트가 같은 값을 읽는다.
// - 편성(?country=)과 무관: 언어는 표시 텍스트/폰트만 바꾼다.
export type Lang = "ko" | "en";

export const LANGS: { code: Lang; label: string }[] = [
    { code: "ko", label: "한국어" },
    { code: "en", label: "English" },
];

export const LANG_COOKIE = "lang";
export const DEFAULT_LANG: Lang = "ko";
// 쿠키 유효기간(초) — 1년.
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** 임의 값을 지원 언어로 정규화. 미지원/빈값이면 기본 언어. */
export function normalizeLang(value?: string | null): Lang {
    return value === "en" ? "en" : "ko";
}
