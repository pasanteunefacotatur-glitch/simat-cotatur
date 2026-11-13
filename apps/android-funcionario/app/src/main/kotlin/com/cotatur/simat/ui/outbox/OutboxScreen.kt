package com.cotatur.simat.ui.outbox

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.cotatur.simat.data.local.EncuestaPrestadorLocal
import com.cotatur.simat.data.local.EncuestaRepository
import com.cotatur.simat.data.local.EncuestaTuristicaLocal
import com.cotatur.simat.data.local.SessionManager
import com.cotatur.simat.data.remote.SupabaseRemoteClient
import com.cotatur.simat.ui.supervision.models.verificarInternetActivo
import com.cotatur.simat.ui.theme.BrandGreen
import kotlinx.coroutines.launch

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR
 * ARCHIVO: OutboxScreen.kt
 * DESCRIPCIÓN: Pantalla de inspección y sincronización de la Bandeja de Salida local.
 *              Muestra registros en Room/SQLite pendientes de subir a Supabase.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */
@Composable
fun OutboxScreen(
    onVolverAlMenu: () -> Unit
) {
    val context = LocalContext.current
    val repository = remember { EncuestaRepository(context) }
    val scope = rememberCoroutineScope()

    val totalPendientes by repository.pendientesCount.collectAsStateWithLifecycle()
    var listaTuristas by remember { mutableStateOf<List<EncuestaTuristicaLocal>>(emptyList()) }
    var listaPrestadores by remember { mutableStateOf<List<EncuestaPrestadorLocal>>(emptyList()) }
    var sincronizando by remember { mutableStateOf(false) }
    var syncError by remember { mutableStateOf(false) }
    var mensajeSincronizacion by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(totalPendientes) {
        listaTuristas = repository.obtenerPendientesTuristas(50)
        listaPrestadores = repository.obtenerPendientesPrestadores(50)
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
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Cabecera
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "📦 Bandeja de Salida (Outbox)",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Encuestas almacenadas de forma 100% offline en el teléfono.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Resumen de estado
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (totalPendientes == 0) BrandGreen.copy(alpha = 0.12f) else Color(0xFFFFC107).copy(alpha = 0.15f)
                )
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
                            .background(
                                color = if (totalPendientes == 0) BrandGreen else Color(0xFFD97706),
                                shape = CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = if (totalPendientes == 0) "✅" else "⏳", fontSize = 20.sp)
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (totalPendientes == 0) "Todas las encuestas están al día" else "$totalPendientes encuestas pendientes en SQLite",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = if (totalPendientes == 0) "Sincronizado con Supabase" else "Se enviarán automáticamente cuando detecte señal",
                            style = MaterialTheme.typography.bodyMedium,
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            mensajeSincronizacion?.let { msg ->
                val bannerColor = if (syncError) Color(0xFFEF4444) else BrandGreen
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(bannerColor.copy(alpha = 0.2f))
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = msg, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = bannerColor)
                }
            }

            // Lista de elementos en cola
            Text(
                text = "Detalle en Cola (${listaTuristas.size} turistas • ${listaPrestadores.size} PST):",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (listaTuristas.isEmpty() && listaPrestadores.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "No hay encuestas pendientes de sincronizar.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                } else {
                    items(listaTuristas, key = { "T_${it.id}" }) { item ->
                        ItemOutboxRow(item)
                    }
                    items(listaPrestadores, key = { "P_${it.id}" }) { pst ->
                        ItemOutboxPrestadorRow(pst)
                    }
                }
            }

            // Botones de acción inferiores
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedButton(
                    onClick = onVolverAlMenu,
                    modifier = Modifier
                        .weight(1f)
                        .height(52.dp),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text("◀ Regresar", fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = {
                        if (totalPendientes > 0 && !sincronizando) {
                            val token = SessionManager.getInstance(context).obtenerSesion()?.sessionToken.orEmpty()
                            if (!verificarInternetActivo(context)) {
                                syncError = true
                                mensajeSincronizacion = "📡 Sin conexión a internet. Los datos permanecen seguros en SQLite."
                                return@Button
                            }
                            if (token.isBlank()) {
                                syncError = true
                                mensajeSincronizacion = "🔒 Sesión sin token en la nube. Cierra sesión e inicia en línea para subir registros."
                                return@Button
                            }
                            sincronizando = true
                            syncError = false
                            mensajeSincronizacion = null
                            scope.launch {
                                val puntosMap = runCatching {
                                    SupabaseRemoteClient.fetchPuntosCaptura().associate { it.codigo to it.id }
                                }.getOrElse { emptyMap() }

                                val loteTuristas = repository.obtenerPendientesTuristas(100)
                                val lotePrestadores = repository.obtenerPendientesPrestadores(100)
                                var totalSubidas = 0
                                var errMsg: String? = null

                                if (loteTuristas.isNotEmpty()) {
                                    val (procT, resT) = SupabaseRemoteClient.sincronizarTuristasBatch(token, loteTuristas, puntosMap)
                                    if (resT.ok && procT > 0) {
                                        repository.marcarTuristasSincronizadas(loteTuristas.map { it.id })
                                        totalSubidas += procT
                                    } else if (!resT.ok) {
                                        errMsg = if (resT.sessionExpired) "🔒 Sesión expirada. Inicia sesión nuevamente." else resT.mensaje
                                    }
                                }

                                if (errMsg == null && lotePrestadores.isNotEmpty()) {
                                    val (procP, resP) = SupabaseRemoteClient.sincronizarPrestadoresBatch(token, lotePrestadores, puntosMap)
                                    if (resP.ok && procP > 0) {
                                        repository.marcarPrestadoresSincronizados(lotePrestadores.map { it.id })
                                        totalSubidas += procP
                                    } else if (!resP.ok) {
                                        errMsg = if (resP.sessionExpired) "🔒 Sesión expirada. Inicia sesión nuevamente." else resP.mensaje
                                    }
                                }

                                listaTuristas = repository.obtenerPendientesTuristas(50)
                                listaPrestadores = repository.obtenerPendientesPrestadores(50)
                                sincronizando = false
                                syncError = errMsg != null
                                mensajeSincronizacion = errMsg ?: "✅ Sincronizados $totalSubidas registros en Supabase Cloud."
                            }
                        }
                    },
                    modifier = Modifier
                        .weight(1.5f)
                        .height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandGreen),
                    enabled = totalPendientes > 0 && !sincronizando
                ) {
                    if (sincronizando) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    } else {
                        Text("🔄 Sincronizar Ahora", fontWeight = FontWeight.ExtraBold)
                    }
                }
            }
        }
    }
}

@Composable
private fun ItemOutboxRow(item: EncuestaTuristicaLocal) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "🚗 Turista: ${item.procedenciaTipo} (${item.estadoOrigen ?: item.paisOrigen ?: "N/D"})",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
                Text(
                    text = "Destino: ${item.municipioDestino} • Duración: ${item.duracionLlenadoSeg}s",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
            }

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(Color(0xFFFFC107).copy(alpha = 0.2f))
                    .padding(horizontal = 8.dp, vertical = 3.dp)
            ) {
                Text(
                    text = "En cola",
                    style = MaterialTheme.typography.labelSmall,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFD97706)
                )
            }
        }
    }
}

@Composable
private fun ItemOutboxPrestadorRow(pst: EncuestaPrestadorLocal) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "🏨 PST: ${pst.nombreEstablecimiento} (${pst.tipoPrestador})",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
                Text(
                    text = "${pst.municipio} • Ocupación ${pst.porcentajeOcupacionRango}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
            }

            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(Color(0xFFFFC107).copy(alpha = 0.2f))
                    .padding(horizontal = 8.dp, vertical = 3.dp)
            ) {
                Text(
                    text = "En cola",
                    style = MaterialTheme.typography.labelSmall,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFD97706)
                )
            }
        }
    }
}
