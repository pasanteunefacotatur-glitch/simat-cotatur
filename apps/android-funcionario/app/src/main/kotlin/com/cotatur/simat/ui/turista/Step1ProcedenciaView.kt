package com.cotatur.simat.ui.turista

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
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
 * ARCHIVO: Step1ProcedenciaView.kt
 * DESCRIPCIÓN: Paso 1 - Procedencia del Visitante (Nacional vs Internacional).
 *              - Chips de acceso rápido para los estados y países más frecuentes.
 *              - Modal Bottom Sheet con búsqueda instantánea (One-Tap Selection)
 *                para los 24 Estados de Venezuela y 200 Países del Mundo.
 *              - Cero saltos de pantalla (no layout shifts) y sin confirmaciones redundantes.
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
    var mostrarBottomSheetEstado by remember { mutableStateOf(false) }
    var mostrarBottomSheetPais by remember { mutableStateOf(false) }

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
                // Top estados frecuentes de procedencia hacia Táchira
                CatalogosGeograficos.ESTADOS_FRECUENTES.forEach { estado ->
                    val esSel = estadoOrigen == estado
                    ChipOpcion(
                        texto = estado,
                        seleccionado = esSel,
                        onClick = { onEstadoSelected(estado) }
                    )
                }

                // Chip de estado activo si fue seleccionado fuera del TOP
                val estadoEsOtro = estadoOrigen != null && estadoOrigen !in CatalogosGeograficos.ESTADOS_FRECUENTES
                if (estadoEsOtro) {
                    ChipOpcion(
                        texto = "📍 $estadoOrigen",
                        seleccionado = true,
                        onClick = { mostrarBottomSheetEstado = true }
                    )
                }

                // Disparador del Modal Bottom Sheet para buscar entre los 24 Estados
                ChipOpcion(
                    texto = "🔍 Buscar otro estado...",
                    seleccionado = false,
                    onClick = { mostrarBottomSheetEstado = true }
                )
            }

        } else {
            // --- PROCEDENCIA INTERNACIONAL ---
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
                // Países de mayor flujo y frontera
                CatalogosGeograficos.PAISES_FRECUENTES.forEach { pais ->
                    val esSel = paisOrigen == pais
                    ChipOpcion(
                        texto = pais,
                        seleccionado = esSel,
                        onClick = { onPaisSelected(pais) }
                    )
                }

                // Chip de país activo si fue seleccionado mediante el buscador
                val paisEsOtro = paisOrigen != null && paisOrigen !in CatalogosGeograficos.PAISES_FRECUENTES && paisOrigen != "Venezuela"
                if (paisEsOtro) {
                    // Buscar si tiene bandera en el catálogo
                    val banderaItem = CatalogosGeograficos.PAISES_MUNDIAL.find { it.nombre.equals(paisOrigen, ignoreCase = true) }?.bandera ?: "🌍"
                    ChipOpcion(
                        texto = "$banderaItem $paisOrigen",
                        seleccionado = true,
                        onClick = { mostrarBottomSheetPais = true }
                    )
                }

                // Disparador del Modal Bottom Sheet para buscar entre los 200 países del mundo
                ChipOpcion(
                    texto = "🌍 Buscar otro país del mundo...",
                    seleccionado = false,
                    onClick = { mostrarBottomSheetPais = true }
                )
            }
        }
    }

    // Modal Bottom Sheet: Estados de Venezuela
    if (mostrarBottomSheetEstado) {
        val itemsEstados = remember {
            CatalogosGeograficos.ESTADOS_VENEZUELA_24.map { estado ->
                ItemBuscador(
                    valor = estado,
                    etiqueta = estado,
                    subtitulo = "Entidad Federal de Venezuela",
                    icono = "🇻🇪"
                )
            }
        }

        BuscadorSelectorBottomSheet(
            titulo = "Buscar Estado de Venezuela",
            subtitulo = "Toque un estado para seleccionarlo al instante",
            placeholderBusqueda = "Escriba el nombre del estado (ej: Falcón, Sucre, Aragua)...",
            elementos = itemsEstados,
            elementoSeleccionado = estadoOrigen,
            permitirPersonalizado = true,
            onSeleccionar = { estadoSeleccionado ->
                onEstadoSelected(estadoSeleccionado)
                mostrarBottomSheetEstado = false
            },
            onDismiss = { mostrarBottomSheetEstado = false }
        )
    }

    // Modal Bottom Sheet: Países del Mundo
    if (mostrarBottomSheetPais) {
        val itemsPaises = remember {
            CatalogosGeograficos.PAISES_MUNDIAL.map { pais ->
                ItemBuscador(
                    valor = pais.nombre,
                    etiqueta = pais.nombre,
                    subtitulo = "Código: ${pais.codigo}",
                    icono = pais.bandera
                )
            }
        }

        BuscadorSelectorBottomSheet(
            titulo = "Buscar País de Procedencia",
            subtitulo = "200 países disponibles • Toque 1 vez para seleccionar",
            placeholderBusqueda = "Escriba el país (ej: Rusia, Japón, Turquía, Alemania)...",
            elementos = itemsPaises,
            elementoSeleccionado = paisOrigen,
            permitirPersonalizado = true,
            onSeleccionar = { paisSeleccionado ->
                onPaisSelected(paisSeleccionado)
                mostrarBottomSheetPais = false
            },
            onDismiss = { mostrarBottomSheetPais = false }
        )
    }
}
