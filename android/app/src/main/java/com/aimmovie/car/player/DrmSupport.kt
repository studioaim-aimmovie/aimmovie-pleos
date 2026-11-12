// 기기의 Widevine 지원 확인.
//
// Pleos 차량의 Widevine 보안 레벨(L1/L3)은 Pleos 답변을 기다리는 중이다. 레벨에 따라 막지 않고 로그로만 남긴다 —
// CMS 가 deviceType 'app' 에 SW 보안(L3 허용) 정책을 주므로 L3 라도 재생은 될 것으로 본다(aimmovie_admin routes/api/drm.js).
package com.aimmovie.car.player

import android.media.MediaDrm
import android.util.Log
import androidx.media3.common.C

interface DrmSupport {
    fun isWidevineSupported(): Boolean

    /** 보안 레벨(L1/L3)을 로그로 남긴다. 실기 검증 때 `adb logcat -s AimPlayer` 로 확인한다. */
    fun logWidevineSecurityLevel()
}

object WidevineSupport : DrmSupport {
    private const val TAG = "AimPlayer"

    override fun isWidevineSupported(): Boolean = try {
        MediaDrm.isCryptoSchemeSupported(C.WIDEVINE_UUID)
    } catch (e: Exception) {
        Log.w(TAG, "Widevine 지원 여부 조회 실패", e)
        false
    }

    override fun logWidevineSecurityLevel() {
        try {
            MediaDrm(C.WIDEVINE_UUID).use { drm ->
                Log.i(TAG, "Widevine securityLevel=${drm.getPropertyString("securityLevel")}")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Widevine 보안 레벨 조회 실패", e)
        }
    }
}
