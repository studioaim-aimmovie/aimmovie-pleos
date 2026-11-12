// 원본: packages/core/src/api/country.ts
//
// 국가코드 기반 편성 공용 유틸. 페이지/편성은 "접속 국가"에 맞춰 노출한다(지금은 국내 전용 → 접속국가=KR).
// 백엔드에는 게스트=접속국가(KR), 로그인=user.country_code(ISO) 를 전달한다.
package com.aimmovie.car.data.api

object Country {
    /** 게스트(비로그인) 편성 폴백 = 접속국가. 현재 국내 전용이라 KR. (글로벌 전환 시 GeoIP로 대체) */
    const val DEFAULT_COUNTRY = "KR"

    /**
     * 편성/시장(FILTER) 국가. `?country=` 백엔드 편성에 사용.
     * 게스트(빈값)는 접속국가(DEFAULT_COUNTRY=KR) 편성, 로그인 유저는 country_code.
     */
    fun resolveCountry(countryCode: String?): String = countryCode?.takeIf { it.isNotEmpty() } ?: DEFAULT_COUNTRY

    /**
     * 표시(DISPLAY) 국가. 제목/줄거리/섹션/메뉴명 등 텍스트 표기에 사용.
     * 게스트(빈값)는 "" → resolveText가 titles.default를 반환. 로그인 유저는 country_code.
     * (resolveCountry와 달리 홈마켓 폴백을 적용하지 않아, 게스트=기본값 규칙을 지킨다.)
     */
    fun viewerCountry(countryCode: String?): String = countryCode ?: ""
}
