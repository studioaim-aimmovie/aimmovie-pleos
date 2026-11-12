// DRM 라이선스 토큰 발급. CMS `/authapi/drm/license` 를 `deviceType:'app'` 으로 직접 부른다.
// 받은 토큰은 Widevine 라이선스 요청 헤더(응답의 header, 예: pallycon-customdata-v2)에 실어 보낸다.
//
// 인증 전달 방식:
//  Bearer access 토큰을 쓰므로 ApiClient(Bearer + 401 시 refresh 1회 재시도)를 거친다.
//  CMS 는 body.user 가 없으면 Authorization: Bearer 를 같은 JWT 로 해석한다(aimmovie_admin routes/api/drm.js getUserId).
//  body 에 토큰을 넣지 않는 이유: refresh 후 재시도하면 헤더는 새 토큰으로 바뀌지만 body 는 처음 만든 문자열 그대로라,
//  body.user 를 우선하는 서버가 만료된 토큰으로 판정해 버린다.
package com.aimmovie.car.data.api

import com.aimmovie.car.data.auth.ApiClient
import com.aimmovie.car.data.net.parseJsonObjectOrNull
import com.aimmovie.car.data.net.stringOrNull
import kotlinx.coroutines.CancellationException
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/** 라이선스 서버 요청 1건에 필요한 토큰/URL/헤더명(CMS 응답 계약 그대로). */
data class DrmLicense(
    val token: String,
    val licenseUrl: String,
    /** 토큰을 실어 보낼 헤더 이름. 하드코딩하지 않고 응답값을 쓴다(문서의 "응답의 header 사용 권장"). */
    val headerName: String,
)

sealed interface DrmLicenseResult {
    data class Granted(val license: DrmLicense) : DrmLicenseResult

    /** 로그인 정보가 없다 — 요청을 보내지 않았다(CMS 도 어차피 거부할 요청이다). */
    data object LoginRequired : DrmLicenseResult

    /** 유료인데 시청권(able)이 없다(need_unlock). 재생 화면은 상세로 돌려보낸다. */
    data object NeedUnlock : DrmLicenseResult

    /** 서버가 result:false 로 거부했다(관리자 전용 테스트 기간·DRM 미적용 등). [serverMessage] 는 그대로 보여 줄 수 있는 문구. */
    data class Denied(val serverMessage: String?) : DrmLicenseResult

    /** 네트워크·HTTP·응답 형식 오류. [reason] 은 로그용이다(화면에는 일반 오류 문구를 쓴다). */
    data class Failed(val reason: String) : DrmLicenseResult
}

class DrmLicenseApi(
    private val apiClient: ApiClient,
    /** 로그인 여부. 미로그인이면 요청 없이 [DrmLicenseResult.LoginRequired]. */
    private val hasSession: () -> Boolean,
) {
    suspend fun fetchLicense(videoId: String, drmType: String = WIDEVINE): DrmLicenseResult {
        if (!hasSession()) return DrmLicenseResult.LoginRequired
        val body = buildJsonObject {
            put("video", videoId)
            put("drmType", drmType)
            // 보안 레벨 정책이 deviceType 으로 갈린다(app = SW 허용, tv = HW 강제). 차량 앱은 'app' 이다.
            put("deviceType", DEVICE_TYPE)
        }.toString()
        val res = try {
            apiClient.authPost(LICENSE_ENDPOINT, body)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            return DrmLicenseResult.Failed("네트워크 오류: ${e.message}")
        }
        // 200 만 성공으로 본다. CMS 는 거부도 200 + result:false 로 준다.
        if (res.status != 200) return DrmLicenseResult.Failed("라이선스 응답 오류 (HTTP ${res.status})")
        val data = parseJsonObjectOrNull(res.body) ?: return DrmLicenseResult.Failed("응답 형식 오류")
        if ((data["result"] as? JsonPrimitive)?.booleanOrNull != true) {
            if ((data["need_unlock"] as? JsonPrimitive)?.booleanOrNull == true) return DrmLicenseResult.NeedUnlock
            return DrmLicenseResult.Denied(data["message"].stringOrNull()?.takeIf { it.isNotEmpty() })
        }
        val token = data["token"].stringOrNull().orEmpty()
        val licenseUrl = data["license_url"].stringOrNull().orEmpty()
        val header = data["header"].stringOrNull().orEmpty()
        if (token.isEmpty() || licenseUrl.isEmpty() || header.isEmpty()) return DrmLicenseResult.Failed("라이선스 응답 형식 오류")
        return DrmLicenseResult.Granted(DrmLicense(token = token, licenseUrl = licenseUrl, headerName = header))
    }

    companion object {
        const val WIDEVINE = "Widevine"
        const val DEVICE_TYPE = "app"
        private const val LICENSE_ENDPOINT = "/api/drm/license"
    }
}
