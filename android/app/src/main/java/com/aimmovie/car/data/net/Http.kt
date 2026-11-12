package com.aimmovie.car.data.net

import java.io.IOException
import java.net.URLEncoder

/** 공개 조회가 2xx 가 아닐 때. 원본의 `throw new Error(\`조회 실패(${status}): ${url}\`)` 에 해당한다. */
class ApiException(val status: Int, message: String) : IOException(message)

/** JS encodeURIComponent 와 같은 결과를 낸다(URLEncoder 는 공백을 + 로, !'()~ 를 퍼센트로 바꾼다). */
fun encodeURIComponent(value: String): String =
    URLEncoder.encode(value, "UTF-8")
        .replace("+", "%20")
        .replace("%21", "!")
        .replace("%27", "'")
        .replace("%28", "(")
        .replace("%29", ")")
        .replace("%7E", "~")
