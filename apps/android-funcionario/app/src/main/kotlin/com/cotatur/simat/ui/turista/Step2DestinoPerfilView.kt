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
 * ARCHIVO: Step2DestinoPerfilView.kt
 * DESCRIPCIÓN: Paso 2 - Destino y Perfil de Viaje:
 *              - Selector dinámico de los 29 Municipios Oficiales del Táchira.
 *              - Acceso rápido a los destinos más transitados y buscador alfanumérico.
 *              - Motivo, tipo de alojamiento y steppers táctiles de grupo y días.
 * ==============================================================================
 */

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun Step2DestinoPerfilView(
    municipioDestino: String,
    motivoViaje: String,
    tipoAlojamiento: String,
    grupoTamano: Int,
    diasEstadia: Int,
    onMunicipioSelected: (String) -> Unit,
    onMotivoSelected: (String) -> Unit,
    onAlojamientoSelected: (String) -> Unit,
    onGrupoChanged: (Int) -> Unit,
    onDiasChanged: (Int) -> Unit
) {
    val motivos = listOf(
        "Turismo y Recreación", "Visita Familiar/Amigos",
        "Negocios y Comercio", "Peregrinación/Religioso", "Tránsito a Frontera"
    )

    val alojamientos = listOf(
        "Hotel", "Posada Turística", "Casa Familiar/Amigos", "Campamento/Propio"
    )

    var mostrarCatalogo29 by remember {
        mutableStateOf(municipioDestino !in CatalogosGeograficos.MUNICIPIOS_FRECUENTES)
    }
    var filtroMunicipio by remember { mutableStateOf("") }

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        // --- DESTINO PRINCIPAL EN TÁCHIRA (29 MUNICIPIOS) ---
        Text(
            text = "Destino Principal en Táchira:",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )

        // Chips rápidos de municipios con mayor afluencia
        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            CatalogosGeograficos.MUNICIPIOS_FRECUENTES.forEach { mun ->
                val esSel = !mostrarCatalogo29 && municipioDestino == mun
                ChipOpcion(
                    texto = mun,
                    seleccionado = esSel,
                    onClick = {
                        mostrarCatalogo29 = false
                        onMunicipioSelected(mun)
                    }
                )
            }

            // Botón para expandir catálogo completo de 29 municipios
            ChipOpcion(
                texto = if (mostrarCatalogo29) "📍 Destino: $municipioDestino" else "📍 Ver los 29 Municipios / Buscar",
                seleccionado = mostrarCatalogo29,
                onClick = {
                    mostrarCatalogo29 = !mostrarCatalogo29
                }
            )
        }

        // Panel interactivo de los 29 municipios del Táchira
        if (mostrarCatalogo29) {
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
                        text = "🏛️ Catálogo Oficial - 29 Municipios del Táchira:",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    OutlinedTextField(
                        value = filtroMunicipio,
                        onValueChange = { filtroMunicipio = it },
                        placeholder = { Text("Filtrar por municipio o pueblo (ej: Ureña, Cordero...)") },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BrandGreen,
                            focusedLabelColor = BrandGreen
                        )
                    )

                    val municipiosFiltrados = CatalogosGeograficos.MUNICIPIOS_TACHIRA_29
                        .filter { filtroMunicipio.isBlank() || it.contains(filtroMunicipio, ignoreCase = true) }

                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        municipiosFiltrados.forEach { mun ->
                            val sel = municipioDestino == mun
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (sel) BrandGreen else MaterialTheme.colorScheme.surface)
                                    .border(1.dp, if (sel) BrandGreen else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                    .clickable {
                                        onMunicipioSelected(mun)
                                    }
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = mun,
                                    fontSize = 12.sp,
                                    fontWeight = if (sel) FontWeight.Bold else FontWeight.Medium,
                                    color = if (sel) Color.White else MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }

                    Text(
                        text = "✅ Destino seleccionado: $municipioDestino",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = BrandGreen
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(2.dp))

        // Motivo del Viaje
        Text(
            text = "Motivo de la Visita:",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )
        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            motivos.forEach { mot ->
                ChipOpcion(
                    texto = mot,
                    seleccionado = motivoViaje == mot,
                    onClick = { onMotivoSelected(mot) }
                )
            }
        }

        // Tipo de Alojamiento
        Text(
            text = "Tipo de Alojamiento:",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )
        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            alojamientos.forEach { aloj ->
                ChipOpcion(
                    texto = aloj,
                    seleccionado = tipoAlojamiento == aloj,
                    onClick = { onAlojamientoSelected(aloj) }
                )
            }
        }

        // Stepper: Personas en el Grupo
        ContadorStepperFila(
            etiqueta = "Personas en el Grupo:",
            valor = grupoTamano,
            unidad = "personas",
            presets = listOf(1, 2, 4, 6),
            onValorChanged = onGrupoChanged
        )

        // Stepper: Días de Estadía
        ContadorStepperFila(
            etiqueta = "Días de Permanencia:",
            valor = diasEstadia,
            unidad = "días",
            presets = listOf(1, 3, 7, 14),
            onValorChanged = onDiasChanged
        )
    }
}
