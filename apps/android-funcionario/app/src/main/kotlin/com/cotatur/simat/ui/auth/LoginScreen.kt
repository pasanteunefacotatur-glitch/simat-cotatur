package com.cotatur.simat.ui.auth

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cotatur.simat.R
import com.cotatur.simat.data.local.SessionManager
import com.cotatur.simat.data.local.UserSession
import com.cotatur.simat.ui.theme.AppThemeMode
import com.cotatur.simat.ui.theme.BrandAmber
import com.cotatur.simat.ui.theme.BrandGreen
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: LoginScreen.kt
 * DESCRIPCIÓN: Pantalla oficial de Inicio de Sesión Institucional (APK SIMAT-COTATUR).
 *              - Logo institucional oficial de COTATUR en alta resolución.
 *              - Autenticación por Cédula y Contraseña con contingencia offline.
 *              - Inicio de Sesión con Google exclusivo para funcionarios vinculados.
 *              Cumple estrictamente con la Regla de Oro (< 400 líneas).
 * ==============================================================================
 */

@Composable
fun LoginScreen(
    currentTheme: AppThemeMode,
    onToggleTheme: () -> Unit,
    onLoginExitoso: (UserSession) -> Unit
) {
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current
    val scope = rememberCoroutineScope()
    val sessionManager = remember { SessionManager.getInstance(context) }

    var cedula by remember { mutableStateOf("") }
    var clave by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var cargando by remember { mutableStateOf(false) }
    var mensajeError by remember { mutableStateOf<String?>(null) }
    var avisoOffline by remember { mutableStateOf<String?>(null) }
    var mostrarDialogoRecuperar by remember { mutableStateOf(false) }

    fun ejecutarLoginCedula() {
        val cedulaLimpia = cedula.trim().replace(".", "").replace("-", "")
        if (cedulaLimpia.isEmpty()) {
            mensajeError = "Por favor ingrese su número de cédula."
            return
        }
        if (clave.trim().isEmpty()) {
            mensajeError = "Por favor ingrese su contraseña."
            return
        }

        mensajeError = null
        avisoOffline = null
        cargando = true
        focusManager.clearFocus()

        scope.launch {
            val resultado = withContext(Dispatchers.IO) {
                autenticarFuncionarioCedula(context, sessionManager, cedulaLimpia, clave.trim())
            }

            cargando = false
            when (resultado) {
                is LoginResult.Success -> onLoginExitoso(resultado.session)
                is LoginResult.OfflineSuccess -> {
                    avisoOffline = "Acceso verificado offline con credenciales locales."
                    onLoginExitoso(resultado.session)
                }
                is LoginResult.Error -> mensajeError = resultado.mensaje
            }
        }
    }

    if (mostrarDialogoRecuperar) {
        DialogoRecuperarContrasenaGoogle(
            cedulaInicial = cedula,
            onDismiss = { mostrarDialogoRecuperar = false },
            onRestablecer = { ced, gIdToken, nClave ->
                mostrarDialogoRecuperar = false
                cargando = true
                mensajeError = null
                avisoOffline = null
                scope.launch {
                    val res = withContext(Dispatchers.IO) {
                        recuperarClaveConGoogle(sessionManager, ced, gIdToken, nClave)
                    }
                    cargando = false
                    when (res) {
                        is LoginResult.Success -> {
                            avisoOffline = "Contraseña restablecida con éxito mediante verificación Google."
                            onLoginExitoso(res.session)
                        }
                        is LoginResult.OfflineSuccess -> onLoginExitoso(res.session)
                        is LoginResult.Error -> mensajeError = res.mensaje
                    }
                }
            }
        )
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .safeDrawingPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Fila superior: Selector de Tema (Pill elegante sin cortes ni wrapping)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                Surface(
                    onClick = onToggleTheme,
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = when (currentTheme) {
                                AppThemeMode.AMOLED -> "⚫ AMOLED"
                                AppThemeMode.LIGHT -> "☀️ Claro"
                                AppThemeMode.DARK -> "🌙 Oscuro"
                                AppThemeMode.SYSTEM -> "📱 Auto"
                            },
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Cápsula Institucional de Login
            Card(
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.2.dp, BrandGreen.copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Logo oficial de COTATUR
                    Image(
                        painter = painterResource(id = R.drawable.logo_cotatur),
                        contentDescription = "Logo Oficial COTATUR",
                        modifier = Modifier
                            .height(52.dp)
                            .fillMaxWidth(),
                        contentScale = ContentScale.Fit
                    )

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "SIMAT-COTATUR",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Corporación Tachirense de Turismo",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold,
                            color = BrandAmber
                        )
                        Text(
                            text = "Gobernación del Estado Táchira",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    // Formulario de Inicio de Sesión
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Input Cédula
                        OutlinedTextField(
                            value = cedula,
                            onValueChange = {
                                if (it.length <= 10) cedula = it.filter { char -> char.isDigit() }
                                mensajeError = null
                            },
                            label = { Text("Cédula de Identidad") },
                            placeholder = { Text("Ej: 31061007 (solo números)") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Number,
                                imeAction = ImeAction.Next
                            ),
                            keyboardActions = KeyboardActions(
                                onNext = { focusManager.moveFocus(FocusDirection.Down) }
                            ),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandGreen,
                                focusedLabelColor = BrandGreen
                            )
                        )

                        // Input Contraseña
                        OutlinedTextField(
                            value = clave,
                            onValueChange = {
                                clave = it
                                mensajeError = null
                            },
                            label = { Text("Contraseña") },
                            placeholder = { Text("Ingrese su contraseña") },
                            singleLine = true,
                            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Done
                            ),
                            keyboardActions = KeyboardActions(
                                onDone = { ejecutarLoginCedula() }
                            ),
                            trailingIcon = {
                                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                    Text(text = if (passwordVisible) "👁️" else "🙈", fontSize = 16.sp)
                                }
                            },
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandGreen,
                                focusedLabelColor = BrandGreen
                            )
                        )

                        // Enlace para recuperar contraseña mediante Google
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            TextButton(
                                onClick = { mostrarDialogoRecuperar = true }
                            ) {
                                Text(
                                    text = "¿Olvidó su contraseña? Recupérela con Google",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = BrandGreen
                                )
                            }
                        }

                        // Mensajes de Alerta / Error
                        mensajeError?.let { err ->
                            Text(
                                text = "⚠️ $err",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFEF4444),
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 4.dp)
                            )
                        }

                        avisoOffline?.let { aviso ->
                            Text(
                                text = "📡 $aviso",
                                style = MaterialTheme.typography.bodySmall,
                                color = BrandAmber,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 4.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(2.dp))

                        // Botón Primario: Inicio con Cédula
                        Button(
                            onClick = { ejecutarLoginCedula() },
                            enabled = !cargando,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp),
                            shape = RoundedCornerShape(14.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BrandGreen)
                        ) {
                            if (cargando) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(24.dp),
                                    color = Color.White,
                                    strokeWidth = 2.5.dp
                                )
                            } else {
                                Text(
                                    text = "INICIAR SESIÓN",
                                    fontWeight = FontWeight.Black,
                                    letterSpacing = 1.sp,
                                    color = Color.White
                                )
                            }
                        }

                        // Separador " O "
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 2.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            HorizontalDivider(modifier = Modifier.weight(1f), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.25f))
                            Text(
                                text = " O ",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 8.dp)
                            )
                            HorizontalDivider(modifier = Modifier.weight(1f), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.25f))
                        }

                        // Botón Secundario: Iniciar Sesión con Google (Credential Manager)
                        BotonGoogleLogin(
                            habilitado = !cargando,
                            onClick = {
                                mensajeError = null
                                avisoOffline = null
                                scope.launch {
                                    try {
                                        cargando = true
                                        val idToken = solicitarGoogleIdTokenNativo(context)
                                        ejecutarLoginGoogle(
                                            googleIdToken = idToken,
                                            sessionManager = sessionManager,
                                            scope = scope,
                                            setCargando = { cargando = it },
                                            setError = { mensajeError = it },
                                            setAviso = { avisoOffline = it },
                                            onSuccess = onLoginExitoso
                                        )
                                    } catch (e: Exception) {
                                        cargando = false
                                        mensajeError = "No se completó el inicio con Google: ${e.localizedMessage ?: "Cancelado"}"
                                    }
                                }
                            }
                        )

                        Text(
                            text = "💡 El acceso con Google es exclusivo para funcionarios que verificaron su cuenta en el registro.",
                            style = MaterialTheme.typography.labelSmall,
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Sistema de Medición y Analítica Turística • UNEFA",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.outline
            )
        }
    }
}
