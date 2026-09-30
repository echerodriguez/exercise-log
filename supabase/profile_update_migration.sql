-- ==============================================================================
-- Migración: Columna para restricción de actualización diaria de perfil
-- ==============================================================================

-- 1. Agregar la columna a la tabla profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_profile_update timestamptz DEFAULT NULL;

-- 2. Recargar la caché de esquemas de PostgREST en Supabase
-- Esto soluciona inmediatamente el error:
-- "Could not find the 'last_profile_update' column of 'profiles' in the schema cache"
NOTIFY pgrst, 'reload schema';
