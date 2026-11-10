package com.cotatur.simat.ui.prestador

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import com.cotatur.simat.data.local.CatalogosGeograficos
import com.cotatur.simat.data.local.EncuestaPrestadorLocal
import com.cotatur.simat.data.local.EncuestaRepository
import com.cotatur.simat.ui.theme.BrandAmber
import com.cotatur.simat.ui.theme.BrandGreen
import com.cotatur.simat.ui.turista.ChipOpcion
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR
 * ARCHIVO: CensoPrestadoresScreen.kt
 * DESCRIPCIÓN: Módulo de inspección en campo a Prestadores de Servicios Turísticos (PST).
 *              Registra ocupación hotelera, tarifas y dificultades operativas en SQLite.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CensoPrestadoresScreen(
    puntoCodigo: String = "PEAJE_TARIBA",
    funcionarioCedula: String = "V-31061007",
    onVolverAlMenu: () -> Unit
) {
    val context = LocalContext.current
    val repository = remember { EncuestaRepository(context) }
    val scope = rememberCoroutineScope()

    var nombreEstablecimiento by remember { mutableStateOf("") }
    var tipoPrestador by remember { mutableStateOf("HOTEL") }
    var municipio by remember { mutableStateOf("San Cristóbal") }
    var habitacionesDisponibles by remember { mutableIntStateOf(20) }
    var habitacionesOcupadas by remember { mutableIntStateOf(12) }
    var ocupacionRango by remember { mutableStateOf("51-75%") }
    var tarifaPromedioUsd by remember { mutableStateOf(35.0) }
    var evaluacionTemporada by remember { mutableStateOf("IGUAL") }
    var dificultadOperativa by remember { mutableStateOf("Electricidad y Combustible") }
    var califSeguridad by remember { mutableIntStateOf(5) }
    var mensajeExito by remember { mutableStateOf<String?>(null) }

    val tiposPrestador = listOf(
        "HOTEL" to "🏨 Hotel",
        "POSADA" to "🏡 Posada",
        "CAMPAMENTO" to "⛺ Campamento",
        "RESTAURANTE" to "🍽️ Gastronomía",
        "TRANSPORTE" to "🚐 Transporte"
    )

    var mostrar29Municipios by remember {
        mutableStateOf(municipio !in CatalogosGeograficos.MUNICIPIOS_FRECUENTES)
    }
    var filtroMunPst by remember { mutableStateOf("") }

    val rangosOcupacion = listOf("0-25%", "26-50%", "51-75%", "76-100%")
    val evaluaciones = listOf("MEJOR" to "📈 Mejor", "IGUAL" to "⚖️ Igual", "PEOR" to "📉 Menor")

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
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Cabecera del formulario
            Text(
                text = "🏨 Censo de Prestadores de Servicios (PST)",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Black,
                color = MaterialTheme.colorScheme.onSurface
            )

            mensajeExito?.let { msg ->
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

            // Nombre del Establecimiento
            OutlinedTextField(
                value = nombreEstablecimiento,
                onValueChange = { nombreEstablecimiento = it },
                label = { Text("Nombre del Establecimiento *") },
                placeholder = { Text("Ej: Hotel El Tama / Posada La Giralda") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            // Tipo de Prestador
            Text(
                text = "Categoría del Establecimiento:",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                tiposPrestador.forEach { (clave, etiqueta) ->
                    ChipOpcion(
                        texto = etiqueta,
                        seleccionado = tipoPrestador == clave,
                        onClick = { tipoPrestador = clave }
                    )
                }
            }

            // Municipio
            Text(
                text = "Municipio de Ubicación en Táchira:",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                CatalogosGeograficos.MUNICIPIOS_FRECUENTES.forEach { mun ->
                    val esSel = !mostrar29Municipios && municipio == mun
                    ChipOpcion(
                        texto = mun,
                        seleccionado = esSel,
                        onClick = {
                            mostrar29Municipios = false
                            municipio = mun
                        }
                    )
                }

                ChipOpcion(
                    texto = if (mostrar29Municipios) "📍 Municipio: $municipio" else "📍 Ver los 29 Municipios / Buscar",
                    seleccionado = mostrar29Municipios,
                    onClick = { mostrar29Municipios = !mostrar29Municipios }
                )
            }

            if (mostrar29Municipios) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BrandAmber.copy(alpha = 0.6f))
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "🏛️ Catálogo de los 29 Municipios del Táchira:",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        OutlinedTextField(
                            value = filtroMunPst,
                            onValueChange = { filtroMunPst = it },
                            placeholder = { Text("Filtrar por nombre o pueblo...") },
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandGreen,
                                focusedLabelColor = BrandGreen
                            )
                        )

                        val filtrados = CatalogosGeograficos.MUNICIPIOS_TACHIRA_29
                            .filter { filtroMunPst.isBlank() || it.contains(filtroMunPst, ignoreCase = true) }

                        FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            filtrados.forEach { m ->
                                val sel = municipio == m
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (sel) BrandGreen else MaterialTheme.colorScheme.surface)
                                        .border(1.dp, if (sel) BrandGreen else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                        .clickable { municipio = m }
                                        .padding(horizontal = 10.dp, vertical = 6.dp)
                                ) {
                                    Text(
                                        text = m,
                                        fontSize = 12.sp,
                                        fontWeight = if (sel) FontWeight.Bold else FontWeight.Medium,
                                        color = if (sel) Color.White else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }

                        Text(
                            text = "✅ Municipio PST: $municipio",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = BrandGreen
                        )
                    }
                }
            }

            // Porcentaje de Ocupación
            Text(
                text = "Ocupación Registrada en la Temporada:",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                rangosOcupacion.forEach { rango ->
                    val esSel = ocupacionRango == rango
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (esSel) BrandAmber else MaterialTheme.colorScheme.surface)
                            .clickable { ocupacionRango = rango }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = rango,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (esSel) Color.Black else MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

            // Comparativa de Temporada
            Text(
                text = "Comparativa frente a la Temporada Anterior:",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                evaluaciones.forEach { (clave, etiqueta) ->
                    val esSel = evaluacionTemporada == clave
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (esSel) BrandGreen else MaterialTheme.colorScheme.surface)
                            .clickable { evaluacionTemporada = clave }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = etiqueta,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = if (esSel) Color.White else MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

            // Dificultades Operativas
            OutlinedTextField(
                value = dificultadOperativa,
                onValueChange = { dificultadOperativa = it },
                label = { Text("Dificultades Operativas Reportadas") },
                placeholder = { Text("Ej: Combustible, suministro eléctrico, agua") },
                modifier = Modifier.fillMaxWidth(),
                maxLines = 2,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Botones de Acción
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
                    Text("✕ Regresar", fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = {
                        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                            timeZone = TimeZone.getTimeZone("UTC")
                        }
                        val ahoraIso = sdf.format(Date())

                        val pst = EncuestaPrestadorLocal(
                            puntoCodigo = puntoCodigo,
                            funcionarioCedula = funcionarioCedula,
                            temporadaCodigo = "REGULAR",
                            nombreEstablecimiento = nombreEstablecimiento.ifBlank { "Establecimiento Anónimo" },
                            tipoPrestador = tipoPrestador,
                            municipio = municipio,
                            habitacionesDisponibles = habitacionesDisponibles,
                            habitacionesOcupadas = habitacionesOcupadas,
                            porcentajeOcupacionRango = ocupacionRango,
                            tarifaPromedioUsd = tarifaPromedioUsd,
                            evaluacionTemporada = evaluacionTemporada,
                            dificultadesOperativas = dificultadOperativa,
                            califSeguridadAcompanamiento = califSeguridad,
                            capturedAt = ahoraIso,
                            createdAt = ahoraIso
                        )

                        scope.launch {
                            repository.guardarEncuestaPrestador(pst)
                            mensajeExito = "✅ Censo de prestador registrado exitosamente"
                            nombreEstablecimiento = ""
                        }
                    },
                    modifier = Modifier
                        .weight(1.5f)
                        .height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandAmber)
                ) {
                    Text("✅ REGISTRAR PST", fontWeight = FontWeight.Black, color = Color.Black)
                }
            }
        }
    }
}
