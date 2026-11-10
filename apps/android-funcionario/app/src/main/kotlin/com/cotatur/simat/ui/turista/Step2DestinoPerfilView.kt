package com.cotatur.simat.ui.turista

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.cotatur.simat.data.local.CatalogosGeograficos

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR
 * ARCHIVO: Step2DestinoPerfilView.kt
 * DESCRIPCIÓN: Paso 2 - Destino y Perfil de Viaje:
 *              - Selector dinámico de los 29 Municipios Oficiales del Táchira.
 *              - Modal Bottom Sheet con búsqueda alfanumérica y selección a 1 toque.
 *              - Motivo, tipo de alojamiento y steppers táctiles de grupo y días.
 *              - Cero desbordamientos de pantalla en teléfonos móviles.
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

    var mostrarBottomSheetMunicipios by remember { mutableStateOf(false) }

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
                val esSel = municipioDestino == mun
                ChipOpcion(
                    texto = mun,
                    seleccionado = esSel,
                    onClick = { onMunicipioSelected(mun) }
                )
            }

            // Chip activo si el municipio seleccionado no está en los frecuentes
            val esOtroMunicipio = municipioDestino !in CatalogosGeograficos.MUNICIPIOS_FRECUENTES
            if (esOtroMunicipio) {
                ChipOpcion(
                    texto = "📍 $municipioDestino",
                    seleccionado = true,
                    onClick = { mostrarBottomSheetMunicipios = true }
                )
            }

            // Botón para abrir el Modal Bottom Sheet de los 29 municipios
            ChipOpcion(
                texto = "🔍 Ver los 29 Municipios / Buscar...",
                seleccionado = false,
                onClick = { mostrarBottomSheetMunicipios = true }
            )
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

    // Modal Bottom Sheet: 29 Municipios del Táchira
    if (mostrarBottomSheetMunicipios) {
        val itemsMunicipios = remember {
            CatalogosGeograficos.MUNICIPIOS_TACHIRA_29.map { mun ->
                ItemBuscador(
                    valor = mun,
                    etiqueta = mun,
                    subtitulo = "Estado Táchira",
                    icono = "🏛️"
                )
            }
        }

        BuscadorSelectorBottomSheet(
            titulo = "29 Municipios del Estado Táchira",
            subtitulo = "Toque un municipio para fijarlo como destino turístico",
            placeholderBusqueda = "Escriba para filtrar (ej: Ureña, Delicias, La Grita, Pregonero)...",
            elementos = itemsMunicipios,
            elementoSeleccionado = municipioDestino,
            permitirPersonalizado = true,
            onSeleccionar = { munSeleccionado ->
                onMunicipioSelected(munSeleccionado)
                mostrarBottomSheetMunicipios = false
            },
            onDismiss = { mostrarBottomSheetMunicipios = false }
        )
    }
}
