package com.cotatur.simat.ui.auth

import android.content.Context
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import com.cotatur.simat.R
import com.cotatur.simat.data.local.SessionManager
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.launch
import org.json.JSONObject

private const val RPC_GOOGLE_LOGIN_JWT =
    "${AuthNetworkClient.SUPABASE_URL}/rest/v1/rpc/auth_login_google_jwt"

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
            .height(52.dp),
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.onSurface
        ),
        border = BorderStroke(1.2.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.45f))
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            Image(
                painter = painterResource(id = R.drawable.ic_google_logo),
                contentDescription = "Logo Oficial Google",
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = "Iniciar sesión con Google",
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

suspend fun solicitarGoogleIdTokenNativo(context: Context): String {
    val credentialManager = CredentialManager.create(context)
    val googleIdOption = GetGoogleIdOption.Builder()
        .setFilterByAuthorizedAccounts(false)
        .setServerClientId(AuthNetworkClient.GOOGLE_WEB_CLIENT_ID)
        .setAutoSelectEnabled(false)
        .build()

    val request = GetCredentialRequest.Builder()
        .addCredentialOption(googleIdOption)
        .build()

    val result = credentialManager.getCredential(context = context, request = request)
    val credential = result.credential
    if (credential is CustomCredential &&
        credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
    ) {
        return GoogleIdTokenCredential.createFrom(credential.data).idToken
    }
    throw IllegalStateException("No se recibió un id_token válido desde Google.")
}

@Composable
fun DialogoRecuperarContrasenaGoogle(
    cedulaInicial: String,
    onDismiss: () -> Unit,
    onRestablecer: (cedula: String, googleIdToken: String, nuevaClave: String) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var cedulaInput by remember { mutableStateOf(cedulaInicial) }
    var idTokenVerificado by remember { mutableStateOf<String?>(null) }
    var nuevaClaveInput by remember { mutableStateOf("") }
    var confirmarClaveInput by remember { mutableStateOf("") }
    var claveVisible by remember { mutableStateOf(false) }
    var verificandoGoogle by remember { mutableStateOf(false) }
    var errorLocal by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(text = "🔑", fontSize = 20.sp)
                Text(text = "Recuperar Contraseña", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "Autentique su cuenta Google vinculada a su cédula mediante el proveedor oficial:",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                OutlinedTextField(
                    value = cedulaInput,
                    onValueChange = { cedulaInput = it.filter { c -> c.isDigit() }; errorLocal = null },
                    label = { Text("Cédula de Identidad") },
                    placeholder = { Text("Ej: 31061007") },
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedButton(
                    enabled = !verificandoGoogle,
                    onClick = {
                        errorLocal = null
                        verificandoGoogle = true
                        scope.launch {
                            try {
                                idTokenVerificado = solicitarGoogleIdTokenNativo(context)
                            } catch (e: Exception) {
                                errorLocal = "No se completó la verificación con Google: ${e.localizedMessage ?: "Cancelado"}"
                            } finally {
                                verificandoGoogle = false
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                        Image(
                            painter = painterResource(id = R.drawable.ic_google_logo),
                            contentDescription = "Google Logo",
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = when {
                                verificandoGoogle -> "Verificando Google..."
                                idTokenVerificado != null -> "✅ Cuenta Google verificada"
                                else -> "Verificar Cuenta Google"
                            },
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                OutlinedTextField(
                    value = nuevaClaveInput,
                    onValueChange = { nuevaClaveInput = it; errorLocal = null },
                    label = { Text("Nueva Contraseña") },
                    placeholder = { Text("Mínimo 8 caracteres") },
                    singleLine = true,
                    visualTransformation = if (claveVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(onClick = { claveVisible = !claveVisible }) {
                            Text(text = if (claveVisible) "👁️" else "🙈", fontSize = 14.sp)
                        }
                    },
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = confirmarClaveInput,
                    onValueChange = { confirmarClaveInput = it; errorLocal = null },
                    label = { Text("Confirmar Contraseña") },
                    singleLine = true,
                    visualTransformation = if (claveVisible) VisualTransformation.None else PasswordVisualTransformation(),
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
                    val cedula = cedulaInput.trim()
                    val token = idTokenVerificado
                    val clave = nuevaClaveInput.trim()
                    val conf = confirmarClaveInput.trim()

                    when {
                        cedula.isBlank() -> errorLocal = "Ingrese su número de cédula."
                        token.isNullOrBlank() -> errorLocal = "Debe autenticar primero su cuenta Google."
                        clave.length < 8 -> errorLocal = "La nueva contraseña debe tener al menos 8 caracteres."
                        clave != conf -> errorLocal = "Las contraseñas no coinciden."
                        else -> onRestablecer(cedula, token, clave)
                    }
                },
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("Restablecer Clave", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}

fun autenticarFuncionarioGoogleIdToken(
    sessionManager: SessionManager,
    googleIdToken: String
): LoginResult {
    return try {
        val supabaseJwt = AuthNetworkClient.exchangeGoogleIdTokenForSupabaseJwt(googleIdToken)
        val payload = JSONObject().apply { put("p_canal", "APK") }
        val (code, body) = AuthNetworkClient.postJson(
            endpointUrl = RPC_GOOGLE_LOGIN_JWT,
            payload = payload,
            bearerToken = supabaseJwt
        )
        val json = JSONObject(body)

        if (code in 200..299 && json.optString("status") == "success") {
            val session = AuthNetworkClient.parsearYGuardarSesion(
                json = json,
                sessionManager = sessionManager
            )
            LoginResult.Success(session)
        } else {
            LoginResult.Error(
                json.optString(
                    "message",
                    "Su cuenta Google no está vinculada a ningún funcionario activo de COTATUR."
                )
            )
        }
    } catch (e: Exception) {
        LoginResult.Error(
            "No se pudo verificar Google (${e.localizedMessage ?: "Sin conexión"}). Para operar sin internet use su Cédula y Contraseña."
        )
    }
}
