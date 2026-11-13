package com.cotatur.simat.data.remote

/**
 * Política estricta de integridad OTA: rechaza manifiestos sin firma SHA-256
 * válida de 64 caracteres hexadecimales o cuya huella calculada no coincida.
 */
object OtaIntegrityPolicy {
    private val HEX_64_REGEX = Regex("^[0-9a-fA-F]{64}$")

    fun validarIntegridad(expectedSha256: String, actualSha256: String): Boolean {
        val esperado = expectedSha256.trim()
        val calculado = actualSha256.trim()
        if (!HEX_64_REGEX.matches(esperado)) return false
        if (!HEX_64_REGEX.matches(calculado)) return false
        return esperado.equals(calculado, ignoreCase = true)
    }
}
