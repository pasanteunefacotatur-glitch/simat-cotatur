package com.cotatur.simat.data.local

import androidx.compose.runtime.Immutable
import kotlinx.serialization.Serializable
import java.util.UUID

/**
 * Modelo inmutable para encuestas de demanda turística en campo.
 */
@Immutable
@Serializable
data class EncuestaTuristicaLocal(
    val id: String = UUID.randomUUID().toString(),
    val canal: String = "APK",
    val puntoCodigo: String,
    val temporadaCodigo: String = "REGULAR",
    val funcionarioCedula: String,
    val capturedAt: String,
    val duracionLlenadoSeg: Int,
    val bootCountCapture: Int = 0,
    val relojNoVerificado: Boolean = false,
    val gpsLat: Double? = null,
    val gpsLng: Double? = null,
    val gpsPrecisionM: Float? = null,
    val gpsEsSimulado: Boolean = false,
    val gpsEsCache: Boolean = false,
    val gpsFixId: String? = null,
    val gpsFueraDePunto: Boolean = false,
    val distanciaPuntoM: Int = 0,
    val procedenciaTipo: String, // "NACIONAL" o "INTERNACIONAL"
    val estadoOrigen: String? = null,
    val paisOrigen: String? = "Venezuela",
    val municipioDestino: String,
    val motivoViaje: String,
    val tipoAlojamiento: String,
    val grupoTamano: Int = 1,
    val diasEstadia: Int = 1,
    val califVialidad: Int = 5,
    val califSeguridad: Int = 5,
    val califHospitalidad: Int = 5,
    val califServiciosPublicos: Int = 5,
    val respuestasTemporadaJson: String = "{}",
    val sincronizado: Boolean = false,
    val sincronizadoAt: String? = null,
    val createdAt: String
)

/**
 * Modelo inmutable para censo de prestadores de servicios turísticos (PST).
 */
@Immutable
@Serializable
data class EncuestaPrestadorLocal(
    val id: String = UUID.randomUUID().toString(),
    val puntoCodigo: String,
    val funcionarioCedula: String,
    val temporadaCodigo: String = "REGULAR",
    val nombreEstablecimiento: String,
    val tipoPrestador: String, // HOTEL, POSADA, CAMPAMENTO, RESTAURANTE, TRANSPORTE
    val municipio: String,
    val habitacionesDisponibles: Int = 0,
    val habitacionesOcupadas: Int = 0,
    val porcentajeOcupacionRango: String = "0-25%",
    val tarifaPromedioUsd: Double = 0.0,
    val evaluacionTemporada: String = "IGUAL",
    val dificultadesOperativas: String? = null,
    val califSeguridadAcompanamiento: Int = 5,
    val capturedAt: String,
    val sincronizado: Boolean = false,
    val sincronizadoAt: String? = null,
    val createdAt: String
)

/**
 * Pregunta dinámica generada por el supervisor en admin.html y cacheada en el APK.
 */
@Immutable
@Serializable
data class PreguntaDinamicaLocal(
    val id: String,
    val temporadaCodigo: String,
    val label: String,
    val tipo: String, // CHIPS_SINGLE, CHIPS_MULTI, RATING_5, NUMBER_STEPPER, TEXT_SHORT
    val opciones: List<String>,
    val orden: Int = 0,
    val requerido: Boolean = false,
    val activo: Boolean = true,
    val version: String = "1.0"
)
