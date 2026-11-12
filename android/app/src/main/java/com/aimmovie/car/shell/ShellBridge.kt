// `window.AimPleos` 로 웹에 노출되는 객체. 짝: web/src/native/bridge.ts 의 AimPleosBridge.
//
// 여기서는 받아서 넘기기만 한다. `@JavascriptInterface` 메서드는 WebView 의 JavaBridge 스레드에서 불리고 원시값만
// 주고받을 수 있어, 실제 처리는 BridgeDispatcher(코루틴)가 맡고 결과는 evaluateJavascript 로 돌려준다.
//
// 보안: addJavascriptInterface 는 WebView 에 뜬 모든 문서(iframe 포함)에 이 객체를 노출한다. 셸은 앱 번들 오리진
// (https://appassets.androidplatform.net) 밖으로의 이동을 막고, 웹 번들은 iframe 을 쓰지 않는다(MainActivity 주석).
package com.aimmovie.car.shell

import android.webkit.JavascriptInterface

class ShellBridge(
    private val dispatcher: BridgeDispatcher,
    /** 지금 세션의 JSON(WebSession 또는 "null"). 네트워크 없이 메모리 값만 읽는다. */
    private val snapshotJson: () -> String,
) {
    @JavascriptInterface
    fun version(): Int = VERSION

    @JavascriptInterface
    fun request(id: String?, method: String?, argsJson: String?) {
        // id 가 없으면 결과를 돌려줄 곳이 없다 — 웹 쪽 타임아웃이 처리한다.
        if (id.isNullOrEmpty() || method.isNullOrEmpty()) return
        dispatcher.request(id, method, argsJson)
    }

    @JavascriptInterface
    fun authSnapshot(): String = snapshotJson()

    companion object {
        /** web/src/native/bridge.ts 의 BRIDGE_VERSION 과 같아야 한다. */
        const val VERSION = 2

        /** addJavascriptInterface 이름. 웹의 BRIDGE_NAME 과 같아야 한다. */
        const val NAME = "AimPleos"
    }
}
