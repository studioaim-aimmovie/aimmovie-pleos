package com.aimmovie.car.data.auth

import com.aimmovie.car.data.config.AppConfig
import com.aimmovie.car.data.net.HttpResponse
import com.aimmovie.car.data.net.HttpTransport
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** web/src/auth/{AuthContext.tsx,tokenStore.ts,guestPolicy.ts} */
@OptIn(ExperimentalCoroutinesApi::class)
class AuthStateTest {
    private val user = StoredUser(id = "u1", name = "n")
    private val config = AppConfig("https://cms.test", "")

    private class SuspendedStorage(var value: String?) : TokenStorage {
        var reads = 0
        override suspend fun read(): String? {
            reads++
            return value
        }

        override suspend fun write(value: String?) {
            this.value = value
        }
    }

    @Test
    fun authState_followsRestoreLoginAndLogout() = runTest {
        val scope = backgroundScope
        val storage = SuspendedStorage(null)
        val store = TokenStore(storage)
        val transport = HttpTransport { HttpResponse(200, """{"result":true}""") }
        val client = ApiClient(config, transport, store, scope)
        val repo = AuthRepository(store, client, CoroutineScope(backgroundScope.coroutineContext + UnconfinedTestDispatcher(testScheduler)))

        // 복원이 끝나면 미로그인
        store.restore()
        assertEquals(AuthState.LoggedOut, repo.state.value)
        assertFalse(repo.isLoggedIn)

        // 페어링이 토큰을 저장하는 순간 로그인 상태가 된다
        store.setTokens(AuthTokens("a", "r", Long.MAX_VALUE, user))
        assertEquals(AuthState.LoggedIn(user), repo.state.value)
        assertEquals(user, repo.user)

        repo.logout()
        assertEquals(AuthState.LoggedOut, repo.state.value)
        assertNull(storage.value)
    }

    @Test
    fun tokenStore_restoresOnceAndDropsBrokenValues() = runTest {
        val valid = SuspendedStorage(
            """{"accessToken":"a","refreshToken":"r","accessExpiresAt":10,"user":{"id":"u1","name":"n","country_code":"KR"}}""",
        )
        val store = TokenStore(valid)
        assertEquals("a", store.getTokens()?.accessToken)
        assertEquals("KR", store.getTokens()?.user?.countryCode)
        assertEquals(1, valid.reads)

        assertNull(TokenStore(SuspendedStorage("{not json")).getTokens())
        assertNull(TokenStore(SuspendedStorage("""{"accessToken":"","refreshToken":"r","accessExpiresAt":1,"user":{}}""")).getTokens())
    }

    @Test
    fun tokenStore_expiringWindowIsThirtySeconds() = runTest {
        var now = 1_000_000L
        val store = TokenStore(InMemoryTokenStorage(), clock = { now })
        val t = AuthTokens("a", "r", accessExpiresAt = now + 30_001, user = user)
        assertFalse(store.isAccessExpiring(t))
        now += 1
        assertTrue(store.isAccessExpiring(t))

        store.setTokens(t)
        store.updateAccess("a2", "r2", expiresInSec = 60)
        assertEquals(AuthTokens("a2", "r2", now + 60_000, user), store.getTokens())
    }
}
