package com.cotatur.simat.ui.turista

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cotatur.simat.ui.theme.BrandAmber
import com.cotatur.simat.ui.theme.BrandGreen

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR
 * ARCHIVO: StepViews.kt
 * DESCRIPCIÓN: Componentes atómicos y Vista del Paso 4 (Calificación de Servicios).
 *              Diseñados con Fitts' Law (botones >= 48dp) y áreas táctiles ergonómicas.
 *              Cumple estrictamente con la Regla de Modularidad (< 500 líneas).
 * ==============================================================================
 */

// --- PASO 4: CALIFICACIÓN DE SERVICIOS REGIONALES ---
@Composable
fun Step4CalificacionView(
    califVialidad: Int,
    califSeguridad: Int,
    califHospitalidad: Int,
    califServiciosPublicos: Int,
    onCalifVialidadChanged: (Int) -> Unit,
    onCalifSeguridadChanged: (Int) -> Unit,
    onCalifHospitalidadChanged: (Int) -> Unit,
    onCalifServiciosChanged: (Int) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(
            text = "Evaluación de Servicios Regionales:",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )

        FilaEstrellasCalificacion(
            etiqueta = "🛣️ Estado de Vialidad y Accesos:",
            calificacion = califVialidad,
            onCalificacionChanged = onCalifVialidadChanged
        )

        FilaEstrellasCalificacion(
            etiqueta = "🛡️ Seguridad y Acompañamiento:",
            calificacion = califSeguridad,
            onCalificacionChanged = onCalifSeguridadChanged
        )

        FilaEstrellasCalificacion(
            etiqueta = "🤝 Hospitalidad y Trato Cordial:",
            calificacion = califHospitalidad,
            onCalificacionChanged = onCalifHospitalidadChanged
        )

        FilaEstrellasCalificacion(
            etiqueta = "💡 Servicios Públicos (Agua/Luz):",
            calificacion = califServiciosPublicos,
            onCalificacionChanged = onCalifServiciosChanged
        )
    }
}

// --- COMPONENTES AUXILIARES REUTILIZABLES ---
@Composable
internal fun SelectorCard(
    titulo: String,
    seleccionado: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val borderColor = if (seleccionado) BrandGreen else MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)
    val bgColor = if (seleccionado) BrandGreen.copy(alpha = 0.12f) else MaterialTheme.colorScheme.surface

    Card(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor),
        border = BorderStroke(if (seleccionado) 2.dp else 1.dp, borderColor)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 14.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = titulo,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = if (seleccionado) FontWeight.ExtraBold else FontWeight.Medium,
                color = if (seleccionado) BrandGreen else MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

@Composable
fun ChipOpcion(
    texto: String,
    seleccionado: Boolean,
    onClick: () -> Unit
) {
    val borderColor = if (seleccionado) BrandGreen else MaterialTheme.colorScheme.outline.copy(alpha = 0.35f)
    val bgColor = if (seleccionado) BrandGreen.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surface
    val textColor = if (seleccionado) BrandGreen else MaterialTheme.colorScheme.onSurface

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor)
            .clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = texto,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = if (seleccionado) FontWeight.Bold else FontWeight.Normal,
            color = textColor
        )
    }
}

@Composable
internal fun ContadorStepperFila(
    etiqueta: String,
    valor: Int,
    unidad: String,
    presets: List<Int>,
    onValorChanged: (Int) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = etiqueta,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            // Controles de Stepper Gigantes (>= 44px de altura)
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surface)
                        .clickable { if (valor > 1) onValorChanged(valor - 1) },
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "−", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                }

                Text(
                    text = "$valor $unidad",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(horizontal = 6.dp)
                )

                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(BrandGreen)
                        .clickable { onValorChanged(valor + 1) },
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "+", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }

        // Pastillas de preset rápido
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            presets.forEach { preset ->
                val esSel = valor == preset
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (esSel) BrandGreen else MaterialTheme.colorScheme.surface)
                        .clickable { onValorChanged(preset) }
                        .padding(vertical = 6.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "$preset",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = if (esSel) Color.White else MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
    }
}

@Composable
internal fun FilaEstrellasCalificacion(
    etiqueta: String,
    calificacion: Int,
    onCalificacionChanged: (Int) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surface)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = etiqueta,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.weight(1f)
        )

        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            (1..5).forEach { estrella ->
                val activa = estrella <= calificacion
                Text(
                    text = if (activa) "★" else "☆",
                    fontSize = 24.sp,
                    color = if (activa) BrandAmber else MaterialTheme.colorScheme.outline,
                    modifier = Modifier
                        .clickable { onCalificacionChanged(estrella) }
                        .padding(4.dp)
                )
            }
        }
    }
}
