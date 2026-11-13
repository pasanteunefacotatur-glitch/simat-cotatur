package com.cotatur.simat.ui.auth

import com.cotatur.simat.data.local.SessionManager
import com.cotatur.simat.data.local.UserSession
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

internal object AuthNetworkClient {
    const val SUPABASE_URL = "https://njcwdhakkbiabkinsafs.supabase.co"
    const val SUPABASE_ANON_KEY = "sb_publishable_icIarHUnV_Fvm84XkasTJA_OjsGvtNN"
    const val GOOGLE_WEB_CLIENT_ID =
        "1054364039678-ekqvi4pfqhuue97sjed68oltkt4mo009.apps.googleusercontent.com"

    fun postJson(
        endpointUrl: String,
        payload: JSONObject,
        bearerToken: String? = null
    ): Pair<Int, String> {
        var conn: HttpURLConnection? = null
        return try {
            val url = URL(endpointUrl)
            conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 10_000
                readTimeout = 10_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("apikey", SUPABASE_ANON_KEY)
                setRequestProperty("Authorization", "Bearer ${bearerToken ?: SUPABASE_ANON_KEY}")
            }

            OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(payload.toString())
            }

            val code = conn.responseCode
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            val body = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: "{}"
            Pair(code, body)
        } finally {
            conn?.disconnect()
        }
    }

    fun exchangeGoogleIdTokenForSupabaseJwt(googleIdToken: String): String {
        val payload = JSONObject().apply {
            put("provider", "google")
            put("id_token", googleIdToken)
        }
        val (code, body) = postJson(
            "$SUPABASE_URL/auth/v1/token?grant_type=id_token",
            payload
        )
        val json = runCatching { JSONObject(body) }.getOrNull() ?: JSONObject()
        val accessToken = json.optString("access_token", "")
        if (code !in 200..299 || accessToken.isBlank()) {
            val errMsg = json.optString("error_description")
                .ifBlank { json.optString("msg") }
                .ifBlank { "Google no pudo ser validado por el servidor." }
            throw IllegalStateException(errMsg)
        }
        return accessToken
    }

    fun parsearYGuardarSesion(
        json: JSONObject,
        sessionManager: SessionManager,
        claveTextoPlano: String? = null,
        fallbackEmail: String? = null
    ): UserSession {
        val func = json.getJSONObject("funcionario")
        val token = json.optString("token", "")
        val cedulaFinal = func.getString("cedula")
        val nombreFinal = func.optString("nombre_completo", "Funcionario COTATUR")
        val rolFinal = func.optString("rol", "ENCUESTADOR")
        val emailFinal = func.optString("email", fallbackEmail ?: "").ifBlank { null }
        val puntoCod = func.optString("punto_codigo", "PEAJE_TARIBA")
        val puntoNom = func.optString("punto_nombre", "Peaje Vega de Táriba")
        val debeCambiar = json.optBoolean("debe_cambiar_clave", false)

        if (claveTextoPlano != null) {
            sessionManager.guardarSesion(
                cedula = cedulaFinal,
                nombreCompleto = nombreFinal,
                rol = rolFinal,
                puntoCodigo = puntoCod,
                puntoNombre = puntoNom,
                claveTextoPlano = claveTextoPlano,
                debeCambiarClave = debeCambiar,
                email = emailFinal,
                sessionToken = token
            )
        } else {
            sessionManager.guardarSesionGoogle(
                cedula = cedulaFinal,
                nombreCompleto = nombreFinal,
                rol = rolFinal,
                email = emailFinal.orEmpty(),
                puntoCodigo = puntoCod,
                puntoNombre = puntoNom,
                sessionToken = token
            )
        }

        return sessionManager.obtenerSesion() ?: UserSession(
            cedula = cedulaFinal,
            nombreCompleto = nombreFinal,
            rol = rolFinal,
            puntoCodigo = puntoCod,
            puntoNombre = puntoNom,
            debeCambiarClave = debeCambiar,
            email = emailFinal,
            sessionToken = token
        )
    }
}
