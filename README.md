# Exercise Log

Aplicación web para explorar ejercicios físicos, armar rutinas personalizadas y registrar sesiones de entrenamiento con seguimiento visual de progreso.

---

## 🚀 Características

- **Explorador y buscador de ejercicios:** Filtrado por grupo muscular, categoría y equipamiento, con instrucciones paso a paso y demostraciones en GIF.
- **Gestión de rutinas:** Creación, edición y administración de rutinas de entrenamiento personalizadas.
- **Historial de entrenamientos:** Registro manual y edición de sesiones pasadas con desglose de ejercicios, series y repeticiones.
- **Mapa de calor de actividad:** Seguimiento visual de consistencia diaria y frecuencia de entrenamientos completados.

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 16 (App Router)
- **Librería UI:** React 19
- **Estilos & Componentes:** Tailwind CSS v4, Base UI (`@base-ui/react`), Lucide React
- **Lenguaje:** TypeScript
- **Testing:** Node.js native test runner (`node --test`)
- **Gestor de paquetes:** npm

---

## 📂 Estructura del Proyecto

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