package com.aimmovie.car.data.net

import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import java.io.IOException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * fetch 한 번에 해당하는 요청/응답.
 *
 * TS 원본은 fetch → res.ok / res.status / res.json() 순서로 쓴다. 그 형태를 그대로 받으려고
 * 본문을 문자열로 다 읽은 응답 객체를 돌려준다(본문이 작아 스트리밍할 이유가 없다).
 * 테스트에서는 이 인터페이스를 가짜로 갈아 끼워 서버 없이 분기를 검증한다.
 */
fun interface HttpTransport {
    /** 응답을 받으면 상태 코드와 관계없이 돌려준다. 연결 자체가 실패하면 IOException. */
    suspend fun execute(request: HttpRequest): HttpResponse
}

data class HttpRequest(
    val url: String,
    val method: String = "GET",
    val headers: Map<String, String> = emptyMap(),
    /** JSON 본문. null 이면 본문 없이 보낸다. */
    val jsonBody: String? = null,
)

data class HttpResponse(val status: Int, val body: String) {
    /** fetch 의 res.ok 와 같다. */
    val isSuccessful: Boolean get() = status in 200..299
}

private val JSON_MEDIA_TYPE = "application/json".toMediaType()

/** OkHttp 구현. 코루틴이 취소되면 진행 중인 호출도 취소한다(화면을 떠나면 요청이 남지 않게). */
class OkHttpTransport(private val client: OkHttpClient) : HttpTransport {
    override suspend fun execute(request: HttpRequest): HttpResponse {
        val builder = Request.Builder().url(request.url)
        request.headers.forEach { (name, value) -> builder.header(name, value) }
        val body = request.jsonBody?.toRequestBody(JSON_MEDIA_TYPE)
        builder.method(request.method, body ?: if (request.method == "POST") ByteArray(0).toRequestBody(JSON_MEDIA_TYPE) else null)
        val call = client.newCall(builder.build())

        return suspendCancellableCoroutine { cont ->
            cont.invokeOnCancellation { call.cancel() }
            call.enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    cont.resumeWithException(e)
                }

                override fun onResponse(call: Call, response: Response) {
                    val result = try {
                        response.use { HttpResponse(it.code, it.body?.string().orEmpty()) }
                    } catch (e: IOException) {
                        cont.resumeWithException(e)
                        return
                    }
                    cont.resume(result)
                }
            })
        }
    }
}
