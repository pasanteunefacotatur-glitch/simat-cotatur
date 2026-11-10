package com.cotatur.simat

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.cotatur.simat.data.local.SessionManager
import com.cotatur.simat.ui.ajustes.AjustesPuntoScreen
import com.cotatur.simat.ui.auth.LoginScreen
import com.cotatur.simat.ui.main.MainMenuScreen
import com.cotatur.simat.ui.outbox.OutboxScreen
import com.cotatur.simat.ui.prestador.CensoPrestadoresScreen
import com.cotatur.simat.ui.supervision.SupervisionScreen
import com.cotatur.simat.ui.theme.AppThemeMode
import com.cotatur.simat.ui.turista.EncuestaTuristaScreen

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR
 * ARCHIVO: Navigation.kt
 * DESCRIPCIÓN: Controlador de navegación principal con Navigation 3 de Jetpack.
 *              - Compuerta de Autenticación Institucional (LoginScreen).
 *              - Control de rol estricto (SUPERVISOR vs ENCUESTADOR).
 *              - Gestión de sesión y punto activo.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */
@Composable
fun MainNavigation(
    currentTheme: AppThemeMode = AppThemeMode.AMOLED,
    onToggleTheme: () -> Unit = {}
) {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager.getInstance(context) }
    var activeSession by remember { mutableStateOf(sessionManager.obtenerSesion()) }

    val initialDest = if (activeSession != null) MainMenuDest else LoginDest
    val backStack = rememberNavBackStack(initialDest)

    var puntoCodigo by remember { mutableStateOf(activeSession?.puntoCodigo ?: "PEAJE_TARIBA") }
    var puntoNombre by remember { mutableStateOf(activeSession?.puntoNombre ?: "Peaje Vega de Táriba") }
    val funcionarioCedula = activeSession?.cedula ?: "V-31061007"
    val esSupervisor = activeSession?.esSupervisor ?: false
    val usuarioNombre = activeSession?.nombreCompleto ?: "Funcionario COTATUR"
    val usuarioRol = activeSession?.rol ?: "ENCUESTADOR"

    NavDisplay(
        backStack = backStack,
        onBack = {
            if (backStack.size > 1) {
                backStack.removeLastOrNull()
            }
        },
        entryProvider = entryProvider {
            entry<LoginDest> {
                LoginScreen(
                    currentTheme = currentTheme,
                    onToggleTheme = onToggleTheme,
                    onLoginExitoso = { session ->
                        activeSession = session
                        puntoCodigo = session.puntoCodigo
                        puntoNombre = session.puntoNombre
                        backStack.clear()
                        backStack.add(MainMenuDest)
                    }
                )
            }
            entry<MainMenuDest> {
                MainMenuScreen(
                    onNavigate = { navKey -> backStack.add(navKey) },
                    onToggleTheme = onToggleTheme,
                    puntoNombre = puntoNombre,
                    esSupervisor = esSupervisor,
                    usuarioNombre = usuarioNombre,
                    usuarioRol = usuarioRol,
                    onCerrarSesion = {
                        sessionManager.cerrarSesion()
                        activeSession = null
                        backStack.clear()
                        backStack.add(LoginDest)
                    }
                )
            }
            entry<EncuestaTuristaDest> {
                EncuestaTuristaScreen(
                    puntoCodigo = puntoCodigo,
                    funcionarioCedula = funcionarioCedula,
                    onVolverAlMenu = { backStack.removeLastOrNull() }
                )
            }
            entry<CensoPrestadoresDest> {
                CensoPrestadoresScreen(
                    puntoCodigo = puntoCodigo,
                    funcionarioCedula = funcionarioCedula,
                    onVolverAlMenu = { backStack.removeLastOrNull() }
                )
            }
            entry<OutboxDetalleDest> {
                OutboxScreen(
                    onVolverAlMenu = { backStack.removeLastOrNull() }
                )
            }
            entry<AjustesPuntoDest> {
                AjustesPuntoScreen(
                    puntoActualCodigo = puntoCodigo,
                    onPuntoSeleccionado = { codigo, nombre ->
                        puntoCodigo = codigo
                        puntoNombre = nombre
                    },
                    onVolverAlMenu = { backStack.removeLastOrNull() }
                )
            }
            entry<SupervisionDest> {
                SupervisionScreen(
                    onVolverAlMenu = { backStack.removeLastOrNull() },
                    currentTheme = currentTheme,
                    supervisorNombre = usuarioNombre
                )
            }
        }
    )
}
