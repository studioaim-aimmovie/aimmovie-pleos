// 웹 브릿지 v2 의 프로토콜 계층(요청 ID 매칭·타임아웃·결과/이벤트 직렬화). 짝: apps/pleos src/native/bridge.ts
//
// `@JavascriptInterface` 는 동기 호출이고 WebView 의 JavaBridge 스레드에서 돈다. refresh 처럼 네트워크를 기다리는 작업을
// 그 안에서 끝까지 붙잡으면 웹의 JS 스레드도 같이 멈춘다. 그래서 요청은 즉시 접수만 하고, 결과는 나중에
// `window.__aimPleosResolve(id, resultJson)` 을 evaluateJavascript 로 불러 돌려준다.
//
// WebView·Activity 에 의존하지 않게 [emit](스크립트 실행)과 [methods](메서드 구현)를 주입받는다 — JVM 단위 테스트로
// ID 매칭·타임아웃·오류 형태를 확인할 수 있다.
package com.aimmovie.car.shell

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/** 메서드가 의도적으로 실패를 돌려줄 때 던진다. [code] 가 결과의 `error` 가 된다. */
class BridgeException(val code: String) : Exception(code)

/** 메서드 구현. 인자는 JSON 객체, 반환값은 결과의 `data`(null 이면 JSON null). */
typealias BridgeMethod = suspend (args: JsonObject) -> JsonElement?

class BridgeDispatcher(
    /** 요청을 처리할 스코프. 셸은 Activity 의 lifecycleScope(메인)를 넘긴다 — 화면이 사라지면 응답할 곳도 없다. */
    private val scope: CoroutineScope,
    /** 웹에 스크립트를 실행시킨다. 셸 구현은 메인 스레드에서 evaluateJavascript 를 부른다. */
    private val emit: (script: String) -> Unit,
    private val methods: Map<String, BridgeMethod>,
    /**
     * 메서드 하나의 최대 처리 시간. 웹의 안전망(40초)보다 짧아야 웹이 "timeout" 사유를 네이티브에게서 받는다.
     * refresh 는 OkHttp 연결 15초 + 읽기 20초까지 걸릴 수 있지만, 그 작업 자체는 앱 스코프에서 끝까지 돌아 회전 결과를
     * 저장하므로(ApiClient 주석) 여기서 응답을 먼저 끊어도 토큰이 어긋나지 않는다.
     */
    private val timeoutMs: Long = DEFAULT_TIMEOUT_MS,
) {
    /** 요청 접수. JavaBridge 스레드에서 불려도 되며 곧바로 돌아온다. 결과는 반드시 한 번 [emit] 된다. */
    fun request(id: String, method: String, argsJson: String?) {
        scope.launch {
            val result = try {
                val impl = methods[method] ?: throw BridgeException(ERR_UNKNOWN_METHOD)
                val args = parseArgs(argsJson)
                val data = withTimeout(timeoutMs) { impl(args) }
                success(data)
            } catch (e: TimeoutCancellationException) {
                failure(ERR_TIMEOUT)
            } catch (e: CancellationException) {
                // 스코프가 끝났다(Activity 파기) — 웹 페이지도 같이 사라지므로 응답하지 않는다.
                if (!isActive) throw e
                // 스코프는 살아 있는데 기다리던 다른 작업이 취소됐다 — 웹이 응답을 잃지 않게 실패로 돌려준다.
                failure(ERR_INTERNAL)
            } catch (e: BridgeException) {
                failure(e.code)
            } catch (e: Exception) {
                failure(ERR_INTERNAL)
            }
            emit(resolveScript(id, result))
        }
    }

    /** 네이티브 → 웹 이벤트. */
    fun emitEvent(name: String, payload: JsonElement?) {
        emit(eventScript(name, payload ?: JsonNull))
    }

    companion object {
        const val DEFAULT_TIMEOUT_MS = 25_000L

        const val ERR_UNKNOWN_METHOD = "unknown_method"
        const val ERR_INVALID_ARGS = "invalid_args"
        const val ERR_TIMEOUT = "timeout"
        const val ERR_INTERNAL = "internal_error"

        private fun parseArgs(argsJson: String?): JsonObject {
            if (argsJson.isNullOrBlank()) return JsonObject(emptyMap())
            return try {
                Json.parseToJsonElement(argsJson) as? JsonObject
            } catch (_: Exception) {
                null
            } ?: throw BridgeException(ERR_INVALID_ARGS)
        }

        fun success(data: JsonElement?): JsonObject = buildJsonObject {
            put("ok", true)
            put("data", data ?: JsonNull)
        }

        fun failure(code: String): JsonObject = buildJsonObject {
            put("ok", false)
            put("error", code)
        }

        /**
         * 인자는 JS 문자열 리터럴로 넣는다(JsonPrimitive 의 JSON 표기 = 따옴표·역슬래시·제어문자가 이스케이프된 문자열).
         * id·결과를 코드로 이어 붙이지 않으므로 웹에서 온 id 가 스크립트를 깨거나 다른 코드를 끼워 넣을 수 없다.
         * 함수가 없으면(페이지 재로드 직후) 조용히 넘어간다.
         */
        fun resolveScript(id: String, result: JsonObject): String =
            "window.__aimPleosResolve&&window.__aimPleosResolve(${JsonPrimitive(id)},${JsonPrimitive(result.toString())})"

        fun eventScript(name: String, payload: JsonElement): String =
            "window.__aimPleosEvent&&window.__aimPleosEvent(${JsonPrimitive(name)},${JsonPrimitive(payload.toString())})"
    }
}
