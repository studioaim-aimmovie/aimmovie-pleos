package com.aimmovie.car.shell

import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * 브릿지 v2 프로토콜(apps/pleos src/native/bridge.ts 와 짝) — 요청 ID 매칭, 타임아웃, 오류 형태, 스크립트 이스케이프.
 * emit 으로 나간 스크립트를 웹 쪽 resolver 와 같은 방식으로 해석해 확인한다.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class BridgeDispatcherTest {
    private val emitted = mutableListOf<String>()

    /** `window.__aimPleosResolve("id","{json}")` → (id, 결과 객체). 웹 resolver 가 받는 두 인자를 그대로 꺼낸다. */
    private fun parseResolve(script: String): Pair<String, JsonObject> {
        val prefix = "window.__aimPleosResolve&&window.__aimPleosResolve("
        assertTrue(script, script.startsWith(prefix) && script.endsWith(")"))
        // 인자 두 개를 JSON 배열로 감싸면 JS 문자열 리터럴 두 개를 그대로 읽을 수 있다.
        val args = Json.parseToJsonElement("[" + script.removePrefix(prefix).removeSuffix(")") + "]") as JsonArray
        val id = args[0].jsonPrimitive.content
        val result = Json.parseToJsonElement(args[1].jsonPrimitive.content) as JsonObject
        return id to result
    }

    private fun TestScope.dispatcher(methods: Map<String, BridgeMethod>, timeoutMs: Long = 1_000) =
        BridgeDispatcher(scope = this, emit = { emitted += it }, methods = methods, timeoutMs = timeoutMs)

    @Test
    fun resultsMatchRequestIdsEvenWhenFinishedOutOfOrder() = runTest(StandardTestDispatcher()) {
        val slow = CompletableDeferred<Unit>()
        val d = dispatcher(
            mapOf(
                "slow" to { _ ->
                    slow.await()
                    JsonPrimitive("slow-done")
                },
                "echo" to { args -> args["v"] },
            ),
        )
        d.request("a-1", "slow", "{}")
        d.request("a-2", "echo", """{"v":42}""")
        runCurrent()
        // 늦게 접수된 a-2 가 먼저 끝난다 — 응답은 각자의 id 로 돌아가야 한다.
        assertEquals(1, emitted.size)
        val (id2, r2) = parseResolve(emitted[0])
        assertEquals("a-2", id2)
        assertEquals("""{"ok":true,"data":42}""", r2.toString())

        slow.complete(Unit)
        runCurrent()
        val (id1, r1) = parseResolve(emitted[1])
        assertEquals("a-1", id1)
        assertEquals("""{"ok":true,"data":"slow-done"}""", r1.toString())
    }

    @Test
    fun hangingMethodTimesOutWithTimeoutError() = runTest(StandardTestDispatcher()) {
        val d = dispatcher(mapOf("hang" to { _ -> awaitCancellation() }), timeoutMs = 25_000)
        d.request("t-1", "hang", null)
        advanceTimeBy(24_999)
        runCurrent()
        assertTrue("타임아웃 전에는 응답하지 않는다", emitted.isEmpty())
        advanceTimeBy(2)
        runCurrent()
        val (id, r) = parseResolve(emitted.single())
        assertEquals("t-1", id)
        assertEquals("""{"ok":false,"error":"timeout"}""", r.toString())
    }

    @Test
    fun unknownMethodBadArgsAndExceptionsBecomeErrorCodes() = runTest(StandardTestDispatcher()) {
        val d = dispatcher(
            mapOf(
                "fail" to { _ -> throw BridgeException("player_busy") },
                "boom" to { _ -> error("내부 오류") },
                "null" to { _ -> null },
            ),
        )
        d.request("1", "nope", "{}")
        d.request("2", "fail", "not json")
        d.request("3", "fail", "[1,2]")
        d.request("4", "fail", "{}")
        d.request("5", "boom", "{}")
        d.request("6", "null", "")
        runCurrent()
        val results = emitted.map(::parseResolve).associate { (id, r) -> id to r.toString() }
        assertEquals("""{"ok":false,"error":"unknown_method"}""", results["1"])
        assertEquals("""{"ok":false,"error":"invalid_args"}""", results["2"])
        assertEquals("""{"ok":false,"error":"invalid_args"}""", results["3"]) // 객체가 아닌 JSON 도 거절
        assertEquals("""{"ok":false,"error":"player_busy"}""", results["4"])
        assertEquals("""{"ok":false,"error":"internal_error"}""", results["5"])
        assertEquals("""{"ok":true,"data":null}""", results["6"]) // 빈 인자는 {} 로 본다
    }

    @Test
    fun idAndPayloadAreEscapedAsStringLiterals() = runTest(StandardTestDispatcher()) {
        val d = dispatcher(mapOf("echo" to { args -> args["s"] }))
        // 웹이 이상한 id 를 보내도 스크립트 밖으로 새지 않아야 한다.
        val evilId = """x");alert(1);("""
        d.request(evilId, "echo", """{"s":"따옴표\" 역슬래시\\ 줄바꿈\n"}""")
        runCurrent()
        val (id, r) = parseResolve(emitted.single())
        assertEquals(evilId, id)
        assertEquals("따옴표\" 역슬래시\\ 줄바꿈\n", r["data"]!!.jsonPrimitive.content)

        d.emitEvent("onAuthChanged", null)
        assertEquals(
            """window.__aimPleosEvent&&window.__aimPleosEvent("onAuthChanged","null")""",
            emitted.last(),
        )
    }

    @Test
    fun cancelledScopeDoesNotRespond() = runTest(StandardTestDispatcher()) {
        val child = TestScope(testScheduler)
        val d = BridgeDispatcher(scope = child, emit = { emitted += it }, methods = mapOf("slow" to { _ -> delay(10_000); null }))
        d.request("c-1", "slow", "{}")
        child.runCurrent()
        child.cancel()
        advanceTimeBy(20_000)
        runCurrent()
        assertTrue("Activity 가 사라지면 응답할 웹 페이지도 없다", emitted.isEmpty())
    }
}
