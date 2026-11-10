package com.cotatur.simat.data.local

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Repositorio de acceso a datos para encuestas turísticas y de prestadores.
 * Operaciones 100% thread-safe y optimizadas en Dispatchers.IO.
 */
class EncuestaRepository(context: Context) {
    private val dbHelper = SimatDbHelper.getInstance(context)
    private val repoScope = CoroutineScope(Dispatchers.IO)

    private val _pendientesCount = MutableStateFlow(0)
    val pendientesCount: StateFlow<Int> = _pendientesCount.asStateFlow()

    init {
        actualizarContadorPendientesAsync()
    }

    private fun ahoraIso(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(Date())
    }

    suspend fun guardarEncuestaTurista(encuesta: EncuestaTuristicaLocal): Boolean = withContext(Dispatchers.IO) {
        val db = dbHelper.writableDatabase
        val values = ContentValues().apply {
            put("id", encuesta.id)
            put("canal", encuesta.canal)
            put("punto_codigo", encuesta.puntoCodigo)
            put("temporada_codigo", encuesta.temporadaCodigo)
            put("funcionario_cedula", encuesta.funcionarioCedula)
            put("captured_at", encuesta.capturedAt)
            put("duracion_llenado_seg", encuesta.duracionLlenadoSeg)
            put("boot_count_capture", encuesta.bootCountCapture)
            put("reloj_no_verificado", if (encuesta.relojNoVerificado) 1 else 0)
            put("gps_lat", encuesta.gpsLat)
            put("gps_lng", encuesta.gpsLng)
            put("gps_precision_m", encuesta.gpsPrecisionM)
            put("gps_es_simulado", if (encuesta.gpsEsSimulado) 1 else 0)
            put("gps_es_cache", if (encuesta.gpsEsCache) 1 else 0)
            put("gps_fix_id", encuesta.gpsFixId)
            put("gps_fuera_de_punto", if (encuesta.gpsFueraDePunto) 1 else 0)
            put("distancia_punto_m", encuesta.distanciaPuntoM)
            put("procedencia_tipo", encuesta.procedenciaTipo)
            put("estado_origen", encuesta.estadoOrigen)
            put("pais_origen", encuesta.paisOrigen)
            put("municipio_destino", encuesta.municipioDestino)
            put("motivo_viaje", encuesta.motivoViaje)
            put("tipo_alojamiento", encuesta.tipoAlojamiento)
            put("grupo_tamano", encuesta.grupoTamano)
            put("dias_estadia", encuesta.diasEstadia)
            put("calif_vialidad", encuesta.califVialidad)
            put("calif_seguridad", encuesta.califSeguridad)
            put("calif_hospitalidad", encuesta.califHospitalidad)
            put("calif_servicios_publicos", encuesta.califServiciosPublicos)
            put("respuestas_temporada_json", encuesta.respuestasTemporadaJson)
            put("sincronizado", if (encuesta.sincronizado) 1 else 0)
            put("sincronizado_at", encuesta.sincronizadoAt)
            put("created_at", ahoraIso())
        }

        val rowId = db.insertWithOnConflict(
            "encuestas_turisticas_local",
            null,
            values,
            android.database.sqlite.SQLiteDatabase.CONFLICT_REPLACE
        )

        val exito = rowId != -1L
        if (exito) {
            actualizarContadorPendientesInterno()
        }
        exito
    }

    suspend fun guardarEncuestaPrestador(prestador: EncuestaPrestadorLocal): Boolean = withContext(Dispatchers.IO) {
        val db = dbHelper.writableDatabase
        val values = ContentValues().apply {
            put("id", prestador.id)
            put("punto_codigo", prestador.puntoCodigo)
            put("funcionario_cedula", prestador.funcionarioCedula)
            put("temporada_codigo", prestador.temporadaCodigo)
            put("nombre_establecimiento", prestador.nombreEstablecimiento)
            put("tipo_prestador", prestador.tipoPrestador)
            put("municipio", prestador.municipio)
            put("habitaciones_disponibles", prestador.habitacionesDisponibles)
            put("habitaciones_ocupadas", prestador.habitacionesOcupadas)
            put("porcentaje_ocupacion_rango", prestador.porcentajeOcupacionRango)
            put("tarifa_promedio_usd", prestador.tarifaPromedioUsd)
            put("evaluacion_temporada", prestador.evaluacionTemporada)
            put("dificultades_operativas", prestador.dificultadesOperativas)
            put("calif_seguridad_acompanamiento", prestador.califSeguridadAcompanamiento)
            put("captured_at", prestador.capturedAt)
            put("sincronizado", if (prestador.sincronizado) 1 else 0)
            put("sincronizado_at", prestador.sincronizadoAt)
            put("created_at", ahoraIso())
        }

        val rowId = db.insertWithOnConflict(
            "encuestas_prestadores_local",
            null,
            values,
            android.database.sqlite.SQLiteDatabase.CONFLICT_REPLACE
        )

        val exito = rowId != -1L
        if (exito) {
            actualizarContadorPendientesInterno()
        }
        exito
    }

    suspend fun obtenerPendientesTuristas(limite: Int = 100): List<EncuestaTuristicaLocal> = withContext(Dispatchers.IO) {
        val db = dbHelper.readableDatabase
        val list = mutableListOf<EncuestaTuristicaLocal>()
        val query = "SELECT * FROM encuestas_turisticas_local WHERE sincronizado = 0 ORDER BY captured_at ASC LIMIT ?"
        db.rawQuery(query, arrayOf(limite.toString())).use { cursor ->
            while (cursor.moveToNext()) {
                list.add(mapearCursorTurista(cursor))
            }
        }
        list
    }

    suspend fun marcarTuristasSincronizadas(ids: List<String>) = withContext(Dispatchers.IO) {
        if (ids.isEmpty()) return@withContext
        val db = dbHelper.writableDatabase
        val ahora = ahoraIso()
        db.beginTransaction()
        try {
            val stmt = db.compileStatement("UPDATE encuestas_turisticas_local SET sincronizado = 1, sincronizado_at = ? WHERE id = ?")
            for (id in ids) {
                stmt.bindString(1, ahora)
                stmt.bindString(2, id)
                stmt.executeUpdateDelete()
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
        actualizarContadorPendientesInterno()
    }

    suspend fun contarPendientesTotal(): Int = withContext(Dispatchers.IO) {
        val db = dbHelper.readableDatabase
        var count = 0
        db.rawQuery("SELECT COUNT(*) FROM encuestas_turisticas_local WHERE sincronizado = 0", null).use {
            if (it.moveToNext()) count += it.getInt(0)
        }
        db.rawQuery("SELECT COUNT(*) FROM encuestas_prestadores_local WHERE sincronizado = 0", null).use {
            if (it.moveToNext()) count += it.getInt(0)
        }
        count
    }

    private fun actualizarContadorPendientesAsync() {
        repoScope.launch {
            actualizarContadorPendientesInterno()
        }
    }

    private fun actualizarContadorPendientesInterno() {
        try {
            val db = dbHelper.readableDatabase
            var count = 0
            db.rawQuery("SELECT COUNT(*) FROM encuestas_turisticas_local WHERE sincronizado = 0", null).use {
                if (it.moveToNext()) count += it.getInt(0)
            }
            db.rawQuery("SELECT COUNT(*) FROM encuestas_prestadores_local WHERE sincronizado = 0", null).use {
                if (it.moveToNext()) count += it.getInt(0)
            }
            _pendientesCount.value = count
        } catch (_: Exception) {}
    }

    private fun mapearCursorTurista(c: Cursor): EncuestaTuristicaLocal {
        return EncuestaTuristicaLocal(
            id = c.getString(c.getColumnIndexOrThrow("id")),
            canal = c.getString(c.getColumnIndexOrThrow("canal")),
            puntoCodigo = c.getString(c.getColumnIndexOrThrow("punto_codigo")),
            temporadaCodigo = c.getString(c.getColumnIndexOrThrow("temporada_codigo")),
            funcionarioCedula = c.getString(c.getColumnIndexOrThrow("funcionario_cedula")),
            capturedAt = c.getString(c.getColumnIndexOrThrow("captured_at")),
            duracionLlenadoSeg = c.getInt(c.getColumnIndexOrThrow("duracion_llenado_seg")),
            bootCountCapture = c.getInt(c.getColumnIndexOrThrow("boot_count_capture")),
            relojNoVerificado = c.getInt(c.getColumnIndexOrThrow("reloj_no_verificado")) == 1,
            gpsLat = if (c.isNull(c.getColumnIndexOrThrow("gps_lat"))) null else c.getDouble(c.getColumnIndexOrThrow("gps_lat")),
            gpsLng = if (c.isNull(c.getColumnIndexOrThrow("gps_lng"))) null else c.getDouble(c.getColumnIndexOrThrow("gps_lng")),
            gpsPrecisionM = if (c.isNull(c.getColumnIndexOrThrow("gps_precision_m"))) null else c.getFloat(c.getColumnIndexOrThrow("gps_precision_m")),
            gpsEsSimulado = c.getInt(c.getColumnIndexOrThrow("gps_es_simulado")) == 1,
            gpsEsCache = c.getInt(c.getColumnIndexOrThrow("gps_es_cache")) == 1,
            gpsFixId = c.getString(c.getColumnIndexOrThrow("gps_fix_id")),
            gpsFueraDePunto = c.getInt(c.getColumnIndexOrThrow("gps_fuera_de_punto")) == 1,
            distanciaPuntoM = c.getInt(c.getColumnIndexOrThrow("distancia_punto_m")),
            procedenciaTipo = c.getString(c.getColumnIndexOrThrow("procedencia_tipo")),
            estadoOrigen = c.getString(c.getColumnIndexOrThrow("estado_origen")),
            paisOrigen = c.getString(c.getColumnIndexOrThrow("pais_origen")),
            municipioDestino = c.getString(c.getColumnIndexOrThrow("municipio_destino")),
            motivoViaje = c.getString(c.getColumnIndexOrThrow("motivo_viaje")),
            tipoAlojamiento = c.getString(c.getColumnIndexOrThrow("tipo_alojamiento")),
            grupoTamano = c.getInt(c.getColumnIndexOrThrow("grupo_tamano")),
            diasEstadia = c.getInt(c.getColumnIndexOrThrow("dias_estadia")),
            califVialidad = c.getInt(c.getColumnIndexOrThrow("calif_vialidad")),
            califSeguridad = c.getInt(c.getColumnIndexOrThrow("calif_seguridad")),
            califHospitalidad = c.getInt(c.getColumnIndexOrThrow("calif_hospitalidad")),
            califServiciosPublicos = c.getInt(c.getColumnIndexOrThrow("calif_servicios_publicos")),
            respuestasTemporadaJson = c.getString(c.getColumnIndexOrThrow("respuestas_temporada_json")),
            sincronizado = c.getInt(c.getColumnIndexOrThrow("sincronizado")) == 1,
            sincronizadoAt = c.getString(c.getColumnIndexOrThrow("sincronizado_at")),
            createdAt = c.getString(c.getColumnIndexOrThrow("created_at"))
        )
    }
}
