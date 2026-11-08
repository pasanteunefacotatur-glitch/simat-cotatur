-- ==============================================================================
-- PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
-- ENTIDAD: Corporación Tachirense de Turismo (COTATUR)
-- ARCHIVO: 04_gestion_puntos_admin.sql
-- DESCRIPCIÓN: Módulo de gestión y administración de Puntos de Control Turístico.
--              Permite que el Panel de Administración (Web y APK) registre nuevos
--              puntos fijados visualmente mediante mapa, sin teclear coordenadas.
--              Cumple con la regla de modularidad (< 500 líneas).
-- ==============================================================================

-- 1. FUNCIÓN RPC: GESTIÓN DE PUNTOS DE CONTROL POR SUPERVISORES
CREATE OR REPLACE FUNCTION public.admin_gestionar_punto(
    p_pin TEXT,
    p_accion TEXT,
    p_datos JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_admin_pin_valido CONSTANT TEXT := 'cotatur2026';
    v_resultado JSONB;
    v_nuevo_id UUID;
    v_target_id UUID;
    v_nuevo_estado BOOLEAN;
    v_codigo_slug TEXT;
BEGIN
    -- 1. Validación de seguridad de credencial de supervisión
    IF p_pin IS NULL OR TRIM(p_pin) <> v_admin_pin_valido THEN
        RAISE EXCEPTION 'PIN_INVALIDO: Credencial de supervisión no autorizada.'
        USING ERRCODE = '42501';
    END IF;

    -- 2. Enrutamiento de acciones administrativas
    CASE UPPER(TRIM(p_accion))
        -- ACCIÓN: LISTAR TODOS LOS PUNTOS DE CONTROL
        WHEN 'LISTAR' THEN
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', p.id,
                    'codigo', p.codigo,
                    'nombre', p.nombre,
                    'tipo', p.tipo,
                    'municipio', p.municipio,
                    'latitud_referencia', p.latitud_referencia,
                    'longitud_referencia', p.longitud_referencia,
                    'activo', p.activo,
                    'created_at', p.created_at
                ) ORDER BY p.activo DESC, p.nombre ASC
            ) INTO v_resultado
            FROM public.puntos_captura p;

            RETURN COALESCE(v_resultado, '[]'::JSONB);

        -- ACCIÓN: CREAR NUEVO PUNTO DE CONTROL (Coordenadas capturadas por mapa interactivo)
        WHEN 'CREAR' THEN
            v_nuevo_id := gen_random_uuid();
            v_codigo_slug := UPPER(REGEXP_REPLACE(TRIM(COALESCE(p_datos->>'codigo', p_datos->>'nombre')), '[^a-zA-Z0-9]+', '_', 'g'));

            INSERT INTO public.puntos_captura (
                id, codigo, nombre, tipo, municipio, latitud_referencia, longitud_referencia, activo
            ) VALUES (
                v_nuevo_id,
                v_codigo_slug,
                TRIM(p_datos->>'nombre'),
                COALESCE(TRIM(p_datos->>'tipo'), 'PEAJE'),
                COALESCE(TRIM(p_datos->>'municipio'), 'San Cristóbal'),
                NULLIF(p_datos->>'latitud', '')::NUMERIC,
                NULLIF(p_datos->>'longitud', '')::NUMERIC,
                COALESCE((p_datos->>'activo')::BOOLEAN, TRUE)
            );

            RETURN jsonb_build_object(
                'status', 'success',
                'id', v_nuevo_id,
                'codigo', v_codigo_slug,
                'mensaje', 'Punto de control turístico registrado exitosamente'
            );

        -- ACCIÓN: ACTIVAR / DESACTIVAR PUNTO DE CONTROL
        WHEN 'TOGGLE_ACTIVO' THEN
            v_target_id := (p_datos->>'id')::UUID;

            UPDATE public.puntos_captura
            SET activo = NOT activo
            WHERE id = v_target_id
            RETURNING activo INTO v_nuevo_estado;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Punto no encontrado con ID %', v_target_id;
            END IF;

            RETURN jsonb_build_object(
                'status', 'success',
                'id', v_target_id,
                'nuevo_estado', v_nuevo_estado
            );

        ELSE
            RAISE EXCEPTION 'Acción administrativa no soportada: %', p_accion;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permisos de ejecución para anon y authenticated (la seguridad la valida el PIN interno)
GRANT EXECUTE ON FUNCTION public.admin_gestionar_punto(TEXT, TEXT, JSONB) TO anon, authenticated;
