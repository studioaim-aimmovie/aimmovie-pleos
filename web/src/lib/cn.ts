import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 클래스명 병합 유틸.
 * - clsx: falsy 값 제거 + 조건부 클래스 조합
 * - twMerge: 충돌하는 Tailwind 유틸리티 클래스를 뒤엣것 우선으로 정리
 *
 * 템플릿 리터럴로 직접 공백을 넣지 않아도 되므로,
 * prettier-plugin-tailwindcss가 조각의 앞뒤 공백을 잘라내는 문제를 피할 수 있다.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
