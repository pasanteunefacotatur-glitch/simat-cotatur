package com.cotatur.simat.data.local

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/**
 * ==============================================================================
 * PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
 * ARCHIVO: SimatDbHelper.kt
 * DESCRIPCIÓN: Motor de persistencia SQLite nativo con modo WAL (Write-Ahead Logging).
 *              Garantiza almacenamiento atómico y seguro para captura 100% offline
 *              en peajes y terminales del Estado Táchira.
 *              Sandbox protegido: /data/user/0/com.cotatur.simat/databases/simat_cotatur.db
 *              Preservado de forma inmutable durante actualizaciones remotas OTA.
 * ==============================================================================
 */
class SimatDbHelper(context: Context) : SQLiteOpenHelper(
    context.applicationContext,
    DATABASE_NAME,
    null,
    DATABASE_VERSION
) {
    companion object {
        const val DATABASE_NAME = "simat_cotatur.db"
        const val DATABASE_VERSION = 1

        @Volatile
        private var INSTANCE: SimatDbHelper? = null

        fun getInstance(context: Context): SimatDbHelper {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SimatDbHelper(context.applicationContext).also { INSTANCE = it }
            }
        }
    }

    override fun onConfigure(db: SQLiteDatabase) {
        super.onConfigure(db)
        // Habilitar Write-Ahead Logging (WAL) para lecturas y escrituras concurrentes sin jank
        db.enableWriteAheadLogging()
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.beginTransaction()
        try {
            // 1. TABLA: Encuestas a Turistas (Demanda vehicular en peajes y terminales)
            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS encuestas_turisticas_local (
                    id TEXT PRIMARY KEY,
                    canal TEXT NOT NULL DEFAULT 'APK',
                    punto_codigo TEXT NOT NULL,
                    temporada_codigo TEXT NOT NULL DEFAULT 'REGULAR',
                    funcionario_cedula TEXT NOT NULL,
                    captured_at TEXT NOT NULL,
                    duracion_llenado_seg INTEGER NOT NULL,
                    boot_count_capture INTEGER NOT NULL DEFAULT 0,
                    reloj_no_verificado INTEGER NOT NULL DEFAULT 0,
                    gps_lat REAL,
                    gps_lng REAL,
                    gps_precision_m REAL,
                    gps_es_simulado INTEGER NOT NULL DEFAULT 0,
                    gps_es_cache INTEGER NOT NULL DEFAULT 0,
                    gps_fix_id TEXT,
                    gps_fuera_de_punto INTEGER NOT NULL DEFAULT 0,
                    distancia_punto_m INTEGER NOT NULL DEFAULT 0,
                    procedencia_tipo TEXT NOT NULL,
                    estado_origen TEXT,
                    pais_origen TEXT DEFAULT 'Venezuela',
                    municipio_destino TEXT NOT NULL,
                    motivo_viaje TEXT NOT NULL,
                    tipo_alojamiento TEXT NOT NULL,
                    grupo_tamano INTEGER NOT NULL DEFAULT 1,
                    dias_estadia INTEGER NOT NULL DEFAULT 1,
                    calif_vialidad INTEGER NOT NULL DEFAULT 5,
                    calif_seguridad INTEGER NOT NULL DEFAULT 5,
                    calif_hospitalidad INTEGER NOT NULL DEFAULT 5,
                    calif_servicios_publicos INTEGER NOT NULL DEFAULT 5,
                    respuestas_temporada_json TEXT NOT NULL DEFAULT '{}',
                    sincronizado INTEGER NOT NULL DEFAULT 0,
                    sincronizado_at TEXT,
                    created_at TEXT NOT NULL
                )
                """.trimIndent()
            )

            // Índices de alto rendimiento para Outbox y orden temporal
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_turistas_sinc ON encuestas_turisticas_local(sincronizado) WHERE sincronizado = 0")
            db.execSQL("CREATE INDEX IF NOT EXISTS idx_turistas_captured ON encuestas_turisticas_local(captured_at)")

            // 2. TABLA: Censo de Prestadores de Servicios Turísticos (Oferta PST)
            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS encuestas_prestadores_local (
                    id TEXT PRIMARY KEY,
                    punto_codigo TEXT NOT NULL,
                    funcionario_cedula TEXT NOT NULL,
                    temporada_codigo TEXT NOT NULL DEFAULT 'REGULAR',
                    nombre_establecimiento TEXT NOT NULL,
                    tipo_prestador TEXT NOT NULL,
                    municipio TEXT NOT NULL,
                    habitaciones_disponibles INTEGER NOT NULL DEFAULT 0,
                    habitaciones_ocupadas INTEGER NOT NULL DEFAULT 0,
                    porcentaje_ocupacion_rango TEXT NOT NULL DEFAULT '0-25%',
                    tarifa_promedio_usd REAL NOT NULL DEFAULT 0.0,
                    evaluacion_temporada TEXT NOT NULL DEFAULT 'IGUAL',
                    dificultades_operativas TEXT,
                    calif_seguridad_acompanamiento INTEGER NOT NULL DEFAULT 5,
                    captured_at TEXT NOT NULL,
                    sincronizado INTEGER NOT NULL DEFAULT 0,
                    sincronizado_at TEXT,
                    created_at TEXT NOT NULL
                )
                """.trimIndent()
            )

            db.execSQL("CREATE INDEX IF NOT EXISTS idx_prestadores_sinc ON encuestas_prestadores_local(sincronizado) WHERE sincronizado = 0")

            // 3. TABLA: Catálogo dinámico de preguntas de temporada (Caché local del Survey Builder)
            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS preguntas_dinamicas_cache (
                    id TEXT PRIMARY KEY,
                    temporada_codigo TEXT NOT NULL,
                    label TEXT NOT NULL,
                    tipo TEXT NOT NULL,
                    opciones_json TEXT NOT NULL DEFAULT '[]',
                    orden INTEGER NOT NULL DEFAULT 0,
                    requerido INTEGER NOT NULL DEFAULT 0,
                    activo INTEGER NOT NULL DEFAULT 1,
                    version TEXT NOT NULL DEFAULT '1.0'
                )
                """.trimIndent()
            )

            db.execSQL("CREATE INDEX IF NOT EXISTS idx_preguntas_temp ON preguntas_dinamicas_cache(temporada_codigo, activo)")

            // 4. TABLA: Sesión y configuración local del encuestador
            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS configuracion_local (
                    clave TEXT PRIMARY KEY,
                    valor TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """.trimIndent()
            )

            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // En SIMAT-COTATUR se prohíbe el borrado destructivo para proteger las encuestas
        // Las migraciones de versión se ejecutan mediante ALTER TABLE incremental.
    }
}
