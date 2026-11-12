// 마지막 화면 복원(재실행 시).
//
// Pleos 는 DO(distractionOptimized)를 선언하지 않은 앱을 P단을 벗어나는 순간 시스템이 종료한다.
// 다시 P단에서 앱을 열면 "보던 화면"으로 돌아와야 한다(Pleos 심사 요건: 재실행 시 마지막 상태 복원).
// WebView 의 saveState/restoreState 는 Activity 의 savedInstanceState 에 기대는데, 종료·태스크 정리 뒤에는 남지 않는다.
// 그래서 두 가지를 DataStore 에 따로 적는다.
//  - 웹 화면: HashRouter 의 해시 경로(`/contents/abc`). 셸이 해시가 바뀔 때마다 적고, 실행할 때 그 해시로 연다.
//  - 재생: 플레이어가 떠 있는 동안 5초마다 적는 재생 요청(위치 포함). 정상적으로 닫으면 지운다 — 남아 있으면
//    "재생 중에 종료됐다"는 뜻이라 실행할 때 플레이어를 그 위치에서 다시 연다.
package com.aimmovie.car.shell

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.aimmovie.car.data.net.AppJson
import com.aimmovie.car.ui.play.PlayRequest
import kotlinx.coroutines.flow.first

/** 키 하나에 문자열 한 덩어리를 읽고 쓰는 저장소. 실패는 조용히 삼킨다(복원은 편의 기능이라 실패해도 홈에서 시작하면 된다). */
interface KeyValueStorage {
    suspend fun read(key: String): String?
    suspend fun write(key: String, value: String?)
}

class InMemoryKeyValueStorage : KeyValueStorage {
    private val values = mutableMapOf<String, String>()
    override suspend fun read(key: String): String? = values[key]
    override suspend fun write(key: String, value: String?) {
        if (value == null) values.remove(key) else values[key] = value
    }
}

private val Context.shellDataStore: DataStore<Preferences> by preferencesDataStore(name = "aim_shell")

class DataStoreKeyValueStorage(context: Context) : KeyValueStorage {
    private val dataStore = context.applicationContext.shellDataStore

    override suspend fun read(key: String): String? = try {
        dataStore.data.first()[stringPreferencesKey(key)]
    } catch (_: Exception) {
        null
    }

    override suspend fun write(key: String, value: String?) {
        try {
            dataStore.edit { if (value == null) it.remove(stringPreferencesKey(key)) else it[stringPreferencesKey(key)] = value }
        } catch (_: Exception) {
            // 저장 실패는 무시 — 다음 실행이 홈에서 시작할 뿐이다.
        }
    }
}

class ShellStateStore(
    private val storage: KeyValueStorage,
    /** 현재 시각(ms). 테스트에서 바꿔 끼운다. */
    private val clock: () -> Long = System::currentTimeMillis,
) {
    private var lastRoute: String? = null

    /** 마지막 웹 화면의 해시 경로. 없으면 null(홈). */
    suspend fun loadWebRoute(): String? = storage.read(KEY_WEB_ROUTE)?.takeIf(::isRestorableRoute)

    /** 웹 화면이 바뀔 때마다 부른다. 복원하면 안 되는 화면은 적지 않는다([isRestorableRoute]). */
    suspend fun saveWebRoute(route: String) {
        if (!isRestorableRoute(route) || route == lastRoute) return
        lastRoute = route
        storage.write(KEY_WEB_ROUTE, route)
    }

    /**
     * 재생 중에 종료됐으면 그때의 재생 요청. 정상적으로 닫았거나 [PLAYBACK_RESTORE_WINDOW_MS] 보다 오래됐으면 null.
     *
     * 오래된 기록을 버리는 이유: Pleos 가이드의 재진입 복원은 "수 분 이내면 최대한 그대로"다. 기어 변경으로 종료된 뒤
     * 몇 시간 지나 앱을 열었는데 영상이 저절로 재생되면 어색하고, 그사이 콘텐츠가 지워졌으면 실행할 때마다 플레이어가
     * 떠서 "영상 정보를 불러오지 못했습니다"를 보여 준다(실측). 저장 시각이 없는 옛 기록도 같은 이유로 버린다.
     */
    suspend fun loadPlayback(): PlayRequest? {
        val raw = storage.read(KEY_PLAYBACK) ?: return null
        val savedAt = storage.read(KEY_PLAYBACK_SAVED_AT)?.toLongOrNull()
        if (savedAt == null || clock() - savedAt !in 0..PLAYBACK_RESTORE_WINDOW_MS) return null
        return runCatching { AppJson.decodeFromString(PlayRequest.serializer(), raw) }.getOrNull()
            ?.takeIf { it.contentId.isNotEmpty() }
    }

    suspend fun savePlayback(request: PlayRequest) {
        storage.write(KEY_PLAYBACK, AppJson.encodeToString(PlayRequest.serializer(), request))
        storage.write(KEY_PLAYBACK_SAVED_AT, clock().toString())
    }

    suspend fun clearPlayback() {
        storage.write(KEY_PLAYBACK, null)
        storage.write(KEY_PLAYBACK_SAVED_AT, null)
    }

    companion object {
        private const val KEY_WEB_ROUTE = "web_route"
        private const val KEY_PLAYBACK = "playback"
        private const val KEY_PLAYBACK_SAVED_AT = "playback_saved_at"

        /** 재생 복원을 허용하는 시간. 주기 기록(5초)이 갱신하므로 "마지막으로 보던 시점"부터 센다. */
        const val PLAYBACK_RESTORE_WINDOW_MS = 30 * 60 * 1000L

        /**
         * 다시 열 수 있는 웹 화면인가.
         *  - `/login`: 재실행 때 로그인 여부를 다시 판정하면 된다(페어링 코드는 1회용이라 옛 화면이 의미 없다).
         *  - `/play/..`: 웹의 /play 는 재생을 네이티브로 넘기고 곧바로 이전 화면으로 돌아가는 경유지다. 이 해시로 다시
         *    열면 같은 재생이 한 번 더 시작된다. 재생 복원은 [loadPlayback] 이 따로 맡는다.
         *  - 해시 경로가 아닌 값(외부 URL 등)은 받지 않는다.
         */
        fun isRestorableRoute(route: String): Boolean =
            route.startsWith("/") && route != "/login" && !route.startsWith("/login?") && !route.startsWith("/play/")
    }
}
