package com.cotatur.simat.data.local

import android.content.Context
import android.content.SharedPreferences
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

data class UserSession(
    val cedula: String,
    val nombreCompleto: String,
    val rol: String,
    val puntoCodigo: String,
    val puntoNombre: String,
    val debeCambiarClave: Boolean = false,
    val email: String? = null,
    val sessionToken: String = ""
) {
    val esSupervisor: Boolean
        get() = rol.equals("SUPERVISOR", ignoreCase = true) || rol.equals("ADMIN", ignoreCase = true)
}

/**
 * Gestor cifrado de sesión institucional en Android.
 * Cifra secretos sensibles en reposo usando AndroidKeyStore (AES/GCM/NoPadding)
 * y deriva credenciales offline con PBKDF2WithHmacSHA256 + salt único.
 */
class SessionManager(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("simat_session_secure_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEYSTORE_ALIAS = "simat_cotatur_session_aes"
        private const val ANDROID_KEYSTORE = "AndroidKeyStore"
        private const val AES_GCM_TRANSFORMATION = "AES/GCM/NoPadding"
        private const val GCM_IV_LENGTH = 12
        private const val GCM_TAG_BITS = 128

        @Volatile
        private var INSTANCE: SessionManager? = null

        fun getInstance(context: Context): SessionManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SessionManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }

    private fun getOrCreateKey(): SecretKey {
        val ks = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        val existing = ks.getKey(KEYSTORE_ALIAS, null) as? SecretKey
        if (existing != null) return existing

        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
        val spec = KeyGenParameterSpec.Builder(
            KEYSTORE_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build()
        generator.init(spec)
        return generator.generateKey()
    }

    private fun cifrar(textoPlano: String): String {
        val cipher = Cipher.getInstance(AES_GCM_TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
        val iv = cipher.iv
        val cipherBytes = cipher.doFinal(textoPlano.toByteArray(Charsets.UTF_8))
        val combined = ByteArray(iv.size + cipherBytes.size)
        System.arraycopy(iv, 0, combined, 0, iv.size)
        System.arraycopy(cipherBytes, 0, combined, iv.size, cipherBytes.size)
        return Base64.encodeToString(combined, Base64.NO_WRAP)
    }

    private fun descifrar(encoded: String?): String? {
        if (encoded.isNullOrBlank()) return null
        return try {
            val combined = Base64.decode(encoded, Base64.NO_WRAP)
            if (combined.size <= GCM_IV_LENGTH) return null
            val iv = combined.copyOfRange(0, GCM_IV_LENGTH)
            val cipherBytes = combined.copyOfRange(GCM_IV_LENGTH, combined.size)
            val cipher = Cipher.getInstance(AES_GCM_TRANSFORMATION)
            cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), GCMParameterSpec(GCM_TAG_BITS, iv))
            String(cipher.doFinal(cipherBytes), Charsets.UTF_8)
        } catch (_: Exception) {
            null
        }
    }

    fun guardarSesion(
        cedula: String,
        nombreCompleto: String,
        rol: String,
        puntoCodigo: String,
        puntoNombre: String,
        claveTextoPlano: String,
        debeCambiarClave: Boolean = false,
        email: String? = null,
        sessionToken: String = ""
    ) {
        // PBKDF2WithHmacSHA256 con salt aleatorio único para validación offline
        val (claveHash, claveSalt) = PasswordCrypto.hashPassword(claveTextoPlano.trim())
        prefs.edit()
            .putBoolean("is_logged_in", true)
            .putString("cedula", cedula.trim())
            .putString("nombre_completo", nombreCompleto.trim())
            .putString("rol", rol.trim().uppercase())
            .putString("punto_codigo", puntoCodigo.trim())
            .putString("punto_nombre", puntoNombre.trim())
            .putString("enc_clave_hash", cifrar(claveHash))
            .putString("enc_clave_salt", cifrar(claveSalt))
            .putString("enc_session_token", cifrar(sessionToken.trim()))
            .putString("email", email?.trim()?.lowercase())
            .putBoolean("debe_cambiar_clave", debeCambiarClave)
            .apply()
    }

    fun guardarSesionGoogle(
        cedula: String,
        nombreCompleto: String,
        rol: String,
        email: String,
        puntoCodigo: String,
        puntoNombre: String,
        sessionToken: String = ""
    ) {
        prefs.edit()
            .putBoolean("is_logged_in", true)
            .putString("cedula", cedula.trim())
            .putString("nombre_completo", nombreCompleto.trim())
            .putString("rol", rol.trim().uppercase())
            .putString("email", email.trim().lowercase())
            .putString("punto_codigo", puntoCodigo.trim())
            .putString("punto_nombre", puntoNombre.trim())
            .putString("enc_session_token", cifrar(sessionToken.trim()))
            .putBoolean("debe_cambiar_clave", false)
            .apply()
    }

    fun obtenerSesion(): UserSession? {
        val isLoggedIn = prefs.getBoolean("is_logged_in", false)
        val cedula = prefs.getString("cedula", null) ?: return null
        if (!isLoggedIn) return null
        val token = descifrar(prefs.getString("enc_session_token", null)).orEmpty()

        return UserSession(
            cedula = cedula,
            nombreCompleto = prefs.getString("nombre_completo", "Funcionario COTATUR") ?: "Funcionario COTATUR",
            rol = prefs.getString("rol", "ENCUESTADOR") ?: "ENCUESTADOR",
            puntoCodigo = prefs.getString("punto_codigo", "PEAJE_TARIBA") ?: "PEAJE_TARIBA",
            puntoNombre = prefs.getString("punto_nombre", "Peaje Vega de Táriba") ?: "Peaje Vega de Táriba",
            debeCambiarClave = prefs.getBoolean("debe_cambiar_clave", false),
            email = prefs.getString("email", null),
            sessionToken = token
        )
    }

    fun validarOffline(cedulaIngresada: String, claveIngresada: String): Boolean {
        val savedCedula = prefs.getString("cedula", null) ?: return false
        val hashGuardado = descifrar(prefs.getString("enc_clave_hash", null)) ?: return false
        val saltGuardado = descifrar(prefs.getString("enc_clave_salt", null)) ?: return false

        val cLimpia = cedulaIngresada.trim().replace("V-", "", ignoreCase = true)
        val sLimpia = savedCedula.trim().replace("V-", "", ignoreCase = true)
        if (!cLimpia.equals(sLimpia, ignoreCase = true)) return false

        return PasswordCrypto.verifyPassword(claveIngresada.trim(), hashGuardado, saltGuardado)
    }

    fun cerrarSesion() {
        prefs.edit().clear().apply()
    }
}
