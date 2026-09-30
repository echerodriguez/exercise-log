-- ==============================================================================
-- Exercise Log - PostgreSQL Schema & Row Level Security (RLS) for Supabase
-- ==============================================================================

-- 1. Habilitar extensión para generación de UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- TABLA: profiles
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text,
  email text,
  fecha_nacimiento date,
  avatar_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  last_profile_update timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- TABLA: exercises (Catálogo global de ejercicios)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.exercises (
  id text PRIMARY KEY,
  nombre text NOT NULL,
  grupo_muscular text NOT NULL,
  descripcion text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- TABLA: routines
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  creada_en timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- TABLA: routine_exercises
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.routine_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES public.routines(id) ON DELETE CASCADE NOT NULL,
  exercise_id text REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  orden integer NOT NULL DEFAULT 1,
  series_objetivo integer NOT NULL DEFAULT 3,
  reps_objetivo integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- TABLA: workout_logs (Solapa Historial)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  duration integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- TABLA: workout_sets
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workout_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id uuid REFERENCES public.workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_id text REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  reps integer NOT NULL DEFAULT 10,
  peso numeric(6, 2) DEFAULT 0,
  orden integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ÍNDICES PARA ALTO RENDIMIENTO Y ESCALABILIDAD
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON public.routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine_id ON public.routine_exercises(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_exercise_id ON public.routine_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON public.workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON public.workout_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_log_id ON public.workout_sets(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id ON public.workout_sets(exercise_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden consultar su propio perfil"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar su propio perfil"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuarios pueden eliminar su propio perfil"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- 2. exercises (Catálogo global: lectura pública / anónima + autenticados)
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalogo de ejercicios publico para lectura"
  ON public.exercises FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Usuarios autenticados pueden registrar ejercicios en catalogo"
  ON public.exercises FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar catalogo"
  ON public.exercises FOR UPDATE
  TO authenticated
  USING (true);

-- 3. routines
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias rutinas"
  ON public.routines FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propias rutinas"
  ON public.routines FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias rutinas"
  ON public.routines FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias rutinas"
  ON public.routines FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. routine_exercises
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver ejercicios de sus rutinas"
  ON public.routine_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE public.routines.id = public.routine_exercises.routine_id
        AND public.routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden insertar ejercicios en sus rutinas"
  ON public.routine_exercises FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE public.routines.id = public.routine_exercises.routine_id
        AND public.routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden actualizar ejercicios de sus rutinas"
  ON public.routine_exercises FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE public.routines.id = public.routine_exercises.routine_id
        AND public.routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden eliminar ejercicios de sus rutinas"
  ON public.routine_exercises FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.routines
      WHERE public.routines.id = public.routine_exercises.routine_id
        AND public.routines.user_id = auth.uid()
    )
  );

-- 5. workout_logs
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propios workout logs"
  ON public.workout_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propios workout logs"
  ON public.workout_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios workout logs"
  ON public.workout_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios workout logs"
  ON public.workout_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. workout_sets
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sets de sus workout logs"
  ON public.workout_sets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs
      WHERE public.workout_logs.id = public.workout_sets.workout_log_id
        AND public.workout_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden insertar sets en sus workout logs"
  ON public.workout_sets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_logs
      WHERE public.workout_logs.id = public.workout_sets.workout_log_id
        AND public.workout_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden actualizar sets de sus workout logs"
  ON public.workout_sets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs
      WHERE public.workout_logs.id = public.workout_sets.workout_log_id
        AND public.workout_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden eliminar sets de sus workout logs"
  ON public.workout_sets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs
      WHERE public.workout_logs.id = public.workout_sets.workout_log_id
        AND public.workout_logs.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- TRIGGER AUTOMÁTICO: Crear perfil al registrarse un usuario en auth.users
-- ==============================================================================
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Notificar a PostgREST para recargar la caché de esquemas
NOTIFY pgrst, 'reload schema';
