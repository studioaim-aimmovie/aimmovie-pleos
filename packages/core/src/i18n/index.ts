// 정적 UI 문자열 i18n 사전 진입점 (밑작업 골격).
// 언어 감지(쿠키)·Provider·useT 훅은 이후 단계에서 추가. 여기서는 사전과 조회 함수만 제공한다.
import ko, { type MessageKey } from "./ko";
import en from "./en";
import type { Lang } from "./locale";

// 지원 언어 타입은 lib/locale.ts가 단일 출처. 여기서 재노출.
export type { Lang };
export type { MessageKey };

export const messages = { ko, en } as const;

/** 해당 언어의 사전 전체를 반환(없으면 ko). */
export function getMessages(lang: Lang): Record<MessageKey, string> {
    return messages[lang] ?? messages.ko;
}

/** t()의 값 보간용: 문자열 내 {name} 토큰을 vars.name으로 치환. */
export type TVars = Record<string, string | number>;

/**
 * 키로 문자열 조회. 우선 해당 언어 → 없으면 ko 폴백 → 그래도 없으면 키 문자열 그대로 반환
 * (화면이 깨지지 않게 한다). 키는 MessageKey로 타입 체크되어 오탈자를 방지한다.
 * vars가 있으면 "{name}" 토큰을 치환한다(예: t(lang,"view.season",{n:2}) → "시즌 2").
 */
export function t(lang: Lang, key: MessageKey, vars?: TVars): string {
    const raw = messages[lang]?.[key] ?? messages.ko[key] ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, name: string) =>
        name in vars ? String(vars[name]) : `{${name}}`,
    );
}
