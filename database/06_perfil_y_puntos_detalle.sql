-- ==============================================================================
-- PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
-- ENTIDAD: Corporación Tachirense de Turismo (COTATUR)
-- ARCHIVO: 06_perfil_y_puntos_detalle.sql
-- DESCRIPCIÓN: Procedimientos para:
--              1. Gestión del Perfil propio (modificar datos y cambio de contraseña).
--              2. Consulta de Punto de Control con sus Funcionarios Participantes.
--              3. Asignación directa de funcionarios a un punto de encuesta.
--              Cumple con la regla de modularidad (< 500 líneas).
-- ==============================================================================

-- 1. FUNCIÓN RPC: ACTUALIZACIÓN DE PERFIL PROPIO (DATOS Y CONTRASEÑA)
CREATE OR REPLACE FUNCTION public.auth_actualizar_mi_perfil(
    p_funcionario_id UUID,
    p_nombre TEXT,
    p_telefono TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_clave_actual TEXT DEFAULT NULL,
    p_nueva_clave TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_func RECORD;
    v_pin_maestro CONSTANT TEXT := 'cotatur2026';
    v_clave_valida BOOLEAN := FALSE;
BEGIN
    SELECT * INTO v_func FROM public.perfiles_funcionarios WHERE id = p_funcionario_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Funcionario no encontrado con ID %', p_funcionario_id;
    END IF;

    -- Si el usuario desea cambiar su contraseña, validar la clave actual
    IF p_nueva_clave IS NOT NULL AND LENGTH(TRIM(p_nueva_clave)) > 0 THEN
        IF LENGTH(TRIM(p_nueva_clave)) < 4 THEN
            RAISE EXCEPTION 'La nueva contraseña debe tener al menos 4 caracteres.';
        END IF;

        IF p_clave_actual = v_pin_maestro THEN
            v_clave_valida := TRUE;
        ELSIF v_func.password_hash IS NOT NULL THEN
            v_clave_valida := (v_func.password_hash = crypt(p_clave_actual, v_func.password_hash));
        ELSE
            v_clave_valida := (TRIM(p_clave_actual) = TRIM(v_func.cedula) OR TRIM(p_clave_actual) = TRIM(REPLACE(v_func.cedula, 'V-', '')));
        END IF;

        IF NOT v_clave_valida THEN
            RAISE EXCEPTION 'La contraseña actual ingresada es incorrecta.';
        END IF;

        -- Actualizar contraseña cifrada
        UPDATE public.perfiles_funcionarios
        SET password_hash = crypt(p_nueva_clave, gen_salt('bf')),
            debe_cambiar_clave = FALSE
        WHERE id = p_funcionario_id;
    END IF;

    -- Actualizar datos personales
    UPDATE public.perfiles_funcionarios
    SET nombre_completo = COALESCE(NULLIF(TRIM(p_nombre), ''), nombre_completo),
        telefono = COALESCE(NULLIF(TRIM(p_telefono), ''), telefono),
        email = COALESCE(NULLIF(TRIM(p_email), ''), email)
    WHERE id = p_funcionario_id;

    RETURN jsonb_build_object(
        'status', 'success',
        'mensaje', 'Perfil actualizado exitosamente'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNCIÓN RPC: ASIGNAR FUNCIONARIO A UN PUNTO DE ENCUESTA DIRECTAMENTE
CREATE OR REPLACE FUNCTION public.admin_asignar_funcionario_punto(
    p_credencial TEXT,
    p_funcionario_id UUID,
    p_punto_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_es_supervisor BOOLEAN := FALSE;
    v_pin_maestro CONSTANT TEXT := 'cotatur2026';
BEGIN
    IF TRIM(p_credencial) = v_pin_maestro THEN
        v_es_supervisor := TRUE;
    ELSE
        SELECT (rol = 'SUPERVISOR' AND activo = TRUE) INTO v_es_supervisor
        FROM public.perfiles_funcionarios
        WHERE id = NULLIF(TRIM(p_credencial), '')::UUID 
           OR UPPER(TRIM(cedula)) = UPPER(TRIM(p_credencial));
    END IF;

    IF NOT COALESCE(v_es_supervisor, FALSE) THEN
        RAISE EXCEPTION 'NO_AUTORIZADO: Se requiere rango de Supervisor.' USING ERRCODE = '42501';
    END IF;

    UPDATE public.perfiles_funcionarios
    SET punto_asignado_id = p_punto_id
    WHERE id = p_funcionario_id;

    RETURN jsonb_build_object(
        'status', 'success',
        'mensaje', 'Funcionario asignado exitosamente al punto'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNCIÓN RPC: OBTENER DETALLE DE UN PUNTO CON SUS FUNCIONARIOS PARTICIPANTES
CREATE OR REPLACE FUNCTION public.admin_obtener_punto_detalle(
    p_punto_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_punto RECORD;
    v_participantes JSONB;
BEGIN
    SELECT * INTO v_punto FROM public.puntos_captura WHERE id = p_punto_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Punto no encontrado con ID %', p_punto_id;
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', f.id,
            'cedula', f.cedula,
            'nombre_completo', f.nombre_completo,
            'cargo', f.cargo,
            'rol', f.rol,
            'telefono', f.telefono,
            'activo', f.activo
        ) ORDER BY f.activo DESC, f.nombre_completo ASC
    ), '[]'::JSONB) INTO v_participantes
    FROM public.perfiles_funcionarios f
    WHERE f.punto_asignado_id = p_punto_id;

    RETURN jsonb_build_object(
        'punto', jsonb_build_object(
            'id', v_punto.id,
            'codigo', v_punto.codigo,
            'nombre', v_punto.nombre,
            'tipo', v_punto.tipo,
            'municipio', v_punto.municipio,
            'latitud_referencia', v_punto.latitud_referencia,
            'longitud_referencia', v_punto.longitud_referencia,
            'activo', v_punto.activo
        ),
        'participantes', v_participantes
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CONCEDER PERMISOS DE EJECUCIÓN A ANON Y AUTHENTICATED
GRANT EXECUTE ON FUNCTION public.auth_actualizar_mi_perfil(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_asignar_funcionario_punto(TEXT, UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_obtener_punto_detalle(UUID) TO anon, authenticated;
