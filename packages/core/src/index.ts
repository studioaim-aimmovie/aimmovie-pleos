// @aim/core 배럴.
//
// 서브패스(`@aim/core/domain/contents` 등)로도 직접 import할 수 있다. 호출부가
// 어떤 계층의 코드를 쓰는지 드러나므로 앱 코드에서는 서브패스를 권장하고,
// 이 배럴은 "core 전체가 무엇을 노출하는지" 한눈에 보는 목차 역할을 한다.

export * from "./config";

// --- types ---
export type * from "./types/api";
export type * from "./types/auth";
export type * from "./types/contents";
export type * from "./types/faq";
export type * from "./types/main";
export type * from "./types/menu";

// --- api (CMS 조회 / 인증 호출) ---
export * from "./api/menu";
export * from "./api/catalog";
export * from "./api/faq";
export * from "./api/popcorn";
export * from "./api/likeStatus";
export * from "./api/videoStatus";
export * from "./api/drm";
export * from "./api/user";
export * from "./api/country";
export * from "./api/popcornProducts";

// --- domain (가공 유틸) ---
export * from "./domain/contents";
export * from "./domain/kvPlayback";
export * from "./domain/focusKeys";

// --- i18n ---
export * from "./i18n/locale";
export * from "./i18n/index";
