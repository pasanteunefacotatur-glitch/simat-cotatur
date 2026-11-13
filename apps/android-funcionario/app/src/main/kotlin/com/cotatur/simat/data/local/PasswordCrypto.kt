package com.cotatur.simat.data.local

import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

/**
 * Utilidad criptográfica pura JVM para derivación y verificación de credenciales
 * offline usando PBKDF2-HMAC-SHA256 con salt aleatorio por contraseña.
 */
object PasswordCrypto {
    const val PBKDF2_ALGORITHM = "PBKDF2WithHmacSHA256"
    private const val ITERATIONS = 65_536
    private const val KEY_LENGTH_BITS = 256
    private const val SALT_BYTES = 16

    fun hashPassword(password: String): Pair<String, String> {
        val clean = password.trim()
        require(clean.isNotEmpty()) { "La contraseña no puede estar vacía." }

        val salt = ByteArray(SALT_BYTES)
        SecureRandom().nextBytes(salt)
        val hash = deriveKey(clean, salt)

        val saltB64 = Base64.getEncoder().encodeToString(salt)
        val hashHex = hash.joinToString("") { "%02x".format(it) }
        return Pair(hashHex, saltB64)
    }

    fun verifyPassword(password: String, expectedHashHex: String, saltBase64: String): Boolean {
        val clean = password.trim()
        if (clean.isEmpty() || expectedHashHex.isBlank() || saltBase64.isBlank()) {
            return false
        }

        val salt = try {
            Base64.getDecoder().decode(saltBase64)
        } catch (_: IllegalArgumentException) {
            return false
        }
        if (salt.size < 8) return false

        val expectedBytes = hexToBytes(expectedHashHex) ?: return false
        val actualBytes = deriveKey(clean, salt)
        return MessageDigest.isEqual(actualBytes, expectedBytes)
    }

    private fun deriveKey(password: String, salt: ByteArray): ByteArray {
        val spec = PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_LENGTH_BITS)
        return try {
            SecretKeyFactory.getInstance(PBKDF2_ALGORITHM).generateSecret(spec).encoded
        } finally {
            spec.clearPassword()
        }
    }

    private fun hexToBytes(hex: String): ByteArray? {
        if (hex.length % 2 != 0) return null
        return try {
            ByteArray(hex.length / 2) { idx ->
                hex.substring(idx * 2, idx * 2 + 2).toInt(16).toByte()
            }
        } catch (_: NumberFormatException) {
            null
        }
    }
}
