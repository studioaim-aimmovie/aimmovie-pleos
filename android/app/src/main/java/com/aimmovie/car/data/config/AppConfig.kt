// 원본: packages/core/src/config.ts (apiRoot / cdnUrl)
//
// core 는 앱이 부팅 시 configure() 로 호스트를 주입받는다. 차량 앱은 그 값을 BuildConfig 에서 받는다
// (debug = 로컬 CMS, release = 운영 CMS — app/build.gradle.kts 참고).
//
// authFetch / sendBeacon 주입은 없다. 네이티브는 CMS 를 Bearer 로 직접 부르는
// 한 가지 방식뿐이라 전송자를 갈아 끼울 일이 없다. 그 역할은 data/auth/ApiClient.kt 가 맡는다.
package com.aimmovie.car.data.config

import com.aimmovie.car.BuildConfig

data class AppConfig(
    /** CMS(API) 호스트. 공개 조회·이미지 경로·인증 호출에 쓴다. 끝에 `/`를 붙이지 않는다. */
    val apiRoot: String,
    /** HLS/미디어 CDN 호스트. 끝에 `/`를 붙이지 않는다. */
    val cdnUrl: String,
) {
    companion object {
        fun fromBuildConfig(): AppConfig = AppConfig(
            apiRoot = BuildConfig.API_ROOT.trimEnd('/'),
            cdnUrl = BuildConfig.CDN_URL.trimEnd('/'),
        )
    }
}
