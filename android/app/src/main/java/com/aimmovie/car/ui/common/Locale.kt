package com.aimmovie.car.ui.common

import com.aimmovie.car.data.api.Country
import com.aimmovie.car.data.auth.AuthRepository
import java.util.Locale

/**
 * 표시 언어(ko/en). 콘텐츠 제목의 언어 키(resolveText)와 플레이어 문구 언어로 쓴다. 웹이 재생 요청에 언어를 실어 보내면
 * 그 값을 쓰고(웹은 사용자가 푸터에서 언어를 고른다), 없으면(복원 기록 등) 시스템 언어를 따른다.
 */
fun displayLocale(requested: String = "", locale: Locale = Locale.getDefault()): String = when (requested) {
    "ko", "en" -> requested
    else -> if (locale.language == "en") "en" else "ko"
}

/** 편성/시장 국가(?country=). 게스트는 KR, 로그인 사용자는 country_code(web/src/hooks/useMarketCountry.ts 와 같다). */
fun AuthRepository.marketCountry(): String = Country.resolveCountry(user?.countryCode)
