package com.aimmovie.car.data.net

import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.doubleOrNull

/**
 * 앱 전역 Json 설정.
 *
 * CMS 응답은 "관찰해서" 정의한 타입이라(types/api.ts 주석) 서버가 필드를 빼거나 더할 수 있다.
 * TS 는 그래도 undefined 로 흘려보내지만 kotlinx 는 기본값이 엄격해 응답 전체가 실패하므로 느슨하게 둔다.
 *  - ignoreUnknownKeys : 서버가 필드를 추가해도 깨지지 않는다.
 *  - coerceInputValues : non-null 필드에 null 이 오면 기본값으로 대체한다(Mongo 문서는 null 이 흔하다).
 *  - explicitNulls=false : 응답에 없는 nullable 필드는 null, 요청 본문에서는 null 필드를 뺀다
 *    (JSON.stringify 가 undefined 필드를 빼는 동작과 같다).
 *  - isLenient : 숫자가 문자열로 오는 등 표기 편차를 받아들인다.
 */
@OptIn(ExperimentalSerializationApi::class)
val AppJson: Json = Json {
    ignoreUnknownKeys = true
    coerceInputValues = true
    explicitNulls = false
    isLenient = true
    encodeDefaults = true
}

/** `await res.json().catch(() => null)` — 파싱할 수 없으면 null. */
fun parseJsonOrNull(body: String): JsonElement? =
    try {
        AppJson.parseToJsonElement(body)
    } catch (_: Exception) {
        null
    }

/** 응답이 객체일 때만 돌려준다. `data?.result` 처럼 쓰려는 곳에서 쓴다. */
fun parseJsonObjectOrNull(body: String): JsonObject? = parseJsonOrNull(body) as? JsonObject

/** JS truthy 판정. `!!data?.result`, `if (data.access_token)` 같은 조건을 그대로 옮기기 위해 쓴다. */
fun JsonElement?.isTruthy(): Boolean = when (this) {
    null, JsonNull -> false
    is JsonPrimitive -> when {
        isString -> content.isNotEmpty()
        booleanOrNull != null -> booleanOrNull!!
        doubleOrNull != null -> doubleOrNull!!.let { it != 0.0 && !it.isNaN() }
        else -> true
    }
    else -> true
}

/** 문자열 원시값만 꺼낸다(숫자·불리언도 문자열로). 객체·배열·null 이면 null. */
fun JsonElement?.stringOrNull(): String? = (this as? JsonPrimitive)?.takeIf { it !is JsonNull }?.content

/**
 * JS `Number(x)` 와 같은 변환. null/undefined 는 호출부가 `??` 로 먼저 걸러내므로 여기서는
 * 숫자로 읽을 수 없으면 NaN 을 돌려준다(빈 문자열은 JS 와 같이 0).
 */
fun JsonElement?.jsNumber(): Double = when (this) {
    null, JsonNull -> 0.0
    is JsonPrimitive -> when {
        !isString && booleanOrNull != null -> if (booleanOrNull!!) 1.0 else 0.0
        isString && content.isBlank() -> 0.0
        else -> content.trim().toDoubleOrNull() ?: Double.NaN
    }
    else -> Double.NaN
}

/** `x ?? y` — null/누락이면 다음 후보. */
fun JsonObject.firstPresent(vararg keys: String): JsonElement? =
    keys.firstNotNullOfOrNull { key -> this[key]?.takeIf { it !is JsonNull } }
