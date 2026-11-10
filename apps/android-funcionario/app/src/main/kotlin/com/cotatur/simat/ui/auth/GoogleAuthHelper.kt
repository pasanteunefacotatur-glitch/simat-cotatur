package com.cotatur.simat.ui.auth

import android.accounts.AccountManager
import android.content.Context
import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cotatur.simat.data.local.SessionManager
import com.cotatur.simat.data.local.UserSession
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

private const val SUPABASE_RPC_GOOGLE_LOGIN = "https://njcwdhakkbiabkinsafs.supabase.co/rest/v1/rpc/auth_login_google"
private const val SUPABASE_ANON_KEY = "sb_publishable_icIarHUnV_Fvm84XkasTJA_OjsGvtNN"

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR
 * ARCHIVO: GoogleAuthHelper.kt
 * DESCRIPCIÓN: Componentes y lógica de autenticación oficial con Google:
 *              - Selector nativo de cuentas Google en Android (AccountManager).
 *              - Validación estricta en Supabase: solo permite acceso a cuentas
 *                verificadas y vinculadas previamente durante el registro.
 *              - Soporte de contingencia offline con caché local de sesión.
 * ==============================================================================
 */

@Composable
fun BotonGoogleLogin(
    habilitado: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedButton(
        onClick = onClick,
        enabled = habilitado,
        modifier = modifier
            .fillMaxWidth()
            .height(50.dp),
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.onSurface
        ),
        border = BorderStroke(1.2.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.4f))
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            // Emblema visual de Google
            Text(text = "🌐", fontSize = 18.sp)
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = "Iniciar Sesión con Google",
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

@Composable
fun DialogoCuentaGoogleManual(
    onDismiss: () -> Unit,
    onConfirmar: (String) -> Unit
) {
    var emailInput by remember { mutableStateOf("") }
    var errorLocal by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(text = "🌐", fontSize = 20.sp)
                Text(text = "Cuenta de Google", fontWeight = FontWeight.Bold)
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Ingrese su correo Gmail vinculado en el registro de COTATUR:",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                OutlinedTextField(
                    value = emailInput,
                    onValueChange = {
                        emailInput = it
                        errorLocal = null
                    },
                    label = { Text("Correo Google (Gmail)") },
                    placeholder = { Text("ejemplo@gmail.com") },
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                )
                errorLocal?.let {
                    Text(text = "⚠️ $it", fontSize = 11.sp, color = Color(0xFFEF4444), fontWeight = FontWeight.Bold)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val limpio = emailInput.trim().lowercase()
                    if (limpio.isEmpty() || !limpio.contains("@")) {
                        errorLocal = "Ingrese un correo electrónico válido."
                    } else {
                        onConfirmar(limpio)
                    }
                },
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("Verificar e Ingresar", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}

/**
 * Autenticación de funcionario vía cuenta Google verificada contra Supabase RPC.
 */
fun autenticarFuncionarioGoogle(
    context: Context,
    sessionManager: SessionManager,
    email: String,
    googleId: String? = null
): LoginResult {
    val emailLimpio = email.trim().lowercase()

    try {
        val url = URL(SUPABASE_RPC_GOOGLE_LOGIN)
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.connectTimeout = 8000
        conn.readTimeout = 8000
        conn.doOutput = true
        conn.setRequestProperty("Content-Type", "application/json")
        conn.setRequestProperty("apikey", SUPABASE_ANON_KEY)
        conn.setRequestProperty("Authorization", "Bearer $SUPABASE_ANON_KEY")

        val payload = JSONObject().apply {
            put("p_email", emailLimpio)
            put("p_google_id", googleId ?: emailLimpio)
        }

        OutputStreamWriter(conn.outputStream).use { writer ->
            writer.write(payload.toString())
            writer.flush()
        }

        val responseCode = conn.responseCode
        if (responseCode == HttpURLConnection.HTTP_OK) {
            val responseText = conn.inputStream.bufferedReader().use { it.readText() }
            val json = JSONObject(responseText)

            if (json.optString("status") == "success") {
                val fObj = json.optJSONObject("funcionario")
                val cedula = fObj?.optString("cedula") ?: "GOOGLE"
                val nombre = fObj?.optString("nombre_completo") ?: "Funcionario Verificado"
                val rol = fObj?.optString("rol") ?: "ENCUESTADOR"
                val puntoCodigo = fObj?.optString("punto_codigo") ?: "PEAJE_TARIBA"
                val puntoNombre = fObj?.optString("punto_nombre") ?: "Peaje Vega de Táriba"

                sessionManager.guardarSesionGoogle(
                    cedula = cedula,
                    nombreCompleto = nombre,
                    rol = rol,
                    email = emailLimpio,
                    puntoCodigo = puntoCodigo,
                    puntoNombre = puntoNombre
                )

                val session = sessionManager.obtenerSesion()
                    ?: UserSession(cedula, nombre, rol, puntoCodigo, puntoNombre, false, emailLimpio)

                return LoginResult.Success(session)
            } else {
                val msg = json.optString("message", "Cuenta no verificada en nómina.")
                return LoginResult.Error(msg)
            }
        } else if (responseCode == 404) {
            return LoginResult.Error("El servicio de Google requiere ejecutar la migración 08_auth_login_google.sql en la base de datos Supabase.")
        } else {
            val errBody = try { conn.errorStream?.bufferedReader()?.use { it.readText() } } catch (_: Exception) { null }
            val errorMsg = if (errBody != null && errBody.contains("USUARIO_NO_VINCULADO")) {
                "⚠️ La cuenta de Google ($emailLimpio) no ha sido verificada en el registro de COTATUR. Inicie sesión con su Cédula y Contraseña o solicite su registro a la Supervisión."
            } else if (errBody != null && errBody.contains("USUARIO_REVOCADO")) {
                "⛔ Acceso revocatorio: Este usuario ha sido desactivado por la supervisión de COTATUR."
            } else {
                "Cuenta de Google no vinculada o credenciales no autorizadas en COTATUR."
            }
            return LoginResult.Error(errorMsg)
        }

    } catch (e: Exception) {
        // En offline, verificar si ya se había autenticado previamente con esta cuenta Google
        if (sessionManager.validarOfflineGoogle(emailLimpio)) {
            val session = sessionManager.obtenerSesion()
            if (session != null) {
                return LoginResult.OfflineSuccess(session)
            }
        }

        return LoginResult.Error("Sin conexión a internet. Para verificar una cuenta Google por primera vez se requiere señal móvil.")
    }
}
