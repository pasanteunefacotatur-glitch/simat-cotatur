package com.cotatur.simat.data.remote

import com.cotatur.simat.data.local.EncuestaPrestadorLocal
import com.cotatur.simat.data.local.EncuestaTuristicaLocal

/**
 * Serializador puro (sin dependencias de stubs Android) para mapear entidades
 * SQLite locales al contrato JSON exacto de las RPCs de Supabase PostgreSQL.
 */
object SyncPayloadMapper {
    private val UUID_REGEX = Regex(
        "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    )

    private val PUNTOS_SEMILLA_UUID = mapOf(
        "PEAJE_TARIBA" to "a07731b0-c77a-4df8-8cc6-95396d6743e9",
        "PEAJE_CAMPANA" to "674525d8-2fd8-455a-af0f-a71c1854bdfb",
        "TERMINAL_SC" to "64d20a51-333e-478f-95cc-a45d05e96edb",
        "PUENTE_ATANASIO" to "d4249187-3b50-4bc6-9a05-f85160a6b479",
        "PERIBECA_PUEBLO" to "9dc01181-7f8f-4f91-9c54-66aec8c580c5",
        "CHORRO_EL_INDIO" to "fafd9b9b-54ff-42d2-8949-d636ccf912e2"
    )

    val COORDENADAS_SEMILLA = mapOf(
        "PEAJE_TARIBA" to Pair(7.7986, -72.2156),
        "PEAJE_CAMPANA" to Pair(7.5712, -72.0942),
        "TERMINAL_SC" to Pair(7.7569, -72.2389),
        "PUENTE_ATANASIO" to Pair(7.8548, -72.4432),
        "PERIBECA_PUEBLO" to Pair(7.7795, -72.3081),
        "CHORRO_EL_INDIO" to Pair(7.7501, -72.1643)
    )

    fun resolverPuntoUuid(puntoCodigo: String, puntoUuidMap: Map<String, String>): String? {
        val code = puntoCodigo.trim().uppercase()
        val match = puntoUuidMap[code] ?: PUNTOS_SEMILLA_UUID[code]
        return match?.takeIf { UUID_REGEX.matches(it) }
    }

    fun esUuidValido(valor: String?): Boolean {
        return !valor.isNullOrBlank() && UUID_REGEX.matches(valor.trim())
    }

    fun construirBodySincronizarTuristas(
        token: String,
        encuestas: List<EncuestaTuristicaLocal>,
        puntoUuidMap: Map<String, String>
    ): String {
        val itemsJson = encuestas.mapNotNull { enc ->
            val puntoUuid = resolverPuntoUuid(enc.puntoCodigo, puntoUuidMap) ?: return@mapNotNull null
            encuestaTuristaAJson(enc, puntoUuid)
        }
        return "{\"p_token\":${jsonStr(token)},\"p_encuestas\":[${itemsJson.joinToString(",")}]}"
    }

    fun construirBodySincronizarPrestadores(
        token: String,
        prestadores: List<EncuestaPrestadorLocal>,
        puntoUuidMap: Map<String, String>
    ): String {
        val itemsJson = prestadores.mapNotNull { pst ->
            val puntoUuid = resolverPuntoUuid(pst.puntoCodigo, puntoUuidMap) ?: return@mapNotNull null
            prestadorAJson(pst, puntoUuid)
        }
        return "{\"p_token\":${jsonStr(token)},\"p_prestadores\":[${itemsJson.joinToString(",")}]}"
    }

    private fun encuestaTuristaAJson(enc: EncuestaTuristicaLocal, puntoUuid: String): String {
        val fixUuid = enc.gpsFixId?.trim()?.takeIf { UUID_REGEX.matches(it) }
        val duracionSeg = enc.duracionLlenadoSeg.coerceAtLeast(10)
        val rawTemp = enc.respuestasTemporadaJson.trim()
        val respuestasObj = if (rawTemp.startsWith("{") && rawTemp.endsWith("}")) rawTemp else "{}"

        return buildString {
            append('{')
            append("\"id\":").append(jsonStr(enc.id)).append(',')
            append("\"punto_captura_id\":").append(jsonStr(puntoUuid)).append(',')
            append("\"captured_at\":").append(jsonStr(enc.capturedAt)).append(',')
            append("\"duracion_llenado_seg\":").append(duracionSeg).append(',')
            append("\"boot_count_capture\":").append(enc.bootCountCapture).append(',')
            append("\"reloj_no_verificado\":").append(enc.relojNoVerificado).append(',')
            append("\"gps_lat\":").append(enc.gpsLat ?: "null").append(',')
            append("\"gps_lng\":").append(enc.gpsLng ?: "null").append(',')
            append("\"gps_precision_m\":").append(enc.gpsPrecisionM ?: "null").append(',')
            append("\"gps_es_simulado\":").append(enc.gpsEsSimulado).append(',')
            append("\"gps_es_cache\":").append(enc.gpsEsCache).append(',')
            append("\"gps_fix_id\":").append(fixUuid?.let(::jsonStr) ?: "null").append(',')
            append("\"procedencia_tipo\":").append(jsonStr(enc.procedenciaTipo)).append(',')
            append("\"estado_origen\":").append(enc.estadoOrigen?.let(::jsonStr) ?: "null").append(',')
            append("\"pais_origen\":").append(jsonStr(enc.paisOrigen ?: "Venezuela")).append(',')
            append("\"municipio_destino\":").append(jsonStr(enc.municipioDestino)).append(',')
            append("\"motivo_viaje\":").append(jsonStr(enc.motivoViaje)).append(',')
            append("\"tipo_alojamiento\":").append(jsonStr(enc.tipoAlojamiento)).append(',')
            append("\"grupo_tamano\":").append(enc.grupoTamano.coerceAtLeast(1)).append(',')
            append("\"dias_estadia\":").append(enc.diasEstadia.coerceAtLeast(1)).append(',')
            append("\"temporada_codigo\":").append(jsonStr(enc.temporadaCodigo.ifBlank { "REGULAR" })).append(',')
            append("\"respuestas_temporada\":").append(respuestasObj).append(',')
            append("\"calif_vialidad\":").append(enc.califVialidad.coerceIn(1, 5)).append(',')
            append("\"calif_seguridad\":").append(enc.califSeguridad.coerceIn(1, 5)).append(',')
            append("\"calif_hospitalidad\":").append(enc.califHospitalidad.coerceIn(1, 5)).append(',')
            append("\"calif_servicios_publicos\":").append(enc.califServiciosPublicos.coerceIn(1, 5))
            append('}')
        }
    }

    private fun prestadorAJson(pst: EncuestaPrestadorLocal, puntoUuid: String): String {
        return buildString {
            append('{')
            append("\"id\":").append(jsonStr(pst.id)).append(',')
            append("\"punto_id\":").append(jsonStr(puntoUuid)).append(',')
            append("\"temporada_codigo\":").append(jsonStr(pst.temporadaCodigo.ifBlank { "REGULAR" })).append(',')
            append("\"nombre_establecimiento\":").append(jsonStr(pst.nombreEstablecimiento)).append(',')
            append("\"tipo_prestador\":").append(jsonStr(pst.tipoPrestador)).append(',')
            append("\"municipio\":").append(jsonStr(pst.municipio)).append(',')
            append("\"habitaciones_disponibles\":").append(pst.habitacionesDisponibles.coerceAtLeast(0)).append(',')
            append("\"habitaciones_ocupadas\":").append(pst.habitacionesOcupadas.coerceAtLeast(0)).append(',')
            append("\"porcentaje_ocupacion_rango\":").append(jsonStr(pst.porcentajeOcupacionRango)).append(',')
            append("\"tarifa_promedio_usd\":").append(pst.tarifaPromedioUsd.coerceAtLeast(0.0)).append(',')
            append("\"evaluacion_temporada\":").append(jsonStr(pst.evaluacionTemporada)).append(',')
            append("\"dificultades_operativas\":").append(pst.dificultadesOperativas?.let(::jsonStr) ?: "null").append(',')
            append("\"calif_seguridad_acompanamiento\":").append(pst.califSeguridadAcompanamiento.coerceIn(1, 5)).append(',')
            append("\"created_at\":").append(jsonStr(pst.createdAt))
            append('}')
        }
    }

    private fun jsonStr(value: String): String {
        val sb = StringBuilder(value.length + 4)
        sb.append('"')
        for (ch in value) {
            when (ch) {
                '\\' -> sb.append("\\\\")
                '"' -> sb.append("\\\"")
                '\b' -> sb.append("\\b")
                '\n' -> sb.append("\\n")
                '\r' -> sb.append("\\r")
                '\t' -> sb.append("\\t")
                else -> if (ch < ' ') {
                    sb.append("\\u%04x".format(ch.code))
                } else {
                    sb.append(ch)
                }
            }
        }
        sb.append('"')
        return sb.toString()
    }
}
