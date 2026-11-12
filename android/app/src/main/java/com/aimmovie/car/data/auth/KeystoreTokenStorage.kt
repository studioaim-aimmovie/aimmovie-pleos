// 토큰 JSON 을 Android Keystore 의 AES-256-GCM 키로 암호화해 DataStore(Preferences)에 저장한다.
//
// EncryptedSharedPreferences 를 쓰지 않은 이유:
//  - androidx.security:security-crypto 가 deprecated 됐다(1.1.0-alpha07). 더 이상 고쳐지지 않는 라이브러리에
//    로그인 상태를 묶어 둘 이유가 없다.
//  - 내부의 Tink keyset 이 손상되면 앱 시작 시 예외로 죽는 사례가 잘 알려져 있다. 여기서는 복호화가 실패하면
//    "토큰 없음" 으로 보고 다시 페어링시키면 된다(QR 한 번이면 끝나는 흐름이라 그게 가장 안전한 복구다).
//  - 우리가 저장하는 값은 문자열 한 덩어리라 Keystore 키 하나 + GCM 으로 충분하다.
//
// 키는 기기 밖으로 나가지 않으므로 백업·복원으로 토큰이 다른 기기에 옮겨지지 않는다(매니페스트도 allowBackup=false).
package com.aimmovie.car.data.auth

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import java.security.KeyStore
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

private val Context.authDataStore: DataStore<Preferences> by preferencesDataStore(name = "aim_auth")

class KeystoreTokenStorage(context: Context) : TokenStorage {
    private val dataStore = context.applicationContext.authDataStore

    override suspend fun read(): String? = try {
        dataStore.data.first()[KEY_TOKENS]?.let(::decrypt)
    } catch (_: Exception) {
        // 키가 무효화됐거나(잠금 화면 재설정 등) 암호문이 깨졌다 — 없는 것으로 보고 지운다.
        write(null)
        null
    }

    override suspend fun write(value: String?) {
        try {
            dataStore.edit { prefs ->
                if (value == null) prefs.remove(KEY_TOKENS) else prefs[KEY_TOKENS] = encrypt(value)
            }
        } catch (_: Exception) {
            // 저장 실패는 조용히 무시 — 메모리 캐시로는 세션이 유지된다.
        }
    }

    private fun encrypt(plain: String): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
        val iv = cipher.iv
        val sealed = cipher.doFinal(plain.toByteArray(Charsets.UTF_8))
        // [IV 길이(1바이트)][IV][암호문+태그] — IV 는 키스토어가 매번 새로 만든다.
        val out = ByteArray(1 + iv.size + sealed.size)
        out[0] = iv.size.toByte()
        iv.copyInto(out, 1)
        sealed.copyInto(out, 1 + iv.size)
        return Base64.getEncoder().encodeToString(out)
    }

    private fun decrypt(encoded: String): String {
        val bytes = Base64.getDecoder().decode(encoded)
        val ivSize = bytes[0].toInt()
        val iv = bytes.copyOfRange(1, 1 + ivSize)
        val sealed = bytes.copyOfRange(1 + ivSize, bytes.size)
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), GCMParameterSpec(GCM_TAG_BITS, iv))
        return String(cipher.doFinal(sealed), Charsets.UTF_8)
    }

    private fun getOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        (keyStore.getEntry(KEY_ALIAS, null) as? KeyStore.SecretKeyEntry)?.let { return it.secretKey }

        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
        generator.init(
            KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                // 사용자 인증(잠금 화면)을 요구하지 않는다. 차량은 잠금 화면이 없는 경우가 많고,
                // 앱 실행만으로 로그인 상태가 복원돼야 하기 때문이다.
                .setUserAuthenticationRequired(false)
                .build(),
        )
        return generator.generateKey()
    }

    private companion object {
        const val ANDROID_KEYSTORE = "AndroidKeyStore"
        const val KEY_ALIAS = "aim_auth_tokens"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val GCM_TAG_BITS = 128
        val KEY_TOKENS = stringPreferencesKey("tokens")
    }
}
