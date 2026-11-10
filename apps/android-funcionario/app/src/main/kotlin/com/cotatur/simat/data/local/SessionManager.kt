package com.cotatur.simat.data.local

import android.content.Context
import android.content.SharedPreferences
import java.security.MessageDigest

/**
 * Modelo inmutable de la sesión institucional activa en el APK.
 */
data class UserSession(
    val cedula: String,
    val nombreCompleto: String,
    val rol: String, // "SUPERVISOR" o "ENCUESTADOR"
    val puntoCodigo: String,
    val puntoNombre: String,
    val debeCambiarClave: Boolean = false
) {
    val esSupervisor: Boolean
        get() = rol.equals("SUPERVISOR", ignoreCase = true)
}

/**
 * Gestor de persistencia de sesión de funcionario en el dispositivo.
 * Permite desbloqueo seguro offline en carretera si ya se autenticó previamente.
 */
class SessionManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("simat_session_prefs", Context.MODE_PRIVATE)

    companion object {
        @Volatile
        private var INSTANCE: SessionManager? = null

        fun getInstance(context: Context): SessionManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SessionManager(context.applicationContext).also { INSTANCE = it }
            }
        }

        fun sha256(input: String): String {
            val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray(Charsets.UTF_8))
            return bytes.joinToString("") { "%02x".format(it) }
        }
    }

    fun guardarSesion(
        cedula: String,
        nombreCompleto: String,
        rol: String,
        puntoCodigo: String,
        puntoNombre: String,
        claveTextoPlano: String,
        debeCambiarClave: Boolean = false
    ) {
        val claveHash = sha256(claveTextoPlano.trim())
        prefs.edit()
            .putBoolean("is_logged_in", true)
            .putString("cedula", cedula.trim())
            .putString("nombre_completo", nombreCompleto.trim())
            .putString("rol", rol.trim().uppercase())
            .putString("punto_codigo", puntoCodigo.trim())
            .putString("punto_nombre", puntoNombre.trim())
            .putString("clave_hash", claveHash)
            .putBoolean("debe_cambiar_clave", debeCambiarClave)
            .apply()
    }

    fun obtenerSesion(): UserSession? {
        val isLoggedIn = prefs.getBoolean("is_logged_in", false)
        val cedula = prefs.getString("cedula", null) ?: return null
        if (!isLoggedIn) return null

        return UserSession(
            cedula = cedula,
            nombreCompleto = prefs.getString("nombre_completo", "Funcionario COTATUR") ?: "Funcionario COTATUR",
            rol = prefs.getString("rol", "ENCUESTADOR") ?: "ENCUESTADOR",
            puntoCodigo = prefs.getString("punto_codigo", "PEAJE_TARIBA") ?: "PEAJE_TARIBA",
            puntoNombre = prefs.getString("punto_nombre", "Peaje Vega de Táriba") ?: "Peaje Vega de Táriba",
            debeCambiarClave = prefs.getBoolean("debe_cambiar_clave", false)
        )
    }

    fun validarOffline(cedula: String, claveTextoPlano: String): Boolean {
        val savedCedula = prefs.getString("cedula", null) ?: return false
        val savedHash = prefs.getString("clave_hash", null) ?: return false

        val cleanCedula = cedula.trim().replace(".", "").replace("-", "").uppercase()
        val targetCedula = savedCedula.replace(".", "").replace("-", "").uppercase()

        if (cleanCedula != targetCedula) return false
        return sha256(claveTextoPlano.trim()) == savedHash
    }

    fun cerrarSesion() {
        prefs.edit().clear().apply()
    }

    fun isLoggedIn(): Boolean {
        return prefs.getBoolean("is_logged_in", false)
    }
}
