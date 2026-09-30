# Contexto y Reglas de Desarrollo — Exercise Log

Este documento proporciona las directrices, convenciones arquitectónicas y contexto del proyecto para asistir eficazmente en el desarrollo, mantenimiento y refactorización del código base.

---

## 📌 Visión General del Proyecto

**Exercise Log** es una aplicación web interactiva (mobile-first) para registrar entrenamientos, planificar rutinas personalizadas, buscar ejercicios con instrucciones detalladas y seguir la consistencia de entrenamiento mediante un mapa de calor (*activity heatmap*).

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js (App Router)
- **Librería UI:** React 19
- **Lenguaje:** TypeScript (modo estricto)
- **Estilos:** Tailwind CSS v4 con variables CSS
- **Componentes:** Base UI (`@base-ui/react`), Lucide React (iconografía)
- **Gestor de Paquetes:** `pnpm`
- **Testing:** Test runner nativo de Node.js (`node --test`)

---

## 🏗️ Arquitectura y Estructura de Archivos

```text
exercise-log/
├── app/                      # App Router de Next.js
│   ├── layout.tsx            # Root layout con providers globales
│   ├── page.tsx              # Punto de entrada principal (monta los screens)
│   └── globals.css           # Configuración de estilos y temas de Tailwind
├── src/
│   ├── components/           # Componentes de UI modulares y modales
│   │   ├── ActivityHeatmap.tsx       # Visualización de frecuencia de actividad
│   │   ├── BottomTabs.tsx            # Navegación inferior principal
│   │   ├── ExerciseCard.tsx          # Tarjeta básica de ejercicio
│   │   ├── CollapsibleExerciseCard.tsx # Tarjeta desplegable para detalles
│   │   ├── WorkoutLogAccordionItem.tsx # Elemento colapsable en historial
│   │   └── *Modal.tsx                # Modales (creación, edición, técnica, etc.)
│   ├── context/              # Estado global y persistencia
│   │   ├── HistoryContext.tsx        # Historial de sesiones y logs
│   │   ├── historyHelpers.ts         # Funciones puras y utilidades de fechas/logs
│   │   └── RoutinesContext.tsx       # CRUD de rutinas personalizadas
│   ├── hooks/                # Custom hooks (ej. useExercises.ts)
│   ├── screens/              # Vistas principales de la aplicación
│   │   ├── ExerciseSearchScreen.tsx  # Catálogo, filtros y búsqueda de ejercicios
│   │   ├── RoutinesScreen.tsx        # Lista y gestión de rutinas
│   │   ├── RoutineDetailScreen.tsx   # Detalle y edición de una rutina específica
│   │   └── HistoryScreen.tsx         # Registro histórico y mapa de calor
│   └── services/             # Lógica de datos y APIs externas
│       └── exercises.ts              # Carga, tipado y filtrado de ejercicios
└── components.json           # Configuración de componentes UI (estilo shadcn)
```

---

## 💻 Convenciones de Código y Buenas Prácticas

### TypeScript y Tipado
- Utilizar tipos e interfaces explícitos para todas las entidades (`Exercise`, `Routine`, `WorkoutLog`, `SetEntry`).
- Prohibido el uso de `any`; recurrir a tipos genéricos o `unknown` con type guards si la estructura no está garantizada.
- Co-ubicar las interfaces de componentes dentro del mismo archivo o en archivos `.types.ts` si se comparten entre módulos.

### Componentes y UI
- Priorizar componentes funcionales limpios con Server Components por defecto en Next.js, añadiendo `'use client'` únicamente donde haya interactividad, hooks o acceso al DOM.
- Los modales deben implementar cierre con tecla `Escape`, accesibilidad ARIA adecuada y bloqueo de scroll cuando estén abiertos.
- Diseño enfocado en dispositivos móviles (mobile-first), utilizando `BottomTabs` para la navegación táctil y adaptando gradualmente la visualización para pantallas más grandes mediante clases responsivas de Tailwind.

### Estilos
- Usar clases utilitarias de Tailwind CSS.
- Centralizar clases condicionales mediante la función utilitaria `cn(...)` ubicada en `src/lib/utils.ts`.

## Buenas Prácticas de la Industria:

   - Mantén el código limpio, modular y fácil de leer.
   - Aplica un manejo de errores robusto (try/catch donde corresponda).
   - Asegura un tipado estricto y correcto en TypeScript.
   - Continúa respetando el enfoque mobile-first y el uso coherente de los componentes de `components/ui`.

---

## 🧪 Estrategia de Testing

- El proyecto utiliza el ejecutor de pruebas nativo de Node.js (`node --test`).
- **Nomenclatura:** Los archivos de pruebas llevan el sufijo `*.test.ts`.
- **Alcance prioritario:**
  - Reducers, helpers y funciones de cálculo en `src/context/*.test.ts`.
  - Transformaciones y lógica de filtrado de datos en `src/services/*.test.ts`.
- Antes de entregar cambios que modifiquen lógica de cálculo de repeticiones, fechas del heatmap o persistencia, verificar que las pruebas pasen con `pnpm test`.

---

## 🤖 Directrices para Gemini

Al proponer modificaciones o generar nuevo código:
1. **Verificar dependencias existentes:** No introduzcas nuevas librerías si se puede resolver con lo que ya está instalado (`lucide-react`, `@base-ui/react`, utilidades nativas).
2. **Respetar la arquitectura en capas:** Mantén los componentes de presentación libres de lógica de sincronización o persistencia directa.
3. **Consistencia en el idioma:** Las interfaces de usuario actuales y mensajes al usuario están en español; mantén esa localización constante.
4. **Pruebas automáticas:** Si agregas funciones a `historyHelpers.ts` o `exercises.ts`, genera o actualiza simultáneamente sus correspondientes pruebas unitarias.