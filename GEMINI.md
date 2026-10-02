# Instrucciones para Asistentes de IA (Gemini / Copilot / Cursor)

Este archivo contiene el contexto del proyecto y las reglas de desarrollo. Lee esto antes de proponer código o refactorizaciones para mantener la consistencia en el proyecto **Exercise Log**.

## 🧠 Contexto del Proyecto
Exercise Log es una aplicación web (PWA/Mobile-first) para registrar entrenamientos físicos, visualizar el progreso mediante heatmaps y gestionar rutinas. 

## 🛠 Stack Tecnológico
- **Framework:** Next.js (App Router)
- **Lenguaje:** TypeScript (Estricto)
- **Estilos:** Tailwind CSS
- **UI Kit:** Radix UI + Shadcn UI
- **Backend/DB:** Supabase (PostgreSQL)

## 📁 Reglas de Arquitectura y Estructura
Al crear o modificar archivos, respeta esta organización estricta:

- `/app`: Solo para el enrutamiento de Next.js (App Router). Contiene `page.tsx`, `layout.tsx`, etc. Trata de mantener estas páginas ligeras y delegar la vista a `/src/screens`.
- `/src/screens`: Vistas completas de la aplicación (ej. `ProfileScreen.tsx`, `HistoryScreen.tsx`). Se importan desde las rutas en `/app`.
- `/src/components`: Componentes específicos del dominio de la app (ej. `ActivityHeatmap.tsx`, `ExerciseCard.tsx`, Modales).
- `/components/ui`: **SOLO** componentes base de UI generados por Shadcn (botones, inputs, tabs). No crear componentes de negocio aquí.
- `/src/context`: Proveedores de estado (React Context) para datos globales (Rutinas, Historial).
- `/src/services`: Toda llamada a Supabase o lógica de base de datos debe estar encapsulada aquí (ej. `exercises.ts`, `profile.ts`). **Nunca** hacer llamadas directas a Supabase desde los componentes de UI.
- `/src/hooks`: Custom hooks (ej. `useAuth.ts`, `useExercises.ts`).
- `/lib`: Utilidades genéricas (`utils.ts`) y configuración de clientes (`supabase.ts`).

## ✍️ Reglas de Código y Convenciones

1. **Componentes de React:**
   - Usa componentes funcionales y *arrow functions*.
   - Si un componente usa hooks o interactúa con el DOM, asegúrate de incluir `"use client";` al inicio del archivo, ya que estamos usando Next.js App Router.
   - Nombra los archivos en PascalCase para componentes (`MiComponente.tsx`) y camelCase para utilidades/hooks (`useAuth.ts`).

2. **TypeScript:**
   - Tipar siempre las *props*, respuestas de API y variables de estado.
   - Evitar el uso de `any`. Usa `unknown` si es estrictamente necesario y valida el tipo.

3. **Estilos (Tailwind CSS):**
   - Usa la función utilitaria `cn()` (ubicada en `lib/utils.ts`) para combinar clases dinámicas de Tailwind, especialmente cuando crees o modifiques componentes reutilizables.

4. **Base de Datos (Supabase):**
   - Importa el cliente desde `lib/supabase.ts`.
   - Maneja los errores de Supabase explícitamente y devuelve tipados consistentes desde `/src/services`.
   - Considera el uso de Row Level Security (RLS) al hacer consultas; el usuario debe estar autenticado.

5. **Idioma:**
   - El código (variables, funciones, componentes) debe estar en **Inglés** (ej. `WorkoutLog`, `useExercises`).
   - El contenido visible para el usuario (UI) debe estar en **Español** (ej. "Historial", "Iniciar Sesión").

## Buenas Prácticas de la Industria:

   - Mantén el código limpio, modular y fácil de leer.
   - Aplica un manejo de errores robusto (try/catch donde corresponda).
   - Asegura un tipado estricto y correcto en TypeScript.
   - Continúa respetando el enfoque mobile-first y el uso coherente de los componentes de `components/ui`.

## 🧪 Estrategia de Testing

- El proyecto utiliza el ejecutor de pruebas nativo de Node.js (`node --test`).
- **Nomenclatura:** Los archivos de pruebas llevan el sufijo `*.test.ts`.
- **Alcance prioritario:**
  - Reducers, helpers y funciones de cálculo en `src/context/*.test.ts`.
  - Transformaciones y lógica de filtrado de datos en `src/services/*.test.ts`.
- Antes de entregar cambios que modifiquen lógica de cálculo de repeticiones, fechas del heatmap o persistencia, verificar que las pruebas pasen con `pnpm test`.