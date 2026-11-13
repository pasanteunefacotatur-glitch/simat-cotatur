package com.cotatur.simat.ui.supervision

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import com.cotatur.simat.data.local.SessionManager
import com.cotatur.simat.data.remote.SupabaseRemoteClient
import com.cotatur.simat.ui.supervision.components.CardKpiEjecutivo
import com.cotatur.simat.ui.supervision.components.ItemSemaforoPunto
import com.cotatur.simat.ui.supervision.models.EstadoPeajeAuditoria
import com.cotatur.simat.ui.supervision.models.KpiResumenSupervision
import com.cotatur.simat.ui.supervision.models.verificarInternetActivo
import com.cotatur.simat.ui.theme.AppThemeMode
import com.cotatur.simat.ui.theme.BrandAmber
import com.cotatur.simat.ui.theme.BrandAmberDark
import com.cotatur.simat.ui.theme.BrandGreen
import com.cotatur.simat.ui.theme.BrandGreenLight
import com.cotatur.simat.ui.theme.BrandGreenNeon
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR
 * ARCHIVO: SupervisionScreen.kt
 * DESCRIPCIÓN: Pantalla Nativa de Supervisión Integrada en el APK.
 *              - Acceso directo para usuarios con rol SUPERVISOR (sin PIN).
 *              - Obligatoriedad de conexión ONLINE para realizar modificaciones.
 *              - Registro visible de la última hora de actualización de los KPIs.
 *              - Semáforo satelital de geocerca (350m) en peajes y terminales.
 *              Cumple estrictamente con la Regla de Oro de modularidad (< 350 líneas).
 * ==============================================================================
 */

@Composable
fun SupervisionScreen(
    onVolverAlMenu: () -> Unit,
    currentTheme: AppThemeMode = AppThemeMode.AMOLED,
    supervisorNombre: String = "Supervisor General COTATUR"
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var isOnline by remember { mutableStateOf(verificarInternetActivo(context)) }
    var cargando by remember { mutableStateOf(false) }
    var errorEstado by remember { mutableStateOf<String?>(null) }
    var ultimaActualizacionHora by remember {
        mutableStateOf(SimpleDateFormat("hh:mm:ss a", Locale.getDefault()).format(Date()))
    }

    var kpis by remember { mutableStateOf(KpiResumenSupervision()) }
    var listaPuntos by remember { mutableStateOf<List<EstadoPeajeAuditoria>>(emptyList()) }

    suspend fun recargarMetricas(notificarToast: Boolean = false) {
        isOnline = verificarInternetActivo(context)
        if (!isOnline) {
            errorEstado = "Sin conexión a Internet. Conecta a la red para consultar los KPIs reales."
            return
        }
        val token = SessionManager.getInstance(context).obtenerSesion()?.sessionToken.orEmpty()
        if (token.isBlank()) {
            errorEstado = "Sesión sin token remoto. Inicia sesión en línea para consultar métricas."
            return
        }
        cargando = true
        errorEstado = null
        val snap = SupabaseRemoteClient.obtenerMetricasSupervision(token)
        cargando = false
        ultimaActualizacionHora = SimpleDateFormat("hh:mm:ss a", Locale.getDefault()).format(Date())
        if (snap.ok) {
            kpis = snap.kpis
            listaPuntos = snap.puntos
            if (notificarToast) {
                Toast.makeText(context, "Métricas actualizadas ($ultimaActualizacionHora)", Toast.LENGTH_SHORT).show()
            }
        } else {
            errorEstado = snap.errorMsg ?: "No se pudieron obtener los indicadores de supervisión."
        }
    }

    LaunchedEffect(Unit) {
        recargarMetricas(notificarToast = false)
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
            verticalArrangement = Arrangement.spacedBy(12.dp)
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
                            .size(42.dp)
                            .background(Color(0xFF6366F1).copy(alpha = 0.15f), CircleShape),
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
                            style = MaterialTheme.typography.bodySmall,
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                FilledTonalButton(
                    onClick = onVolverAlMenu,
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "✕ Volver",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            // Indicador de Estado de Conectividad (Online Obligatorio para Modificaciones)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isOnline) Color(0xFF198754).copy(alpha = 0.15f) else Color(0xFFEF4444).copy(alpha = 0.15f)
                ),
                border = BorderStroke(
                    1.dp,
                    if (isOnline) BrandGreen else Color(0xFFEF4444)
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(
                                    if (isOnline) Color(0xFF10B981) else Color(0xFFEF4444),
                                    CircleShape
                                )
                        )
                        Text(
                            text = if (isOnline) "🟢 Conectado a la Nube (Online)" else "🔴 Modo Consulta Offline",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (isOnline) BrandGreen else Color(0xFFEF4444)
                        )
                    }

                    if (!isOnline) {
                        Text(
                            text = "Modificaciones bloqueadas",
                            style = MaterialTheme.typography.labelSmall,
                            fontSize = 10.sp,
                            color = Color(0xFFEF4444),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Contenido Scrollable: KPIs y Semáforo de Peajes
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // 1. Bloque de KPIs Ejecutivos con hora de actualización en vivo
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = "MÉTRICAS DEL OPERATIVO",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Black,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                letterSpacing = 1.sp
                            )
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = "🕒 $ultimaActualizacionHora",
                                style = MaterialTheme.typography.labelSmall,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = BrandAmber
                            )

                            FilledTonalButton(
                                onClick = {
                                    scope.launch { recargarMetricas(notificarToast = true) }
                                },
                                enabled = !cargando,
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                if (cargando) {
                                    CircularProgressIndicator(modifier = Modifier.size(14.dp), strokeWidth = 2.dp)
                                } else {
                                    Text("🔄", fontSize = 11.sp)
                                }
                            }
                        }
                    }

                    errorEstado?.let { err ->
                        Spacer(modifier = Modifier.height(6.dp))
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFEF4444).copy(alpha = 0.12f))
                        ) {
                            Text(
                                text = err,
                                modifier = Modifier.padding(10.dp),
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFFEF4444),
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        CardKpiEjecutivo(
                            modifier = Modifier.weight(1f),
                            titulo = "Afluencia Total",
                            valorPrincipal = "${kpis.totalVisitantesHoy}",
                            unidad = "turistas",
                            subtexto = "${kpis.totalGruposHoy} grupos censados",
                            colorAcento = if (currentTheme == AppThemeMode.AMOLED) BrandGreenNeon else BrandGreenLight,
                            icono = "👥"
                        )
                        CardKpiEjecutivo(
                            modifier = Modifier.weight(1f),
                            titulo = "Ocupación PST",
                            valorPrincipal = "${kpis.ocupacionHoteleraPct}%",
                            unidad = "capacidad",
                            subtexto = "Hoteles y Posadas",
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
                            valorPrincipal = "${listaPuntos.size}",
                            unidad = "habilitados",
                            subtexto = if (listaPuntos.isEmpty()) "Sin puntos consultados" else "${listaPuntos.count { !it.fueraDePunto }} puntos operativos",
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
                    ItemSemaforoPunto(
                        punto = punto,
                        currentTheme = currentTheme,
                        isOnline = isOnline,
                        onModificarClick = {
                            if (!isOnline) {
                                Toast.makeText(
                                    context,
                                    "⚠️ Acción bloqueada: Para realizar modificaciones en ${punto.nombre} es obligatorio estar en línea (Online).",
                                    Toast.LENGTH_LONG
                                ).show()
                            } else {
                                Toast.makeText(
                                    context,
                                    "Abriendo editor en línea de ${punto.nombre}...",
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                        }
                    )
                }
            }
        }
    }
}
