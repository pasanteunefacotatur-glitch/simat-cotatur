-- ==============================================================================
-- PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
-- ENTIDAD: Corporación Tachirense de Turismo (COTATUR)
-- ARCHIVO: 08_auth_login_google.sql
-- DESCRIPCIÓN: Autenticación con Google exclusiva para funcionarios verificados:
--              - Solo permite el ingreso a usuarios que hayan vinculado previamente
--                su cuenta de Google o correo Gmail en el registro o primer ingreso.
--              - Retorna la sesión completa (rol, cédula, punto asignado).
--              - Rechaza con 42501 si la cuenta Google no está en la nómina activa.
--              Cumple con la regla de modularidad (< 500 líneas).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.auth_login_google(
    p_email TEXT,
    p_google_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_func RECORD;
    v_permitir_punto BOOLEAN := FALSE;
    v_email_limpio TEXT;
    v_google_id_limpio TEXT;
BEGIN
    v_email_limpio := LOWER(TRIM(COALESCE(p_email, '')));
    v_google_id_limpio := TRIM(COALESCE(p_google_id, ''));

    IF v_email_limpio = '' AND v_google_id_limpio = '' THEN
        RAISE EXCEPTION 'DATOS_INVALIDOS: Debe proporcionar un correo o identificador de Google válido.'
        USING ERRCODE = '42501';
    END IF;

    -- Obtener ajuste global de punto
    SELECT valor_bool INTO v_permitir_punto 
    FROM public.configuracion_global 
    WHERE clave = 'permitir_seleccion_punto_encuestador';

    -- Buscar funcionario por google_id O email verificado en perfiles_funcionarios
    SELECT f.*, p.codigo AS punto_codigo, p.nombre AS punto_nombre
    INTO v_func
    FROM public.perfiles_funcionarios f
    LEFT JOIN public.puntos_captura p ON f.punto_asignado_id = p.id
    WHERE (
        (v_google_id_limpio <> '' AND f.google_id = v_google_id_limpio)
        OR (v_email_limpio <> '' AND f.email IS NOT NULL AND LOWER(TRIM(f.email)) = v_email_limpio)
    );

    IF NOT FOUND THEN
        RAISE EXCEPTION 'USUARIO_NO_VINCULADO: La cuenta de Google (%) no ha sido verificada en el registro de COTATUR. Inicie sesión con su Cédula y Contraseña o solicite su registro a la Supervisión.', COALESCE(v_email_limpio, v_google_id_limpio)
        USING ERRCODE = '42501';
    END IF;

    IF NOT v_func.activo THEN
        RAISE EXCEPTION 'USUARIO_REVOCADO: Este usuario ha sido desactivado por la supervisión de COTATUR.'
        USING ERRCODE = '42501';
    END IF;

    -- Registrar último ingreso y actualizar google_id si aún no estaba enlazado
    UPDATE public.perfiles_funcionarios 
    SET ultimo_ingreso = NOW(),
        google_id = COALESCE(google_id, NULLIF(v_google_id_limpio, ''))
    WHERE id = v_func.id;

    RETURN jsonb_build_object(
        'status', 'success',
        'es_supervisor', (v_func.rol = 'SUPERVISOR'),
        'debe_cambiar_clave', COALESCE(v_func.debe_cambiar_clave, FALSE),
        'funcionario', jsonb_build_object(
            'id', v_func.id,
            'cedula', v_func.cedula,
            'nombre_completo', COALESCE(v_func.nombre_completo, 'Funcionario'),
            'cargo', COALESCE(v_func.cargo, 'Encuestador de Campo'),
            'rol', COALESCE(v_func.rol, 'ENCUESTADOR'),
            'email', v_func.email,
            'punto_asignado_id', v_func.punto_asignado_id,
            'punto_codigo', COALESCE(v_func.punto_codigo, 'PEAJE_TARIBA'),
            'punto_nombre', COALESCE(v_func.punto_nombre, 'Peaje Vega de Táriba')
        ),
        'configuracion', jsonb_build_object(
            'permitir_seleccion_punto', COALESCE(v_permitir_punto, FALSE)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Conceder permisos explícitos
GRANT EXECUTE ON FUNCTION public.auth_login_google(TEXT, TEXT) TO anon, authenticated;
