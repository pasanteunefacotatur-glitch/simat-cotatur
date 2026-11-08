-- ==============================================================================
-- PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
-- ENTIDAD: Corporación Tachirense de Turismo (COTATUR)
-- ARCHIVO: 05_autenticacion_funcionarios_completa.sql
-- DESCRIPCIÓN: Sistema integral de identificación y autenticación por Cédula:
--              1. Creación de funcionarios solo con su Cédula (clave = cédula inicial).
--              2. Flujo de primer ingreso (cambio obligatorio de clave y datos personales).
--              3. Vinculación opcional con Google para rescate de clave por correo.
--              4. Acciones de supervisor: Crear, Activar/Desactivar, Restablecer clave, Eliminar.
--              5. Configuración global: Permitir o bloquear selección de punto a encuestadores.
--              Cumple con la regla de modularidad (< 500 líneas).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ACTUALIZAR TABLA DE FUNCIONARIOS
ALTER TABLE public.perfiles_funcionarios 
    ADD COLUMN IF NOT EXISTS password_hash TEXT,
    ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'ENCUESTADOR',
    ADD COLUMN IF NOT EXISTS email VARCHAR(150),
    ADD COLUMN IF NOT EXISTS debe_cambiar_clave BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS google_id VARCHAR(150),
    ADD COLUMN IF NOT EXISTS ultimo_ingreso TIMESTAMPTZ;

-- Crear supervisor inicial por defecto (Cédula: 00000000, clave inicial: cotatur2026)
INSERT INTO public.perfiles_funcionarios (cedula, nombre_completo, cargo, rol, activo, debe_cambiar_clave, password_hash)
VALUES ('00000000', 'Supervisor General COTATUR', 'Supervisión de Operativo', 'SUPERVISOR', TRUE, FALSE, crypt('cotatur2026', gen_salt('bf')))
ON CONFLICT (cedula) DO UPDATE 
SET rol = 'SUPERVISOR', activo = TRUE, password_hash = crypt('cotatur2026', gen_salt('bf'));

-- 2. TABLA DE CONFIGURACIÓN GLOBAL DEL SISTEMA
CREATE TABLE IF NOT EXISTS public.configuracion_global (
    clave VARCHAR(50) PRIMARY KEY,
    valor_bool BOOLEAN DEFAULT FALSE,
    valor_texto TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.configuracion_global (clave, valor_bool, valor_texto)
VALUES ('permitir_seleccion_punto_encuestador', FALSE, 'Si los encuestadores pueden cambiar libremente su punto de control')
ON CONFLICT (clave) DO NOTHING;

-- 3. POLÍTICAS RLS
ALTER TABLE public.configuracion_global ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura publica configuracion global" ON public.configuracion_global;
CREATE POLICY "Lectura publica configuracion global" ON public.configuracion_global FOR SELECT USING (TRUE);

-- 4. FUNCIÓN RPC: INICIO DE SESIÓN DE FUNCIONARIOS Y SUPERVISORES (WEB Y APK)
CREATE OR REPLACE FUNCTION public.auth_login_funcionario(
    p_identificador TEXT,
    p_clave TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_func RECORD;
    v_clave_valida BOOLEAN := FALSE;
    v_permitir_punto BOOLEAN := FALSE;
    v_pin_maestro CONSTANT TEXT := 'cotatur2026';
    v_identificador_limpio TEXT;
BEGIN
    v_identificador_limpio := UPPER(TRIM(p_identificador));

    -- Obtener ajuste global de punto
    SELECT valor_bool INTO v_permitir_punto 
    FROM public.configuracion_global 
    WHERE clave = 'permitir_seleccion_punto_encuestador';

    -- Caso especial: PIN maestro directo de supervisión
    IF (v_identificador_limpio = 'ADMIN' OR v_identificador_limpio = 'COTATUR' OR v_identificador_limpio = '00000000') AND p_clave = v_pin_maestro THEN
        RETURN jsonb_build_object(
            'status', 'success',
            'es_supervisor', TRUE,
            'debe_cambiar_clave', FALSE,
            'funcionario', jsonb_build_object(
                'id', '00000000-0000-0000-0000-000000000000',
                'cedula', '00000000',
                'nombre_completo', 'Supervisor General COTATUR',
                'rol', 'SUPERVISOR',
                'cargo', 'Supervisión de Operativo'
            ),
            'configuracion', jsonb_build_object(
                'permitir_seleccion_punto', COALESCE(v_permitir_punto, FALSE)
            )
        );
    END IF;

    -- Buscar funcionario por cédula (con o sin prefijo V-)
    SELECT f.*, p.nombre AS punto_nombre
    INTO v_func
    FROM public.perfiles_funcionarios f
    LEFT JOIN public.puntos_captura p ON f.punto_asignado_id = p.id
    WHERE UPPER(TRIM(f.cedula)) = v_identificador_limpio 
       OR UPPER(TRIM(REPLACE(f.cedula, 'V-', ''))) = UPPER(TRIM(REPLACE(v_identificador_limpio, 'V-', '')));

    IF NOT FOUND THEN
        -- Si intentó con el PIN maestro pero puso cualquier cédula válida
        IF p_clave = v_pin_maestro THEN
            RETURN jsonb_build_object(
                'status', 'success',
                'es_supervisor', TRUE,
                'debe_cambiar_clave', FALSE,
                'funcionario', jsonb_build_object(
                    'cedula', v_identificador_limpio,
                    'nombre_completo', 'Supervisor Autorizado (PIN Maestro)',
                    'rol', 'SUPERVISOR'
                ),
                'configuracion', jsonb_build_object('permitir_seleccion_punto', COALESCE(v_permitir_punto, FALSE))
            );
        END IF;

        RAISE EXCEPTION 'USUARIO_NO_ENCONTRADO: La cédula % no está registrada en COTATUR.', p_identificador
        USING ERRCODE = '42501';
    END IF;

    -- Verificar si está activo
    IF NOT v_func.activo THEN
        RAISE EXCEPTION 'USUARIO_REVOCADO: Este usuario ha sido desactivado por la supervisión de COTATUR.'
        USING ERRCODE = '42501';
    END IF;

    -- Validar contraseña:
    -- A) Clave por defecto inicial (la cédula del usuario)
    -- B) Hash guardado en base de datos
    -- C) PIN maestro institucional de emergencia ('cotatur2026')
    IF p_clave = v_pin_maestro THEN
        v_clave_valida := TRUE;
    ELSIF v_func.password_hash IS NULL OR v_func.debe_cambiar_clave = TRUE THEN
        v_clave_valida := (TRIM(p_clave) = TRIM(v_func.cedula) OR TRIM(p_clave) = TRIM(REPLACE(v_func.cedula, 'V-', '')));
    ELSE
        v_clave_valida := (v_func.password_hash = crypt(p_clave, v_func.password_hash));
    END IF;

    IF NOT v_clave_valida THEN
        RAISE EXCEPTION 'CLAVE_INCORRECTA: La contraseña no coincide con la registrada.'
        USING ERRCODE = '42501';
    END IF;

    -- Registrar último ingreso
    UPDATE public.perfiles_funcionarios SET ultimo_ingreso = NOW() WHERE id = v_func.id;

    RETURN jsonb_build_object(
        'status', 'success',
        'es_supervisor', (v_func.rol = 'SUPERVISOR'),
        'debe_cambiar_clave', COALESCE(v_func.debe_cambiar_clave, TRUE),
        'funcionario', jsonb_build_object(
            'id', v_func.id,
            'cedula', v_func.cedula,
            'nombre_completo', COALESCE(v_func.nombre_completo, 'Funcionario Nuevo'),
            'cargo', COALESCE(v_func.cargo, 'Encuestador de Campo'),
            'rol', COALESCE(v_func.rol, 'ENCUESTADOR'),
            'telefono', v_func.telefono,
            'email', v_func.email,
            'punto_asignado_id', v_func.punto_asignado_id,
            'punto_nombre', COALESCE(v_func.punto_nombre, 'Sin asignar')
        ),
        'configuracion', jsonb_build_object(
            'permitir_seleccion_punto', COALESCE(v_permitir_punto, FALSE)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNCIÓN RPC: PRIMER INGRESO (ACTUALIZAR CONTRASEÑA Y PERFIL)
CREATE OR REPLACE FUNCTION public.auth_primer_ingreso(
    p_funcionario_id UUID,
    p_nueva_clave TEXT,
    p_nombre_completo TEXT,
    p_telefono TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_google_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
    IF LENGTH(TRIM(p_nueva_clave)) < 4 THEN
        RAISE EXCEPTION 'CLAVE_CORTA: La contraseña debe tener al menos 4 caracteres.';
    END IF;

    UPDATE public.perfiles_funcionarios
    SET password_hash = crypt(p_nueva_clave, gen_salt('bf')),
        nombre_completo = COALESCE(NULLIF(TRIM(p_nombre_completo), ''), nombre_completo),
        telefono = COALESCE(NULLIF(TRIM(p_telefono), ''), telefono),
        email = COALESCE(NULLIF(TRIM(p_email), ''), email),
        google_id = COALESCE(NULLIF(TRIM(p_google_id), ''), google_id),
        debe_cambiar_clave = FALSE,
        ultimo_ingreso = NOW()
    WHERE id = p_funcionario_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Funcionario no encontrado con ID %', p_funcionario_id;
    END IF;

    RETURN jsonb_build_object(
        'status', 'success',
        'mensaje', 'Perfil y contraseña actualizados exitosamente'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCIÓN RPC MAESTRA: GESTIÓN DE FUNCIONARIOS V2 POR EL SUPERVISOR
CREATE OR REPLACE FUNCTION public.admin_gestionar_funcionarios_v2(
    p_credencial TEXT,
    p_accion TEXT,
    p_datos JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_es_supervisor BOOLEAN := FALSE;
    v_nuevo_id UUID;
    v_target_id UUID;
    v_target_cedula TEXT;
    v_nuevo_estado BOOLEAN;
    v_pin_maestro CONSTANT TEXT := 'cotatur2026';
BEGIN
    -- 1. Validar autorización
    IF TRIM(p_credencial) = v_pin_maestro THEN
        v_es_supervisor := TRUE;
    ELSE
        SELECT (rol = 'SUPERVISOR' AND activo = TRUE) INTO v_es_supervisor
        FROM public.perfiles_funcionarios
        WHERE id = NULLIF(TRIM(p_credencial), '')::UUID 
           OR UPPER(TRIM(cedula)) = UPPER(TRIM(p_credencial));
    END IF;

    IF NOT COALESCE(v_es_supervisor, FALSE) THEN
        RAISE EXCEPTION 'NO_AUTORIZADO: Se requiere rango de Supervisor o PIN Maestro para esta acción.'
        USING ERRCODE = '42501';
    END IF;

    -- 2. Enrutamiento de acciones
    CASE UPPER(TRIM(p_accion))
        -- LISTAR TODOS LOS USUARIOS
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

        -- CREAR USUARIO SOLO CON SU CÉDULA
        WHEN 'CREAR' THEN
            v_target_cedula := UPPER(TRIM(p_datos->>'cedula'));
            IF v_target_cedula IS NULL OR LENGTH(v_target_cedula) < 4 THEN
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
                COALESCE(NULLIF(TRIM(p_datos->>'rol'), ''), 'ENCUESTADOR'),
                TRUE,
                TRUE, -- Obliga a cambiar clave al ingresar
                crypt(v_target_cedula, gen_salt('bf')), -- Clave inicial = cédula
                NULLIF(p_datos->>'punto_asignado_id', '')::UUID
            );

            RETURN jsonb_build_object(
                'status', 'success',
                'id', v_nuevo_id,
                'cedula', v_target_cedula,
                'mensaje', 'Funcionario registrado. Su clave inicial es su número de cédula.'
            );

        -- RESTABLECER CONTRASEÑA A LA CÉDULA
        WHEN 'RESET_PASSWORD' THEN
            v_target_id := (p_datos->>'id')::UUID;

            SELECT cedula INTO v_target_cedula FROM public.perfiles_funcionarios WHERE id = v_target_id;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Funcionario no encontrado con ID %', v_target_id;
            END IF;

            UPDATE public.perfiles_funcionarios
            SET password_hash = crypt(cedula, gen_salt('bf')),
                debe_cambiar_clave = TRUE
            WHERE id = v_target_id;

            RETURN jsonb_build_object(
                'status', 'success',
                'mensaje', 'Contraseña restablecida exitosamente al número de cédula (' || v_target_cedula || ')'
            );

        -- ACTIVAR / DESACTIVAR
        WHEN 'TOGGLE_ACTIVO' THEN
            v_target_id := (p_datos->>'id')::UUID;

            UPDATE public.perfiles_funcionarios
            SET activo = NOT activo
            WHERE id = v_target_id
            RETURNING activo INTO v_nuevo_estado;

            RETURN jsonb_build_object(
                'status', 'success',
                'id', v_target_id,
                'nuevo_estado', v_nuevo_estado
            );

        -- ELIMINAR USUARIO
        WHEN 'ELIMINAR' THEN
            v_target_id := (p_datos->>'id')::UUID;
            DELETE FROM public.perfiles_funcionarios WHERE id = v_target_id;

            RETURN jsonb_build_object('status', 'success', 'mensaje', 'Usuario eliminado de COTATUR');

        -- OBTENER AJUSTES GLOBALES
        WHEN 'CONFIG_GET' THEN
            RETURN (
                SELECT jsonb_object_agg(clave, valor_bool)
                FROM public.configuracion_global
            );

        -- MODIFICAR AJUSTE GLOBAL (Permitir cambio de punto)
        WHEN 'CONFIG_SET' THEN
            UPDATE public.configuracion_global
            SET valor_bool = (p_datos->>'permitir_seleccion_punto_encuestador')::BOOLEAN,
                updated_at = NOW()
            WHERE clave = 'permitir_seleccion_punto_encuestador';

            RETURN jsonb_build_object('status', 'success', 'mensaje', 'Configuración global actualizada');

        ELSE
            RAISE EXCEPTION 'Acción administrativa no soportada: %', p_accion;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CONCEDER PERMISOS EXPLÍCITOS A ANON Y AUTHENTICATED
GRANT EXECUTE ON FUNCTION public.auth_login_funcionario(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_primer_ingreso(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_gestionar_funcionarios_v2(TEXT, TEXT, JSONB) TO anon, authenticated;
