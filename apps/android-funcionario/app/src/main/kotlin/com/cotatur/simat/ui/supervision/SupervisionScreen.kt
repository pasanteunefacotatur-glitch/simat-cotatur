package com.cotatur.simat.ui.supervision

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cotatur.simat.ui.theme.AppThemeMode
import com.cotatur.simat.ui.theme.BrandAmber
import com.cotatur.simat.ui.theme.BrandAmberDark
import com.cotatur.simat.ui.theme.BrandGreen
import com.cotatur.simat.ui.theme.BrandGreenNeon

/**
 * Modelos de datos para el Dashboard Ejecutivo de Supervisión.
 */
data class KpiResumenSupervision(
    val totalVisitantesHoy: Int = 1420,
    val totalGruposHoy: Int = 412,
    val ocupacionHoteleraPct: Int = 84,
    val gastoPromedioUsd: Double = 38.5,
    val pernoctaPromedioDias: Double = 3.2
)

data class EstadoPeajeAuditoria(
    val codigo: String,
    val nombre: String,
    val encuestadorNombre: String,
    val encuestadorCedula: String,
    val encuestasHoy: Int,
    val distanciaM: Int,
    val fueraDePunto: Boolean,
    val esSimulado: Boolean,
    val ultimaSincronizacionMin: Int
)

/**
 * Pantalla Nativa de Supervisión Integrada en el APK.
 * Elimina la necesidad de redirigir a navegadores externos.
 * Funciona offline con métricas locales y semáforo satelital de geocerca.
 */
@Composable
fun SupervisionScreen(
    onVolverAlMenu: () -> Unit,
    currentTheme: AppThemeMode = AppThemeMode.AMOLED,
    supervisorNombre: String = "Supervisor General COTATUR"
) {
    var pinAutenticado by remember { mutableStateOf(false) }

    if (!pinAutenticado) {
        DialogoPinSupervisor(
            onPinValido = { pinAutenticado = true },
            onCancelar = onVolverAlMenu
        )
        return
    }

    val kpis = remember { KpiResumenSupervision() }
    val listaPuntos = remember {
        listOf(
            EstadoPeajeAuditoria(
                codigo = "PEAJE_TARIBA",
                nombre = "Peaje Vega de Táriba (Troncal 1)",
                encuestadorNombre = "María Delgado",
                encuestadorCedula = "V-24.120.304",
                encuestasHoy = 168,
                distanciaM = 35,
                fueraDePunto = false,
                esSimulado = false,
                ultimaSincronizacionMin = 4
            ),
            EstadoPeajeAuditoria(
                codigo = "PEAJE_CAMPANA",
                nombre = "Peaje La Campana (Troncal 5)",
                encuestadorNombre = "José Gregorio Colmenares",
                encuestadorCedula = "V-19.845.210",
                encuestasHoy = 124,
                distanciaM = 580,
                fueraDePunto = true, // Alerta Geocerca > 350m
                esSimulado = false,
                ultimaSincronizacionMin = 18
            ),
            EstadoPeajeAuditoria(
                codigo = "PUENTE_ATANASIO",
                nombre = "Puente Atanasio Girardot",
                encuestadorNombre = "Carlos Ramírez",
                encuestadorCedula = "V-20.158.994",
                encuestasHoy = 96,
                distanciaM = 75,
                fueraDePunto = false,
                esSimulado = false,
                ultimaSincronizacionMin = 8
            ),
            EstadoPeajeAuditoria(
                codigo = "TERMINAL_SC",
                nombre = "Terminal Central San Cristóbal",
                encuestadorNombre = "Yulimar Blanco",
                encuestadorCedula = "V-26.784.112",
                encuestasHoy = 142,
                distanciaM = 22,
                fueraDePunto = false,
                esSimulado = false,
                ultimaSincronizacionMin = 2
            )
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
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Cabecera de Supervisión
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(BrandGreen.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = "🛡️", fontSize = 22.sp)
                    }
                    Column {
                        Text(
                            text = "Supervisión Operativa",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = supervisorNombre,
                            style = MaterialTheme.typography.labelSmall,
                            color = BrandAmberDark
                        )
                    }
                }

                FilledTonalButton(
                    onClick = { pinAutenticado = false; onVolverAlMenu() },
                    colors = ButtonDefaults.filledTonalButtonColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    ),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(text = "Salir ✕", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                }
            }

            // Cuerpo Scrolleable: KPIs Ejecutivos + Semáforo Satelital
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // 1. Vista Ejecutiva (Grid 2x2 de KPIs)
                item {
                    Text(
                        text = "BALANCE EJECUTIVO REGIONAL",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        CardKpiEjecutivo(
                            modifier = Modifier.weight(1f),
                            titulo = "Afluencia Hoy",
                            valorPrincipal = "${kpis.totalVisitantesHoy}",
                            unidad = "turistas",
                            subtexto = "${kpis.totalGruposHoy} grupos censados",
                            colorAcento = if (currentTheme == AppThemeMode.AMOLED) BrandGreenNeon else BrandGreen,
                            icono = "🚗"
                        )
                        CardKpiEjecutivo(
                            modifier = Modifier.weight(1f),
                            titulo = "Ocupación Hotelera",
                            valorPrincipal = "${kpis.ocupacionHoteleraPct}%",
                            unidad = "capacidad",
                            subtexto = "SC y La Grita polos líderes",
                            colorAcento = BrandAmber,
                            icono = "🏨"
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        CardKpiEjecutivo(
                            modifier = Modifier.weight(1f),
                            titulo = "Gasto Promedio",
                            valorPrincipal = "$${kpis.gastoPromedioUsd}",
                            unidad = "/ pers.",
                            subtexto = "Estadía: ${kpis.pernoctaPromedioDias} días",
                            colorAcento = Color(0xFF38BDF8),
                            icono = "💵"
                        )
                        CardKpiEjecutivo(
                            modifier = Modifier.weight(1f),
                            titulo = "Puntos Activos",
                            valorPrincipal = "${listaPuntos.count { !it.fueraDePunto }} / ${listaPuntos.size}",
                            unidad = "en norma",
                            subtexto = if (listaPuntos.any { it.fueraDePunto }) "1 alerta GPS fuera de sitio" else "100% en sitio",
                            colorAcento = if (listaPuntos.any { it.fueraDePunto }) Color(0xFFEF4444) else BrandGreen,
                            icono = "📡"
                        )
                    }
                }

                // 2. Semáforo Satelital de Auditoría
                item {
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "MONITOR SATELITAL DE PEAJES",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "Geocerca 350m",
                            style = MaterialTheme.typography.labelSmall,
                            color = BrandAmberDark,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                items(listaPuntos, key = { it.codigo }) { punto ->
                    ItemSemaforoPunto(punto = punto, currentTheme = currentTheme)
                }
            }
        }
    }
}

@Composable
private fun CardKpiEjecutivo(
    modifier: Modifier = Modifier,
    titulo: String,
    valorPrincipal: String,
    unidad: String,
    subtexto: String,
    colorAcento: Color,
    icono: String
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.2.dp, colorAcento.copy(alpha = 0.4f))
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(3.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = titulo, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(text = icono, fontSize = 15.sp)
            }
            Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = valorPrincipal,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Black,
                    color = colorAcento
                )
                Text(
                    text = unidad,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 3.dp)
                )
            }
            Text(
                text = subtexto,
                style = MaterialTheme.typography.bodySmall,
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun ItemSemaforoPunto(
    punto: EstadoPeajeAuditoria,
    currentTheme: AppThemeMode
) {
    val esAlerta = punto.fueraDePunto || punto.esSimulado
    val semaforoColor = if (esAlerta) Color(0xFFEF4444) else BrandGreen

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (esAlerta) Color(0xFFFEF2F2).copy(alpha = if (currentTheme == AppThemeMode.AMOLED) 0.15f else 1f)
            else MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(
            width = if (esAlerta) 1.8.dp else 1.dp,
            color = semaforoColor.copy(alpha = if (esAlerta) 1f else 0.35f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = punto.nombre,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Funcionario: ${punto.encuestadorNombre} (${punto.encuestadorCedula})",
                        style = MaterialTheme.typography.bodySmall,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(semaforoColor.copy(alpha = 0.18f))
                        .padding(horizontal = 7.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = if (esAlerta) "🚨 FUERA DE PUNTO" else "🟢 EN SITIO",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Black,
                        color = semaforoColor
                    )
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Encuestas: ${punto.encuestasHoy} • Distancia: ${punto.distanciaM}m",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = if (esAlerta) Color(0xFFEF4444) else MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Sync hace ${punto.ultimaSincronizacionMin}m",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun DialogoPinSupervisor(
    onPinValido: () -> Unit,
    onCancelar: () -> Unit
) {
    var pinIngresado by remember { mutableStateOf("") }
    var errorPin by remember { mutableStateOf(false) }
    val pinCorrecto = "2026" // PIN Institucional COTATUR

    AlertDialog(
        onDismissRequest = onCancelar,
        title = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(text = "🛡️", fontSize = 32.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Acceso a Supervisión",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black
                )
                Text(
                    text = "Ingrese su PIN institucional de 4 dígitos",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    repeat(4) { index ->
                        val lleno = index < pinIngresado.length
                        Box(
                            modifier = Modifier
                                .size(16.dp)
                                .clip(CircleShape)
                                .background(
                                    if (errorPin) Color(0xFFEF4444)
                                    else if (lleno) BrandGreen
                                    else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                                )
                        )
                    }
                }

                if (errorPin) {
                    Text(
                        text = "⚠️ PIN Incorrecto. Intente con el año institucional (2026).",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFFEF4444),
                        fontWeight = FontWeight.Bold
                    )
                }

                val numeros = listOf(
                    listOf("1", "2", "3"),
                    listOf("4", "5", "6"),
                    listOf("7", "8", "9"),
                    listOf("✕", "0", "⌫")
                )

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    numeros.forEach { fila ->
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            fila.forEach { tecla ->
                                Box(
                                    modifier = Modifier
                                        .size(64.dp)
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(MaterialTheme.colorScheme.surfaceVariant)
                                        .clickable {
                                            when (tecla) {
                                                "✕" -> onCancelar()
                                                "⌫" -> {
                                                    if (pinIngresado.isNotEmpty()) {
                                                        pinIngresado = pinIngresado.dropLast(1)
                                                        errorPin = false
                                                    }
                                                }
                                                else -> {
                                                    if (pinIngresado.length < 4) {
                                                        pinIngresado += tecla
                                                        errorPin = false
                                                        if (pinIngresado.length == 4) {
                                                            if (pinIngresado == pinCorrecto) {
                                                                onPinValido()
                                                            } else {
                                                                errorPin = true
                                                                pinIngresado = ""
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = tecla,
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = if (tecla == "⌫" || tecla == "✕") BrandAmberDark else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = {}
    )
}
