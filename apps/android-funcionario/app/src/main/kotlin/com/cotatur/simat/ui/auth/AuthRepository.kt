package com.cotatur.simat.ui.auth

import android.content.Context
import com.cotatur.simat.data.local.SessionManager
import com.cotatur.simat.data.local.UserSession
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject

private const val RPC_LOGIN = "${AuthNetworkClient.SUPABASE_URL}/rest/v1/rpc/auth_login_funcionario"
private const val RPC_RECUPERAR_JWT =
    "${AuthNetworkClient.SUPABASE_URL}/rest/v1/rpc/auth_recuperar_clave_con_google_jwt"

sealed class LoginResult {
    data class Success(val session: UserSession) : LoginResult()
    data class OfflineSuccess(val session: UserSession) : LoginResult()
    data class Error(val mensaje: String) : LoginResult()
}

fun autenticarFuncionarioCedula(
    context: Context,
    sessionManager: SessionManager,
    cedula: String,
    clave: String
): LoginResult {
    try {
        val payload = JSONObject().apply {
            put("p_identificador", cedula)
            put("p_clave", clave)
            put("p_canal", "APK")
        }
        val (responseCode, bodyText) = AuthNetworkClient.postJson(RPC_LOGIN, payload)
        val json = JSONObject(bodyText)

        if (responseCode in 200..299 && json.optString("status") == "success") {
            val session = AuthNetworkClient.parsearYGuardarSesion(
                json = json,
                sessionManager = sessionManager,
                claveTextoPlano = clave
            )
            return LoginResult.Success(session)
        }

        val errMsg = json.optString("message", "Credenciales inválidas o usuario revocado.")
        return LoginResult.Error(errMsg)
    } catch (_: Exception) {
        if (sessionManager.validarOffline(cedula, clave)) {
            val session = sessionManager.obtenerSesion()
            if (session != null) {
                return LoginResult.OfflineSuccess(session)
            }
        }
        return LoginResult.Error(
            "Sin conexión a internet. Verifique su señal o asegúrese de haber iniciado sesión previamente en este equipo."
        )
    }
}

fun ejecutarLoginGoogle(
    googleIdToken: String,
    sessionManager: SessionManager,
    scope: CoroutineScope,
    setCargando: (Boolean) -> Unit,
    setError: (String?) -> Unit,
    setAviso: (String?) -> Unit,
    onSuccess: (UserSession) -> Unit
) {
    setError(null)
    setAviso(null)
    setCargando(true)

    scope.launch {
        val resultado = withContext(Dispatchers.IO) {
            autenticarFuncionarioGoogleIdToken(sessionManager, googleIdToken)
        }

        setCargando(false)
        when (resultado) {
            is LoginResult.Success -> onSuccess(resultado.session)
            is LoginResult.OfflineSuccess -> onSuccess(resultado.session)
            is LoginResult.Error -> setError(resultado.mensaje)
        }
    }
}

fun recuperarClaveConGoogle(
    sessionManager: SessionManager,
    cedula: String,
    googleIdToken: String,
    nuevaClave: String
): LoginResult {
    if (nuevaClave.trim().length < 8) {
        return LoginResult.Error("La nueva contraseña debe tener al menos 8 caracteres.")
    }

    return try {
        val supabaseJwt = AuthNetworkClient.exchangeGoogleIdTokenForSupabaseJwt(googleIdToken)
        val payload = JSONObject().apply {
            put("p_cedula", cedula.trim())
            put("p_nueva_clave", nuevaClave.trim())
            put("p_canal", "APK")
        }
        val (code, body) = AuthNetworkClient.postJson(
            endpointUrl = RPC_RECUPERAR_JWT,
            payload = payload,
            bearerToken = supabaseJwt
        )
        val json = JSONObject(body)

        if (code in 200..299 && json.optString("status") == "success") {
            val session = AuthNetworkClient.parsearYGuardarSesion(
                json = json,
                sessionManager = sessionManager,
                claveTextoPlano = nuevaClave.trim()
            )
            LoginResult.Success(session)
        } else {
            LoginResult.Error(json.optString("message", "No se pudo verificar la identidad con Google."))
        }
    } catch (e: Exception) {
        LoginResult.Error("No se pudo conectar con Google/COTATUR: ${e.localizedMessage ?: "Revise su conexión"}")
    }
}
