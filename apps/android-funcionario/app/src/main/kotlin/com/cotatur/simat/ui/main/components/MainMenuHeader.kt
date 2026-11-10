package com.cotatur.simat.ui.main.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cotatur.simat.ui.theme.AppThemeMode
import com.cotatur.simat.ui.theme.BrandAmberDark
import com.cotatur.simat.ui.theme.BrandGreen

/**
 * Cabecera institucional con logos, selector de punto, Outbox y selector de tema.
 */
@Composable
fun HeaderInstitucional(
    puntoNombre: String,
    pendientesCount: Int,
    currentTheme: AppThemeMode,
    usuarioNombre: String = "",
    usuarioRol: String = "ENCUESTADOR",
    esSupervisor: Boolean = false,
    onCerrarSesion: () -> Unit = {},
    onOutboxClick: () -> Unit,
    onAjustesClick: () -> Unit,
    onToggleTheme: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Identidad Institucional
                Column {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "🏔️",
                            fontSize = 18.sp
                        )
                        Text(
                            text = "SIMAT • COTATUR",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                    Text(
                        text = "Gobernación del Estado Táchira",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Controles de cabecera: Outbox Badge + Selector de Tema
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Outbox Badge (Bandeja de Salida Offline)
                    OutboxBadgeButton(
                        pendientesCount = pendientesCount,
                        onClick = onOutboxClick
                    )

                    // Botón de alternancia de tema (AMOLED / Claro / Oscuro)
                    IconButton(
                        onClick = onToggleTheme,
                        modifier = Modifier
                            .size(38.dp)
                            .background(
                                color = MaterialTheme.colorScheme.surfaceVariant,
                                shape = CircleShape
                            )
                    ) {
                        Text(
                            text = when (currentTheme) {
                                AppThemeMode.AMOLED -> "⚫"
                                AppThemeMode.LIGHT -> "☀️"
                                AppThemeMode.DARK -> "🌙"
                                AppThemeMode.SYSTEM -> "⚙️"
                            },
                            fontSize = 14.sp
                        )
                    }
                }
            }

            // Identidad del Usuario Autenticado y Botón Cerrar Sesión
            if (usuarioNombre.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(text = if (esSupervisor) "🛡️" else "📋", fontSize = 14.sp)
                        Column {
                            Text(
                                text = usuarioNombre,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = if (esSupervisor) "SUPERVISOR OFICIAL" else "ENCUESTADOR DE CAMPO",
                                style = MaterialTheme.typography.labelSmall,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black,
                                color = if (esSupervisor) BrandAmberDark else BrandGreen
                            )
                        }
                    }

                    TextButton(
                        onClick = onCerrarSesion,
                        contentPadding = PaddingValues(horizontal = 6.dp, vertical = 0.dp)
                    ) {
                        Text(
                            text = "Cerrar Sesión 🚪",
                            style = MaterialTheme.typography.labelSmall,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFEF4444)
                        )
                    }
                }
            }

            // Punto de Control Asignado (Clickable para cambiar de punto)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f))
                    .clickable { onAjustesClick() }
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(text = "📍", fontSize = 14.sp)
                    Column {
                        Text(
                            text = "PUNTO DE CONTROL ACTIVO",
                            style = MaterialTheme.typography.labelSmall,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = puntoNombre,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
                Text(
                    text = "Cambiar ▾",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

/**
 * Badge visual de la cola local de salida (Outbox).
 */
@Composable
fun OutboxBadgeButton(
    pendientesCount: Int,
    onClick: () -> Unit
) {
    val esVacio = pendientesCount == 0
    val badgeBg = if (esVacio) Color(0xFF198754).copy(alpha = 0.15f) else Color(0xFFFFC107).copy(alpha = 0.2f)
    val badgeText = if (esVacio) Color(0xFF198754) else Color(0xFFD97706)

    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(badgeBg)
            .clickable { onClick() }
            .padding(horizontal = 10.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(5.dp)
    ) {
        Text(
            text = if (esVacio) "✅" else "📦",
            fontSize = 12.sp
        )
        Text(
            text = if (esVacio) "Al día" else "$pendientesCount por subir",
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.ExtraBold,
            color = badgeText
        )
    }
}
