package com.cotatur.simat.data.remote

import com.cotatur.simat.data.local.EncuestaPrestadorLocal
import com.cotatur.simat.data.local.EncuestaTuristicaLocal
import com.cotatur.simat.ui.auth.AuthNetworkClient
import com.cotatur.simat.ui.supervision.models.EstadoPeajeAuditoria
import com.cotatur.simat.ui.supervision.models.KpiResumenSupervision
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

data class PuntoRemoto(
    val id: String,
    val codigo: String,
    val nombre: String,
    val municipio: String,
    val tipo: String,
    val latitud: Double?,
    val longitud: Double?,
    val activo: Boolean
)

data class TemporadaActivaInfo(
    val temporadaCodigo: String,
    val nombre: String,
    val esEspecifica: Boolean
)

data class SyncOutcome(
    val ok: Boolean,
    val sessionExpired: Boolean = false,
    val turistasInsertadas: Int = 0,
    val prestadoresInsertados: Int = 0,
    val mensaje: String
)

data class SupervisionSnapshot(
    val ok: Boolean,
    val sessionExpired: Boolean = false,
    val kpis: KpiResumenSupervision = KpiResumenSupervision(),
    val puntos: List<EstadoPeajeAuditoria> = emptyList(),
    val errorMsg: String? = null
)

/**
 * Cliente HTTP unificado para las consultas y RPCs protegidas de Supabase Cloud.
 */
object SupabaseRemoteClient {

    suspend fun fetchPuntosCaptura(): List<PuntoRemoto> = withContext(Dispatchers.IO) {
        val url = "${AuthNetworkClient.SUPABASE_URL}/rest/v1/puntos_captura" +
            "?select=id,codigo,nombre,municipio,tipo,latitud_referencia,longitud_referencia,activo&activo=eq.true&order=nombre.asc"
        val (code, body) = getJson(url)
        if (code !in 200..299) return@withContext emptyList()
        val arr = runCatching { JSONArray(body) }.getOrNull() ?: return@withContext emptyList()
        buildList {
            for (i in 0 until arr.length()) {
                val o = arr.optJSONObject(i) ?: continue
                add(
                    PuntoRemoto(
                        id = o.optString("id"),
                        codigo = o.optString("codigo").uppercase(),
                        nombre = o.optString("nombre"),
                        municipio = o.optString("municipio", "San Cristóbal"),
                        tipo = o.optString("tipo", "PEAJE"),
                        latitud = if (o.isNull("latitud_referencia")) null else o.optDouble("latitud_referencia"),
                        longitud = if (o.isNull("longitud_referencia")) null else o.optDouble("longitud_referencia"),
                        activo = o.optBoolean("activo", true)
                    )
                )
            }
        }
    }

    suspend fun fetchTemporadaActiva(): TemporadaActivaInfo? = withContext(Dispatchers.IO) {
        val (code, body) = postRawJson(
            "${AuthNetworkClient.SUPABASE_URL}/rest/v1/rpc/obtener_temporada_activa",
            "{}"
        )
        if (code !in 200..299) return@withContext null
        val json = runCatching { JSONObject(body) }.getOrNull() ?: return@withContext null
        if (!json.optBoolean("ok", true)) return@withContext null
        TemporadaActivaInfo(
            temporadaCodigo = json.optString("temporada_codigo", "REGULAR").ifBlank { "REGULAR" },
            nombre = json.optString("nombre", "Temporada Regular de Turismo"),
            esEspecifica = json.optBoolean("es_especifica", false)
        )
    }

    suspend fun sincronizarTuristasBatch(
        token: String,
        lista: List<EncuestaTuristicaLocal>,
        puntoUuidMap: Map<String, String>
    ): Pair<Int, SyncOutcome> = withContext(Dispatchers.IO) {
        if (lista.isEmpty()) return@withContext Pair(0, SyncOutcome(ok = true, mensaje = ""))
        val validos = lista.filter { SyncPayloadMapper.resolverPuntoUuid(it.puntoCodigo, puntoUuidMap) != null }
        if (validos.isEmpty()) {
            return@withContext Pair(
                0,
                SyncOutcome(ok = false, mensaje = "No se encontró el UUID del punto para sincronizar.")
            )
        }
        val bodyJson = SyncPayloadMapper.construirBodySincronizarTuristas(token, validos, puntoUuidMap)
        val (code, respBody) = postRawJson(
            "${AuthNetworkClient.SUPABASE_URL}/rest/v1/rpc/sincronizar_lote_apk",
            bodyJson
        )
        val json = runCatching { JSONObject(respBody) }.getOrNull()
        if (code in 200..299 && json != null && json.optString("status") == "success") {
            val ins = json.optInt("insertadas", validos.size)
            return@withContext Pair(validos.size, SyncOutcome(ok = true, turistasInsertadas = ins, mensaje = "OK"))
        }
        val errText = json?.optString("message").orEmpty().ifBlank { respBody }
        val expired = code == 401 || errText.contains("SESION_INVALIDA", ignoreCase = true)
        Pair(0, SyncOutcome(ok = false, sessionExpired = expired, mensaje = errText.ifBlank { "HTTP $code" }))
    }

    suspend fun sincronizarPrestadoresBatch(
        token: String,
        lista: List<EncuestaPrestadorLocal>,
        puntoUuidMap: Map<String, String>
    ): Pair<Int, SyncOutcome> = withContext(Dispatchers.IO) {
        if (lista.isEmpty()) return@withContext Pair(0, SyncOutcome(ok = true, mensaje = ""))
        val validos = lista.filter { SyncPayloadMapper.resolverPuntoUuid(it.puntoCodigo, puntoUuidMap) != null }
        if (validos.isEmpty()) {
            return@withContext Pair(
                0,
                SyncOutcome(ok = false, mensaje = "No se encontró el UUID del punto PST para sincronizar.")
            )
        }
        val bodyJson = SyncPayloadMapper.construirBodySincronizarPrestadores(token, validos, puntoUuidMap)
        val (code, respBody) = postRawJson(
            "${AuthNetworkClient.SUPABASE_URL}/rest/v1/rpc/sincronizar_lote_prestadores_apk",
            bodyJson
        )
        val json = runCatching { JSONObject(respBody) }.getOrNull()
        if (code in 200..299 && json != null && json.optBoolean("ok", false)) {
            val ins = json.optInt("insertadas", validos.size)
            return@withContext Pair(validos.size, SyncOutcome(ok = true, prestadoresInsertados = ins, mensaje = "OK"))
        }
        val errText = json?.optString("message").orEmpty().ifBlank { respBody }
        val expired = code == 401 || errText.contains("SESION_INVALIDA", ignoreCase = true)
        Pair(0, SyncOutcome(ok = false, sessionExpired = expired, mensaje = errText.ifBlank { "HTTP $code" }))
    }

    suspend fun obtenerMetricasSupervision(token: String): SupervisionSnapshot = withContext(Dispatchers.IO) {
        val bodyPayload = JSONObject().apply {
            put("p_token", token)
            put("p_temporada", "TODAS")
        }.toString()

        val (code, respBody) = postRawJson(
            "${AuthNetworkClient.SUPABASE_URL}/rest/v1/rpc/admin_obtener_metricas_gobernador",
            bodyPayload
        )
        val json = runCatching { JSONObject(respBody) }.getOrNull()
        if (code == 401 || respBody.contains("SESION_INVALIDA", ignoreCase = true)) {
            return@withContext SupervisionSnapshot(
                ok = false,
                sessionExpired = true,
                errorMsg = "Sesión de supervisor expirada. Inicia sesión nuevamente."
            )
        }
        if (code !in 200..299 || json == null || !json.optBoolean("ok", false)) {
            return@withContext SupervisionSnapshot(
                ok = false,
                errorMsg = json?.optString("message")?.ifBlank { null } ?: "No se pudo consultar métricas (HTTP $code)."
            )
        }

        val resumen = json.optJSONObject("resumen") ?: JSONObject()
        val ocupArr = json.optJSONArray("ocupacion_hotelera") ?: JSONArray()
        val avgOcup = if (ocupArr.length() > 0) {
            var sum = 0.0
            for (i in 0 until ocupArr.length()) {
                sum += ocupArr.optJSONObject(i)?.optDouble("pct_ocupacion", 0.0) ?: 0.0
            }
            ((sum / ocupArr.length()) * 10).toInt() / 10.0
        } else {
            0.0
        }

        val kpis = KpiResumenSupervision(
            totalVisitantesHoy = resumen.optInt("total_personas_estimadas", 0),
            totalGruposHoy = resumen.optInt("total_encuestas", 0),
            ocupacionHoteleraPct = avgOcup.toInt(),
            gastoPromedioUsd = resumen.optDouble("gasto_promedio_usd", 0.0),
            pernoctaPromedioDias = resumen.optDouble("promedio_pernocta_dias", 0.0)
        )

        val puntosRemotos = fetchPuntosCaptura()
        val puntosAuditoria = puntosRemotos.map { p ->
            EstadoPeajeAuditoria(
                codigo = p.codigo,
                nombre = p.nombre,
                encuestadorNombre = "Operativo Activo",
                encuestadorCedula = p.municipio,
                encuestasHoy = 0,
                distanciaM = 0,
                fueraDePunto = false,
                esSimulado = false,
                ultimaSincronizacionMin = 0
            )
        }

        SupervisionSnapshot(ok = true, kpis = kpis, puntos = puntosAuditoria)
    }

    private fun getJson(endpointUrl: String): Pair<Int, String> {
        var conn: HttpURLConnection? = null
        return try {
            conn = (URL(endpointUrl).openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8_000
                readTimeout = 8_000
                setRequestProperty("apikey", AuthNetworkClient.SUPABASE_ANON_KEY)
                setRequestProperty("Authorization", "Bearer ${AuthNetworkClient.SUPABASE_ANON_KEY}")
            }
            val code = conn.responseCode
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            Pair(code, stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: "[]")
        } catch (e: Exception) {
            Pair(0, e.localizedMessage ?: "Error de red")
        } finally {
            conn?.disconnect()
        }
    }

    private fun postRawJson(endpointUrl: String, jsonBody: String): Pair<Int, String> {
        var conn: HttpURLConnection? = null
        return try {
            conn = (URL(endpointUrl).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 10_000
                readTimeout = 12_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("apikey", AuthNetworkClient.SUPABASE_ANON_KEY)
                setRequestProperty("Authorization", "Bearer ${AuthNetworkClient.SUPABASE_ANON_KEY}")
            }
            OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { it.write(jsonBody) }
            val code = conn.responseCode
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            Pair(code, stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: "{}")
        } catch (e: Exception) {
            Pair(0, e.localizedMessage ?: "Error de red")
        } finally {
            conn?.disconnect()
        }
    }
}
