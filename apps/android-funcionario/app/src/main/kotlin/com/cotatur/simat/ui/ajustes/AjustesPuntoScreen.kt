package com.cotatur.simat.ui.ajustes

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cotatur.simat.ui.theme.BrandGreen

data class PuntoControlItem(
    val codigo: String,
    val nombre: String,
    val municipio: String,
    val tipo: String,
    val icono: String
)

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR
 * ARCHIVO: AjustesPuntoScreen.kt
 * DESCRIPCIÓN: Selección del puesto de control activo para el encuestador.
 *              Cumple con la regla de modularidad (< 500 líneas).
 * ==============================================================================
 */
@Composable
fun AjustesPuntoScreen(
    puntoActualCodigo: String = "PEAJE_TARIBA",
    onPuntoSeleccionado: (String, String) -> Unit,
    onVolverAlMenu: () -> Unit
) {
    val puntos = listOf(
        PuntoControlItem("PEAJE_TARIBA", "Peaje Vega de Táriba", "Cárdenas", "PEAJE", "🛣️"),
        PuntoControlItem("PEAJE_CAMPANA", "Peaje La Campana", "Torbes", "PEAJE", "🛣️"),
        PuntoControlItem("TERMINAL_SC", "Terminal de Pasajeros", "San Cristóbal", "TERMINAL", "🚌"),
        PuntoControlItem("PUENTE_ATANASIO", "Puente Atanasio Girardot", "Pedro María Ureña", "FRONTERA", "🌉"),
        PuntoControlItem("PERIBECA_PUEBLO", "Pueblo Típico Peribeca", "Capacho Nuevo", "ATRACCION", "🏡"),
        PuntoControlItem("CHORRO_EL_INDIO", "P.N. Chorro El Indio", "San Cristóbal", "ATRACCION", "⛰️")
    )

    var seleccionado by remember { mutableStateOf(puntoActualCodigo) }

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
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Column {
                Text(
                    text = "📍 Puestos de Control Turístico",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Seleccione el peaje, terminal o punto donde realiza su guardia hoy.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(puntos, key = { it.codigo }) { item ->
                    val esActivo = item.codigo == seleccionado
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .clickable {
                                seleccionado = item.codigo
                                onPuntoSeleccionado(item.codigo, item.nombre)
                            },
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (esActivo) BrandGreen.copy(alpha = 0.12f) else MaterialTheme.colorScheme.surface
                        ),
                        border = BorderStroke(if (esActivo) 2.dp else 1.dp, if (esActivo) BrandGreen else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .background(if (esActivo) BrandGreen else MaterialTheme.colorScheme.surfaceVariant, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(text = item.icono, fontSize = 20.sp)
                            }

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = item.nombre,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    maxLines = 1,
                                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "Municipio: ${item.municipio} • Tipo: ${item.tipo}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    maxLines = 1,
                                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                                )
                            }

                            if (esActivo) {
                                Text(
                                    text = "✅ Activo",
                                    color = BrandGreen,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 12.sp,
                                    maxLines = 1,
                                    modifier = Modifier.padding(start = 6.dp)
                                )
                            }
                        }
                    }
                }
            }

            Button(
                onClick = onVolverAlMenu,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = BrandGreen)
            ) {
                Text("Confirmar y Regresar al Menú", fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}
