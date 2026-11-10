package com.cotatur.simat.ui.turista

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
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cotatur.simat.data.local.CatalogosGeograficos
import com.cotatur.simat.ui.theme.BrandAmber
import com.cotatur.simat.ui.theme.BrandGreen

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR
 * ARCHIVO: Step1ProcedenciaView.kt
 * DESCRIPCIÓN: Paso 1 - Procedencia del Visitante (Nacional vs Internacional).
 *              - Chips de acceso rápido para países y estados frecuentes.
 *              - Especificación obligatoria del país/estado exacto ante la opción "Otro".
 *              - Buscador predictivo integrado con catálogos oficiales.
 * ==============================================================================
 */

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun Step1ProcedenciaView(
    procedenciaTipo: String,
    estadoOrigen: String?,
    paisOrigen: String?,
    onTipoSelected: (String) -> Unit,
    onEstadoSelected: (String) -> Unit,
    onPaisSelected: (String) -> Unit
) {
    var mostrarBuscadorPais by remember {
        mutableStateOf(paisOrigen != null && paisOrigen !in CatalogosGeograficos.PAISES_FRECUENTES && paisOrigen != "Venezuela")
    }
    var busquedaPaisCustom by remember {
        mutableStateOf(if (mostrarBuscadorPais) (paisOrigen ?: "") else "")
    }

    var mostrarBuscadorEstado by remember {
        mutableStateOf(estadoOrigen != null && estadoOrigen !in CatalogosGeograficos.ESTADOS_FRECUENTES)
    }
    var busquedaEstadoCustom by remember {
        mutableStateOf(if (mostrarBuscadorEstado) (estadoOrigen ?: "") else "")
    }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(
            text = "¿De dónde nos visita el turista?",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )

        // Selector Tipo: Nacional vs Internacional
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            SelectorCard(
                titulo = "🇻🇪 Nacional",
                seleccionado = procedenciaTipo == "NACIONAL",
                modifier = Modifier.weight(1f),
                onClick = { onTipoSelected("NACIONAL") }
            )
            SelectorCard(
                titulo = "✈️ Internacional",
                seleccionado = procedenciaTipo == "INTERNACIONAL",
                modifier = Modifier.weight(1f),
                onClick = { onTipoSelected("INTERNACIONAL") }
            )
        }

        Spacer(modifier = Modifier.height(2.dp))

        if (procedenciaTipo == "NACIONAL") {
            Text(
                text = "Estado de Origen en Venezuela:",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.primary
            )

            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                CatalogosGeograficos.ESTADOS_FRECUENTES.forEach { estado ->
                    val esSel = !mostrarBuscadorEstado && estadoOrigen == estado
                    ChipOpcion(
                        texto = estado,
                        seleccionado = esSel,
                        onClick = {
                            mostrarBuscadorEstado = false
                            onEstadoSelected(estado)
                        }
                    )
                }

                // Opción explícita de "Otro Estado"
                ChipOpcion(
                    texto = if (mostrarBuscadorEstado && busquedaEstadoCustom.isNotBlank()) "➕ $busquedaEstadoCustom" else "➕ Otro Estado / Buscar",
                    seleccionado = mostrarBuscadorEstado,
                    onClick = {
                        mostrarBuscadorEstado = true
                    }
                )
            }

            // Panel para especificar estado exacto
            if (mostrarBuscadorEstado) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BrandAmber.copy(alpha = 0.6f))
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "📍 Indique el Estado exacto:",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        OutlinedTextField(
                            value = busquedaEstadoCustom,
                            onValueChange = { busquedaEstadoCustom = it },
                            placeholder = { Text("Escriba el nombre del estado (ej: Falcón, Sucre)") },
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandGreen,
                                focusedLabelColor = BrandGreen
                            )
                        )

                        // Sugerencias de otros estados venezolanos
                        val estadosFiltrados = CatalogosGeograficos.ESTADOS_VENEZUELA_24
                            .filter { it !in CatalogosGeograficos.ESTADOS_FRECUENTES }
                            .filter { busquedaEstadoCustom.isBlank() || it.contains(busquedaEstadoCustom, ignoreCase = true) }
                            .take(6)

                        if (estadosFiltrados.isNotEmpty()) {
                            Text(text = "Sugerencias de Estados:", fontSize = 11.sp, color = MaterialTheme.colorScheme.outline)
                            FlowRow(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                estadosFiltrados.forEach { est ->
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(MaterialTheme.colorScheme.surface)
                                            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                            .clickable {
                                                busquedaEstadoCustom = est
                                                onEstadoSelected(est)
                                            }
                                            .padding(horizontal = 10.dp, vertical = 6.dp)
                                    ) {
                                        Text(text = est, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                                    }
                                }
                            }
                        }

                        Button(
                            onClick = {
                                val valorLimpio = busquedaEstadoCustom.trim()
                                if (valorLimpio.isNotBlank()) {
                                    onEstadoSelected(valorLimpio)
                                }
                            },
                            enabled = busquedaEstadoCustom.isNotBlank(),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BrandGreen)
                        ) {
                            Text("CONFIRMAR ESTADO Y AVANZAR ➔", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

        } else {
            // --- FLUJO INTERNACIONAL ---
            Text(
                text = "País de Procedencia / Residencia:",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.primary
            )

            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                CatalogosGeograficos.PAISES_FRECUENTES.forEach { pais ->
                    val esSel = !mostrarBuscadorPais && paisOrigen == pais
                    ChipOpcion(
                        texto = pais,
                        seleccionado = esSel,
                        onClick = {
                            mostrarBuscadorPais = false
                            onPaisSelected(pais)
                        }
                    )
                }

                // Opción para especificar otro país
                ChipOpcion(
                    texto = if (mostrarBuscadorPais && busquedaPaisCustom.isNotBlank()) "🌍 $busquedaPaisCustom" else "➕ Otro País / Buscar",
                    seleccionado = mostrarBuscadorPais,
                    onClick = {
                        mostrarBuscadorPais = true
                    }
                )
            }

            // Panel interactivo para capturar el país exacto
            if (mostrarBuscadorPais) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, BrandAmber.copy(alpha = 0.6f))
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "🌍 Especifique el País de Procedencia:",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        OutlinedTextField(
                            value = busquedaPaisCustom,
                            onValueChange = { busquedaPaisCustom = it },
                            placeholder = { Text("Escriba el nombre del país (ej: Francia, Argentina, etc.)") },
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandGreen,
                                focusedLabelColor = BrandGreen
                            )
                        )

                        // Sugerencias de países internacionales
                        val paisesFiltrados = CatalogosGeograficos.PAISES_CATALOGO
                            .filter { it !in CatalogosGeograficos.PAISES_FRECUENTES }
                            .filter { busquedaPaisCustom.isBlank() || it.contains(busquedaPaisCustom, ignoreCase = true) }
                            .take(8)

                        if (paisesFiltrados.isNotEmpty()) {
                            Text(text = "Sugerencias de Países:", fontSize = 11.sp, color = MaterialTheme.colorScheme.outline)
                            FlowRow(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                paisesFiltrados.forEach { p ->
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(MaterialTheme.colorScheme.surface)
                                            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                            .clickable {
                                                busquedaPaisCustom = p
                                                onPaisSelected(p)
                                            }
                                            .padding(horizontal = 10.dp, vertical = 6.dp)
                                    ) {
                                        Text(text = p, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                                    }
                                }
                            }
                        }

                        Button(
                            onClick = {
                                val limpio = busquedaPaisCustom.trim()
                                if (limpio.isNotBlank()) {
                                    onPaisSelected(limpio)
                                }
                            },
                            enabled = busquedaPaisCustom.isNotBlank(),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = BrandGreen)
                        ) {
                            Text("CONFIRMAR PAÍS Y AVANZAR ➔", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
