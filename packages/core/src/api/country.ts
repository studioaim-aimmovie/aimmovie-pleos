// 국가코드 기반 편성 공용 유틸.
// 백엔드에는 국가 지정 유저=session.user.country_code(ISO), 국가 미지정(게스트·미지정 신규 유저)=
// 리터럴 "default"(기본 편성)을 전달한다. (가입에서 국가선택을 받지 않게 되면서 미지정이 기본 케이스)

/** 국가 미지정(게스트·country_code 빈값) 편성 폴백 = 리터럴 "default". 백엔드가 기본 편성으로 인식. */
export const DEFAULT_COUNTRY = "default";

/**
 * 편성/시장(FILTER) 국가. `?country=` 백엔드 편성에 사용.
 * 국가 지정 유저는 country_code(ISO), 미지정(빈값)은 DEFAULT_COUNTRY("default") 기본 편성.
 */
export function resolveCountry(countryCode?: string | null): string {
    return countryCode || DEFAULT_COUNTRY;
}
