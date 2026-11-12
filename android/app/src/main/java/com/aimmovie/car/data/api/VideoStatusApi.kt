// 원본: packages/core/src/api/videoStatus.ts
//
// 시청 진행률 보고와 시청 상태(이어보기 위치·권한 able) 조회. 논리 경로(/api/videostatus/*)로 보내면
// ApiClient 가 CMS /authapi/* 로 바꾼다. 네이티브는 플레이어가 쓰는 두 함수만 둔다
// (시청기록·팝콘 잔고·대여는 웹 번들이 @aim/core 로 부른다). play = 재생 위치(초) — 이어보기에 그대로 seek 할 수 있게 %가 아닌 초로 저장한다.
//
// 순수 계산(secondsToPercent·isWatchComplete·mergeResumeStatus)은 네트워크 없이 테스트하려고
// [WatchProgress] 오브젝트로 분리했다. 원본에서는 같은 파일의 export 함수들이다.
package com.aimmovie.car.data.api

import com.aimmovie.car.data.auth.ApiClient
import com.aimmovie.car.data.net.AppJson
import com.aimmovie.car.data.net.isTruthy
import com.aimmovie.car.data.net.parseJsonObjectOrNull
import com.aimmovie.car.data.net.stringOrNull
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.add
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray

/** 영상 1건의 시청 상태. (CMS videostatus/resume 응답의 status 값) */
@Serializable
data class VideoStatus(
    /** 마지막 재생 위치(초) */
    val play: Double = 0.0,
    /** 마지막 시청 진행률(%) 0~100 — 진행바 표시용. (CMS가 내려주면 이 값을 우선 사용) */
    @SerialName("play_percent") val playPercent: Double? = null,
    /** 재생 가능 여부 */
    val able: Boolean? = null,
    /** able 만료 시각(ISO) */
    val ableExpireAt: String? = null,
    /** 마지막 재생 이벤트 시각(ISO). "마지막으로 본 회차" 판정용. */
    val playAt: String? = null,
    /** 이 영상이 속한 콘텐츠 _id. 콘텐츠 단위로 "마지막 본 회차"를 묶을 때 사용. */
    val parent: String? = null,
)

/** { videoId: VideoStatus } 맵 */
typealias VideoStatusMap = Map<String, VideoStatus>

object WatchProgress {
    /**
     * 시청 완료 판정: 영상 끝에서 이 초(秒) 이내면 "다 봄"으로 간주한다.
     * 비율(%)이 아닌 절대 초를 쓰는 이유 — floor 버림·ended 미발화로 생기는 끝자락 오차는 영상 길이와 무관하게
     * 수 초 단위다. 비율 기준(예: 95%)은 긴 영상에서 완료 구간이 수 분이 되어 "덜 봤는데 완료" 오판이 생긴다.
     */
    const val WATCH_COMPLETE_EPSILON_SEC = 3.0

    /** 재생 위치(초) → 0~100 진행률(%). duration이 없으면 0. */
    fun secondsToPercent(seconds: Double, duration: Double): Double {
        if (duration.isNaN() || duration.isInfinite() || duration <= 0) return 0.0
        val pct = (seconds / duration) * 100
        return pct.coerceIn(0.0, 100.0)
    }

    /** 재생 위치(초)가 영상 끝(EPSILON 이내)에 도달했으면 완료로 본다. */
    fun isWatchComplete(seconds: Double, duration: Double): Boolean {
        if (duration.isNaN() || duration.isInfinite() || duration <= 0) return false
        return seconds >= duration - WATCH_COMPLETE_EPSILON_SEC
    }

    /**
     * resume 응답(data.status 맵 + data.list rows)을 병합해 VideoStatusMap으로 만든다.
     * status 맵엔 playAt/parent가 없을 수 있어 list rows에서 보강한다.
     */
    fun mergeResumeStatus(data: JsonObject?): VideoStatusMap {
        if (data == null || !data["result"].isTruthy() || !data["status"].isTruthy()) return emptyMap()
        val statusObj = data["status"] as? JsonObject ?: return emptyMap()
        val status = AppJson.decodeFromJsonElement(MapSerializer(String.serializer(), VideoStatus.serializer()), statusObj)
            .toMutableMap()
        (data["list"] as? JsonArray)?.forEach { row ->
            val r = row as? JsonObject ?: return@forEach
            val video = r["video"].stringOrNull()
            if (video.isNullOrEmpty()) return@forEach
            val current = status[video] ?: return@forEach
            status[video] = current.copy(
                playAt = r["playAt"].stringOrNull() ?: current.playAt,
                parent = r["parent"].stringOrNull() ?: current.parent,
            )
        }
        return status
    }
}

class VideoStatusApi(
    private val apiClient: ApiClient,
    /** 진행률 저장을 화면 수명과 무관하게 끝까지 보내기 위한 앱 스코프(원본의 keepalive fetch 역할). */
    private val appScope: CoroutineScope,
) {
    private suspend fun postJson(path: String, body: String): JsonObject? {
        val res = apiClient.authPost(path, body)
        return if (res.isSuccessful) parseJsonObjectOrNull(res.body) else null
    }

    /**
     * 사용자 + 영상 id 목록으로 시청 상태를 조회한다.
     * 미로그인/실패 시 빈 맵을 돌려준다(호출부에서 별도 분기 불필요).
     */
    suspend fun fetchWatchStatus(videos: List<String>): VideoStatusMap {
        val list = videos.filter { it.isNotEmpty() }
        if (list.isEmpty()) return emptyMap()
        return swallow(emptyMap()) {
            val body = buildJsonObject { putJsonArray("videos") { list.forEach { add(it) } } }
            WatchProgress.mergeResumeStatus(postJson(RESUME_ENDPOINT, body.toString()))
        }
    }

    /**
     * 시청 진행률을 저장한다. play=재생 위치(초), playPercent=진행률(%, 0~100, 진행바용).
     * 원본의 beacon 경로는 옮기지 않았다 — 브라우저 언로드 대책이라 네이티브 앱에는 해당이 없고,
     * 대신 앱 스코프에서 보내 화면을 떠나도 요청이 끝까지 간다(원본 keepalive fetch 와 같은 목적).
     * 저장 실패는 재생 UX를 방해하지 않도록 조용히 무시한다.
     */
    fun sendWatchProgress(video: String, play: Double, playPercent: Double) {
        if (video.isEmpty()) return
        val payload = buildJsonObject {
            put("video", video)
            put("play", play)
            put("play_percent", playPercent)
        }.toString()
        appScope.launch {
            try {
                apiClient.authPost(PLAY_ENDPOINT, payload)
            } catch (e: CancellationException) {
                throw e
            } catch (_: Exception) {
                // 저장 실패 무시
            }
        }
    }

    private inline fun <T> swallow(fallback: T, block: () -> T): T = try {
        block()
    } catch (e: CancellationException) {
        throw e
    } catch (_: Exception) {
        fallback
    }

    private companion object {
        const val PLAY_ENDPOINT = "/api/videostatus/play"
        const val RESUME_ENDPOINT = "/api/videostatus/resume"
    }
}
