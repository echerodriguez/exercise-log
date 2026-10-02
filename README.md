# Exercise Log

Una aplicación web moderna para registrar entrenamientos, gestionar rutinas personalizadas y hacer seguimiento de la actividad física. Construida con un enfoque en rendimiento y usabilidad.

## 🛠 Tecnologías Principales

- **Framework:** Next.js (App Router) con React
- **Lenguaje:** TypeScript[cite: 1]
- **Estilos:** Tailwind CSS[cite: 1]
- **Componentes UI:** Shadcn UI / Radix UI[cite: 1]
- **Backend & Autenticación:** Supabase (PostgreSQL)[cite: 1]

## 📂 Estructura del Proyecto

El proyecto sigue una arquitectura modular separando la lógica de negocio, la interfaz de usuario y los servicios de backend:

### Directorios Principales

- `/app`: Contiene el enrutamiento principal de Next.js (App Router). Aquí se encuentran las páginas de `/login`, `/register` y el layout global[cite: 1].
- `/src/screens`: Son las "páginas" o vistas completas de la aplicación (ej. `ProfileScreen`, `HistoryScreen`, `RoutinesScreen`)[cite: 1].
- `/src/components`: Componentes visuales específicos del dominio de la app, como `ActivityHeatmap`, `ExerciseCard` y varios modales (ej. `CreateRoutineModal`, `AuthRequiredModal`)[cite: 1].
- `/components/ui`: Componentes base de diseño (botones, inputs, tabs, tarjetas) generados a través de Shadcn UI[cite: 1].
- `/src/context`: Proveedores de estado global de React, manejando la información del historial (`HistoryContext`) y las rutinas (`RoutinesContext`)[cite: 1].
- `/src/hooks`: Hooks personalizados para encapsular lógica compleja, como `useAuth` y `useExercises`[cite: 1].
- `/src/services`: Capa de abstracción para las llamadas a la base de datos y APIs (ej. `exercises.ts`, `profile.ts`)[cite: 1].
- `/lib`: Funciones utilitarias y configuración de clientes de terceros (como el cliente de `supabase.ts`)[cite: 1].
- `/supabase`: Archivos SQL con la definición del esquema de la base de datos (`schema.sql`) y las migraciones de roles y perfiles[cite: 1].

## ✨ Características de la Aplicación

- **Autenticación:** Registro e inicio de sesión de usuarios[cite: 1].
- **Gestión de Perfil:** Visualización y edición de datos del usuario[cite: 1].
- **Rutinas:** Creación, edición y detalle de rutinas de ejercicio[cite: 1].
- **Catálogo de Ejercicios:** Búsqueda de ejercicios y visualización de técnicas[cite: 1].
- **Historial:** Registro manual de entrenamientos, visualización de historial en acordeón y un heatmap de actividad[cite: 1].
