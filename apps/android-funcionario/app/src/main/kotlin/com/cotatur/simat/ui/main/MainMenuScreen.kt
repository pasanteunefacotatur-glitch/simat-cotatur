package com.cotatur.simat.ui.main

import android.content.Intent
import android.net.Uri
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation3.runtime.NavKey
import com.cotatur.simat.AjustesPuntoDest
import com.cotatur.simat.CensoPrestadoresDest
import com.cotatur.simat.EncuestaTuristaDest
import com.cotatur.simat.OutboxDetalleDest
import com.cotatur.simat.SupervisionDest
import com.cotatur.simat.ota.OtaUpdateManager
import com.cotatur.simat.ota.VersionInfo
import com.cotatur.simat.ui.theme.AppThemeMode
import com.cotatur.simat.ui.theme.BrandAmber
import com.cotatur.simat.ui.theme.BrandCarbon
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
 *              - Tarjeta 3: Panel de Supervisión y Métricas (Lanzador Chrome Custom Tabs).
 *              - Cabecera con Trilogía Institucional, Outbox Badge y selector de temas.
 *              - Barra de estado con Geocerca Haversine (350m de tolerancia).
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
    esSupervisor: Boolean = true
) {
    val context = LocalContext.current
    val currentTheme = LocalThemeMode.current
    var actualizacionDisponible by remember { mutableStateOf<VersionInfo?>(null) }

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
                onOutboxClick = { onNavigate(OutboxDetalleDest) },
                onAjustesClick = { onNavigate(AjustesPuntoDest) },
                onToggleTheme = onToggleTheme
            )

            // --- AVISO DESATENDIDO DE ACTUALIZACIÓN REMOTA (OTA) ---
            actualizacionDisponible?.let { updateInfo ->
                BannerActualizacionOta(
                    updateInfo = updateInfo,
                    onInstalarClick = { OtaUpdateManager.descargarEInstalar(context, updateInfo) }
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
 * Cabecera institucional con logos, selector de punto, Outbox y selector de tema.
 */
@Composable
private fun HeaderInstitucional(
    puntoNombre: String,
    pendientesCount: Int,
    currentTheme: AppThemeMode,
    onOutboxClick: () -> Unit,
    onAjustesClick: () -> Unit,
    onToggleTheme: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Identidad Institucional
                Column {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "🏔️",
                            fontSize = 18.sp
                        )
                        Text(
                            text = "SIMAT • COTATUR",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    Text(
                        text = "Gobernación del Estado Táchira",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Controles de cabecera: Outbox Badge + Selector de Tema
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Outbox Badge (Bandeja de Salida Offline)
                    OutboxBadgeButton(
                        pendientesCount = pendientesCount,
                        onClick = onOutboxClick
                    )

                    // Botón de alternancia de tema (AMOLED / Claro / Oscuro)
                    IconButton(
                        onClick = onToggleTheme,
                        modifier = Modifier
                            .size(38.dp)
                            .background(
                                color = MaterialTheme.colorScheme.surfaceVariant,
                                shape = CircleShape
                            )
                    ) {
                        Text(
                            text = when (currentTheme) {
                                AppThemeMode.AMOLED -> "⚫"
                                AppThemeMode.LIGHT -> "☀️"
                                AppThemeMode.DARK -> "🌙"
                                AppThemeMode.SYSTEM -> "⚙️"
                            },
                            fontSize = 14.sp
                        )
                    }
                }
            }

            // Punto de Control Asignado (Clickable para cambiar de punto)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f))
                    .clickable { onAjustesClick() }
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(text = "📍", fontSize = 14.sp)
                    Column {
                        Text(
                            text = "PUNTO DE CONTROL ACTIVO",
                            style = MaterialTheme.typography.labelSmall,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = puntoNombre,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
                Text(
                    text = "Cambiar ▾",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

/**
 * Badge visual de la cola local de salida (Outbox).
 */
@Composable
private fun OutboxBadgeButton(
    pendientesCount: Int,
    onClick: () -> Unit
) {
    val esVacio = pendientesCount == 0
    val badgeBg = if (esVacio) Color(0xFF198754).copy(alpha = 0.15f) else Color(0xFFFFC107).copy(alpha = 0.2f)
    val badgeText = if (esVacio) Color(0xFF198754) else Color(0xFFD97706)

    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(badgeBg)
            .clickable { onClick() }
            .padding(horizontal = 10.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(5.dp)
    ) {
        Text(
            text = if (esVacio) "✅" else "📦",
            fontSize = 12.sp
        )
        Text(
            text = if (esVacio) "Al día" else "$pendientesCount por subir",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.ExtraBold,
            color = badgeText
        )
    }
}

/**
 * Tarjeta de acción de alto impacto táctil (mínimo 100dp de altura, tap-target generoso).
 */
@Composable
private fun TarjetaMenuPrimaria(
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
            .clip(RoundedCornerShape(22.dp))
            .clickable { onClick() },
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(2.dp, bordeColor)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Icono en cápsula circular grande
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .background(bordeColor.copy(alpha = 0.15f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(text = icono, fontSize = 28.sp)
            }

            // Textos informativos
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = titulo,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }

                Text(
                    text = subtitulo,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    lineHeight = 17.sp
                )

                Spacer(modifier = Modifier.height(4.dp))

                Box(
                    modifier = Modifier
                        .background(badgeColor.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = etiquetaBadge,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = badgeColor
                    )
                }
            }

            // Flecha indicadora
            Text(
                text = "➔",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = bordeColor
            )
        }
    }
}

/**
 * Tarjeta ejecutiva exclusiva para supervisores: acceso nativo dentro del APK.
 */
@Composable
private fun TarjetaMenuSupervision(onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .clickable { onClick() },
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f)
        ),
        border = BorderStroke(1.dp, Color(0xFF6366F1).copy(alpha = 0.5f))
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
                    .size(44.dp)
                    .background(Color(0xFF6366F1).copy(alpha = 0.15f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "🛡️", fontSize = 22.sp)
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Panel de Supervisión y Métricas",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Monitoreo satelital de peajes, KPIs ejecutivos y semáforo de geocerca.",
                    style = MaterialTheme.typography.bodyMedium,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Text(
                text = "Ingresar ❯",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF6366F1)
            )
        }
    }
}

/**
 * Alerta visual en caso de que el encuestador se retire más de 350m del punto asignado.
 */
@Composable
private fun AlertaGeocercaFueraDeSitio(distanciaM: Int) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)),
        border = BorderStroke(1.5.dp, Color(0xFFEF4444))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(text = "⚠️", fontSize = 20.sp)
            Column {
                Text(
                    text = "Desplazamiento Fuera de Sitio Detectado",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFFB91C1C)
                )
                Text(
                    text = "Distancia al punto asignado: ${distanciaM}m (Límite: 350m). Las encuestas registrarán bandera de auditoría.",
                    style = MaterialTheme.typography.bodyMedium,
                    fontSize = 11.sp,
                    color = Color(0xFF991B1B)
                )
            }
        }
    }
}

/**
 * Barra inferior con telemetría de satélite y versión.
 */
@Composable
private fun BarraEstadoInferior(
    puntoNombre: String,
    gpsDistanciaM: Int,
    gpsFueraDePunto: Boolean,
    currentTheme: AppThemeMode
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(
                        color = if (gpsFueraDePunto) Color(0xFFEF4444) else Color(0xFF10B981),
                        shape = CircleShape
                    )
            )
            Text(
                text = if (gpsFueraDePunto) "Fuera de geocerca (${gpsDistanciaM}m)" else "GPS Anclado ($puntoNombre • ${gpsDistanciaM}m)",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Text(
            text = "SIMAT v0.7.0-beta • Corporación Tachirense de Turismo • UNEFA",
            style = MaterialTheme.typography.labelSmall,
            fontSize = 10.sp,
            color = MaterialTheme.colorScheme.outline
        )
    }
}

/**
 * Banner de notificación de actualización remota (OTA).
 */
@Composable
private fun BannerActualizacionOta(
    updateInfo: VersionInfo,
    onInstalarClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = BrandAmber.copy(alpha = 0.15f)),
        border = BorderStroke(1.dp, BrandAmber)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(BrandAmber, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "🚀", fontSize = 18.sp)
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Actualización v${updateInfo.versionName} disponible",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    color = BrandAmber
                )
                Text(
                    text = updateInfo.changelog,
                    style = MaterialTheme.typography.bodyMedium,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
            }

            Button(
                onClick = onInstalarClick,
                colors = ButtonDefaults.buttonColors(containerColor = BrandAmber),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("Actualizar", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 11.sp)
            }
        }
    }
}
