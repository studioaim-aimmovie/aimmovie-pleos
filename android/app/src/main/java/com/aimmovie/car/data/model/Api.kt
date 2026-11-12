// 원본: packages/core/src/types/api.ts
package com.aimmovie.car.data.model

import kotlinx.serialization.Serializable

/**
 * 데이터를 `data`로 감싸 돌려주는 조회형 응답. (예: /api/main/list, /api/contents/show)
 * TS 는 `data: T` 지만 서버가 빼먹어도 응답 전체가 실패하지 않도록 nullable 로 둔다.
 */
@Serializable
data class ApiResponse<T>(
    val result: Boolean = false,
    val data: T? = null,
)
