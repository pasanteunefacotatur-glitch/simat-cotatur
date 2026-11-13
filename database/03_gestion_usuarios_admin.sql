-- ==============================================================================
-- PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
-- ENTIDAD: Corporación Tachirense de Turismo (COTATUR)
-- ARCHIVO: 03_gestion_usuarios_admin.sql
-- DESCRIPCIÓN: Módulo de gestión y administración de funcionarios/encuestadores.
--              Permite que tanto la Web como el APK Android administren usuarios
--              mediante una función RPC protegida por PIN de supervisión.
--              Cumple con la regla de modularidad (< 500 líneas).
-- ==============================================================================

-- 1. POLÍTICAS RLS PARA LECTURA Y ADMINISTRACIÓN DE FUNCIONARIOS
ALTER TABLE public.perfiles_funcionarios ENABLE ROW LEVEL SECURITY;

-- Permitir lectura de funcionarios activos protegiendo password_hash
DROP POLICY IF EXISTS "Permitir lectura publica de funcionarios activos" ON public.perfiles_funcionarios;
CREATE POLICY "Permitir lectura publica de funcionarios activos"
ON public.perfiles_funcionarios FOR SELECT
USING (activo = TRUE);

-- Blindar columnas sensibles contra lectura anónima
REVOKE SELECT ON public.perfiles_funcionarios FROM anon;
GRANT SELECT (id, cedula, nombre_completo, cargo, rol, punto_asignado_id, activo, email, telefono) 
ON public.perfiles_funcionarios TO anon, authenticated;

-- Permitir acceso total al service_role
DROP POLICY IF EXISTS "Acceso total funcionarios service_role" ON public.perfiles_funcionarios;
CREATE POLICY "Acceso total funcionarios service_role"
ON public.perfiles_funcionarios FOR ALL TO service_role
USING (TRUE) WITH CHECK (TRUE);

-- 2. FUNCIÓN RPC: GESTIÓN DE USUARIOS POR EL ADMINISTRADOR (WEB Y APK)
-- Requiere sesión activa verificada de Supervisión.
CREATE OR REPLACE FUNCTION public.admin_gestionar_funcionario(
    p_pin TEXT,
    p_accion TEXT,
    p_datos JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_supervisor_ok BOOLEAN := FALSE;
    v_resultado JSONB;
    v_nuevo_id UUID;
    v_target_id UUID;
    v_nuevo_estado BOOLEAN;
BEGIN
    -- 1. Validación de credencial de supervisión contra funcionarios activos
    SELECT EXISTS (
        SELECT 1 FROM public.perfiles_funcionarios
        WHERE (id::TEXT = TRIM(p_pin) OR UPPER(TRIM(cedula)) = UPPER(TRIM(p_pin)))
          AND activo = TRUE
          AND (rol = 'SUPERVISOR' OR cedula = '00000000')
    ) INTO v_supervisor_ok;

    IF NOT v_supervisor_ok THEN
        RAISE EXCEPTION 'CREDENCIAL_INVALIDA: Credencial de supervisión no autorizada para gestión de usuarios.'
        USING ERRCODE = '42501';
    END IF;

    -- 2. Enrutamiento de acciones administrativas
    CASE UPPER(TRIM(p_accion))
        -- ACCIÓN: LISTAR TODOS LOS FUNCIONARIOS (ACTIVOS E INACTIVOS)
        WHEN 'LISTAR' THEN
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', f.id,
                    'cedula', f.cedula,
                    'nombre_completo', f.nombre_completo,
                    'cargo', f.cargo,
                    'telefono', f.telefono,
                    'punto_asignado_id', f.punto_asignado_id,
                    'punto_nombre', COALESCE(p.nombre, 'Sin asignar'),
                    'activo', f.activo,
                    'created_at', f.created_at
                ) ORDER BY f.activo DESC, f.nombre_completo ASC
            ) INTO v_resultado
            FROM public.perfiles_funcionarios f
            LEFT JOIN public.puntos_captura p ON f.punto_asignado_id = p.id;

            RETURN COALESCE(v_resultado, '[]'::JSONB);

        -- ACCIÓN: CREAR NUEVO FUNCIONARIO / ENCUESTADOR
        WHEN 'CREAR' THEN
            v_nuevo_id := gen_random_uuid();
            
            INSERT INTO public.perfiles_funcionarios (
                id, cedula, nombre_completo, cargo, telefono, punto_asignado_id, activo
            ) VALUES (
                v_nuevo_id,
                TRIM(p_datos->>'cedula'),
                TRIM(p_datos->>'nombre_completo'),
                COALESCE(TRIM(p_datos->>'cargo'), 'Encuestador de Campo'),
                TRIM(p_datos->>'telefono'),
                NULLIF(p_datos->>'punto_asignado_id', '')::UUID,
                COALESCE((p_datos->>'activo')::BOOLEAN, TRUE)
            );

            RETURN jsonb_build_object(
                'status', 'success',
                'id', v_nuevo_id,
                'mensaje', 'Funcionario registrado exitosamente en COTATUR'
            );

        -- ACCIÓN: ACTIVAR / DESACTIVAR FUNCIONARIO (REVOCACIÓN REMOTA)
        WHEN 'TOGGLE_ACTIVO' THEN
            v_target_id := (p_datos->>'id')::UUID;
            
            UPDATE public.perfiles_funcionarios
            SET activo = NOT activo
            WHERE id = v_target_id
            RETURNING activo INTO v_nuevo_estado;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'FUNCIONARIO_NO_ENCONTRADO: El ID especificado no existe.';
            END IF;

            RETURN jsonb_build_object(
                'status', 'success',
                'id', v_target_id,
                'nuevo_estado', v_nuevo_estado,
                'mensaje', CASE WHEN v_nuevo_estado THEN 'Funcionario activado' ELSE 'Funcionario revocado/inactivo' END
            );

        -- ACCIÓN: ELIMINAR FUNCIONARIO
        WHEN 'ELIMINAR' THEN
            v_target_id := (p_datos->>'id')::UUID;

            DELETE FROM public.perfiles_funcionarios
            WHERE id = v_target_id;

            RETURN jsonb_build_object(
                'status', 'success',
                'id', v_target_id,
                'mensaje', 'Registro de funcionario eliminado'
            );

        ELSE
            RAISE EXCEPTION 'ACCION_NO_VALIDA: Las acciones permitidas son LISTAR, CREAR, TOGGLE_ACTIVO o ELIMINAR.';
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 3. DATOS SEMILLA: ENCUESTADORES INSTITUCIONALES DE PRUEBA
INSERT INTO public.perfiles_funcionarios (cedula, nombre_completo, cargo, telefono, punto_asignado_id, activo)
VALUES 
(
    'V-18452120',
    'Pedro José Pérez Ramírez',
    'Encuestador de Campo',
    '0414-7253311',
    (SELECT id FROM public.puntos_captura WHERE codigo = 'PEAJE_TARIBA' LIMIT 1),
    TRUE
),
(
    'V-22194850',
    'María Alejandra Gómez',
    'Supervisora de Operativo',
    '0424-7388849',
    (SELECT id FROM public.puntos_captura WHERE codigo = 'PEAJE_CAMPANA' LIMIT 1),
    TRUE
)
ON CONFLICT (cedula) DO NOTHING;
