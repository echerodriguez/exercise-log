-- ==============================================================================
-- Migración: Soporte para Roles (Administrador) y Trigger Automático de Perfiles
-- ==============================================================================

-- 1. Agregar la columna 'role' a la tabla 'profiles' (por defecto 'user')
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- 2. Asegurar restricción de valores permitidos ('user', 'admin')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- 3. Función Trigger que crea automáticamente el perfil con rol 'user'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, email, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'name', 'Usuario'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', '/placeholder-user.jpg'),
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    nombre = EXCLUDED.nombre,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Asignar el trigger sobre auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. Query Manual para asignar el rol 'admin' a un usuario específico
-- Reemplaza 'admin@ejemplo.com' por el email del usuario correspondiente:
-- ==============================================================================
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'admin@ejemplo.com';
