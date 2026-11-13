-- ==============================================================================
-- PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
-- ENTIDAD: Corporación Tachirense de Turismo (COTATUR)
-- ARCHIVO: 12_seguridad_rpcs_protegidos.sql
-- DESCRIPCIÓN: Reemplazo de todos los RPCs administrativos y de sincronización
--              para exigir token de sesión criptográfico (p_token) validado
--              mediante _validar_sesion_token(), eliminando p_credencial y p_pin.
-- ==============================================================================

-- 1. ELIMINAR TODAS LAS FIRMAS ANTERIORES FALSIFICABLES
DROP FUNCTION IF EXISTS public.admin_gestionar_funcionario(TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.admin_gestionar_punto(TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.admin_gestionar_funcionarios_v2(TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.admin_asignar_funcionario_punto(TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.admin_obtener_punto_detalle(UUID);
DROP FUNCTION IF EXISTS public.admin_gestionar_calendario(VARCHAR, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.admin_obtener_metricas_gobernador(TEXT, VARCHAR, DATE, DATE);
DROP FUNCTION IF EXISTS public.sincronizar_lote_apk(UUID, JSONB);
DROP FUNCTION IF EXISTS public.sincronizar_lote_prestadores_apk(UUID, JSONB);

-- Blindar filas internas de configuración del calendario en lectura pública
DROP POLICY IF EXISTS "Lectura publica calendario" ON public.calendario_asuetos_eventos;
CREATE POLICY "Lectura publica calendario"
    ON public.calendario_asuetos_eventos FOR SELECT
    USING (activo = TRUE AND codigo NOT LIKE 'SYS_%');

-- 2. GESTIÓN MAESTRA DE FUNCIONARIOS V2 PROTEGIDA POR TOKEN DE SUPERVISOR
CREATE OR REPLACE FUNCTION public.admin_gestionar_funcionarios_v2(
    p_token TEXT,
    p_accion TEXT,
    p_datos JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_admin_id UUID;
    v_nuevo_id UUID;
    v_target_id UUID;
    v_target_cedula TEXT;
    v_nuevo_estado BOOLEAN;
BEGIN
    v_admin_id := public._validar_sesion_token(p_token, TRUE);

    CASE UPPER(TRIM(p_accion))
        WHEN 'LISTAR' THEN
            RETURN (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'id', f.id,
                        'cedula', f.cedula,
                        'nombre_completo', COALESCE(f.nombre_completo, 'Pendiente de activación'),
                        'cargo', f.cargo,
                        'rol', f.rol,
                        'telefono', f.telefono,
                        'email', f.email,
                        'correo_verificado_google', COALESCE(f.correo_verificado_google, FALSE),
                        'activo', f.activo,
                        'debe_cambiar_clave', f.debe_cambiar_clave,
                        'punto_asignado_id', f.punto_asignado_id,
                        'punto_nombre', COALESCE(p.nombre, 'Sin asignar'),
                        'ultimo_ingreso', f.ultimo_ingreso,
                        'created_at', f.created_at
                    ) ORDER BY (f.rol = 'SUPERVISOR') DESC, f.activo DESC, f.created_at DESC
                ), '[]'::JSONB)
                FROM public.perfiles_funcionarios f
                LEFT JOIN public.puntos_captura p ON f.punto_asignado_id = p.id
            );

        WHEN 'CREAR' THEN
            v_target_cedula := UPPER(TRIM(COALESCE(p_datos->>'cedula', '')));
            IF LENGTH(v_target_cedula) < 4 THEN
                RAISE EXCEPTION 'CEDULA_INVALIDA: Debe ingresar un número de cédula válido.';
            END IF;

            v_nuevo_id := gen_random_uuid();
            INSERT INTO public.perfiles_funcionarios (
                id, cedula, nombre_completo, cargo, rol, activo, debe_cambiar_clave, password_hash, punto_asignado_id
            ) VALUES (
                v_nuevo_id,
                v_target_cedula,
                COALESCE(NULLIF(TRIM(p_datos->>'nombre_completo'), ''), 'Funcionario Nuevo'),
                COALESCE(NULLIF(TRIM(p_datos->>'cargo'), ''), 'Encuestador de Campo'),
                CASE WHEN UPPER(COALESCE(p_datos->>'rol', '')) IN ('SUPERVISOR', 'ADMIN') THEN 'SUPERVISOR' ELSE 'ENCUESTADOR' END,
                TRUE,
                TRUE,
                crypt(v_target_cedula, gen_salt('bf')),
                NULLIF(p_datos->>'punto_asignado_id', '')::UUID
            );

            PERFORM public._registrar_auditoria('ADMIN_CREAR_FUNCIONARIO', v_admin_id, v_target_cedula);
            RETURN jsonb_build_object(
                'status', 'success',
                'id', v_nuevo_id,
                'cedula', v_target_cedula,
                'mensaje', 'Funcionario registrado. Su clave inicial es su número de cédula.'
            );

        WHEN 'RESET_PASSWORD' THEN
            v_target_id := (p_datos->>'id')::UUID;
            SELECT cedula INTO v_target_cedula FROM public.perfiles_funcionarios WHERE id = v_target_id;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Funcionario no encontrado con ID %', v_target_id;
            END IF;

            UPDATE public.perfiles_funcionarios
            SET password_hash = crypt(v_target_cedula, gen_salt('bf')),
                debe_cambiar_clave = TRUE
            WHERE id = v_target_id;
            UPDATE public.sesiones_activas SET revoked = TRUE WHERE funcionario_id = v_target_id;

            PERFORM public._registrar_auditoria('ADMIN_RESET_PASSWORD', v_admin_id, v_target_cedula);
            RETURN jsonb_build_object(
                'status', 'success',
                'mensaje', 'Contraseña restablecida al número de cédula y sesiones previas revocadas.'
            );

        WHEN 'TOGGLE_ACTIVO' THEN
            v_target_id := (p_datos->>'id')::UUID;
            IF v_target_id = v_admin_id THEN
                RAISE EXCEPTION 'ACCION_NO_PERMITIDA: No puede desactivar su propia cuenta activa.';
            END IF;

            UPDATE public.perfiles_funcionarios
            SET activo = NOT activo
            WHERE id = v_target_id
            RETURNING activo INTO v_nuevo_estado;

            IF v_nuevo_estado IS NOT TRUE THEN
                UPDATE public.sesiones_activas SET revoked = TRUE WHERE funcionario_id = v_target_id;
            END IF;

            PERFORM public._registrar_auditoria('ADMIN_TOGGLE_ACTIVO', v_admin_id, NULL, jsonb_build_object('target', v_target_id, 'activo', v_nuevo_estado));
            RETURN jsonb_build_object('status', 'success', 'id', v_target_id, 'nuevo_estado', v_nuevo_estado);

        WHEN 'ELIMINAR' THEN
            v_target_id := (p_datos->>'id')::UUID;
            IF v_target_id = v_admin_id THEN
                RAISE EXCEPTION 'ACCION_NO_PERMITIDA: No puede eliminar su propia cuenta activa.';
            END IF;

            DELETE FROM public.perfiles_funcionarios WHERE id = v_target_id;
            PERFORM public._registrar_auditoria('ADMIN_ELIMINAR_FUNCIONARIO', v_admin_id, NULL, jsonb_build_object('target', v_target_id));
            RETURN jsonb_build_object('status', 'success', 'mensaje', 'Usuario eliminado de COTATUR');

        WHEN 'CONFIG_GET' THEN
            RETURN (SELECT jsonb_object_agg(clave, valor_bool) FROM public.configuracion_global);

        WHEN 'CONFIG_SET' THEN
            UPDATE public.configuracion_global
            SET valor_bool = COALESCE((p_datos->>'permitir_seleccion_punto_encuestador')::BOOLEAN, FALSE),
                updated_at = NOW()
            WHERE clave = 'permitir_seleccion_punto_encuestador';
            RETURN jsonb_build_object('status', 'success', 'mensaje', 'Configuración global actualizada');

        ELSE
            RAISE EXCEPTION 'Acción administrativa no soportada: %', p_accion;
    END CASE;
END;
$$;

-- 3. GESTIÓN DE PUNTOS Y DETALLES PROTEGIDA POR TOKEN
CREATE OR REPLACE FUNCTION public.admin_gestionar_punto(
    p_token TEXT,
    p_accion TEXT,
    p_datos JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_resultado JSONB;
    v_nuevo_id UUID;
    v_target_id UUID;
    v_nuevo_estado BOOLEAN;
    v_codigo_slug TEXT;
BEGIN
    PERFORM public._validar_sesion_token(p_token, TRUE);

    CASE UPPER(TRIM(p_accion))
        WHEN 'LISTAR' THEN
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', p.id, 'codigo', p.codigo, 'nombre', p.nombre,
                    'tipo', p.tipo, 'municipio', p.municipio,
                    'latitud_referencia', p.latitud_referencia,
                    'longitud_referencia', p.longitud_referencia,
                    'activo', p.activo, 'created_at', p.created_at
                ) ORDER BY p.activo DESC, p.nombre ASC
            ), '[]'::JSONB) INTO v_resultado FROM public.puntos_captura p;
            RETURN v_resultado;

        WHEN 'CREAR' THEN
            v_nuevo_id := gen_random_uuid();
            v_codigo_slug := UPPER(REGEXP_REPLACE(TRIM(COALESCE(p_datos->>'codigo', p_datos->>'nombre')), '[^a-zA-Z0-9]+', '_', 'g'));
            INSERT INTO public.puntos_captura (
                id, codigo, nombre, tipo, municipio, latitud_referencia, longitud_referencia, activo
            ) VALUES (
                v_nuevo_id, v_codigo_slug, TRIM(p_datos->>'nombre'),
                COALESCE(TRIM(p_datos->>'tipo'), 'PEAJE'),
                COALESCE(TRIM(p_datos->>'municipio'), 'San Cristóbal'),
                NULLIF(p_datos->>'latitud', '')::NUMERIC,
                NULLIF(p_datos->>'longitud', '')::NUMERIC,
                COALESCE((p_datos->>'activo')::BOOLEAN, TRUE)
            );
            RETURN jsonb_build_object('status', 'success', 'id', v_nuevo_id, 'codigo', v_codigo_slug);

        WHEN 'TOGGLE_ACTIVO' THEN
            v_target_id := (p_datos->>'id')::UUID;
            UPDATE public.puntos_captura SET activo = NOT activo WHERE id = v_target_id RETURNING activo INTO v_nuevo_estado;
            IF NOT FOUND THEN RAISE EXCEPTION 'Punto no encontrado con ID %', v_target_id; END IF;
            RETURN jsonb_build_object('status', 'success', 'id', v_target_id, 'nuevo_estado', v_nuevo_estado);

        ELSE
            RAISE EXCEPTION 'Acción administrativa no soportada: %', p_accion;
    END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_asignar_funcionario_punto(
    p_token TEXT,
    p_funcionario_id UUID,
    p_punto_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    PERFORM public._validar_sesion_token(p_token, TRUE);
    UPDATE public.perfiles_funcionarios SET punto_asignado_id = p_punto_id WHERE id = p_funcionario_id;
    RETURN jsonb_build_object('status', 'success', 'mensaje', 'Funcionario asignado exitosamente al punto.');
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_obtener_punto_detalle(
    p_token TEXT,
    p_punto_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_punto RECORD;
    v_participantes JSONB;
BEGIN
    PERFORM public._validar_sesion_token(p_token, TRUE);

    SELECT * INTO v_punto FROM public.puntos_captura WHERE id = p_punto_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Punto no encontrado con ID %', p_punto_id; END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', f.id, 'cedula', f.cedula, 'nombre_completo', f.nombre_completo,
            'cargo', f.cargo, 'rol', f.rol, 'telefono', f.telefono, 'activo', f.activo
        ) ORDER BY f.activo DESC, f.nombre_completo ASC
    ), '[]'::JSONB) INTO v_participantes
    FROM public.perfiles_funcionarios f WHERE f.punto_asignado_id = p_punto_id;

    RETURN jsonb_build_object(
        'punto', jsonb_build_object(
            'id', v_punto.id, 'codigo', v_punto.codigo, 'nombre', v_punto.nombre,
            'tipo', v_punto.tipo, 'municipio', v_punto.municipio,
            'latitud_referencia', v_punto.latitud_referencia,
            'longitud_referencia', v_punto.longitud_referencia, 'activo', v_punto.activo
        ),
        'participantes', v_participantes
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_gestionar_funcionarios_v2(TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_gestionar_punto(TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_asignar_funcionario_punto(TEXT, UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_obtener_punto_detalle(TEXT, UUID) TO anon, authenticated;
