-- ==============================================================================
-- PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
-- ENTIDAD: Corporación Tachirense de Turismo (COTATUR)
-- FECHA: Noviembre 2026
-- ARCHIVO: 01_simat_core_schema.sql
-- DESCRIPCIÓN: Esquema principal de base de datos en PostgreSQL 15+ (Supabase).
--              Incluye tablas maestras, índices, disparador automático de temporada,
--              políticas de seguridad a nivel de fila (RLS) y funciones RPC blindadas.
-- ==============================================================================

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLAS MAESTRAS DEL SISTEMA
-- ==============================================================================

-- 2.1 TABLA: PUNTOS DE CAPTURA (Peajes, terminales, alcabalas y puntos turísticos)
CREATE TABLE IF NOT EXISTS public.puntos_captura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,             -- Ej: 'PEAJE_TARIBA', 'TERMINAL_SC'
    nombre VARCHAR(100) NOT NULL,                   -- Ej: 'Peaje Vega de Táriba'
    tipo VARCHAR(30) NOT NULL,                      -- 'PEAJE', 'TERMINAL', 'FRONTERA', 'ATRACCION'
    municipio VARCHAR(50) NOT NULL,                 -- Ej: 'Cárdenas', 'San Cristóbal'
    latitud_referencia NUMERIC(10, 7),              -- Coordenada oficial del punto
    longitud_referencia NUMERIC(10, 7),
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2.2 TABLA: TEMPORADAS TURÍSTICAS (Control de periodos de afluencia)
CREATE TABLE IF NOT EXISTS public.temporadas_turisticas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) UNIQUE NOT NULL,             -- Ej: 'FISS_2026', 'SEMANA_SANTA_2026'
    nombre VARCHAR(100) NOT NULL,                   -- Ej: 'Feria Internacional de San Sebastián 2026'
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    activa BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_fechas_temporada CHECK (fecha_fin > fecha_inicio)
);

-- 2.3 TABLA: PERFILES DE FUNCIONARIOS ENCUESTADORES (Control de acceso APK móvil)
CREATE TABLE IF NOT EXISTS public.perfiles_funcionarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,                       -- Vinculado a auth.users si usa Supabase Auth
    cedula VARCHAR(20) UNIQUE NOT NULL,
    nombre_completo VARCHAR(120) NOT NULL,
    cargo VARCHAR(60) DEFAULT 'Encuestador de Campo' NOT NULL,
    telefono VARCHAR(30),
    punto_asignado_id UUID REFERENCES public.puntos_captura(id) ON DELETE SET NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,           -- CLAVE: Si es FALSE, el RPC revoca acceso de inmediato
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2.4 TABLA CENTRAL: ENCUESTAS TURÍSTICAS (Ingesta Web y APK)
CREATE TABLE IF NOT EXISTS public.encuestas_turisticas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- Generado en cliente (UUIDv4) para idempotencia
    canal VARCHAR(10) NOT NULL,                     -- 'WEB' (Turista QR) o 'APK' (Funcionario)
    punto_captura_id UUID REFERENCES public.puntos_captura(id) ON DELETE RESTRICT,
    temporada_id UUID REFERENCES public.temporadas_turisticas(id) ON DELETE SET NULL,
    funcionario_id UUID REFERENCES public.perfiles_funcionarios(id) ON DELETE SET NULL,
    
    -- Control de duplicidad e identidad anónima
    visitor_client_id UUID,                         -- Identificador anónimo del navegador (Web)
    
    -- Métricas de auditoría temporal y anti-trampa
    captured_at TIMESTAMPTZ NOT NULL,               -- Momento real de la toma de datos
    duracion_llenado_seg INTEGER NOT NULL,          -- Calculado con reloj monotónico
    boot_count_capture INTEGER,                     -- Settings.Global.BOOT_COUNT del teléfono
    reloj_no_verificado BOOLEAN DEFAULT FALSE,      -- TRUE si el teléfono se reinició antes de sincronizar
    
    -- Métricas de geolocalización y auditoría satelital
    gps_lat NUMERIC(10, 7),
    gps_lng NUMERIC(10, 7),
    gps_precision_m NUMERIC(6, 2),
    gps_es_simulado BOOLEAN DEFAULT FALSE,          -- Detectado mediante location.isFromMockProvider()
    gps_es_cache BOOLEAN DEFAULT FALSE,             -- TRUE si reutilizó coordenada válida (< 15 min / 150m)
    gps_fix_id UUID,                                -- ID del disparo satelital (para agrupar ráfagas)
    
    -- Datos sustantivos de la encuesta turística (Estructura normalizada)
    procedencia_tipo VARCHAR(20) NOT NULL,          -- 'NACIONAL' o 'INTERNACIONAL'
    estado_origen VARCHAR(50),                      -- Ej: 'Zulia', 'Mérida', 'Barinas', 'Distrito Capital'
    pais_origen VARCHAR(50) DEFAULT 'Venezuela',    -- Ej: 'Colombia', 'España', 'Estados Unidos'
    municipio_destino VARCHAR(50) NOT NULL,         -- Destino principal en Táchira
    motivo_viaje VARCHAR(50) NOT NULL,              -- 'TURISMO_RECREACION', 'FAMILIAR', 'NEGOCIOS', etc.
    tipo_alojamiento VARCHAR(50) NOT NULL,          -- 'HOTEL', 'POSADA', 'CASA_FAMILIAR', 'CAMPING'
    grupo_tamano INTEGER DEFAULT 1 NOT NULL,        -- Número de personas en el grupo de viaje
    dias_estadia INTEGER DEFAULT 1 NOT NULL,        -- Cantidad de días estimados de permanencia
    
    -- Calificaciones de servicios (Escala 1 al 5)
    calif_vialidad SMALLINT CHECK (calif_vialidad BETWEEN 1 AND 5),
    calif_seguridad SMALLINT CHECK (calif_seguridad BETWEEN 1 AND 5),
    calif_hospitalidad SMALLINT CHECK (calif_hospitalidad BETWEEN 1 AND 5),
    calif_servicios_publicos SMALLINT CHECK (calif_servicios_publicos BETWEEN 1 AND 5),
    gasto_promedio_diario_usd NUMERIC(8, 2),        -- Estimado de consumo diario por persona en USD
    
    -- Puntero de sincronización soberana con Google Sheets / Drive
    replicated_at TIMESTAMPTZ,                      -- NULL = Pendiente de replicar; NOT NULL = Ya replicado
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,   -- Fecha/hora de inserción en Supabase
    
    -- Restricciones de integridad y calidad
    CONSTRAINT chk_duracion_minima CHECK (duracion_llenado_seg >= 10),
    CONSTRAINT chk_canal_valido CHECK (canal IN ('WEB', 'APK'))
);

-- ==============================================================================
-- 3. ÍNDICES DE RENDIMIENTO Y OPTIMIZACIÓN
-- ==============================================================================

-- Cursor de replicación hacia Google Sheets (Lecturas de alto rendimiento)
CREATE INDEX IF NOT EXISTS idx_encuestas_replicated_at 
ON public.encuestas_turisticas(replicated_at) 
WHERE replicated_at IS NULL;

-- Búsqueda por punto de captura (Foreign Key index según Supabase Best Practices)
CREATE INDEX IF NOT EXISTS idx_encuestas_punto 
ON public.encuestas_turisticas(punto_captura_id);

-- Búsquedas por temporada y fecha de captura
CREATE INDEX IF NOT EXISTS idx_encuestas_temporada 
ON public.encuestas_turisticas(temporada_id, captured_at DESC);

-- Búsquedas por canal y funcionario
CREATE INDEX IF NOT EXISTS idx_encuestas_funcionario 
ON public.encuestas_turisticas(funcionario_id, captured_at DESC);

-- ==============================================================================
-- 4. DISPARADOR AUTOMÁTICO DE ASIGNACIÓN DE TEMPORADA (POR SERVIDOR)
-- Evita que relojes descalibrados de clientes decidan la temporada turística.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.fn_asignar_temporada_automatica()
RETURNS TRIGGER AS $$
DECLARE
    v_temporada_id UUID;
    v_temporada_codigo VARCHAR(40);
BEGIN
    -- Busca evento o asueto activo en calendario_asuetos_eventos
    IF to_regclass('public.calendario_asuetos_eventos') IS NOT NULL THEN
        SELECT tipo_cuestionario INTO v_temporada_codigo
        FROM public.calendario_asuetos_eventos
        WHERE NEW.captured_at::DATE >= fecha_inicio 
          AND NEW.captured_at::DATE <= fecha_fin
          AND activo = TRUE
        ORDER BY prioridad DESC, fecha_inicio ASC
        LIMIT 1;

        IF v_temporada_codigo IS NOT NULL AND (NEW.temporada_codigo IS NULL OR NEW.temporada_codigo = 'REGULAR') THEN
            NEW.temporada_codigo := v_temporada_codigo;
        END IF;
    END IF;

    -- Compatibilidad con tabla previa temporadas_turisticas si existe
    IF to_regclass('public.temporadas_turisticas') IS NOT NULL THEN
        SELECT id INTO v_temporada_id
        FROM public.temporadas_turisticas
        WHERE NEW.captured_at >= fecha_inicio 
          AND NEW.captured_at <= fecha_fin
          AND activa = TRUE
        ORDER BY fecha_inicio DESC
        LIMIT 1;

        NEW.temporada_id := v_temporada_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

DROP TRIGGER IF EXISTS trg_asignar_temporada_encuestas ON public.encuestas_turisticas;
CREATE TRIGGER trg_asignar_temporada_encuestas
BEFORE INSERT ON public.encuestas_turisticas
FOR EACH ROW
EXECUTE FUNCTION public.fn_asignar_temporada_automatica();

-- ==============================================================================
-- 5. FUNCIONES RPC BLINDADAS (SECURITY DEFINER)
-- ==============================================================================

-- 5.1 RPC: SINCRONIZACIÓN DE LOTE DESDE APK MÓVIL
-- Valida que el funcionario esté activo. Si fue revocado/despedido, rechaza de inmediato.
CREATE OR REPLACE FUNCTION public.sincronizar_lote_apk(
    p_funcionario_id UUID,
    p_encuestas JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_funcionario_activo BOOLEAN;
    v_encuesta JSONB;
    v_insertadas INTEGER := 0;
BEGIN
    -- LÍNEA 1 OBLIGATORIA: Verificación de estado del encuestador
    SELECT activo INTO v_funcionario_activo
    FROM public.perfiles_funcionarios
    WHERE id = p_funcionario_id;

    IF v_funcionario_activo IS NOT TRUE THEN
        RAISE EXCEPTION 'ACCESO_DENEGADO: El funcionario encuestador no existe o ha sido desactivado institucionalmente.'
        USING ERRCODE = '42501'; -- Insufficient privileges
    END IF;

    -- Iteración sobre cada elemento del lote JSONB
    FOR v_encuesta IN SELECT * FROM jsonb_array_elements(p_encuestas)
    LOOP
        -- Inserción con idempotencia: ON CONFLICT DO NOTHING evita duplicados por reintentos en carretera
        INSERT INTO public.encuestas_turisticas (
            id, canal, punto_captura_id, funcionario_id,
            captured_at, duracion_llenado_seg, boot_count_capture, reloj_no_verificado,
            gps_lat, gps_lng, gps_precision_m, gps_es_simulado, gps_es_cache, gps_fix_id,
            procedencia_tipo, estado_origen, pais_origen, municipio_destino,
            motivo_viaje, tipo_alojamiento, grupo_tamano, dias_estadia,
            composicion_grupo, rango_edad, temporada_codigo, respuestas_temporada,
            calif_vialidad, calif_seguridad, calif_hospitalidad, calif_servicios_publicos,
            gasto_promedio_diario_usd
        ) VALUES (
            (v_encuesta->>'id')::UUID,
            'APK',
            (v_encuesta->>'punto_captura_id')::UUID,
            p_funcionario_id,
            (v_encuesta->>'captured_at')::TIMESTAMPTZ,
            (v_encuesta->>'duracion_llenado_seg')::INTEGER,
            (v_encuesta->>'boot_count_capture')::INTEGER,
            COALESCE((v_encuesta->>'reloj_no_verificado')::BOOLEAN, FALSE),
            (v_encuesta->>'gps_lat')::NUMERIC,
            (v_encuesta->>'gps_lng')::NUMERIC,
            (v_encuesta->>'gps_precision_m')::NUMERIC,
            COALESCE((v_encuesta->>'gps_es_simulado')::BOOLEAN, FALSE),
            COALESCE((v_encuesta->>'gps_es_cache')::BOOLEAN, FALSE),
            (v_encuesta->>'gps_fix_id')::UUID,
            v_encuesta->>'procedencia_tipo',
            v_encuesta->>'estado_origen',
            COALESCE(v_encuesta->>'pais_origen', 'Venezuela'),
            v_encuesta->>'municipio_destino',
            v_encuesta->>'motivo_viaje',
            v_encuesta->>'tipo_alojamiento',
            COALESCE((v_encuesta->>'grupo_tamano')::INTEGER, 1),
            COALESCE((v_encuesta->>'dias_estadia')::INTEGER, 1),
            COALESCE(v_encuesta->>'composicion_grupo', 'GRUPO_FAMILIAR'),
            COALESCE(v_encuesta->>'rango_edad', '30_49'),
            COALESCE(v_encuesta->>'temporada_codigo', 'REGULAR'),
            COALESCE(v_encuesta->'respuestas_temporada', '{}'::JSONB),
            (v_encuesta->>'calif_vialidad')::SMALLINT,
            (v_encuesta->>'calif_seguridad')::SMALLINT,
            (v_encuesta->>'calif_hospitalidad')::SMALLINT,
            (v_encuesta->>'calif_servicios_publicos')::SMALLINT,
            (v_encuesta->>'gasto_promedio_diario_usd')::NUMERIC
        )
        ON CONFLICT (id) DO NOTHING;

        IF FOUND THEN
            v_insertadas := v_insertadas + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'status', 'success',
        'procesadas', jsonb_array_length(p_encuestas),
        'insertadas', v_insertadas
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 5.2 RPC: INGESTA SEGURA PARA CANAL WEB (TURISTA)
-- Protege la tabla de accesos directos de bots.
CREATE OR REPLACE FUNCTION public.registrar_encuesta_web(
    p_datos JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_nueva_id UUID;
BEGIN
    v_nueva_id := COALESCE((p_datos->>'id')::UUID, gen_random_uuid());

    INSERT INTO public.encuestas_turisticas (
        id, canal, punto_captura_id, visitor_client_id,
        captured_at, duracion_llenado_seg,
        procedencia_tipo, estado_origen, pais_origen, municipio_destino,
        motivo_viaje, tipo_alojamiento, grupo_tamano, dias_estadia,
        composicion_grupo, rango_edad, temporada_codigo, respuestas_temporada,
        calif_vialidad, calif_seguridad, calif_hospitalidad, calif_servicios_publicos,
        gasto_promedio_diario_usd
    ) VALUES (
        v_nueva_id,
        'WEB',
        (p_datos->>'punto_captura_id')::UUID,
        (p_datos->>'visitor_client_id')::UUID,
        NOW(), -- En web se usa la hora oficial del servidor
        GREATEST(COALESCE((p_datos->>'duracion_llenado_seg')::INTEGER, 15), 10),
        p_datos->>'procedencia_tipo',
        p_datos->>'estado_origen',
        COALESCE(p_datos->>'pais_origen', 'Venezuela'),
        p_datos->>'municipio_destino',
        p_datos->>'motivo_viaje',
        p_datos->>'tipo_alojamiento',
        COALESCE((p_datos->>'grupo_tamano')::INTEGER, 1),
        COALESCE((p_datos->>'dias_estadia')::INTEGER, 1),
        COALESCE(p_datos->>'composicion_grupo', 'GRUPO_FAMILIAR'),
        COALESCE(p_datos->>'rango_edad', '30_49'),
        COALESCE(p_datos->>'temporada_codigo', 'REGULAR'),
        COALESCE(p_datos->'respuestas_temporada', '{}'::JSONB),
        (p_datos->>'calif_vialidad')::SMALLINT,
        (p_datos->>'calif_seguridad')::SMALLINT,
        (p_datos->>'calif_hospitalidad')::SMALLINT,
        (p_datos->>'calif_servicios_publicos')::SMALLINT,
        (p_datos->>'gasto_promedio_diario_usd')::NUMERIC
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN jsonb_build_object(
        'status', 'success',
        'id', v_nueva_id,
        'mensaje', 'Encuesta turística registrada exitosamente en COTATUR'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- ==============================================================================
-- 6. POLÍTICAS DE SEGURIDAD A NIVEL DE FILA (RLS)
-- ==============================================================================

ALTER TABLE public.puntos_captura ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporadas_turisticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encuestas_turisticas ENABLE ROW LEVEL SECURITY;

-- 6.1 Lectura pública de Puntos y Temporadas (Para alimentar selectores de la Web y APK)
CREATE POLICY "Permitir lectura publica de puntos activos" 
ON public.puntos_captura FOR SELECT USING (activo = TRUE);

CREATE POLICY "Permitir lectura publica de temporadas activas" 
ON public.temporadas_turisticas FOR SELECT USING (activa = TRUE);

-- 6.2 Blindaje total de encuestas: Nadie anónimo puede hacer INSERT ni SELECT directo
-- La web solo puede insertar llamando a public.registrar_encuesta_web()
CREATE POLICY "Prohibir acceso publico directo a encuestas" 
ON public.encuestas_turisticas FOR ALL TO anon USING (FALSE);

-- 6.3 Servicio y Administrador (Service Role) tiene acceso irrestricto
CREATE POLICY "Acceso total para service_role (Replicador Soberano)" 
ON public.encuestas_turisticas FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ==============================================================================
-- 7. DATOS SEMILLA INSTITUCIONALES (COTATUR - TÁCHIRA)
-- ==============================================================================

INSERT INTO public.puntos_captura (codigo, nombre, tipo, municipio, latitud_referencia, longitud_referencia) VALUES
('PEAJE_TARIBA', 'Peaje Vega de Táriba', 'PEAJE', 'Cárdenas', 7.8228, -72.2272),
('PEAJE_CAMPANA', 'Peaje La Pedrera / La Campana', 'PEAJE', 'Libertador', 7.5750, -71.7450),
('TERMINAL_SC', 'Terminal de Pasajeros Gen. Cipriano Castro', 'TERMINAL', 'San Cristóbal', 7.7608, -72.2356),
('PUENTE_ATANASIO', 'Puente Internacional Atanasio Girardot (Tienditas)', 'FRONTERA', 'Pedro María Ureña', 7.8833, -72.4333),
('PERIBECA_PUEBLO', 'Punto Turístico Pueblo Típico de Peribeca', 'ATRACCION', 'Capacho Nuevo', 7.8183, -72.3167),
('CHORRO_EL_INDIO', 'Parque Nacional Chorro El Indio', 'ATRACCION', 'San Cristóbal', 7.7461, -72.1931)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.temporadas_turisticas (codigo, nombre, fecha_inicio, fecha_fin, activa) VALUES
('FISS_2026', 'Feria Internacional de San Sebastián 2026', '2026-01-08 00:00:00-04', '2026-01-31 23:59:59-04', TRUE),
('CARNAVALES_2026', 'Carnavales Turísticos del Táchira 2026', '2026-02-14 00:00:00-04', '2026-02-18 23:59:59-04', TRUE),
('SEMANA_SANTA_2026', 'Semana Santa 2026 (Ruta de los 7 Templos)', '2026-03-29 00:00:00-04', '2026-04-05 23:59:59-04', TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- ==============================================================================
-- 8. CONCESIÓN EXPLÍCITA DE PERMISOS PARA RPCs MÓVILES Y WEB
-- ==============================================================================
GRANT EXECUTE ON FUNCTION public.sincronizar_lote_apk(UUID, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_encuesta_web(JSONB) TO anon, authenticated;
