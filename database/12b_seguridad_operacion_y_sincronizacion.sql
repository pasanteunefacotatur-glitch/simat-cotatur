-- ==============================================================================
-- PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
-- ENTIDAD: Corporación Tachirense de Turismo (COTATUR)
-- ARCHIVO: 12b_seguridad_operacion_y_sincronizacion.sql
-- DESCRIPCIÓN: Protección por token de calendario, métricas ejecutivas del
--              Gobernador, sincronización de lotes APK e ingesta web segura.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.admin_gestionar_calendario(
    p_accion VARCHAR,
    p_token TEXT,
    p_datos JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_items JSONB;
BEGIN
    PERFORM public._validar_sesion_token(p_token, TRUE);

    IF p_accion = 'LISTAR' THEN
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id, 'codigo', codigo, 'nombre', nombre, 'tipo_cuestionario', tipo_cuestionario,
                'fecha_inicio', fecha_inicio, 'fecha_fin', fecha_fin,
                'prioridad', prioridad, 'activo', activo, 'descripcion', descripcion
            ) ORDER BY fecha_inicio ASC
        ), '[]'::jsonb) INTO v_items FROM public.calendario_asuetos_eventos;
        RETURN jsonb_build_object('ok', true, 'asuntos', v_items);

    ELSIF p_accion = 'GUARDAR' THEN
        INSERT INTO public.calendario_asuetos_eventos (
            codigo, nombre, tipo_cuestionario, fecha_inicio, fecha_fin, prioridad, activo, descripcion
        ) VALUES (
            p_datos->>'codigo', p_datos->>'nombre', COALESCE(p_datos->>'tipo_cuestionario', 'EVENTO_ESPECIAL'),
            (p_datos->>'fecha_inicio')::DATE, (p_datos->>'fecha_fin')::DATE,
            COALESCE((p_datos->>'prioridad')::INT, 1), COALESCE((p_datos->>'activo')::BOOLEAN, true), p_datos->>'descripcion'
        )
        ON CONFLICT (codigo) DO UPDATE SET
            nombre = EXCLUDED.nombre, tipo_cuestionario = EXCLUDED.tipo_cuestionario,
            fecha_inicio = EXCLUDED.fecha_inicio, fecha_fin = EXCLUDED.fecha_fin,
            prioridad = EXCLUDED.prioridad, activo = EXCLUDED.activo,
            descripcion = EXCLUDED.descripcion, updated_at = NOW();
        RETURN jsonb_build_object('ok', true, 'mensaje', 'Evento guardado exitosamente');

    ELSIF p_accion = 'TOGGLE_ACTIVO' THEN
        UPDATE public.calendario_asuetos_eventos SET activo = NOT activo, updated_at = NOW() WHERE codigo = (p_datos->>'codigo');
        RETURN jsonb_build_object('ok', true, 'mensaje', 'Estado actualizado');

    ELSIF p_accion = 'ELIMINAR' THEN
        DELETE FROM public.calendario_asuetos_eventos WHERE codigo = (p_datos->>'codigo');
        RETURN jsonb_build_object('ok', true, 'mensaje', 'Evento eliminado');
    END IF;

    RETURN jsonb_build_object('ok', false, 'error', 'ACCION_DESCONOCIDA');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_obtener_metricas_gobernador(
    p_token TEXT,
    p_temporada VARCHAR DEFAULT 'TODAS',
    p_fecha_desde DATE DEFAULT NULL,
    p_fecha_hasta DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_resumen JSONB;
    v_top_origenes JSONB;
    v_tipologia JSONB;
    v_ocupacion_hotelera JSONB;
    v_satisfaccion JSONB;
BEGIN
    PERFORM public._validar_sesion_token(p_token, TRUE);

    SELECT jsonb_build_object(
        'total_encuestas', COUNT(*),
        'total_personas_estimadas', COALESCE(SUM(grupo_tamano), 0),
        'promedio_pernocta_dias', ROUND(COALESCE(AVG(dias_estadia), 0), 1),
        'pct_internacionales', ROUND(COALESCE(COUNT(*) FILTER (WHERE procedencia_tipo = 'INTERNACIONAL')::NUMERIC / NULLIF(COUNT(*), 0) * 100, 0), 1),
        'gasto_promedio_usd', ROUND(COALESCE(AVG(gasto_promedio_diario_usd), 0), 2)
    ) INTO v_resumen
    FROM public.encuestas_turisticas
    WHERE (p_temporada = 'TODAS' OR temporada_codigo = p_temporada)
      AND (p_fecha_desde IS NULL OR captured_at::DATE >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR captured_at::DATE <= p_fecha_hasta);

    WITH conteos AS (
        SELECT CASE WHEN procedencia_tipo = 'INTERNACIONAL' THEN COALESCE(pais_origen, 'Exterior')
                    ELSE COALESCE(estado_origen, 'Nacional') END AS origen, COUNT(*) AS visitas
        FROM public.encuestas_turisticas
        WHERE (p_temporada = 'TODAS' OR temporada_codigo = p_temporada)
          AND (p_fecha_desde IS NULL OR captured_at::DATE >= p_fecha_desde)
          AND (p_fecha_hasta IS NULL OR captured_at::DATE <= p_fecha_hasta)
        GROUP BY 1 ORDER BY 2 DESC LIMIT 6
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object('origen', origen, 'visitas', visitas)), '[]'::jsonb)
    INTO v_top_origenes FROM conteos;

    WITH grupos AS (
        SELECT composicion_grupo AS tipo, COUNT(*) AS cantidad, SUM(grupo_tamano) AS total_personas
        FROM public.encuestas_turisticas
        WHERE (p_temporada = 'TODAS' OR temporada_codigo = p_temporada)
          AND (p_fecha_desde IS NULL OR captured_at::DATE >= p_fecha_desde)
          AND (p_fecha_hasta IS NULL OR captured_at::DATE <= p_fecha_hasta)
        GROUP BY 1
    ), edades AS (
        SELECT rango_edad AS rango, COUNT(*) AS cantidad
        FROM public.encuestas_turisticas
        WHERE (p_temporada = 'TODAS' OR temporada_codigo = p_temporada)
          AND (p_fecha_desde IS NULL OR captured_at::DATE >= p_fecha_desde)
          AND (p_fecha_hasta IS NULL OR captured_at::DATE <= p_fecha_hasta)
        GROUP BY 1
    )
    SELECT jsonb_build_object(
        'composicion', COALESCE((SELECT jsonb_agg(jsonb_build_object('tipo', tipo, 'cantidad', cantidad, 'total_personas', total_personas)) FROM grupos), '[]'::jsonb),
        'edades', COALESCE((SELECT jsonb_agg(jsonb_build_object('rango', rango, 'cantidad', cantidad)) FROM edades), '[]'::jsonb)
    ) INTO v_tipologia;

    WITH ocupacion AS (
        SELECT municipio, COUNT(*) AS establecimientos_censados,
               ROUND(AVG(CASE WHEN habitaciones_disponibles > 0 THEN (habitaciones_ocupadas::NUMERIC / habitaciones_disponibles) * 100 ELSE 50 END), 1) AS pct_ocupacion_promedio,
               ROUND(AVG(tarifa_promedio_usd), 1) AS tarifa_promedio,
               COUNT(*) FILTER (WHERE evaluacion_temporada = 'MEJOR') AS mejor_anio_anterior,
               COUNT(*) FILTER (WHERE evaluacion_temporada = 'IGUAL') AS igual_anio_anterior,
               COUNT(*) FILTER (WHERE evaluacion_temporada = 'PEOR') AS peor_anio_anterior
        FROM public.encuestas_prestadores
        WHERE (p_temporada = 'TODAS' OR temporada_codigo = p_temporada)
          AND (p_fecha_desde IS NULL OR created_at::DATE >= p_fecha_desde)
          AND (p_fecha_hasta IS NULL OR created_at::DATE <= p_fecha_hasta)
        GROUP BY municipio ORDER BY pct_ocupacion_promedio DESC LIMIT 8
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'municipio', municipio, 'censados', establecimientos_censados, 'pct_ocupacion', pct_ocupacion_promedio,
        'tarifa_usd', tarifa_promedio, 'balance_mejor', mejor_anio_anterior,
        'balance_igual', igual_anio_anterior, 'balance_peor', peor_anio_anterior
    )), '[]'::jsonb) INTO v_ocupacion_hotelera FROM ocupacion;

    SELECT jsonb_build_object(
        'vialidad', ROUND(COALESCE(AVG(calif_vialidad), 0), 2),
        'seguridad', ROUND(COALESCE(AVG(calif_seguridad), 0), 2),
        'hospitalidad', ROUND(COALESCE(AVG(calif_hospitalidad), 0), 2),
        'servicios_publicos', ROUND(COALESCE(AVG(calif_servicios_publicos), 0), 2),
        'promedio_general', ROUND(COALESCE(AVG((calif_vialidad + calif_seguridad + calif_hospitalidad + calif_servicios_publicos) / 4.0), 0), 2)
    ) INTO v_satisfaccion
    FROM public.encuestas_turisticas
    WHERE (p_temporada = 'TODAS' OR temporada_codigo = p_temporada)
      AND (p_fecha_desde IS NULL OR captured_at::DATE >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR captured_at::DATE <= p_fecha_hasta);

    RETURN jsonb_build_object('ok', true, 'temporada_filtro', p_temporada, 'resumen', v_resumen, 'top_origenes', v_top_origenes, 'tipologia', v_tipologia, 'ocupacion_hotelera', v_ocupacion_hotelera, 'satisfaccion', v_satisfaccion);
END;
$$;

CREATE OR REPLACE FUNCTION public.sincronizar_lote_apk(p_token TEXT, p_encuestas JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_func_id UUID := public._validar_sesion_token(p_token, FALSE);
    v_encuesta JSONB;
    v_insertadas INTEGER := 0;
BEGIN
    FOR v_encuesta IN SELECT * FROM jsonb_array_elements(p_encuestas)
    LOOP
        INSERT INTO public.encuestas_turisticas (
            id, canal, punto_captura_id, funcionario_id, captured_at, duracion_llenado_seg,
            boot_count_capture, reloj_no_verificado, gps_lat, gps_lng, gps_precision_m,
            gps_es_simulado, gps_es_cache, gps_fix_id, procedencia_tipo, estado_origen,
            pais_origen, municipio_destino, motivo_viaje, tipo_alojamiento, grupo_tamano,
            dias_estadia, composicion_grupo, rango_edad, temporada_codigo, respuestas_temporada,
            calif_vialidad, calif_seguridad, calif_hospitalidad, calif_servicios_publicos, gasto_promedio_diario_usd
        ) VALUES (
            (v_encuesta->>'id')::UUID, 'APK', (v_encuesta->>'punto_captura_id')::UUID, v_func_id,
            (v_encuesta->>'captured_at')::TIMESTAMPTZ, GREATEST(COALESCE((v_encuesta->>'duracion_llenado_seg')::INTEGER, 10), 10),
            (v_encuesta->>'boot_count_capture')::INTEGER, COALESCE((v_encuesta->>'reloj_no_verificado')::BOOLEAN, FALSE),
            (v_encuesta->>'gps_lat')::NUMERIC, (v_encuesta->>'gps_lng')::NUMERIC, (v_encuesta->>'gps_precision_m')::NUMERIC,
            COALESCE((v_encuesta->>'gps_es_simulado')::BOOLEAN, FALSE), COALESCE((v_encuesta->>'gps_es_cache')::BOOLEAN, FALSE),
            (v_encuesta->>'gps_fix_id')::UUID, v_encuesta->>'procedencia_tipo', v_encuesta->>'estado_origen',
            COALESCE(v_encuesta->>'pais_origen', 'Venezuela'), v_encuesta->>'municipio_destino', v_encuesta->>'motivo_viaje',
            v_encuesta->>'tipo_alojamiento', COALESCE((v_encuesta->>'grupo_tamano')::INTEGER, 1), COALESCE((v_encuesta->>'dias_estadia')::INTEGER, 1),
            COALESCE(v_encuesta->>'composicion_grupo', 'GRUPO_FAMILIAR'), COALESCE(v_encuesta->>'rango_edad', '30_49'),
            COALESCE(v_encuesta->>'temporada_codigo', 'REGULAR'), COALESCE(v_encuesta->'respuestas_temporada', '{}'::JSONB),
            (v_encuesta->>'calif_vialidad')::SMALLINT, (v_encuesta->>'calif_seguridad')::SMALLINT,
            (v_encuesta->>'calif_hospitalidad')::SMALLINT, (v_encuesta->>'calif_servicios_publicos')::SMALLINT,
            (v_encuesta->>'gasto_promedio_diario_usd')::NUMERIC
        ) ON CONFLICT (id) DO NOTHING;
        IF FOUND THEN v_insertadas := v_insertadas + 1; END IF;
    END LOOP;
    RETURN jsonb_build_object('status', 'success', 'procesadas', jsonb_array_length(p_encuestas), 'insertadas', v_insertadas);
END;
$$;

CREATE OR REPLACE FUNCTION public.sincronizar_lote_prestadores_apk(p_token TEXT, p_prestadores JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_func_id UUID := public._validar_sesion_token(p_token, FALSE);
    v_item JSONB;
    v_insertadas INT := 0;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_prestadores)
    LOOP
        INSERT INTO public.encuestas_prestadores (
            id, punto_id, funcionario_id, temporada_codigo, nombre_establecimiento, tipo_prestador,
            municipio, habitaciones_disponibles, habitaciones_ocupadas, porcentaje_ocupacion_rango,
            tarifa_promedio_usd, evaluacion_temporada, dificultades_operativas, calif_seguridad_acompanamiento, created_at
        ) VALUES (
            COALESCE((v_item->>'id')::UUID, gen_random_uuid()), (v_item->>'punto_id')::UUID, v_func_id,
            COALESCE(v_item->>'temporada_codigo', 'REGULAR'), v_item->>'nombre_establecimiento',
            COALESCE(v_item->>'tipo_prestador', 'HOTEL'), COALESCE(v_item->>'municipio', 'San Cristóbal'),
            COALESCE((v_item->>'habitaciones_disponibles')::INT, 0), COALESCE((v_item->>'habitaciones_ocupadas')::INT, 0),
            v_item->>'porcentaje_ocupacion_rango', COALESCE((v_item->>'tarifa_promedio_usd')::NUMERIC, 0),
            COALESCE(v_item->>'evaluacion_temporada', 'IGUAL'), v_item->>'dificultades_operativas',
            COALESCE((v_item->>'calif_seguridad_acompanamiento')::SMALLINT, 5), COALESCE((v_item->>'created_at')::TIMESTAMPTZ, NOW())
        ) ON CONFLICT (id) DO NOTHING;
        IF FOUND THEN v_insertadas := v_insertadas + 1; END IF;
    END LOOP;
    RETURN jsonb_build_object('ok', true, 'insertadas', v_insertadas, 'total', jsonb_array_length(p_prestadores));
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_encuesta_web(p_datos JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_id UUID := COALESCE((p_datos->>'id')::UUID, gen_random_uuid());
BEGIN
    INSERT INTO public.encuestas_turisticas (
        id, punto_captura_id, canal, visitor_client_id, duracion_llenado_seg,
        procedencia_tipo, estado_origen, pais_origen, municipio_destino,
        motivo_viaje, tipo_alojamiento, grupo_tamano, dias_estadia,
        composicion_grupo, rango_edad, temporada_codigo, respuestas_temporada,
        calif_vialidad, calif_seguridad, calif_hospitalidad, calif_servicios_publicos,
        gasto_promedio_diario_usd, captured_at
    ) VALUES (
        v_id, (p_datos->>'punto_captura_id')::UUID, 'WEB', NULLIF(p_datos->>'visitor_client_id', '')::UUID,
        GREATEST(COALESCE((p_datos->>'duracion_llenado_seg')::INT, 15), 10),
        COALESCE(p_datos->>'procedencia_tipo', 'NACIONAL'), p_datos->>'estado_origen',
        COALESCE(p_datos->>'pais_origen', 'Venezuela'), p_datos->>'municipio_destino',
        COALESCE(p_datos->>'motivo_viaje', 'TURISMO_RECREACION'), COALESCE(p_datos->>'tipo_alojamiento', 'POSADA'),
        COALESCE((p_datos->>'grupo_tamano')::INT, 1), COALESCE((p_datos->>'dias_estadia')::INT, 1),
        COALESCE(p_datos->>'composicion_grupo', 'GRUPO_FAMILIAR'), COALESCE(p_datos->>'rango_edad', '30_49'),
        COALESCE(p_datos->>'temporada_codigo', 'REGULAR'), COALESCE(p_datos->'respuestas_temporada', '{}'::jsonb),
        COALESCE((p_datos->>'calif_vialidad')::INT, 5), COALESCE((p_datos->>'calif_seguridad')::INT, 5),
        COALESCE((p_datos->>'calif_hospitalidad')::INT, 5), COALESCE((p_datos->>'calif_servicios_publicos')::INT, 5),
        (p_datos->>'gasto_promedio_diario_usd')::NUMERIC, NOW()
    ) ON CONFLICT (id) DO NOTHING;
    RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_gestionar_calendario(VARCHAR, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_obtener_metricas_gobernador(TEXT, VARCHAR, DATE, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sincronizar_lote_apk(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sincronizar_lote_prestadores_apk(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_encuesta_web(JSONB) TO anon, authenticated;
