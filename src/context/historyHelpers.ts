export interface ExerciseSetSnapshot {
  setNumber: number
  reps: number
  completed?: boolean
}

export interface ExerciseSnapshot {
  name: string
  setsCount: number
  sets: ExerciseSetSnapshot[]
}

export interface WorkoutLog {
  id: string
  routineId: string
  routineName: string
  completedAt: string
  dateKey: string
  totalExercises: number
  totalSets: number
  completedSets?: number
  exercisesSnapshot: ExerciseSnapshot[]
}

export interface ManualWorkoutLogInput {
  routineId?: string
  routineName: string
  dateKey: string
  completedAt?: string
  exercisesSnapshot: ExerciseSnapshot[]
}

export interface UpdateWorkoutLogInput {
  routineName?: string
  dateKey?: string
  completedAt?: string
  exercisesSnapshot?: ExerciseSnapshot[]
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatReadableDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const formatted = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function calculateActivityLevel(count: number): 0 | 1 | 2 | 3 {
  let level: 0 | 1 | 2 | 3 = 0
  if (count >= 7) {
    level = 3
  } else if (count >= 4) {
    level = 2
  } else if (count >= 1) {
    level = 1
  }
  return level
}
