package com.cotatur.simat.data.local

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.Looper
import androidx.core.content.ContextCompat
import com.cotatur.simat.data.remote.SyncPayloadMapper
import kotlin.math.roundToInt

data class GpsPuntoEstado(
    val tienePermiso: Boolean = false,
    val fixDisponible: Boolean = false,
    val distanciaMetros: Int = 0,
    val fueraDePunto: Boolean = false,
    val esSimulado: Boolean = false
)

/**
 * Helper liviano de geolocalización sobre LocationManager nativo (cero dependencia de Play Services)
 * que alimenta a LocationCache con fixes reales de GPS/Red y evalúa la geocerca de 350m.
 */
object GpsTrackerHelper {

    fun tienePermisoUbicacion(context: Context): Boolean {
        val fine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
        val coarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION)
        return fine == PackageManager.PERMISSION_GRANTED || coarse == PackageManager.PERMISSION_GRANTED
    }

    @SuppressLint("MissingPermission")
    fun actualizarDesdeUltimaUbicacion(context: Context, puntoCodigo: String): GpsPuntoEstado {
        if (!tienePermisoUbicacion(context)) {
            return GpsPuntoEstado(tienePermiso = false, fixDisponible = false)
        }
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            ?: return GpsPuntoEstado(tienePermiso = true, fixDisponible = false)

        val candidates = listOf(
            LocationManager.GPS_PROVIDER,
            LocationManager.NETWORK_PROVIDER
        ).mapNotNull { provider ->
            runCatching {
                if (lm.isProviderEnabled(provider)) lm.getLastKnownLocation(provider) else null
            }.getOrNull()
        }

        val best = candidates.maxByOrNull { it.time }
        if (best != null) {
            LocationCache.actualizarFix(best)
        }
        return evaluarEstadoContraPunto(puntoCodigo, tienePermiso = true)
    }

    @SuppressLint("MissingPermission")
    fun solicitarActualizacionActiva(
        context: Context,
        puntoCodigo: String,
        onEstadoActualizado: (GpsPuntoEstado) -> Unit
    ): (() -> Unit)? {
        if (!tienePermisoUbicacion(context)) {
            onEstadoActualizado(GpsPuntoEstado(tienePermiso = false, fixDisponible = false))
            return null
        }
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return null

        val listener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                LocationCache.actualizarFix(location)
                onEstadoActualizado(evaluarEstadoContraPunto(puntoCodigo, tienePermiso = true))
            }

            @Deprecated("Deprecated in API 29")
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
            override fun onProviderEnabled(provider: String) {}
            override fun onProviderDisabled(provider: String) {}
        }

        listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER).forEach { provider ->
            runCatching {
                if (lm.isProviderEnabled(provider)) {
                    lm.requestLocationUpdates(provider, 15_000L, 25f, listener, Looper.getMainLooper())
                }
            }
        }

        onEstadoActualizado(actualizarDesdeUltimaUbicacion(context, puntoCodigo))

        return {
            runCatching { lm.removeUpdates(listener) }
        }
    }

    fun evaluarEstadoContraPunto(
        puntoCodigo: String,
        tienePermiso: Boolean = true,
        coordenadasCustom: Pair<Double, Double>? = null
    ): GpsPuntoEstado {
        val fix = LocationCache.obtenerFixValido()
            ?: return GpsPuntoEstado(tienePermiso = tienePermiso, fixDisponible = false)

        val ref = coordenadasCustom ?: SyncPayloadMapper.COORDENADAS_SEMILLA[puntoCodigo.uppercase()]
            ?: return GpsPuntoEstado(tienePermiso = tienePermiso, fixDisponible = true)

        val distanciaM = LocationCache.calcularDistanciaMetros(fix.lat, fix.lng, ref.first, ref.second)
        val distancia = distanciaM.roundToInt()
        val enGeocerca = LocationCache.estaDentroDeGeocerca(distanciaM)
        return GpsPuntoEstado(
            tienePermiso = tienePermiso,
            fixDisponible = true,
            distanciaMetros = distancia,
            fueraDePunto = !enGeocerca,
            esSimulado = fix.esSimulado
        )
    }

    fun esMock(location: Location): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            location.isMock
        } else {
            @Suppress("DEPRECATION")
            location.isFromMockProvider
        }
    }
}
