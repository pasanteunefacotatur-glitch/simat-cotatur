package com.cotatur.simat

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.cotatur.simat.ui.ajustes.AjustesPuntoScreen
import com.cotatur.simat.ui.main.MainMenuScreen
import com.cotatur.simat.ui.outbox.OutboxScreen
import com.cotatur.simat.ui.prestador.CensoPrestadoresScreen
import com.cotatur.simat.ui.theme.AppThemeMode
import com.cotatur.simat.ui.turista.EncuestaTuristaScreen

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR
 * ARCHIVO: Navigation.kt
 * DESCRIPCIÓN: Controlador de navegación principal con Navigation 3 de Jetpack.
 *              Gestiona destinos inmutables, punto de control activo y tema.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */
@Composable
fun MainNavigation(
    currentTheme: AppThemeMode = AppThemeMode.AMOLED,
    onToggleTheme: () -> Unit = {}
) {
    val backStack = rememberNavBackStack(MainMenuDest)
    var puntoCodigo by remember { mutableStateOf("PEAJE_TARIBA") }
    var puntoNombre by remember { mutableStateOf("Peaje Vega de Táriba") }
    val funcionarioCedula = "V-31061007" // Sesión institucional del funcionario

    NavDisplay(
        backStack = backStack,
        onBack = { backStack.removeLastOrNull() },
        entryProvider = entryProvider {
            entry<MainMenuDest> {
                MainMenuScreen(
                    onNavigate = { navKey -> backStack.add(navKey) },
                    onToggleTheme = onToggleTheme,
                    puntoNombre = puntoNombre
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
        }
    )
}
