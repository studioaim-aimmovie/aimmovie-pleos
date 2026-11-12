// 웹 셸. 화면은 apps/pleos(@aim/pleos) 웹 번들을 WebView 로 띄우고, 재생·토큰만 네이티브가 맡는다(하이브리드).
//
// 로드 방식 — WebViewAssetLoader(https://appassets.androidplatform.net/assets/…):
//  - file:// 는 오리진이 opaque(null)이라 ES 모듈·fetch 가 CORS 로 막히고, allowFileAccess 를 켜야 한다(파일 접근은 끈다).
//    https 가상 오리진이면 일반 웹 페이지와 같은 보안 모델로 돌고, localStorage 도 오리진별로 분리된다.
//  - CMS 는 화이트리스트 밖 오리진에 `Access-Control-Allow-Origin: *` 로 답하고 웹은 `credentials: "omit"` + Bearer 로
//    부르므로 이 오리진에서도 CMS 변경 없이 통한다(README "CORS" — 로컬 CMS preflight 로 확인).
//  - 웹 번들은 file:// 를 염두에 두고 클래식 스크립트·상대 경로로 빌드돼 있어(apps/pleos vite.config.ts) 어느 쪽이든 뜬다.
//
// 브릿지 v2(`window.AimPleos`)는 BridgeDispatcher 가 요청 ID 로 비동기 처리한다(shell/ 주석).
package com.aimmovie.car

import android.annotation.SuppressLint
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.lifecycle.lifecycleScope
import androidx.webkit.WebViewAssetLoader
import com.aimmovie.car.data.auth.AuthState
import com.aimmovie.car.data.auth.StoredUser
import com.aimmovie.car.data.net.AppJson
import com.aimmovie.car.data.net.jsNumber
import com.aimmovie.car.data.net.stringOrNull
import com.aimmovie.car.shell.AuthBridge.Companion.toJson
import com.aimmovie.car.shell.BridgeDispatcher
import com.aimmovie.car.shell.BridgeException
import com.aimmovie.car.shell.BridgeMethod
import com.aimmovie.car.shell.ShellBridge
import com.aimmovie.car.ui.play.PlayExit
import com.aimmovie.car.ui.play.PlayRequest
import com.aimmovie.car.ui.play.PlaybackFinished
import com.aimmovie.car.ui.play.PlayerActivity
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive

class MainActivity : ComponentActivity() {
    private val container: AppContainer get() = (application as AimMovieApplication).container

    private lateinit var webView: WebView
    private lateinit var dispatcher: BridgeDispatcher

    /** 앱 번들을 https 가상 오리진으로 서빙한다. assets/ 는 scripts/build.sh 가 apps/pleos/dist 를 스테이징한 것이다. */
    private val assetLoader by lazy {
        WebViewAssetLoader.Builder()
            .setDomain(APP_HOST)
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
    }

    /** 지금 열려 있는 재생 요청. 플레이어가 겹쳐 열리지 않게 하고(동시 다중 스트림 금지), 결과가 비어도 웹에 알릴 값을 남긴다. */
    private var openPlayback: PlayRequest? = null

    /** 지금 웹 화면의 해시 경로. 루트에서 뒤로가기를 판단하는 데 쓴다. */
    private var currentRoute = "/"

    private val playerLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val opened = openPlayback
        openPlayback = null
        val reported = PlayerActivity.readResult(result.data)
        if (reported == null) {
            // 결과 없이 닫혔어도(시스템이 플레이어를 정리) 복원 기록은 남기지 않는다 — 사용자는 웹 화면으로 돌아와 있다.
            container.appScope.launch { container.shellState.clearPlayback() }
        }
        val finished = reported
            ?: opened?.let { PlaybackFinished(it.contentId, it.videoId, it.startPositionMs.coerceAtLeast(0), PlayExit.Closed.wire) }
            ?: return@registerForActivityResult
        dispatcher.emitEvent("onPlaybackFinished", AppJson.encodeToJsonElement(PlaybackFinished.serializer(), finished))
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 웹 콘텐츠 디버깅(chrome://inspect)은 debug 빌드에서만 연다.
        if (BuildConfig.DEBUG) WebView.setWebContentsDebuggingEnabled(true)

        webView = WebView(this)
        // 페이지가 그려지기 전 흰 화면이 번쩍이지 않게 앱 배경색과 맞춘다(themes.xml 의 windowBackground 와 같은 값).
        webView.setBackgroundColor(getColor(R.color.background))
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            // 앱 번들은 WebViewAssetLoader 로만 읽는다. file:// · content:// 접근을 끄면 웹에서 기기 파일을 읽을 길이 없다.
            allowFileAccess = false
            allowContentAccess = false
            // release: https 페이지에서 http 호출을 막는다. debug: 로컬 CMS(http://localhost:8066)를 부르므로 연다.
            mixedContentMode = if (BuildConfig.DEBUG) WebSettings.MIXED_CONTENT_ALWAYS_ALLOW else WebSettings.MIXED_CONTENT_NEVER_ALLOW
            // 확대/축소 금지(웹 viewport 와 같은 취지 — 두 손가락 제스처로 레이아웃이 깨지면 되돌릴 방법이 없다).
            setSupportZoom(false)
            builtInZoomControls = false
        }
        webView.webViewClient = ShellWebViewClient()
        webView.webChromeClient = ShellChromeClient()

        dispatcher = BridgeDispatcher(
            scope = lifecycleScope,
            emit = { script -> runOnUiThread { if (!isDestroyed) webView.evaluateJavascript(script, null) } },
            methods = container.authBridge.methods() + shellMethods(),
        )
        // 페이지 JS 가 window.AimPleos 를 보려면 loadUrl 보다 먼저 주입해야 한다.
        webView.addJavascriptInterface(
            ShellBridge(dispatcher) { container.authBridge.snapshot().toJson().toString() },
            ShellBridge.NAME,
        )

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() = onSystemBack()
        })

        lifecycleScope.launch {
            // 토큰 복원을 먼저 끝낸다 — 웹의 첫 렌더가 authSnapshot 으로 로그인 여부를 바로 알아야 게스트 게이트가
            // 로그인 안내를 잘못 띄우지 않는다.
            container.tokenStore.restore()
            val state = container.shellState
            webView.loadUrl(startUrl(state.loadWebRoute()))
            // 재생 중에 종료됐다면(기어 변경 등) 플레이어를 그 위치에서 다시 연다. 시스템이 태스크를 되살린 경우
            // (savedInstanceState 있음)는 PlayerActivity 가 스스로 복원되므로 여기서 또 열지 않는다.
            if (savedInstanceState == null) state.loadPlayback()?.let(::openPlayer)
            observeAuth()
        }
    }

    /** 브릿지 메서드 중 셸이 직접 처리하는 것. 토큰 메서드는 AuthBridge 가 맡는다. */
    private fun shellMethods(): Map<String, BridgeMethod> = mapOf(
        "version" to { _ -> JsonPrimitive(ShellBridge.VERSION) },
        "play" to { args ->
            val request = PlayRequest(
                contentId = args["contentId"].stringOrNull().orEmpty(),
                videoId = args["videoId"].stringOrNull().orEmpty(),
                startPositionMs = args["startPositionMs"].jsNumber().let { if (it.isNaN() || it < 0) 0L else it.toLong() },
                lang = args["lang"].stringOrNull().orEmpty(),
            )
            if (request.contentId.isEmpty() || request.videoId.isEmpty()) throw BridgeException(BridgeDispatcher.ERR_INVALID_ARGS)
            if (openPlayback != null) throw BridgeException(ERR_PLAYER_BUSY)
            openPlayer(request)
            JsonNull
        },
    )

    private fun openPlayer(request: PlayRequest) {
        openPlayback = request
        // 첫 주기 기록(5초) 전에 종료돼도 복원되게 여는 순간 적어 둔다.
        container.appScope.launch { container.shellState.savePlayback(request) }
        playerLauncher.launch(PlayerActivity.intent(this, request))
    }

    /** 세션이 바뀌면 웹에 알린다(재생 중 refresh 폐기로 로그아웃되는 경우 등). 처음 값은 웹이 authSnapshot 으로 이미 안다. */
    private suspend fun observeAuth() {
        var last: AuthState? = null
        container.authRepository.state.collect { state ->
            if (state == AuthState.Restoring) return@collect
            val previous = last
            last = state
            if (previous == null || previous == state) return@collect
            val user = (state as? AuthState.LoggedIn)?.user
            dispatcher.emitEvent(
                "onAuthChanged",
                user?.let { AppJson.encodeToJsonElement(StoredUser.serializer(), it) },
            )
        }
    }

    /**
     * 시스템 뒤로가기. 웹 history 가 있으면 뒤로(apps/pleos 의 useBackClose 가 popstate 로 모달을 닫는다).
     * 더 갈 곳이 없으면: 홈이 아니면 홈으로(재실행 복원으로 상세에서 시작한 경우 — 들어온 길이 history 에 없다),
     * 홈이면 앱을 백그라운드로 보낸다(AAOS 표준. 종료 확인을 묻지 않는다 — apps/pleos README).
     */
    private fun onSystemBack() {
        when {
            webView.canGoBack() -> webView.goBack()
            currentRoute != "/" -> webView.evaluateJavascript("location.replace('#/')", null)
            else -> moveTaskToBack(true)
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        // 렌더 프로세스와 JS 타이머를 정리한다. 부모에서 떼고 destroy 해야 누수가 없다.
        (webView.parent as? android.view.ViewGroup)?.removeView(webView)
        webView.destroy()
        super.onDestroy()
    }

    private inner class ShellWebViewClient : WebViewClient() {
        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
            assetLoader.shouldInterceptRequest(request.url)

        /**
         * 앱 번들 오리진 밖으로는 이동하지 않는다. 브릿지(window.AimPleos)가 외부 페이지에 노출되면 토큰을 빼낼 수 있고,
         * 주행 화면에서 임의 웹 페이지를 띄울 이유도 없다. 웹 번들에는 외부 링크가 없다(apps/pleos README — 외부 폼 버튼 제거).
         */
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            if (request.url.host == APP_HOST) return false
            if (BuildConfig.DEBUG) Log.w(TAG, "외부 이동 차단: ${request.url}")
            return true
        }

        /** 해시가 바뀔 때마다(HashRouter 이동·모달 history) 마지막 화면을 적는다. */
        override fun doUpdateVisitedHistory(view: WebView, url: String, isReload: Boolean) {
            val uri = Uri.parse(url)
            if (uri.host != APP_HOST) return
            val route = url.substringAfter('#', "").ifEmpty { "/" }
            currentRoute = route.substringBefore('?')
            lifecycleScope.launch { container.shellState.saveWebRoute(route) }
        }

        /**
         * 렌더 프로세스가 죽으면(메모리 부족 등) WebView 를 더 쓸 수 없다. 앱을 같이 죽이지 않고 Activity 를 다시 만들어
         * 마지막 화면으로 연다(true 를 돌려주지 않으면 앱 프로세스가 종료된다).
         */
        override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
            Log.w(TAG, "WebView 렌더 프로세스 종료(crash=${detail.didCrash()}) — 화면을 다시 만든다")
            recreate()
            return true
        }
    }

    private class ShellChromeClient : WebChromeClient() {
        /** 웹 콘솔은 debug 빌드에서만 logcat 으로 넘긴다(`adb logcat -s AimWeb`). release 에서는 토큰·개인정보가 로그에 남지 않게 한다. */
        override fun onConsoleMessage(message: ConsoleMessage): Boolean {
            if (!BuildConfig.DEBUG) return true
            val text = "${message.message()} (${message.sourceId().substringAfterLast('/')}:${message.lineNumber()})"
            when (message.messageLevel()) {
                ConsoleMessage.MessageLevel.ERROR -> Log.e(WEB_TAG, text)
                ConsoleMessage.MessageLevel.WARNING -> Log.w(WEB_TAG, text)
                else -> Log.d(WEB_TAG, text)
            }
            return true
        }
    }

    companion object {
        private const val TAG = "AimShell"
        private const val WEB_TAG = "AimWeb"

        /** WebViewAssetLoader 기본 도메인. 실제 네트워크로 나가지 않고 셸이 가로채 앱 assets 를 돌려준다. */
        const val APP_HOST = WebViewAssetLoader.DEFAULT_DOMAIN

        /** 플레이어가 이미 열려 있다(겹쳐 열기 금지). */
        const val ERR_PLAYER_BUSY = "player_busy"

        fun startUrl(route: String?): String = "https://$APP_HOST/assets/index.html#${route ?: "/"}"
    }
}
