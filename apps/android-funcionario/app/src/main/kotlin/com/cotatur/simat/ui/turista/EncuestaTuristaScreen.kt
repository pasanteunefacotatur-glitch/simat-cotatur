package com.cotatur.simat.ui.turista

import android.os.SystemClock
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
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
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import com.cotatur.simat.data.local.EncuestaRepository
import com.cotatur.simat.data.local.EncuestaTuristicaLocal
import com.cotatur.simat.data.local.LocationCache
import com.cotatur.simat.ui.theme.BrandGreen
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR
 * ARCHIVO: EncuestaTuristaScreen.kt
 * DESCRIPCIÓN: Pantalla de captura en Modo Ráfaga vehicular (meta <= 18s).
 *              - Flujo continuo de 4 pasos con auto-avance táctil.
 *              - Botón visible y accesible en todo momento: "◀ Corregir Anterior".
 *              - Guardado local en SQLite en < 50 ms y reseteo automático.
 *              - Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */
@Composable
fun EncuestaTuristaScreen(
    puntoCodigo: String = "PEAJE_TARIBA",
    funcionarioCedula: String = "V-00000000",
    onVolverAlMenu: () -> Unit
) {
    val context = LocalContext.current
    val repository = remember { EncuestaRepository(context) }
    val scope = rememberCoroutineScope()

    var pasoActual by remember { mutableIntStateOf(1) }
    var startTimerMs by remember { mutableStateOf(SystemClock.elapsedRealtime()) }
    var mensajeExito by remember { mutableStateOf<String?>(null) }
    var encuestasGuardadasSesion by remember { mutableIntStateOf(0) }

    // Estado del Formulario
    var procedenciaTipo by remember { mutableStateOf("NACIONAL") }
    var estadoOrigen by remember { mutableStateOf("Zulia") }
    var paisOrigen by remember { mutableStateOf("Venezuela") }
    var municipioDestino by remember { mutableStateOf("San Cristóbal") }
    var motivoViaje by remember { mutableStateOf("Turismo y Recreación") }
    var tipoAlojamiento by remember { mutableStateOf("Hotel") }
    var grupoTamano by remember { mutableIntStateOf(2) }
    var diasEstadia by remember { mutableIntStateOf(3) }
    var califVialidad by remember { mutableIntStateOf(4) }
    var califSeguridad by remember { mutableIntStateOf(5) }
    var califHospitalidad by remember { mutableIntStateOf(5) }
    var califServiciosPublicos by remember { mutableIntStateOf(4) }

    fun reiniciarFormulario() {
        pasoActual = 1
        startTimerMs = SystemClock.elapsedRealtime()
        procedenciaTipo = "NACIONAL"
        estadoOrigen = "Zulia"
        paisOrigen = "Venezuela"
        municipioDestino = "San Cristóbal"
        motivoViaje = "Turismo y Recreación"
        tipoAlojamiento = "Hotel"
        grupoTamano = 2
        diasEstadia = 3
        califVialidad = 4
        califSeguridad = 5
        califHospitalidad = 5
        califServiciosPublicos = 4
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
                .padding(horizontal = 16.dp, vertical = 10.dp)
        ) {
            // --- CABECERA DE PROGRESO CON BREADCRUMB PILLS ---
            BarraProgresoPills(
                pasoActual = pasoActual,
                totalPasos = 4,
                onPillClick = { pasoSeleccionado ->
                    if (pasoSeleccionado < pasoActual) pasoActual = pasoSeleccionado
                }
            )

            // Mensaje de éxito al guardar
            mensajeExito?.let { msg ->
                Spacer(modifier = Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(BrandGreen.copy(alpha = 0.2f))
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = msg,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = BrandGreen
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // --- CUERPO DINÁMICO DEL PASO ACTUAL CON ANIMACIÓN HORIZONTAL ---
            Box(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
            ) {
                AnimatedContent(
                    targetState = pasoActual,
                    transitionSpec = {
                        if (targetState > initialState) {
                            slideInHorizontally { width -> width } togetherWith slideOutHorizontally { width -> -width }
                        } else {
                            slideInHorizontally { width -> -width } togetherWith slideOutHorizontally { width -> width }
                        }
                    },
                    label = "PasosAnimacion"
                ) { paso ->
                    when (paso) {
                        1 -> Step1ProcedenciaView(
                            procedenciaTipo = procedenciaTipo,
                            estadoOrigen = estadoOrigen,
                            paisOrigen = paisOrigen,
                            onTipoSelected = { procedenciaTipo = it },
                            onEstadoSelected = { estadoOrigen = it; pasoActual = 2 },
                            onPaisSelected = { paisOrigen = it; pasoActual = 2 }
                        )
                        2 -> Step2DestinoPerfilView(
                            municipioDestino = municipioDestino,
                            motivoViaje = motivoViaje,
                            tipoAlojamiento = tipoAlojamiento,
                            grupoTamano = grupoTamano,
                            diasEstadia = diasEstadia,
                            onMunicipioSelected = { municipioDestino = it },
                            onMotivoSelected = { motivoViaje = it },
                            onAlojamientoSelected = { tipoAlojamiento = it },
                            onGrupoChanged = { grupoTamano = it },
                            onDiasChanged = { diasEstadia = it }
                        )
                        3 -> Paso3TemporadaView()
                        4 -> Step4CalificacionView(
                            califVialidad = califVialidad,
                            califSeguridad = califSeguridad,
                            califHospitalidad = califHospitalidad,
                            califServiciosPublicos = califServiciosPublicos,
                            onCalifVialidadChanged = { califVialidad = it },
                            onCalifSeguridadChanged = { califSeguridad = it },
                            onCalifHospitalidadChanged = { califHospitalidad = it },
                            onCalifServiciosChanged = { califServiciosPublicos = it }
                        )
                    }
                }
            }

            // --- BARRA INFERIOR DE ACCIÓN ERGONÓMICA ---
            BarraNavegacionInferior(
                pasoActual = pasoActual,
                totalPasos = 4,
                onCorregirAnterior = {
                    if (pasoActual > 1) {
                        pasoActual -= 1
                    } else {
                        onVolverAlMenu()
                    }
                },
                onAvanzar = {
                    if (pasoActual < 4) {
                        pasoActual += 1
                    } else {
                        // Guardar en SQLite en < 50 ms
                        val duracionSeg = ((SystemClock.elapsedRealtime() - startTimerMs) / 1000).toInt().coerceAtLeast(10)
                        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                            timeZone = TimeZone.getTimeZone("UTC")
                        }
                        val ahoraIso = sdf.format(Date())

                        val fix = LocationCache.obtenerFixValido()

                        val encuesta = EncuestaTuristicaLocal(
                            puntoCodigo = puntoCodigo,
                            temporadaCodigo = "REGULAR",
                            funcionarioCedula = funcionarioCedula,
                            capturedAt = ahoraIso,
                            duracionLlenadoSeg = duracionSeg,
                            gpsLat = fix?.lat,
                            gpsLng = fix?.lng,
                            gpsPrecisionM = fix?.precisionM,
                            gpsEsSimulado = fix?.esSimulado ?: false,
                            gpsEsCache = fix != null,
                            gpsFixId = fix?.fixId,
                            procedenciaTipo = procedenciaTipo,
                            estadoOrigen = if (procedenciaTipo == "NACIONAL") estadoOrigen else null,
                            paisOrigen = if (procedenciaTipo == "INTERNACIONAL") paisOrigen else "Venezuela",
                            municipioDestino = municipioDestino,
                            motivoViaje = motivoViaje,
                            tipoAlojamiento = tipoAlojamiento,
                            grupoTamano = grupoTamano,
                            diasEstadia = diasEstadia,
                            califVialidad = califVialidad,
                            califSeguridad = califSeguridad,
                            califHospitalidad = califHospitalidad,
                            califServiciosPublicos = califServiciosPublicos,
                            createdAt = ahoraIso
                        )

                        scope.launch {
                            repository.guardarEncuestaTurista(encuesta)
                            encuestasGuardadasSesion += 1
                            mensajeExito = "✅ Encuesta #$encuestasGuardadasSesion guardada en SQLite local"
                            reiniciarFormulario()
                        }
                    }
                }
            )
        }
    }
}

@Composable
private fun BarraProgresoPills(
    pasoActual: Int,
    totalPasos: Int,
    onPillClick: (Int) -> Unit
) {
    val nombresPasos = listOf("1. Origen", "2. Destino", "3. Temporada", "4. Evaluar")

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        (1..totalPasos).forEach { paso ->
            val completado = paso < pasoActual
            val activo = paso == pasoActual
            val bgColor = when {
                activo -> BrandGreen
                completado -> BrandGreen.copy(alpha = 0.25f)
                else -> MaterialTheme.colorScheme.surfaceVariant
            }
            val textColor = when {
                activo -> Color.White
                completado -> BrandGreen
                else -> MaterialTheme.colorScheme.onSurfaceVariant
            }

            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(8.dp))
                    .background(bgColor)
                    .clickable { onPillClick(paso) }
                    .padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = nombresPasos[paso - 1],
                    fontSize = 11.sp,
                    fontWeight = if (activo) FontWeight.ExtraBold else FontWeight.Medium,
                    color = textColor
                )
            }
        }
    }
}

@Composable
private fun Paso3TemporadaView() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(
                text = "🎡 Operativo Turístico en Curso",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "Temporada Regular activa. No se requieren preguntas especiales hoy.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun BarraNavegacionInferior(
    pasoActual: Int,
    totalPasos: Int,
    onCorregirAnterior: () -> Unit,
    onAvanzar: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Botón Visible: "◀ Corregir Anterior"
        OutlinedButton(
            onClick = onCorregirAnterior,
            modifier = Modifier
                .weight(1f)
                .height(52.dp),
            shape = RoundedCornerShape(14.dp)
        ) {
            Text(
                text = if (pasoActual > 1) "◀ Corregir" else "✕ Salir",
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp
            )
        }

        // Botón Primario: "Continuar" o "Guardar y Siguiente"
        Button(
            onClick = onAvanzar,
            modifier = Modifier
                .weight(1.5f)
                .height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = BrandGreen)
        ) {
            Text(
                text = if (pasoActual == totalPasos) "✅ GUARDAR Y SIGUIENTE" else "Continuar ▶",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 13.sp
            )
        }
    }
}
