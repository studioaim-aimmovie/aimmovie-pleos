// 원본: packages/core/src/api/catalog.ts (getContentShow)
//
// 공개(비인증) 조회. 인증이 필요 없으므로 ApiClient 를 타지 않고 apiRoot 로 직접 요청한다.
// 네이티브가 부르는 공개 조회는 플레이어의 콘텐츠 상세뿐이다(홈·목록·검색·메뉴·FAQ 는 웹 번들이 @aim/core 로 부른다).
// OkHttpClient 에 캐시를 붙이지 않았으므로 항상 최신을 받는다.
package com.aimmovie.car.data.api

import com.aimmovie.car.data.config.AppConfig
import com.aimmovie.car.data.model.ApiResponse
import com.aimmovie.car.data.model.Content
import com.aimmovie.car.data.model.ContentShowResponse
import com.aimmovie.car.data.net.ApiException
import com.aimmovie.car.data.net.AppJson
import com.aimmovie.car.data.net.HttpRequest
import com.aimmovie.car.data.net.HttpTransport
import com.aimmovie.car.data.net.encodeURIComponent
import kotlinx.serialization.KSerializer

class CatalogApi(
    private val config: AppConfig,
    private val transport: HttpTransport,
) {
    /** 콘텐츠 상세 조회. */
    suspend fun getContentShow(id: String, country: String): ContentShowResponse {
        val url = "${config.apiRoot}/api/contents/show/${encodeURIComponent(id)}?country=${encodeURIComponent(country)}"
        val res = transport.execute(HttpRequest(url))
        if (!res.isSuccessful) throw ApiException(res.status, "조회 실패(${res.status}): $url")
        return AppJson.decodeFromString(CONTENT_SHOW, res.body)
    }

    private companion object {
        val CONTENT_SHOW: KSerializer<ContentShowResponse> = ApiResponse.serializer(Content.serializer())
    }
}
