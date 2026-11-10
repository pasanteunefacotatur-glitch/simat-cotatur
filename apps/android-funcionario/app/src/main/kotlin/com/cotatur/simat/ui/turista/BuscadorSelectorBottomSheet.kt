package com.cotatur.simat.ui.turista

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cotatur.simat.ui.theme.BrandAmber
import com.cotatur.simat.ui.theme.BrandGreen
import java.text.Normalizer

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR
 * ARCHIVO: BuscadorSelectorBottomSheet.kt
 * DESCRIPCIÓN: Modal Bottom Sheet optimizado para pantallas táctiles móviles.
 *              - Búsqueda instantánea con foco automático de teclado.
 *              - Altura táctil generosa (>= 52dp) para uso con el pulgar.
 *              - Selección en un solo toque (One-Tap Selection) con cierre inmediato.
 *              - Opción de valor personalizado si no se encuentra en el catálogo.
 * ==============================================================================
 */

data class ItemBuscador(
    val valor: String,
    val etiqueta: String,
    val subtitulo: String? = null,
    val icono: String = "📍"
)

fun normalizarTexto(texto: String): String {
    return Normalizer.normalize(texto, Normalizer.Form.NFD)
        .replace("\\p{InCombiningDiacriticalMarks}+".toRegex(), "")
        .lowercase()
        .trim()
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BuscadorSelectorBottomSheet(
    titulo: String,
    subtitulo: String = "Seleccione una opción de la lista o escriba para filtrar",
    placeholderBusqueda: String = "Escriba para filtrar...",
    elementos: List<ItemBuscador>,
    elementoSeleccionado: String?,
    permitirPersonalizado: Boolean = true,
    onSeleccionar: (String) -> Unit,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var filtro by remember { mutableStateOf("") }
    val focusRequester = remember { FocusRequester() }

    // Solicitar foco al abrir el modal para que el encuestador pueda tipear de inmediato
    LaunchedEffect(Unit) {
        try {
            focusRequester.requestFocus()
        } catch (_: Exception) {}
    }

    val filtroNormalizado = remember(filtro) { normalizarTexto(filtro) }

    val elementosFiltrados = remember(filtroNormalizado, elementos) {
        if (filtroNormalizado.isBlank()) {
            elementos
        } else {
            elementos.filter { item ->
                normalizarTexto(item.etiqueta).contains(filtroNormalizado) ||
                (item.subtitulo != null && normalizarTexto(item.subtitulo).contains(filtroNormalizado))
            }
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        dragHandle = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 10.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .width(48.dp)
                        .height(5.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                )
            }
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp)
                .padding(bottom = 24.dp)
        ) {
            // Cabecera del Bottom Sheet
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = titulo,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = subtitulo,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 12.sp
                    )
                }

                // Botón cerrar táctil
                Surface(
                    onClick = onDismiss,
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                    modifier = Modifier.size(36.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(text = "✕", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Campo de Búsqueda Instantánea con Autoenfoque
            OutlinedTextField(
                value = filtro,
                onValueChange = { filtro = it },
                placeholder = { Text(placeholderBusqueda, fontSize = 13.sp) },
                leadingIcon = { Text("🔍", fontSize = 14.sp) },
                trailingIcon = {
                    if (filtro.isNotBlank()) {
                        Text(
                            text = "✕",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.outline,
                            modifier = Modifier
                                .clip(CircleShape)
                                .clickable { filtro = "" }
                                .padding(8.dp)
                        )
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .focusRequester(focusRequester),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = BrandGreen,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.4f),
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface
                )
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Contador de resultados o sugerencias
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (filtro.isBlank()) "Opciones disponibles (${elementos.size}):" else "Coincidencias (${elementosFiltrados.size}):",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Toque 1 vez para seleccionar",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.outline
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Lista Vertical Deslizable de Opciones (Táctil >= 52dp)
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 380.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                // Opción personalizada si escribe y no existe coincidencia exacta
                if (permitirPersonalizado && filtro.trim().length >= 2 &&
                    elementosFiltrados.none { normalizarTexto(it.etiqueta) == filtroNormalizado }
                ) {
                    item {
                        Surface(
                            onClick = {
                                onSeleccionar(filtro.trim())
                                onDismiss()
                            },
                            shape = RoundedCornerShape(12.dp),
                            color = BrandAmber.copy(alpha = 0.12f),
                            border = androidx.compose.foundation.BorderStroke(1.dp, BrandAmber.copy(alpha = 0.6f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(text = "➕", fontSize = 16.sp)
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = "Usar \"${filtro.trim()}\"",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = "Registrar como valor no listado",
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }

                if (elementosFiltrados.isEmpty() && (!permitirPersonalizado || filtro.trim().length < 2)) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "No se encontraron coincidencias para \"$filtro\"",
                                color = MaterialTheme.colorScheme.outline,
                                fontSize = 13.sp
                            )
                        }
                    }
                }

                items(elementosFiltrados, key = { it.valor }) { item ->
                    val esSeleccionado = elementoSeleccionado == item.valor
                    Surface(
                        onClick = {
                            onSeleccionar(item.valor)
                            onDismiss()
                        },
                        shape = RoundedCornerShape(12.dp),
                        color = if (esSeleccionado) BrandGreen.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (esSeleccionado) BrandGreen else Color.Transparent
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 13.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    text = item.icono,
                                    fontSize = 18.sp,
                                    modifier = Modifier.padding(end = 12.dp)
                                )
                                Column {
                                    Text(
                                        text = item.etiqueta,
                                        fontWeight = if (esSeleccionado) FontWeight.Bold else FontWeight.SemiBold,
                                        fontSize = 14.sp,
                                        color = if (esSeleccionado) BrandGreen else MaterialTheme.colorScheme.onSurface
                                    )
                                    if (!item.subtitulo.isNullOrBlank()) {
                                        Text(
                                            text = item.subtitulo,
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.outline
                                        )
                                    }
                                }
                            }

                            if (esSeleccionado) {
                                Text(
                                    text = "✓",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = BrandGreen
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
