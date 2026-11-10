package com.cotatur.simat.ui.supervision.models

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR
 * ARCHIVO: SupervisionModels.kt
 * DESCRIPCIÓN: Modelos de datos y utilidades de conectividad para el módulo de supervisión.
 * ==============================================================================
 */

data class KpiResumenSupervision(
    val totalVisitantesHoy: Int = 1420,
    val totalGruposHoy: Int = 412,
    val ocupacionHoteleraPct: Int = 84,
    val gastoPromedioUsd: Double = 38.5,
    val pernoctaPromedioDias: Double = 3.2
)

data class EstadoPeajeAuditoria(
    val codigo: String,
    val nombre: String,
    val encuestadorNombre: String,
    val encuestadorCedula: String,
    val encuestasHoy: Int,
    val distanciaM: Int,
    val fueraDePunto: Boolean,
    val esSimulado: Boolean,
    val ultimaSincronizacionMin: Int
)

/**
 * Función utilitaria para verificar conectividad activa a Internet.
 */
fun verificarInternetActivo(context: Context): Boolean {
    val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
    val network = cm.activeNetwork ?: return false
    val capabilities = cm.getNetworkCapabilities(network) ?: return false
    return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
}
