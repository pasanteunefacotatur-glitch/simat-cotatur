-- ==============================================================================
-- PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
-- ENTIDAD: Corporación Tachirense de Turismo (COTATUR)
-- ARCHIVO: 11_seguridad_auth_jwt_y_hardening.sql
-- DESCRIPCIÓN: Blindaje crítico de autenticación, sesiones con tokens SHA-256,
--              bloqueo por fuerza bruta, auditoría de seguridad y verificación
--              Google real vía JWT de Supabase Auth (auth.uid() / auth.jwt()).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. COLUMNAS DE SEGURIDAD Y CIERRE DE LECTURA ANÓNIMA DIRECTA
ALTER TABLE public.perfiles_funcionarios
    ADD COLUMN IF NOT EXISTS correo_verificado_google BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS auth_user_id UUID;

ALTER TABLE public.perfiles_funcionarios ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.perfiles_funcionarios FROM anon;
REVOKE ALL ON TABLE public.perfiles_funcionarios FROM authenticated;

DROP POLICY IF EXISTS "Permitir lectura publica de funcionarios activos" ON public.perfiles_funcionarios;
DROP POLICY IF EXISTS "Acceso total funcionarios service_role" ON public.perfiles_funcionarios;
CREATE POLICY "Acceso total funcionarios service_role"
    ON public.perfiles_funcionarios FOR ALL TO service_role
    USING (TRUE) WITH CHECK (TRUE);

ALTER TABLE public.encuestas_prestadores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.encuestas_prestadores FROM anon;
DROP POLICY IF EXISTS "Lectura de prestadores por funcionarios autenticados" ON public.encuestas_prestadores;
DROP POLICY IF EXISTS "Insercion de prestadores por funcionarios autenticados" ON public.encuestas_prestadores;
DROP POLICY IF EXISTS "Denegar acceso directo anon prestadores" ON public.encuestas_prestadores;
CREATE POLICY "Acceso total prestadores service_role"
    ON public.encuestas_prestadores FOR ALL TO service_role
    USING (TRUE) WITH CHECK (TRUE);

-- 2. TABLAS INTERNAS DE SEGURIDAD (SOLO ACCESIBLES POR SECURITY DEFINER / SERVICE ROLE)
CREATE TABLE IF NOT EXISTS public.auditoria_seguridad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento VARCHAR(60) NOT NULL,
    funcionario_id UUID,
    cedula VARCHAR(30),
    detalle JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.intentos_login (
    identificador VARCHAR(120) PRIMARY KEY,
    fallos INTEGER NOT NULL DEFAULT 0,
    bloqueado_hasta TIMESTAMPTZ,
    ultimo_intento TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sesiones_activas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funcionario_id UUID NOT NULL REFERENCES public.perfiles_funcionarios(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    canal VARCHAR(16) NOT NULL DEFAULT 'WEB',
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sesiones_activas_func ON public.sesiones_activas(funcionario_id, revoked);
CREATE INDEX IF NOT EXISTS idx_sesiones_activas_exp ON public.sesiones_activas(expires_at);

ALTER TABLE public.auditoria_seguridad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intentos_login ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_activas ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.auditoria_seguridad FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.intentos_login FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.sesiones_activas FROM PUBLIC, anon, authenticated;

-- 3. FUNCIONES INTERNAS DE AUDITORÍA Y TOKENS DE SESIÓN (NO INVOCABLES POR REST)
CREATE OR REPLACE FUNCTION public._registrar_auditoria(
    p_evento TEXT,
    p_funcionario_id UUID DEFAULT NULL,
    p_cedula TEXT DEFAULT NULL,
    p_detalle JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    INSERT INTO public.auditoria_seguridad (evento, funcionario_id, cedula, detalle)
    VALUES (p_evento, p_funcionario_id, p_cedula, COALESCE(p_detalle, '{}'::JSONB));
END;
$$;

CREATE OR REPLACE FUNCTION public._crear_sesion_token(
    p_funcionario_id UUID,
    p_canal TEXT DEFAULT 'WEB'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_raw_token TEXT;
    v_canal TEXT;
BEGIN
    v_raw_token := encode(gen_random_bytes(32), 'hex');
    v_canal := CASE WHEN UPPER(COALESCE(p_canal, 'WEB')) = 'APK' THEN 'APK' ELSE 'WEB' END;

    DELETE FROM public.sesiones_activas
    WHERE expires_at < NOW() - INTERVAL '1 day';

    INSERT INTO public.sesiones_activas (funcionario_id, token_hash, canal, expires_at)
    VALUES (
        p_funcionario_id,
        encode(digest(v_raw_token, 'sha256'), 'hex'),
        v_canal,
        CASE WHEN v_canal = 'APK' THEN NOW() + INTERVAL '7 days' ELSE NOW() + INTERVAL '12 hours' END
    );

    RETURN v_raw_token;
END;
$$;

CREATE OR REPLACE FUNCTION public._validar_sesion_token(
    p_token TEXT,
    p_requiere_supervisor BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_token_limpio TEXT := TRIM(COALESCE(p_token, ''));
    v_hash TEXT;
    v_ses RECORD;
BEGIN
    IF LENGTH(v_token_limpio) < 32 THEN
        RAISE EXCEPTION 'SESION_INVALIDA: Token de sesión ausente o malformado.' USING ERRCODE = '42501';
    END IF;

    v_hash := encode(digest(v_token_limpio, 'sha256'), 'hex');

    SELECT s.id AS sesion_id, s.funcionario_id, f.rol, f.activo
    INTO v_ses
    FROM public.sesiones_activas s
    JOIN public.perfiles_funcionarios f ON f.id = s.funcionario_id
    WHERE s.token_hash = v_hash
      AND s.revoked = FALSE
      AND s.expires_at > NOW();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SESION_EXPIRADA: Su sesión expiró o fue cerrada. Inicie sesión nuevamente.' USING ERRCODE = '42501';
    END IF;

    IF v_ses.activo IS NOT TRUE THEN
        RAISE EXCEPTION 'USUARIO_REVOCADO: Usuario desactivado por COTATUR.' USING ERRCODE = '42501';
    END IF;

    IF p_requiere_supervisor AND COALESCE(v_ses.rol, 'ENCUESTADOR') NOT IN ('SUPERVISOR', 'ADMIN') THEN
        RAISE EXCEPTION 'NO_AUTORIZADO: Se requiere rol de Supervisor activo.' USING ERRCODE = '42501';
    END IF;

    UPDATE public.sesiones_activas SET last_used_at = NOW() WHERE id = v_ses.sesion_id;
    RETURN v_ses.funcionario_id;
END;
$$;

CREATE OR REPLACE FUNCTION public._construir_respuesta_sesion(
    p_func_id UUID,
    p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_func RECORD;
    v_permitir_punto BOOLEAN := FALSE;
BEGIN
    SELECT valor_bool INTO v_permitir_punto
    FROM public.configuracion_global
    WHERE clave = 'permitir_seleccion_punto_encuestador';

    SELECT f.*, p.codigo AS punto_codigo, p.nombre AS punto_nombre
    INTO v_func
    FROM public.perfiles_funcionarios f
    LEFT JOIN public.puntos_captura p ON f.punto_asignado_id = p.id
    WHERE f.id = p_func_id;

    RETURN jsonb_build_object(
        'status', 'success',
        'token', p_token,
        'es_supervisor', (COALESCE(v_func.rol, 'ENCUESTADOR') IN ('SUPERVISOR', 'ADMIN')),
        'debe_cambiar_clave', COALESCE(v_func.debe_cambiar_clave, FALSE),
        'funcionario', jsonb_build_object(
            'id', v_func.id,
            'cedula', v_func.cedula,
            'nombre_completo', COALESCE(v_func.nombre_completo, 'Funcionario'),
            'cargo', COALESCE(v_func.cargo, 'Encuestador de Campo'),
            'rol', COALESCE(v_func.rol, 'ENCUESTADOR'),
            'sexo', v_func.sexo,
            'telefono', v_func.telefono,
            'email', v_func.email,
            'correo_verificado_google', COALESCE(v_func.correo_verificado_google, FALSE),
            'avatar_url', v_func.avatar_url,
            'punto_asignado_id', v_func.punto_asignado_id,
            'punto_codigo', COALESCE(v_func.punto_codigo, 'PEAJE_TARIBA'),
            'punto_nombre', COALESCE(v_func.punto_nombre, 'Sin asignar')
        ),
        'configuracion', jsonb_build_object(
            'permitir_seleccion_punto', COALESCE(v_permitir_punto, FALSE)
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public._registrar_auditoria(TEXT, UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._crear_sesion_token(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._validar_sesion_token(TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._construir_respuesta_sesion(UUID, TEXT) FROM PUBLIC, anon, authenticated;

-- 4. ELIMINAR FIRMAS HEREDADAS INSEGURAS DE AUTENTICACIÓN
DROP FUNCTION IF EXISTS public.auth_login_funcionario(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.auth_primer_ingreso(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.auth_primer_ingreso(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.auth_actualizar_mi_perfil(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.auth_login_google(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.auth_recuperar_clave_con_google(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.auth_vincular_correo_google(UUID, TEXT, TEXT);

-- 5. LOGIN POR CÉDULA CON RATE LIMITING Y EMISIÓN DE TOKEN DE SESIÓN
CREATE OR REPLACE FUNCTION public.auth_login_funcionario(
    p_identificador TEXT,
    p_clave TEXT,
    p_canal TEXT DEFAULT 'WEB'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_ident TEXT := UPPER(TRIM(COALESCE(p_identificador, '')));
    v_intento RECORD;
    v_func RECORD;
    v_clave_valida BOOLEAN := FALSE;
    v_token TEXT;
BEGIN
    IF v_ident = '' OR TRIM(COALESCE(p_clave, '')) = '' THEN
        RAISE EXCEPTION 'CREDENCIALES_REQUERIDAS: Debe ingresar cédula y contraseña.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_intento FROM public.intentos_login WHERE identificador = v_ident;
    IF FOUND AND v_intento.bloqueado_hasta IS NOT NULL AND v_intento.bloqueado_hasta > NOW() THEN
        RAISE EXCEPTION 'CUENTA_BLOQUEADA_TEMP: Demasiados intentos fallidos. Espere 5 minutos.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_func
    FROM public.perfiles_funcionarios
    WHERE UPPER(TRIM(cedula)) = v_ident
       OR UPPER(TRIM(REPLACE(cedula, 'V-', ''))) = UPPER(TRIM(REPLACE(v_ident, 'V-', '')))
    LIMIT 1;

    IF NOT FOUND THEN
        INSERT INTO public.intentos_login (identificador, fallos, bloqueado_hasta, ultimo_intento)
        VALUES (v_ident, 1, NULL, NOW())
        ON CONFLICT (identificador) DO UPDATE
        SET fallos = CASE WHEN intentos_login.ultimo_intento < NOW() - INTERVAL '15 minutes' THEN 1 ELSE intentos_login.fallos + 1 END,
            bloqueado_hasta = CASE WHEN (intentos_login.fallos + 1) >= 5 THEN NOW() + INTERVAL '5 minutes' ELSE NULL END,
            ultimo_intento = NOW();
        PERFORM public._registrar_auditoria('LOGIN_FALLIDO_NO_EXISTE', NULL, v_ident);
        RAISE EXCEPTION 'CREDENCIALES_INVALIDAS: Cédula o contraseña incorrecta.' USING ERRCODE = '42501';
    END IF;

    IF v_func.activo IS NOT TRUE THEN
        PERFORM public._registrar_auditoria('LOGIN_USUARIO_REVOCADO', v_func.id, v_func.cedula);
        RAISE EXCEPTION 'USUARIO_REVOCADO: Este usuario ha sido desactivado por la supervisión de COTATUR.' USING ERRCODE = '42501';
    END IF;

    IF v_func.password_hash IS NULL OR v_func.debe_cambiar_clave = TRUE THEN
        v_clave_valida := (
            TRIM(p_clave) = TRIM(v_func.cedula)
            OR UPPER(TRIM(REPLACE(p_clave, 'V-', ''))) = UPPER(TRIM(REPLACE(v_func.cedula, 'V-', '')))
            OR REGEXP_REPLACE(p_clave, '[^0-9]', '', 'g') = REGEXP_REPLACE(v_func.cedula, '[^0-9]', '', 'g')
        );
    ELSE
        v_clave_valida := (v_func.password_hash = crypt(p_clave, v_func.password_hash));
    END IF;

    IF NOT v_clave_valida THEN
        INSERT INTO public.intentos_login (identificador, fallos, bloqueado_hasta, ultimo_intento)
        VALUES (v_ident, 1, NULL, NOW())
        ON CONFLICT (identificador) DO UPDATE
        SET fallos = CASE WHEN intentos_login.ultimo_intento < NOW() - INTERVAL '15 minutes' THEN 1 ELSE intentos_login.fallos + 1 END,
            bloqueado_hasta = CASE WHEN (intentos_login.fallos + 1) >= 5 THEN NOW() + INTERVAL '5 minutes' ELSE NULL END,
            ultimo_intento = NOW();
        PERFORM public._registrar_auditoria('LOGIN_FALLIDO_CLAVE', v_func.id, v_func.cedula);
        RAISE EXCEPTION 'CREDENCIALES_INVALIDAS: Cédula o contraseña incorrecta.' USING ERRCODE = '42501';
    END IF;

    DELETE FROM public.intentos_login WHERE identificador = v_ident;
    UPDATE public.perfiles_funcionarios SET ultimo_ingreso = NOW() WHERE id = v_func.id;
    v_token := public._crear_sesion_token(v_func.id, p_canal);
    PERFORM public._registrar_auditoria('LOGIN_EXITOSO_CEDULA', v_func.id, v_func.cedula, jsonb_build_object('canal', p_canal));

    RETURN public._construir_respuesta_sesion(v_func.id, v_token);
END;
$$;

-- 6. VALIDACIÓN Y CIERRE DE SESIÓN
CREATE OR REPLACE FUNCTION public.auth_validar_sesion(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_func_id UUID;
BEGIN
    v_func_id := public._validar_sesion_token(p_token, FALSE);
    RETURN public._construir_respuesta_sesion(v_func_id, p_token);
END;
$$;

CREATE OR REPLACE FUNCTION public.auth_cerrar_sesion(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_token_limpio TEXT := TRIM(COALESCE(p_token, ''));
BEGIN
    IF v_token_limpio <> '' THEN
        UPDATE public.sesiones_activas
        SET revoked = TRUE
        WHERE token_hash = encode(digest(v_token_limpio, 'sha256'), 'hex');
    END IF;
    RETURN jsonb_build_object('status', 'success');
END;
$$;

-- 7. PRIMER INGRESO Y ACTUALIZACIÓN DE PERFIL AUTENTICADA POR TOKEN
CREATE OR REPLACE FUNCTION public.auth_primer_ingreso(
    p_token TEXT,
    p_nueva_clave TEXT,
    p_nombre_completo TEXT,
    p_telefono TEXT DEFAULT NULL,
    p_sexo TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_func_id UUID;
BEGIN
    v_func_id := public._validar_sesion_token(p_token, FALSE);

    IF LENGTH(TRIM(COALESCE(p_nueva_clave, ''))) < 8 THEN
        RAISE EXCEPTION 'CLAVE_CORTA: La contraseña debe tener al menos 8 caracteres.';
    END IF;

    UPDATE public.perfiles_funcionarios
    SET password_hash = crypt(TRIM(p_nueva_clave), gen_salt('bf')),
        nombre_completo = COALESCE(NULLIF(TRIM(p_nombre_completo), ''), nombre_completo),
        telefono = COALESCE(NULLIF(TRIM(p_telefono), ''), telefono),
        sexo = COALESCE(NULLIF(TRIM(p_sexo), ''), sexo),
        debe_cambiar_clave = FALSE,
        ultimo_ingreso = NOW()
    WHERE id = v_func_id;

    PERFORM public._registrar_auditoria('PRIMER_INGRESO_COMPLETADO', v_func_id);
    RETURN jsonb_build_object('status', 'success', 'mensaje', 'Perfil y contraseña actualizados exitosamente.');
END;
$$;

CREATE OR REPLACE FUNCTION public.auth_actualizar_mi_perfil(
    p_token TEXT,
    p_nombre TEXT,
    p_telefono TEXT DEFAULT NULL,
    p_clave_actual TEXT DEFAULT NULL,
    p_nueva_clave TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_func_id UUID;
    v_func RECORD;
    v_clave_valida BOOLEAN := FALSE;
BEGIN
    v_func_id := public._validar_sesion_token(p_token, FALSE);
    SELECT * INTO v_func FROM public.perfiles_funcionarios WHERE id = v_func_id;

    IF p_nueva_clave IS NOT NULL AND LENGTH(TRIM(p_nueva_clave)) > 0 THEN
        IF LENGTH(TRIM(p_nueva_clave)) < 8 THEN
            RAISE EXCEPTION 'CLAVE_CORTA: La nueva contraseña debe tener al menos 8 caracteres.';
        END IF;

        v_clave_valida := (v_func.password_hash IS NOT NULL AND v_func.password_hash = crypt(COALESCE(p_clave_actual, ''), v_func.password_hash));
        IF NOT v_clave_valida THEN
            RAISE EXCEPTION 'CLAVE_ACTUAL_INCORRECTA: La contraseña actual ingresada es incorrecta.';
        END IF;

        UPDATE public.perfiles_funcionarios
        SET password_hash = crypt(TRIM(p_nueva_clave), gen_salt('bf')),
            debe_cambiar_clave = FALSE
        WHERE id = v_func_id;
    END IF;

    UPDATE public.perfiles_funcionarios
    SET nombre_completo = COALESCE(NULLIF(TRIM(p_nombre), ''), nombre_completo),
        telefono = COALESCE(NULLIF(TRIM(p_telefono), ''), telefono)
    WHERE id = v_func_id;

    PERFORM public._registrar_auditoria('PERFIL_ACTUALIZADO', v_func_id, v_func.cedula);
    RETURN jsonb_build_object('status', 'success', 'mensaje', 'Perfil actualizado exitosamente.');
END;
$$;

-- 8. GOOGLE AUTHENTICATION VERIFICADA EXCLUSIVAMENTE POR SUPABASE AUTH JWT
CREATE OR REPLACE FUNCTION public.auth_login_google_jwt(p_canal TEXT DEFAULT 'WEB')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_jwt JSONB := auth.jwt();
    v_email TEXT;
    v_func RECORD;
    v_token TEXT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'JWT_REQUERIDO: Debe autenticarse mediante Google / Supabase Auth.' USING ERRCODE = '42501';
    END IF;

    v_email := LOWER(TRIM(COALESCE(v_jwt->>'email', '')));
    IF v_email = '' THEN
        RAISE EXCEPTION 'JWT_SIN_EMAIL: El token verificado de Google no incluye correo.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_func
    FROM public.perfiles_funcionarios
    WHERE auth_user_id = v_uid
       OR (email IS NOT NULL AND LOWER(TRIM(email)) = v_email)
    LIMIT 1;

    IF NOT FOUND THEN
        PERFORM public._registrar_auditoria('GOOGLE_LOGIN_NO_VINCULADO', NULL, NULL, jsonb_build_object('email', v_email));
        RAISE EXCEPTION 'USUARIO_NO_VINCULADO: La cuenta Google (%) no está vinculada a ningún funcionario activo.', v_email USING ERRCODE = '42501';
    END IF;

    IF v_func.activo IS NOT TRUE THEN
        RAISE EXCEPTION 'USUARIO_REVOCADO: Usuario desactivado por la supervisión de COTATUR.' USING ERRCODE = '42501';
    END IF;

    UPDATE public.perfiles_funcionarios
    SET auth_user_id = v_uid,
        correo_verificado_google = TRUE,
        ultimo_ingreso = NOW()
    WHERE id = v_func.id;

    v_token := public._crear_sesion_token(v_func.id, p_canal);
    PERFORM public._registrar_auditoria('LOGIN_EXITOSO_GOOGLE_JWT', v_func.id, v_func.cedula);

    RETURN public._construir_respuesta_sesion(v_func.id, v_token);
END;
$$;

-- 9. PERMISOS BASE DE AUTENTICACIÓN (ver 11b_seguridad_auth_google_jwt.sql para vinculación y recuperación)
GRANT EXECUTE ON FUNCTION public.auth_login_funcionario(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_validar_sesion(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_cerrar_sesion(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_primer_ingreso(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_actualizar_mi_perfil(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_login_google_jwt(TEXT) TO authenticated;
