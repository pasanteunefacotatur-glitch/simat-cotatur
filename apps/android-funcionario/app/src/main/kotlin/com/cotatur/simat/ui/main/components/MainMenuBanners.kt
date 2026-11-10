package com.cotatur.simat.ui.main.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.cotatur.simat.ota.OtaProgressState
import com.cotatur.simat.ota.VersionInfo
import com.cotatur.simat.ui.theme.AppThemeMode
import com.cotatur.simat.ui.theme.BrandAmber
import com.cotatur.simat.ui.theme.BrandGreen

/**
 * Banner de notificación de actualización remota (OTA) con progreso en vivo.
 */
@Composable
fun BannerActualizacionOta(
    updateInfo: VersionInfo,
    estadoOta: OtaProgressState,
    onInstalarClick: () -> Unit,
    onAbrirNavegadorClick: () -> Unit,
    onReintentarClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = BrandAmber.copy(alpha = 0.15f)),
        border = BorderStroke(1.dp, BrandAmber)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .background(BrandAmber, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "🚀", fontSize = 20.sp)
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Actualización v${updateInfo.versionName} disponible",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = BrandAmber
                    )
                    Text(
                        text = updateInfo.changelog,
                        style = MaterialTheme.typography.bodyMedium,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2
                    )
                }

                when (estadoOta) {
                    is OtaProgressState.Inactivo -> {
                        Button(
                            onClick = onInstalarClick,
                            colors = ButtonDefaults.buttonColors(containerColor = BrandAmber),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Actualizar", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 11.sp)
                        }
                    }
                    is OtaProgressState.Descargando -> {
                        Text(
                            text = "${(estadoOta.progreso * 100).toInt()}%",
                            fontWeight = FontWeight.Black,
                            fontSize = 14.sp,
                            color = BrandAmber
                        )
                    }
                    is OtaProgressState.VerificandoIntegridad -> {
                        Text(
                            text = "Verificando...",
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            color = BrandAmber
                        )
                    }
                    is OtaProgressState.ListoParaInstalar -> {
                        Button(
                            onClick = onInstalarClick,
                            colors = ButtonDefaults.buttonColors(containerColor = BrandGreen),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Instalar", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                        }
                    }
                    is OtaProgressState.Error -> {
                        Button(
                            onClick = onReintentarClick,
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Red),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Reintentar", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                        }
                    }
                }
            }

            // Barra de progreso y estados activos
            when (estadoOta) {
                is OtaProgressState.Descargando -> {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        LinearProgressIndicator(
                            progress = { estadoOta.progreso },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp)),
                            color = BrandAmber,
                            trackColor = BrandAmber.copy(alpha = 0.2f)
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Descargando actualización en segundo plano...",
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "%.1f MB / %.1f MB".format(estadoOta.descargadoMb, estadoOta.totalMb),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
                is OtaProgressState.VerificandoIntegridad -> {
                    Text(
                        text = "🔒 Validando firma criptográfica SHA-256...",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = BrandAmber
                    )
                }
                is OtaProgressState.Error -> {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "⚠️ ${estadoOta.mensaje}",
                            fontSize = 11.sp,
                            color = Color(0xFFFF5252),
                            lineHeight = 14.sp
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = onAbrirNavegadorClick,
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.height(34.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp)
                            ) {
                                Text("🌐 Descargar vía Navegador", fontSize = 11.sp, color = BrandAmber)
                            }
                        }
                    }
                }
                else -> {}
            }

            // Opción alternativa: descarga directa por navegador
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                Text(
                    text = "🌐 Descargar APK directo desde el navegador",
                    style = MaterialTheme.typography.labelSmall,
                    fontSize = 10.sp,
                    color = BrandAmber,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable { onAbrirNavegadorClick() }
                )
            }
        }
    }
}

/**
 * Alerta visual en caso de que el encuestador se retire más de 350m del punto asignado.
 */
@Composable
fun AlertaGeocercaFueraDeSitio(distanciaM: Int) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF2F2)),
        border = BorderStroke(1.5.dp, Color(0xFFEF4444))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(text = "⚠️", fontSize = 20.sp)
            Column {
                Text(
                    text = "Desplazamiento Fuera de Sitio Detectado",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFFB91C1C)
                )
                Text(
                    text = "Distancia al punto asignado: ${distanciaM}m (Límite: 350m). Las encuestas registrarán bandera de auditoría.",
                    style = MaterialTheme.typography.bodyMedium,
                    fontSize = 11.sp,
                    color = Color(0xFF991B1B)
                )
            }
        }
    }
}

/**
 * Barra inferior con telemetría de satélite y versión.
 */
@Composable
fun BarraEstadoInferior(
    puntoNombre: String,
    gpsDistanciaM: Int,
    gpsFueraDePunto: Boolean,
    currentTheme: AppThemeMode
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(
                        color = if (gpsFueraDePunto) Color(0xFFEF4444) else Color(0xFF10B981),
                        shape = CircleShape
                    )
            )
            Text(
                text = if (gpsFueraDePunto) "Fuera de geocerca (${gpsDistanciaM}m)" else "GPS Anclado ($puntoNombre • ${gpsDistanciaM}m)",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Text(
            text = "SIMAT v0.7.2-beta • Corporación Tachirense de Turismo • UNEFA",
            style = MaterialTheme.typography.labelSmall,
            fontSize = 10.sp,
            color = MaterialTheme.colorScheme.outline
        )
    }
}
