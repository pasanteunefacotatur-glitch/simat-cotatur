-- ==============================================================================
-- PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
-- ENTIDAD: Corporación Tachirense de Turismo (COTATUR)
-- ARCHIVO: 13_fix_pgcrypto_search_path.sql
-- DESCRIPCIÓN: Hotfix inmediato para Supabase Cloud. En Supabase, pgcrypto
--              reside en el esquema `extensions`. Al restringir funciones
--              SECURITY DEFINER a `SET search_path = public`, crypt()/digest()
--              fallaban con ERROR 42883 (does not exist). Este script añade
--              `extensions` al search_path de todas las funciones del proyecto.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
    fn RECORD;
BEGIN
    FOR fn IN
        SELECT p.proname,
               pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prokind = 'f'
          AND p.prosecdef = TRUE
    LOOP
        EXECUTE format(
            'ALTER FUNCTION public.%I(%s) SET search_path = public, extensions',
            fn.proname,
            fn.args
        );
    END LOOP;
END
$$;
