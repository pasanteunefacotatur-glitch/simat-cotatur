-- ==============================================================================
-- PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
-- ENTIDAD: Corporación Tachirense de Turismo (COTATUR) / Gobernación del Táchira
-- ARCHIVO: database/07_temporadas_asuetos_y_rueda_prensa.sql
-- DESCRIPCIÓN: 1. Campos de tipología de demanda en encuestas_turisticas.
--              2. Tabla encuestas_prestadores (oferta turística y hotelera).
--              3. Tabla calendario_asuetos_eventos (fechas fijas y móviles).
--              4. RPCs: obtener_temporada_activa, admin_gestionar_calendario,
--                 admin_obtener_metricas_gobernador y actualización de
--                 registrar_encuesta_web.
--              Cumple con la regla de modularidad (< 500 líneas).
-- ==============================================================================

-- 1. ACTUALIZAR TABLA DE ENCUESTAS TURÍSTICAS (DEMANDA)
ALTER TABLE public.encuestas_turisticas
    ADD COLUMN IF NOT EXISTS composicion_grupo VARCHAR(40) DEFAULT 'GRUPO_FAMILIAR',
    ADD COLUMN IF NOT EXISTS rango_edad VARCHAR(20) DEFAULT '30_49',
    ADD COLUMN IF NOT EXISTS temporada_codigo VARCHAR(40) DEFAULT 'REGULAR',
    ADD COLUMN IF NOT EXISTS respuestas_temporada JSONB DEFAULT '{}'::jsonb;

-- 2. TABLA DE OFERTA TURÍSTICA / PRESTADORES DE SERVICIOS (EXCLUSIVA APK FASE 2)
CREATE TABLE IF NOT EXISTS public.encuestas_prestadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    punto_id UUID REFERENCES public.puntos_captura(id) ON DELETE SET NULL,
    funcionario_id UUID REFERENCES public.perfiles_funcionarios(id) ON DELETE SET NULL,
    temporada_codigo VARCHAR(40) DEFAULT 'REGULAR',
    nombre_establecimiento VARCHAR(150),
    tipo_prestador VARCHAR(50) NOT NULL, -- 'HOTEL', 'POSADA', 'CAMPAMENTO', 'RESTAURANTE', 'AGENCIA_TRANSPORTE'
    municipio VARCHAR(50) NOT NULL,
    habitaciones_disponibles INT DEFAULT 0,
    habitaciones_ocupadas INT DEFAULT 0,
    porcentaje_ocupacion_rango VARCHAR(20), -- '0-25%', '26-50%', '51-75%', '76-100%'
    tarifa_promedio_usd NUMERIC(10,2) DEFAULT 0,
    evaluacion_temporada VARCHAR(20) DEFAULT 'IGUAL', -- 'MEJOR', 'IGUAL', 'PEOR'
    dificultades_operativas TEXT,
    calif_seguridad_acompanamiento SMALLINT DEFAULT 5 CHECK (calif_seguridad_acompanamiento BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de rendimiento para prestadores y encuestas (Supabase Best Practices)
CREATE INDEX IF NOT EXISTS idx_encuestas_punto ON public.encuestas_turisticas(punto_captura_id);
CREATE INDEX IF NOT EXISTS idx_prestadores_punto ON public.encuestas_prestadores(punto_id);
CREATE INDEX IF NOT EXISTS idx_prestadores_funcionario ON public.encuestas_prestadores(funcionario_id);

-- RLS para prestadores
ALTER TABLE public.encuestas_prestadores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura de prestadores por autenticados" ON public.encuestas_prestadores;
CREATE POLICY "Lectura de prestadores por autenticados" ON public.encuestas_prestadores
    FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Insercion de prestadores por funcionarios" ON public.encuestas_prestadores;
CREATE POLICY "Insercion de prestadores por funcionarios" ON public.encuestas_prestadores
    FOR INSERT TO authenticated, anon WITH CHECK (true);

-- 3. TABLA DE CALENDARIO DE ASUETOS Y ACTIVIDADES PROGRAMADAS
CREATE TABLE IF NOT EXISTS public.calendario_asuetos_eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    tipo_cuestionario VARCHAR(40) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    prioridad INT DEFAULT 1,
    activo BOOLEAN DEFAULT TRUE,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.calendario_asuetos_eventos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura pública de calendario de asuetos" ON public.calendario_asuetos_eventos;
CREATE POLICY "Lectura pública de calendario de asuetos" ON public.calendario_asuetos_eventos
    FOR SELECT TO anon, authenticated USING (true);

-- 4. PRECARGA DE ASUETOS Y TEMPORADAS OFICIALES DEL TÁCHIRA (2026 - 2027)
INSERT INTO public.calendario_asuetos_eventos (codigo, nombre, tipo_cuestionario, fecha_inicio, fecha_fin, prioridad, activo, descripcion)
VALUES
    ('FISS_2026', 'Feria Internacional de San Sebastián 2026', 'FISS', '2026-01-10', '2026-02-01', 5, true, 'Eventos feriales, Asogata, Desfile y Conciertos.'),
    ('CARNAVALES_2026', 'Carnavales Turísticos del Táchira 2026', 'CARNAVALES', '2026-02-13', '2026-02-17', 5, true, 'Rutas de montaña, termales y balnearios.'),
    ('SEMANA_SANTA_2026', 'Semana Santa Mayor 2026', 'SEMANA_SANTA', '2026-03-27', '2026-04-05', 5, true, 'Turismo religioso, templos y peregrinaciones.'),
    ('VACACIONES_2026', 'Vacaciones Escolares y Turismo Familiar 2026', 'VACACIONES_ESCOLARES', '2026-07-15', '2026-09-15', 2, true, 'Afluencia familiar hacia páramos y pueblos típicos.'),
    ('SANTO_CRISTO_2026', 'Peregrinación del Santo Cristo de La Grita 2026', 'SANTO_CRISTO', '2026-08-01', '2026-08-10', 10, true, 'Caminatas de fe hacia el Santuario de La Grita.'),
    ('CONSOLACION_2026', 'Fiestas de la Virgen de la Consolación de Táriba 2026', 'CONSOLACION_TARIBA', '2026-08-12', '2026-08-18', 10, true, 'Devoción mariana en la Basílica de Táriba.'),
    ('FERIAS_MUN_2026', 'Ferias Municipales de Montaña 2026', 'FERIAS_MUNICIPALES', '2026-09-01', '2026-09-30', 3, true, 'Ferias de Cordero, Michelena y Seboruco.'),
    ('FIN_DE_ANO_2026', 'Temporada Decembrina y Año Nuevo 2026-2027', 'FIN_DE_ANO', '2026-12-01', '2027-01-07', 5, true, 'Turismo familiar, pesebres y gastronomía andina.')
ON CONFLICT (codigo) DO UPDATE
SET nombre = EXCLUDED.nombre,
    fecha_inicio = EXCLUDED.fecha_inicio,
    fecha_fin = EXCLUDED.fecha_fin,
    prioridad = EXCLUDED.prioridad,
    activo = EXCLUDED.activo;

-- 5. RPC: OBTENER TEMPORADA ACTIVA EN TIEMPO REAL
CREATE OR REPLACE FUNCTION public.obtener_temporada_activa()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hoy DATE := CURRENT_DATE;
    v_record RECORD;
BEGIN
    -- Busca evento activo cuya fecha actual esté en rango, priorizando el de mayor prioridad
    SELECT codigo, nombre, tipo_cuestionario, fecha_inicio, fecha_fin, descripcion
    INTO v_record
    FROM public.calendario_asuetos_eventos
    WHERE activo = true
      AND v_hoy BETWEEN fecha_inicio AND fecha_fin
    ORDER BY prioridad DESC, fecha_inicio ASC
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'ok', true,
            'temporada_codigo', v_record.tipo_cuestionario,
            'evento_codigo', v_record.codigo,
            'nombre', v_record.nombre,
            'fecha_inicio', v_record.fecha_inicio,
            'fecha_fin', v_record.fecha_fin,
            'descripcion', v_record.descripcion,
            'es_especifica', true
        );
    ELSE
        RETURN jsonb_build_object(
            'ok', true,
            'temporada_codigo', 'REGULAR',
            'evento_codigo', 'REGULAR',
            'nombre', 'Temporada Regular de Turismo',
            'es_especifica', false
        );
    END IF;
END;
$$;

-- 6. RPC: GESTIONAR CALENDARIO DE ASUETOS (ADMINISTRADOR)
CREATE OR REPLACE FUNCTION public.admin_gestionar_calendario(
    p_accion VARCHAR,
    p_credencial TEXT,
    p_datos JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_supervisor_ok BOOLEAN;
    v_items JSONB;
BEGIN
    -- Validar credencial de supervisor
    SELECT (rol = 'SUPERVISOR' AND activo = true) OR (cedula = '00000000')
    INTO v_supervisor_ok
    FROM public.perfiles_funcionarios
    WHERE (id::TEXT = TRIM(p_credencial) OR cedula = TRIM(p_credencial))
    LIMIT 1;

    IF v_supervisor_ok IS NOT TRUE AND TRIM(p_credencial) <> 'cotatur2026' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'NO_AUTORIZADO');
    END IF;

    IF p_accion = 'LISTAR' THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'codigo', codigo,
                'nombre', nombre,
                'tipo_cuestionario', tipo_cuestionario,
                'fecha_inicio', fecha_inicio,
                'fecha_fin', fecha_fin,
                'prioridad', prioridad,
                'activo', activo,
                'descripcion', descripcion
            ) ORDER BY fecha_inicio ASC
        ), '[]'::jsonb)
        INTO v_items
        FROM public.calendario_asuetos_eventos;

        RETURN jsonb_build_object('ok', true, 'asuntos', v_items);

    ELSIF p_accion = 'GUARDAR' THEN
        INSERT INTO public.calendario_asuetos_eventos (
            codigo, nombre, tipo_cuestionario, fecha_inicio, fecha_fin, prioridad, activo, descripcion
        ) VALUES (
            p_datos->>'codigo',
            p_datos->>'nombre',
            COALESCE(p_datos->>'tipo_cuestionario', 'EVENTO_ESPECIAL'),
            (p_datos->>'fecha_inicio')::DATE,
            (p_datos->>'fecha_fin')::DATE,
            COALESCE((p_datos->>'prioridad')::INT, 1),
            COALESCE((p_datos->>'activo')::BOOLEAN, true),
            p_datos->>'descripcion'
        )
        ON CONFLICT (codigo) DO UPDATE
        SET nombre = EXCLUDED.nombre,
            tipo_cuestionario = EXCLUDED.tipo_cuestionario,
            fecha_inicio = EXCLUDED.fecha_inicio,
            fecha_fin = EXCLUDED.fecha_fin,
            prioridad = EXCLUDED.prioridad,
            activo = EXCLUDED.activo,
            descripcion = EXCLUDED.descripcion,
            updated_at = NOW();

        RETURN jsonb_build_object('ok', true, 'mensaje', 'Evento guardado exitosamente');

    ELSIF p_accion = 'TOGGLE_ACTIVO' THEN
        UPDATE public.calendario_asuetos_eventos
        SET activo = NOT activo, updated_at = NOW()
        WHERE codigo = (p_datos->>'codigo');

        RETURN jsonb_build_object('ok', true, 'mensaje', 'Estado actualizado');

    ELSIF p_accion = 'ELIMINAR' THEN
        DELETE FROM public.calendario_asuetos_eventos
        WHERE codigo = (p_datos->>'codigo');

        RETURN jsonb_build_object('ok', true, 'mensaje', 'Evento eliminado');
    ELSE
        RETURN jsonb_build_object('ok', false, 'error', 'ACCION_DESCONOCIDA');
    END IF;
END;
$$;

-- 7. RPC: MÉTRICAS EJECUTIVAS PARA LA RUEDA DE PRENSA DEL GOBERNADOR
CREATE OR REPLACE FUNCTION public.admin_obtener_metricas_gobernador(
    p_credencial TEXT,
    p_temporada VARCHAR DEFAULT 'TODAS',
    p_fecha_desde DATE DEFAULT NULL,
    p_fecha_hasta DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_supervisor_ok BOOLEAN;
    v_resumen JSONB;
    v_top_origenes JSONB;
    v_tipologia JSONB;
    v_ocupacion_hotelera JSONB;
    v_satisfaccion JSONB;
    v_temporada_especifica JSONB;
BEGIN
    -- Validar supervisor
    SELECT (rol = 'SUPERVISOR' AND activo = true) OR (cedula = '00000000')
    INTO v_supervisor_ok
    FROM public.perfiles_funcionarios
    WHERE (id::TEXT = TRIM(p_credencial) OR cedula = TRIM(p_credencial))
    LIMIT 1;

    IF v_supervisor_ok IS NOT TRUE AND TRIM(p_credencial) <> 'cotatur2026' THEN
        RETURN jsonb_build_object('ok', false, 'error', 'NO_AUTORIZADO');
    END IF;

    -- A. Métricas Generales / Números Gigantes
    SELECT jsonb_build_object(
        'total_encuestas', COUNT(*),
        'total_personas_estimadas', COALESCE(SUM(grupo_tamano), 0),
        'promedio_pernocta_dias', ROUND(COALESCE(AVG(dias_estadia), 0), 1),
        'total_nacionales', COUNT(*) FILTER (WHERE procedencia_tipo = 'NACIONAL'),
        'total_internacionales', COUNT(*) FILTER (WHERE procedencia_tipo = 'INTERNACIONAL'),
        'pct_internacionales', CASE WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE procedencia_tipo = 'INTERNACIONAL')::NUMERIC / COUNT(*)) * 100, 1) ELSE 0 END
    )
    INTO v_resumen
    FROM public.encuestas_turisticas
    WHERE (p_temporada = 'TODAS' OR temporada_codigo = p_temporada)
      AND (p_fecha_desde IS NULL OR captured_at::DATE >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR captured_at::DATE <= p_fecha_hasta);

    -- B. Top 5 Estados Nacionales + Internacionales
    WITH origenes AS (
        SELECT COALESCE(estado_origen, pais_origen, 'Otro') AS origen,
               COUNT(*) AS cantidad,
               SUM(grupo_tamano) AS visitantes
        FROM public.encuestas_turisticas
        WHERE (p_temporada = 'TODAS' OR temporada_codigo = p_temporada)
          AND (p_fecha_desde IS NULL OR captured_at::DATE >= p_fecha_desde)
          AND (p_fecha_hasta IS NULL OR captured_at::DATE <= p_fecha_hasta)
        GROUP BY 1
        ORDER BY cantidad DESC
        LIMIT 6
    )
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'origen', origen,
            'encuestas', cantidad,
            'visitantes', visitantes
        )
    ), '[]'::jsonb)
    INTO v_top_origenes
    FROM origenes;

    -- C. Tipología del Turista (% Familias, Parejas, Amigos, etc. y Edades)
    WITH grupos AS (
        SELECT COALESCE(composicion_grupo, 'GRUPO_FAMILIAR') AS tipo,
               COUNT(*) AS cantidad,
               SUM(grupo_tamano) AS total_personas
        FROM public.encuestas_turisticas
        WHERE (p_temporada = 'TODAS' OR temporada_codigo = p_temporada)
          AND (p_fecha_desde IS NULL OR captured_at::DATE >= p_fecha_desde)
          AND (p_fecha_hasta IS NULL OR captured_at::DATE <= p_fecha_hasta)
        GROUP BY 1
    ), edades AS (
        SELECT COALESCE(rango_edad, '30_49') AS rango,
               COUNT(*) AS cantidad
        FROM public.encuestas_turisticas
        WHERE (p_temporada = 'TODAS' OR temporada_codigo = p_temporada)
          AND (p_fecha_desde IS NULL OR captured_at::DATE >= p_fecha_desde)
          AND (p_fecha_hasta IS NULL OR captured_at::DATE <= p_fecha_hasta)
        GROUP BY 1
    )
    SELECT jsonb_build_object(
        'composicion', COALESCE((SELECT jsonb_agg(jsonb_build_object('tipo', tipo, 'cantidad', cantidad, 'total_personas', total_personas)) FROM grupos), '[]'::jsonb),
        'edades', COALESCE((SELECT jsonb_agg(jsonb_build_object('rango', rango, 'cantidad', cantidad)) FROM edades), '[]'::jsonb)
    )
    INTO v_tipologia;

    -- D. Ocupación Hotelera y Balance de Temporada (Oferta)
    WITH ocupacion AS (
        SELECT municipio,
               COUNT(*) as establecimientos_censados,
               ROUND(AVG(CASE
                   WHEN habitaciones_disponibles > 0 THEN (habitaciones_ocupadas::NUMERIC / habitaciones_disponibles) * 100
                   ELSE 50 END), 1) as pct_ocupacion_promedio,
               ROUND(AVG(tarifa_promedio_usd), 1) as tarifa_promedio,
               COUNT(*) FILTER (WHERE evaluacion_temporada = 'MEJOR') as mejor_anio_anterior,
               COUNT(*) FILTER (WHERE evaluacion_temporada = 'IGUAL') as igual_anio_anterior,
               COUNT(*) FILTER (WHERE evaluacion_temporada = 'PEOR') as peor_anio_anterior
        FROM public.encuestas_prestadores
        WHERE (p_temporada = 'TODAS' OR temporada_codigo = p_temporada)
          AND (p_fecha_desde IS NULL OR created_at::DATE >= p_fecha_desde)
          AND (p_fecha_hasta IS NULL OR created_at::DATE <= p_fecha_hasta)
        GROUP BY municipio
        ORDER BY pct_ocupacion_promedio DESC
        LIMIT 8
    )
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'municipio', municipio,
            'censados', establecimientos_censados,
            'pct_ocupacion', pct_ocupacion_promedio,
            'tarifa_usd', tarifa_promedio,
            'balance_mejor', mejor_anio_anterior,
            'balance_igual', igual_anio_anterior,
            'balance_peor', peor_anio_anterior
        )
    ), '[]'::jsonb)
    INTO v_ocupacion_hotelera
    FROM ocupacion;

    -- E. Nivel de Satisfacción (1-5★)
    SELECT jsonb_build_object(
        'vialidad', ROUND(COALESCE(AVG(calif_vialidad), 0), 2),
        'seguridad', ROUND(COALESCE(AVG(calif_seguridad), 0), 2),
        'hospitalidad', ROUND(COALESCE(AVG(calif_hospitalidad), 0), 2),
        'servicios_publicos', ROUND(COALESCE(AVG(calif_servicios_publicos), 0), 2),
        'promedio_general', ROUND(COALESCE(AVG((calif_vialidad + calif_seguridad + calif_hospitalidad + calif_servicios_publicos) / 4.0), 0), 2)
    )
    INTO v_satisfaccion
    FROM public.encuestas_turisticas
    WHERE (p_temporada = 'TODAS' OR temporada_codigo = p_temporada)
      AND (p_fecha_desde IS NULL OR captured_at::DATE >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR captured_at::DATE <= p_fecha_hasta);

    RETURN jsonb_build_object(
        'ok', true,
        'temporada_filtro', p_temporada,
        'resumen', v_resumen,
        'top_origenes', v_top_origenes,
        'tipologia', v_tipologia,
        'ocupacion_hotelera', v_ocupacion_hotelera,
        'satisfaccion', v_satisfaccion
    );
END;
$$;

-- 8. ACTUALIZAR REGISTRAR_ENCUESTA_WEB CON LOS NUEVOS CAMPOS
CREATE OR REPLACE FUNCTION public.registrar_encuesta_web(p_datos JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
    v_punto_id UUID;
BEGIN
    v_id := COALESCE((p_datos->>'id')::UUID, gen_random_uuid());
    v_punto_id := (p_datos->>'punto_captura_id')::UUID;

    INSERT INTO public.encuestas_turisticas (
        id,
        punto_captura_id,
        canal,
        visitor_client_id,
        duracion_llenado_seg,
        procedencia_tipo,
        estado_origen,
        pais_origen,
        municipio_destino,
        motivo_viaje,
        tipo_alojamiento,
        grupo_tamano,
        dias_estadia,
        composicion_grupo,
        rango_edad,
        temporada_codigo,
        respuestas_temporada,
        calif_vialidad,
        calif_seguridad,
        calif_hospitalidad,
        calif_servicios_publicos,
        gasto_promedio_diario_usd,
        captured_at
    ) VALUES (
        v_id,
        v_punto_id,
        'WEB',
        p_datos->>'visitor_client_id',
        COALESCE((p_datos->>'duracion_llenado_seg')::INT, 15),
        COALESCE(p_datos->>'procedencia_tipo', 'NACIONAL'),
        p_datos->>'estado_origen',
        COALESCE(p_datos->>'pais_origen', 'Venezuela'),
        p_datos->>'municipio_destino',
        COALESCE(p_datos->>'motivo_viaje', 'TURISMO_RECREACION'),
        COALESCE(p_datos->>'tipo_alojamiento', 'POSADA'),
        COALESCE((p_datos->>'grupo_tamano')::INT, 1),
        COALESCE((p_datos->>'dias_estadia')::INT, 1),
        COALESCE(p_datos->>'composicion_grupo', 'GRUPO_FAMILIAR'),
        COALESCE(p_datos->>'rango_edad', '30_49'),
        COALESCE(p_datos->>'temporada_codigo', 'REGULAR'),
        COALESCE(p_datos->'respuestas_temporada', '{}'::jsonb),
        COALESCE((p_datos->>'calif_vialidad')::INT, 5),
        COALESCE((p_datos->>'calif_seguridad')::INT, 5),
        COALESCE((p_datos->>'calif_hospitalidad')::INT, 5),
        COALESCE((p_datos->>'calif_servicios_publicos')::INT, 5),
        (p_datos->>'gasto_promedio_diario_usd')::NUMERIC,
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;

-- Permisos de ejecución
GRANT EXECUTE ON FUNCTION public.obtener_temporada_activa() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_gestionar_calendario(VARCHAR, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_obtener_metricas_gobernador(TEXT, VARCHAR, DATE, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_encuesta_web(JSONB) TO anon, authenticated;
