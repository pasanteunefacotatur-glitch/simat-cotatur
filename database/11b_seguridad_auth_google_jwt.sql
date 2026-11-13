-- ==============================================================================
-- PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
-- ENTIDAD: Corporación Tachirense de Turismo (COTATUR)
-- ARCHIVO: 11b_seguridad_auth_google_jwt.sql
-- DESCRIPCIÓN: Vinculación y recuperación de contraseña verificadas vía JWT
--              de Supabase Auth (auth.uid() + auth.jwt()->>'email').
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.auth_vincular_correo_google_jwt(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_func_id UUID := public._validar_sesion_token(p_token, FALSE);
    v_uid UUID := auth.uid();
    v_jwt JSONB := auth.jwt();
    v_email TEXT;
    v_nombre TEXT;
    v_avatar TEXT;
    v_duplicado UUID;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'JWT_REQUERIDO: Debe iniciar sesión Google válida para vincular el correo.' USING ERRCODE = '42501';
    END IF;

    v_email := LOWER(TRIM(COALESCE(v_jwt->>'email', '')));
    v_nombre := NULLIF(TRIM(COALESCE(v_jwt->'user_metadata'->>'full_name', v_jwt->'user_metadata'->>'name', '')), '');
    v_avatar := NULLIF(TRIM(COALESCE(v_jwt->'user_metadata'->>'avatar_url', v_jwt->'user_metadata'->>'picture', '')), '');

    SELECT id INTO v_duplicado
    FROM public.perfiles_funcionarios
    WHERE id <> v_func_id
      AND activo = TRUE
      AND (auth_user_id = v_uid OR (email IS NOT NULL AND LOWER(TRIM(email)) = v_email))
    LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION 'CORREO_DUPLICADO: Esa cuenta Google ya pertenece a otro funcionario activo.' USING ERRCODE = '42501';
    END IF;

    UPDATE public.perfiles_funcionarios
    SET email = v_email,
        auth_user_id = v_uid,
        google_id = COALESCE(NULLIF(v_jwt->>'sub', ''), google_id),
        correo_verificado_google = TRUE,
        avatar_url = COALESCE(v_avatar, avatar_url)
    WHERE id = v_func_id;

    PERFORM public._registrar_auditoria('CORREO_GOOGLE_VINCULADO', v_func_id, NULL, jsonb_build_object('email', v_email));
    RETURN jsonb_build_object('status', 'success', 'email', v_email, 'nombre', v_nombre, 'avatar_url', v_avatar);
END;
$$;

CREATE OR REPLACE FUNCTION public.auth_recuperar_clave_con_google_jwt(
    p_cedula TEXT,
    p_nueva_clave TEXT,
    p_canal TEXT DEFAULT 'WEB'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_jwt JSONB := auth.jwt();
    v_email TEXT := LOWER(TRIM(COALESCE(v_jwt->>'email', '')));
    v_ced TEXT := UPPER(TRIM(COALESCE(p_cedula, '')));
    v_func RECORD;
    v_token TEXT;
BEGIN
    IF v_uid IS NULL OR v_email = '' THEN
        RAISE EXCEPTION 'JWT_REQUERIDO: Verificación Google obligatoria antes de restablecer contraseña.' USING ERRCODE = '42501';
    END IF;

    IF LENGTH(TRIM(COALESCE(p_nueva_clave, ''))) < 8 THEN
        RAISE EXCEPTION 'CLAVE_CORTA: La nueva contraseña debe tener al menos 8 caracteres.';
    END IF;

    SELECT * INTO v_func
    FROM public.perfiles_funcionarios
    WHERE UPPER(TRIM(cedula)) = v_ced
       OR UPPER(TRIM(REPLACE(cedula, 'V-', ''))) = UPPER(TRIM(REPLACE(v_ced, 'V-', '')))
    LIMIT 1;

    IF NOT FOUND OR v_func.activo IS NOT TRUE THEN
        RAISE EXCEPTION 'RECUPERACION_RECHAZADA: Datos inválidos o funcionario inactivo.' USING ERRCODE = '42501';
    END IF;

    IF (v_func.email IS NULL OR LOWER(TRIM(v_func.email)) <> v_email)
       AND (v_func.auth_user_id IS NULL OR v_func.auth_user_id <> v_uid) THEN
        PERFORM public._registrar_auditoria('RECUPERACION_GOOGLE_CORREO_NO_COINCIDE', v_func.id, v_func.cedula);
        RAISE EXCEPTION 'CORREO_NO_COINCIDE: La cuenta Google autenticada no coincide con la vinculada a esa cédula.' USING ERRCODE = '42501';
    END IF;

    UPDATE public.perfiles_funcionarios
    SET password_hash = crypt(TRIM(p_nueva_clave), gen_salt('bf')),
        debe_cambiar_clave = FALSE,
        auth_user_id = v_uid,
        correo_verificado_google = TRUE,
        ultimo_ingreso = NOW()
    WHERE id = v_func.id;

    UPDATE public.sesiones_activas SET revoked = TRUE WHERE funcionario_id = v_func.id;
    v_token := public._crear_sesion_token(v_func.id, p_canal);
    PERFORM public._registrar_auditoria('RECUPERACION_CLAVE_EXITOSA', v_func.id, v_func.cedula);

    RETURN public._construir_respuesta_sesion(v_func.id, v_token);
END;
$$;

GRANT EXECUTE ON FUNCTION public.auth_vincular_correo_google_jwt(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_recuperar_clave_con_google_jwt(TEXT, TEXT, TEXT) TO authenticated;
