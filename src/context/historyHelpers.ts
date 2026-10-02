export interface ExerciseSetSnapshot {
  setNumber: number
  reps: number
  peso?: number | null
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

export function formatSetDisplayText(reps: number, peso?: number | null): string {
  if (peso !== null && peso !== undefined && !isNaN(peso)) {
    return `${reps} reps @ ${peso} kg`
  }
  return `${reps} reps`
}

export function parseSetPeso(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const str = String(value).trim()
  if (str === '') return null
  const normalized = str.replace(',', '.')
  const parsed = parseFloat(normalized)
  return isNaN(parsed) ? null : parsed
}

export function sanitizeDecimalInput(value: string): string {
  const cleaned = value.replace(/[^0-9.,]/g, '')
  const match = cleaned.match(/[.,]/)
  if (match && match.index !== undefined) {
    const firstSep = match[0]
    const before = cleaned.slice(0, match.index)
    const after = cleaned.slice(match.index + 1).replace(/[.,]/g, '')
    return `${before}${firstSep}${after}`
  }
  return cleaned
}

