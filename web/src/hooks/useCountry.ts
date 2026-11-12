import { useLang } from "@/i18n/LocaleProvider";
import type { Lang } from "@aim/core/i18n/locale";

/**
 * 표시(DISPLAY) 로케일(ko/en). 콘텐츠 제목·요약·섹션/메뉴명 등 텍스트 표기
 * (resolveText / pickContents)의 언어 키로 쓴다. 푸터에서 고른 표시 언어를 따르며,
 * 유저의 국가(country_code)·편성(?country=)과는 독립이다.
 */
export function useDisplayLocale(): Lang {
    return useLang().lang;
}

/**
 * @deprecated 이름은 country지만 이제 표시 언어(ko/en)를 반환한다.
 * 콘텐츠/메뉴 텍스트 해석축이 국가 → 표시 언어로 바뀌면서 useDisplayLocale의 별칭이 됐다.
 * 신규 코드는 useDisplayLocale을 사용할 것. (편성/시장 국가는 lib/country의 resolveCountry 사용)
 */
export const useCountry = useDisplayLocale;
