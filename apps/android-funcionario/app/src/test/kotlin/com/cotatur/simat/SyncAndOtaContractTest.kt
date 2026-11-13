package com.cotatur.simat

import com.cotatur.simat.data.local.EncuestaPrestadorLocal
import com.cotatur.simat.data.local.EncuestaTuristicaLocal
import com.cotatur.simat.data.remote.OtaIntegrityPolicy
import com.cotatur.simat.data.remote.SyncPayloadMapper
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SyncAndOtaContractTest {

    @Test
    fun resolverPuntoUuid_usaSemillaYMapaRemoto() {
        val remoto = mapOf("MI_PUNTO" to "11111111-2222-3333-4444-555555555555")
        assertEquals(
            "a07731b0-c77a-4df8-8cc6-95396d6743e9",
            SyncPayloadMapper.resolverPuntoUuid("PEAJE_TARIBA", remoto)
        )
        assertEquals(
            "11111111-2222-3333-4444-555555555555",
            SyncPayloadMapper.resolverPuntoUuid("MI_PUNTO", remoto)
        )
        assertNull(SyncPayloadMapper.resolverPuntoUuid("DESCONOCIDO", remoto))
    }

    @Test
    fun construirRpcTuristasPayload_cumpleEsquemaPostgreSQL() {
        val encuesta = EncuestaTuristicaLocal(
            id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            puntoCodigo = "PEAJE_TARIBA",
            temporadaCodigo = "CARNAVAL_2026",
            funcionarioCedula = "V-31061007",
            capturedAt = "2026-11-13T10:00:00Z",
            duracionLlenadoSeg = 4, // Debe normalizarse a >= 10
            gpsLat = 7.7712,
            gpsLng = -72.2261,
            gpsPrecisionM = 12.5f,
            gpsFixId = "not-a-uuid", // Debe omitirse o ir null
            procedenciaTipo = "NACIONAL",
            estadoOrigen = "Zulia",
            municipioDestino = "San Cristóbal",
            motivoViaje = "Turismo y Recreación",
            tipoAlojamiento = "Hotel",
            grupoTamano = 3,
            diasEstadia = 4,
            respuestasTemporadaJson = "{\"feria\":\"si\"}",
            createdAt = "2026-11-13T10:00:00Z"
        )

        val payloadJson = SyncPayloadMapper.construirBodySincronizarTuristas(
            token = "tok_123",
            encuestas = listOf(encuesta),
            puntoUuidMap = emptyMap()
        )

        assertTrue(payloadJson.contains("\"p_token\":\"tok_123\""))
        assertTrue(payloadJson.contains("\"punto_captura_id\":\"a07731b0-c77a-4df8-8cc6-95396d6743e9\""))
        assertTrue(payloadJson.contains("\"duracion_llenado_seg\":10"))
        assertTrue(payloadJson.contains("\"temporada_codigo\":\"CARNAVAL_2026\""))
        assertTrue(payloadJson.contains("\"gps_fix_id\":null"))
        assertTrue(payloadJson.contains("\"feria\":\"si\""))
    }

    @Test
    fun construirRpcPrestadoresPayload_mapeaPuntoIdUuid() {
        val pst = EncuestaPrestadorLocal(
            id = "ffffffff-1111-2222-3333-444444444444",
            puntoCodigo = "TERMINAL_SC",
            funcionarioCedula = "V-31061007",
            temporadaCodigo = "REGULAR",
            nombreEstablecimiento = "Posada Andina",
            tipoPrestador = "POSADA",
            municipio = "San Cristóbal",
            habitacionesDisponibles = 10,
            habitacionesOcupadas = 8,
            porcentajeOcupacionRango = "76-100%",
            tarifaPromedioUsd = 45.5,
            capturedAt = "2026-11-13T10:05:00Z",
            createdAt = "2026-11-13T10:05:00Z"
        )

        val payloadJson = SyncPayloadMapper.construirBodySincronizarPrestadores(
            token = "tok_abc",
            prestadores = listOf(pst),
            puntoUuidMap = emptyMap()
        )

        assertTrue(payloadJson.contains("\"p_token\":\"tok_abc\""))
        assertTrue(payloadJson.contains("\"punto_id\":\"64d20a51-333e-478f-95cc-a45d05e96edb\""))
        assertTrue(payloadJson.contains("\"nombre_establecimiento\":\"Posada Andina\""))
    }

    @Test
    fun otaIntegrityPolicy_rechazaManifestSinSha256Valido() {
        val hashValido = "a".repeat(64)
        assertFalse(OtaIntegrityPolicy.validarIntegridad("", hashValido))
        assertFalse(OtaIntegrityPolicy.validarIntegridad("   ", hashValido))
        assertFalse(OtaIntegrityPolicy.validarIntegridad("short", hashValido))
        assertFalse(OtaIntegrityPolicy.validarIntegridad("b".repeat(64), hashValido))
        assertTrue(OtaIntegrityPolicy.validarIntegridad(hashValido.uppercase(), hashValido))
    }
}
