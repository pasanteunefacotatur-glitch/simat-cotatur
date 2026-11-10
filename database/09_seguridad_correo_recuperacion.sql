-- ==============================================================================
-- PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
-- ENTIDAD: Corporación Tachirense de Turismo (COTATUR)
-- ARCHIVO: 09_seguridad_correo_recuperacion.sql
-- DESCRIPCIÓN: 
--   1. Bloqueo de modificación manual de correo: Solo se puede vincular o 
--      cambiar iniciando sesión y autenticando con Google.
--   2. Función RPC para recuperación de contraseña olvidada mediante 
--      verificación oficial con la cuenta de Google vinculada.
--   3. Función RPC para vincular o actualizar correo exclusivamente con Google.
--   Cumple con la regla de modularidad (< 500 líneas).
-- ==============================================================================

-- 1. COLUMNA DE CORREO VERIFICADO POR GOOGLE
ALTER TABLE public.perfiles_funcionarios 
ADD COLUMN IF NOT EXISTS correo_verificado_google BOOLEAN DEFAULT FALSE;

-- Marcar como verificados los funcionarios que ya tienen google_id o correo oficial
UPDATE public.perfiles_funcionarios 
SET correo_verificado_google = TRUE 
WHERE google_id IS NOT NULL 
   OR email = 'pasanteunefacotatur@gmail.com';

-- 2. FUNCIÓN RPC: RECUPERACIÓN DE CONTRASEÑA CON GOOGLE VERIFICADO
CREATE OR REPLACE FUNCTION public.auth_recuperar_clave_con_google(
    p_cedula TEXT,
    p_google_email TEXT,
    p_google_id TEXT DEFAULT NULL,
    p_nueva_clave TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_func RECORD;
    v_cedula_limpia TEXT;
    v_email_limpio TEXT;
    v_google_id_limpio TEXT;
    v_punto_codigo TEXT := 'PEAJE_TARIBA';
    v_punto_nombre TEXT := 'Peaje Vega de Táriba';
BEGIN
    v_cedula_limpia := UPPER(TRIM(REPLACE(COALESCE(p_cedula, ''), ' ', '')));
    v_email_limpio := LOWER(TRIM(COALESCE(p_google_email, '')));
    v_google_id_limpio := TRIM(COALESCE(p_google_id, ''));

    IF v_cedula_limpia = '' THEN
        RAISE EXCEPTION 'DATOS_INVALIDOS: Debe ingresar su número de cédula.' USING ERRCODE = '42501';
    END IF;

    IF v_email_limpio = '' THEN
        RAISE EXCEPTION 'DATOS_INVALIDOS: Debe verificar su identidad con su cuenta de Google.' USING ERRCODE = '42501';
    END IF;

    IF p_nueva_clave IS NULL OR LENGTH(TRIM(p_nueva_clave)) < 4 THEN
        RAISE EXCEPTION 'CLAVE_CORTA: La nueva contraseña debe tener al menos 4 caracteres.' USING ERRCODE = '42501';
    END IF;

    -- Buscar al funcionario por Cédula
    SELECT f.*, p.codigo AS p_cod, p.nombre AS p_nom
    INTO v_func
    FROM public.perfiles_funcionarios f
    LEFT JOIN public.puntos_captura p ON f.punto_asignado_id = p.id
    WHERE (f.cedula = v_cedula_limpia OR REPLACE(f.cedula, 'V-', '') = REPLACE(v_cedula_limpia, 'V-', ''));

    IF NOT FOUND THEN
        RAISE EXCEPTION 'USUARIO_NO_ENCONTRADO: No se encontró ningún funcionario con la cédula %', v_cedula_limpia
        USING ERRCODE = '42501';
    END IF;

    IF NOT v_func.activo THEN
        RAISE EXCEPTION 'USUARIO_INACTIVO: Este usuario ha sido desactivado por la supervisión de COTATUR.'
        USING ERRCODE = '42501';
    END IF;

    -- Validar que la cuenta de Google coincida con la registrada/verificada
    IF v_func.email IS NULL OR LOWER(TRIM(v_func.email)) <> v_email_limpio THEN
        IF v_func.google_id IS NULL OR v_func.google_id <> v_google_id_limpio THEN
            RAISE EXCEPTION 'GOOGLE_NO_COINCIDE: La cuenta de Google (%) no coincide con la vinculada a la cédula %. Verifique su cuenta o solicite apoyo a la Supervisión.', v_email_limpio, v_cedula_limpia
            USING ERRCODE = '42501';
        END IF;
    END IF;

    -- Actualizar contraseña cifrada y marcar correo verificado
    UPDATE public.perfiles_funcionarios
    SET password_hash = crypt(p_nueva_clave, gen_salt('bf')),
        debe_cambiar_clave = FALSE,
        google_id = COALESCE(google_id, NULLIF(v_google_id_limpio, '')),
        correo_verificado_google = TRUE,
        ultimo_ingreso = NOW()
    WHERE id = v_func.id;

    -- Auditoría
    INSERT INTO public.auditoria_seguridad (
        funcionario_id, accion, detalle, direccion_ip
    ) VALUES (
        v_func.id,
        'RECUPERACION_CLAVE_GOOGLE',
        jsonb_build_object(
            'cedula', v_func.cedula,
            'email_google', v_email_limpio,
            'fecha', NOW()
        ),
        'APP_MOVIL_OTA'
    );

    IF v_func.p_cod IS NOT NULL THEN
        v_punto_codigo := v_func.p_cod;
        v_punto_nombre := v_func.p_nom;
    END IF;

    RETURN jsonb_build_object(
        'status', 'success',
        'mensaje', 'Contraseña restablecida exitosamente mediante verificación con Google.',
        'funcionario', jsonb_build_object(
            'id', v_func.id,
            'cedula', v_func.cedula,
            'nombre_completo', v_func.nombre_completo,
            'rol', v_func.rol,
            'email', v_email_limpio,
            'punto_codigo', v_punto_codigo,
            'punto_nombre', v_punto_nombre
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. FUNCIÓN RPC: VINCULAR O ACTUALIZAR CORREO EXCLUSIVAMENTE CON GOOGLE
CREATE OR REPLACE FUNCTION public.auth_vincular_correo_google(
    p_funcionario_id UUID,
    p_google_email TEXT,
    p_google_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_func RECORD;
    v_email_limpio TEXT;
    v_google_id_limpio TEXT;
    v_duplicado UUID;
BEGIN
    v_email_limpio := LOWER(TRIM(COALESCE(p_google_email, '')));
    v_google_id_limpio := TRIM(COALESCE(p_google_id, ''));

    IF v_email_limpio = '' THEN
        RAISE EXCEPTION 'DATOS_INVALIDOS: Debe proporcionar una cuenta Google válida.' USING ERRCODE = '42501';
    END IF;

    -- Verificar funcionario
    SELECT * INTO v_func FROM public.perfiles_funcionarios WHERE id = p_funcionario_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Funcionario no encontrado con ID %', p_funcionario_id USING ERRCODE = '42501';
    END IF;

    -- Verificar que otro funcionario activo no tenga ya este mismo correo Google
    SELECT id INTO v_duplicado 
    FROM public.perfiles_funcionarios 
    WHERE id <> p_funcionario_id 
      AND (
          (email IS NOT NULL AND LOWER(TRIM(email)) = v_email_limpio)
          OR (google_id IS NOT NULL AND google_id = v_google_id_limpio)
      )
      AND activo = TRUE;

    IF FOUND THEN
        RAISE EXCEPTION 'CORREO_DUPLICADO: La cuenta de Google (%) ya se encuentra vinculada a otro funcionario.', v_email_limpio
        USING ERRCODE = '42501';
    END IF;

    -- Actualizar correo exclusivamente verificado por Google
    UPDATE public.perfiles_funcionarios
    SET email = v_email_limpio,
        google_id = COALESCE(NULLIF(v_google_id_limpio, ''), google_id, v_email_limpio),
        correo_verificado_google = TRUE,
        ultimo_ingreso = NOW()
    WHERE id = p_funcionario_id;

    RETURN jsonb_build_object(
        'status', 'success',
        'mensaje', 'Correo institucional verificado y vinculado exitosamente con Google.',
        'email', v_email_limpio
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. ACTUALIZAR RPC DE PERFIL: ELIMINAR MODIFICACIÓN ARBITRARIA DE CORREO
CREATE OR REPLACE FUNCTION public.auth_actualizar_mi_perfil(
    p_funcionario_id UUID,
    p_nombre TEXT,
    p_telefono TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL, -- Ignorado para edición manual directa
    p_clave_actual TEXT DEFAULT NULL,
    p_nueva_clave TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_func RECORD;
    v_clave_valida BOOLEAN := FALSE;
BEGIN
    SELECT * INTO v_func FROM public.perfiles_funcionarios WHERE id = p_funcionario_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Funcionario no encontrado con ID %', p_funcionario_id;
    END IF;

    -- Validar cambio de contraseña
    IF p_nueva_clave IS NOT NULL AND LENGTH(TRIM(p_nueva_clave)) > 0 THEN
        IF LENGTH(TRIM(p_nueva_clave)) < 4 THEN
            RAISE EXCEPTION 'La nueva contraseña debe tener al menos 4 caracteres.';
        END IF;

        IF v_func.password_hash IS NOT NULL THEN
            v_clave_valida := (v_func.password_hash = crypt(p_clave_actual, v_func.password_hash));
        ELSE
            v_clave_valida := (TRIM(p_clave_actual) = TRIM(v_func.cedula) OR TRIM(p_clave_actual) = TRIM(REPLACE(v_func.cedula, 'V-', '')));
        END IF;

        IF NOT v_clave_valida THEN
            RAISE EXCEPTION 'La contraseña actual ingresada es incorrecta.';
        END IF;

        UPDATE public.perfiles_funcionarios
        SET password_hash = crypt(p_nueva_clave, gen_salt('bf')),
            debe_cambiar_clave = FALSE
        WHERE id = p_funcionario_id;
    END IF;

    -- Actualizar SOLO nombre y teléfono (El correo está blindado contra cambios manuales)
    UPDATE public.perfiles_funcionarios
    SET nombre_completo = COALESCE(NULLIF(TRIM(p_nombre), ''), nombre_completo),
        telefono = COALESCE(NULLIF(TRIM(p_telefono), ''), telefono)
    WHERE id = p_funcionario_id;

    RETURN jsonb_build_object(
        'status', 'success',
        'mensaje', 'Perfil actualizado exitosamente (Correo preservado bajo protección Google).'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. PERMISOS
GRANT EXECUTE ON FUNCTION public.auth_recuperar_clave_con_google(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_vincular_correo_google(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_actualizar_mi_perfil(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
