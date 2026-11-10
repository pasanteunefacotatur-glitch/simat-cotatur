package com.cotatur.simat.ui.main

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation3.runtime.NavKey
import com.cotatur.simat.AjustesPuntoDest
import com.cotatur.simat.CensoPrestadoresDest
import com.cotatur.simat.EncuestaTuristaDest
import com.cotatur.simat.OutboxDetalleDest
import com.cotatur.simat.SupervisionDest
import com.cotatur.simat.ota.OtaProgressState
import com.cotatur.simat.ota.OtaUpdateManager
import com.cotatur.simat.ota.VersionInfo
import com.cotatur.simat.ui.main.components.AlertaGeocercaFueraDeSitio
import com.cotatur.simat.ui.main.components.BannerActualizacionOta
import com.cotatur.simat.ui.main.components.BarraEstadoInferior
import com.cotatur.simat.ui.main.components.HeaderInstitucional
import com.cotatur.simat.ui.theme.AppThemeMode
import com.cotatur.simat.ui.theme.BrandAmber
import com.cotatur.simat.ui.theme.BrandGreen
import com.cotatur.simat.ui.theme.BrandGreenNeon
import com.cotatur.simat.ui.theme.LocalThemeMode

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: MainMenuScreen.kt
 * DESCRIPCIÓN: Pantalla principal de captura en campo para encuestadores de COTATUR.
 *              - Tarjeta 1: Encuesta a Turistas (Modo Ráfaga de Demanda, meta <= 18s).
 *              - Tarjeta 2: Censo de Prestadores de Servicios Turísticos (PST - Oferta).
 *              - Tarjeta 3: Panel de Supervisión Nativo en Compose (Solo Supervisores).
 *              - Cabecera con Trilogía Institucional, Outbox Badge y selector de temas.
 *              - Barra de estado con Geocerca Haversine (350m de tolerancia).
 *              Cumple estrictamente con la Regla de Oro de modularidad (< 300 líneas).
 * ==============================================================================
 */

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainMenuScreen(
    onNavigate: (NavKey) -> Unit,
    onToggleTheme: () -> Unit = {},
    puntoNombre: String = "Peaje Vega de Táriba",
    pendientesCount: Int = 0,
    gpsDistanciaM: Int = 42,
    gpsFueraDePunto: Boolean = false,
    esSupervisor: Boolean = true,
    usuarioNombre: String = "",
    usuarioRol: String = "ENCUESTADOR",
    onCerrarSesion: () -> Unit = {}
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val currentTheme = LocalThemeMode.current
    var actualizacionDisponible by remember { mutableStateOf<VersionInfo?>(null) }
    val estadoOta by OtaUpdateManager.estadoDescarga.collectAsState()

    LaunchedEffect(Unit) {
        val info = OtaUpdateManager.verificarActualizacion(context)
        if (info != null) {
            actualizacionDisponible = info
        }
    }

    Surface(
        modifier = Modifier
            .fillMaxSize()
            .safeDrawingPadding(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp, vertical = 12.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // --- 1. CABECERA INSTITUCIONAL SUPERIOR ---
            HeaderInstitucional(
                puntoNombre = puntoNombre,
                pendientesCount = pendientesCount,
                currentTheme = currentTheme,
                usuarioNombre = usuarioNombre,
                usuarioRol = usuarioRol,
                esSupervisor = esSupervisor,
                onCerrarSesion = onCerrarSesion,
                onOutboxClick = { onNavigate(OutboxDetalleDest) },
                onAjustesClick = { onNavigate(AjustesPuntoDest) },
                onToggleTheme = onToggleTheme
            )

            // --- AVISO DESATENDIDO DE ACTUALIZACIÓN REMOTA (OTA) CON PROGRESO EN VIVO ---
            actualizacionDisponible?.let { updateInfo ->
                BannerActualizacionOta(
                    updateInfo = updateInfo,
                    estadoOta = estadoOta,
                    onInstalarClick = {
                        if (estadoOta is OtaProgressState.ListoParaInstalar) {
                            OtaUpdateManager.instalarApkDescargado(context, updateInfo)
                        } else {
                            OtaUpdateManager.iniciarDescargaEInstalacion(context, scope, updateInfo)
                        }
                    },
                    onAbrirNavegadorClick = {
                        OtaUpdateManager.abrirEnNavegador(context, updateInfo.apkUrl)
                    },
                    onReintentarClick = {
                        OtaUpdateManager.reiniciarEstado()
                        OtaUpdateManager.iniciarDescargaEInstalacion(context, scope, updateInfo)
                    }
                )
            }

            // --- ALERTA VISUAL: GEOCERCA HAVERSINE SALIDA DE SITIO (> 350m) ---
            AnimatedVisibility(visible = gpsFueraDePunto) {
                AlertaGeocercaFueraDeSitio(distanciaM = gpsDistanciaM)
            }

            Spacer(modifier = Modifier.height(4.dp))

            // --- 2. TARJETA 1: ENCUESTA A TURISTAS (MODO RÁFAGA) ---
            TarjetaMenuPrimaria(
                icono = "🚗",
                titulo = "Encuesta a Turistas",
                subtitulo = "Modo Ráfaga vehicular para peajes y terminales. Flujo táctil continuo.",
                etiquetaBadge = "⚡ Meta ≤ 18 seg",
                badgeColor = BrandGreen,
                bordeColor = if (currentTheme == AppThemeMode.AMOLED) BrandGreenNeon else BrandGreen,
                onClick = { onNavigate(EncuestaTuristaDest) }
            )

            // --- 3. TARJETA 2: CENSO DE PRESTADORES DE SERVICIOS (PST) ---
            TarjetaMenuPrimaria(
                icono = "🏨",
                titulo = "Censo de Prestadores (PST)",
                subtitulo = "Inspección de oferta hotelera, posadas, campamentos y gastronomía.",
                etiquetaBadge = "📊 Ocupación y Servicios",
                badgeColor = BrandAmber,
                bordeColor = BrandAmber,
                onClick = { onNavigate(CensoPrestadoresDest) }
            )

            // --- 4. TARJETA 3: PANEL DE SUPERVISIÓN NATIVO (100% INTEGRADO EN EL APK) ---
            if (esSupervisor) {
                TarjetaMenuSupervision(
                    onClick = { onNavigate(SupervisionDest) }
                )
            }

            Spacer(modifier = Modifier.weight(1f, fill = false))

            // --- 5. BARRA DE ESTADO INFORMATIVA INFERIOR ---
            BarraEstadoInferior(
                puntoNombre = puntoNombre,
                gpsDistanciaM = gpsDistanciaM,
                gpsFueraDePunto = gpsFueraDePunto,
                currentTheme = currentTheme
            )
        }
    }
}

/**
 * Tarjeta táctil interactiva primaria para los formularios de campo.
 */
@Composable
fun TarjetaMenuPrimaria(
    icono: String,
    titulo: String,
    subtitulo: String,
    etiquetaBadge: String,
    badgeColor: Color,
    bordeColor: Color,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .clickable { onClick() },
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(1.5.dp, bordeColor.copy(alpha = 0.8f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .background(
                        color = bordeColor.copy(alpha = 0.12f),
                        shape = CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = icono,
                    fontSize = 26.sp
                )
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(3.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = titulo,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                    )
                }

                Text(
                    text = subtitulo,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    lineHeight = 15.sp,
                    maxLines = 2,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(2.dp))

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(badgeColor.copy(alpha = 0.15f))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = etiquetaBadge,
                        style = MaterialTheme.typography.labelSmall,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = badgeColor,
                        maxLines = 1,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                    )
                }
            }

            Text(
                text = "❯",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = bordeColor,
                modifier = Modifier.padding(start = 2.dp)
            )
        }
    }
}

/**
 * Tarjeta táctil de supervisión (exclusiva para supervisores).
 */
@Composable
fun TarjetaMenuSupervision(
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .clickable { onClick() },
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(1.5.dp, Color(0xFF6366F1).copy(alpha = 0.7f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .background(
                        color = Color(0xFF6366F1).copy(alpha = 0.12f),
                        shape = CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "🛡️",
                    fontSize = 26.sp
                )
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(3.dp)
            ) {
                Text(
                    text = "Panel de Supervisión y Métricas",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
                Text(
                    text = "Monitoreo satelital de peajes, KPIs ejecutivos y semáforo de geocerca.",
                    style = MaterialTheme.typography.bodyMedium,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
            }

            Text(
                text = "Ingresar ❯",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF6366F1),
                maxLines = 1,
                overflow = androidx.compose.ui.text.style.TextOverflow.Clip,
                modifier = Modifier.padding(start = 2.dp)
            )
        }
    }
}
