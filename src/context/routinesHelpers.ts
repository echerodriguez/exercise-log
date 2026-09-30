export interface ExerciseSet {
  id: string
  setNumber: number
  reps: number
  completed: boolean
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function normalizeExerciseSets(rawSets: unknown, legacyReps?: unknown): ExerciseSet[] {
  if (Array.isArray(rawSets) && rawSets.length > 0) {
    return rawSets.map((s, index) => ({
      id: s.id ? String(s.id) : generateUUID(),
      setNumber: typeof s.setNumber === 'number' ? s.setNumber : index + 1,
      reps: typeof s.reps === 'number' && !isNaN(s.reps) && s.reps > 0 ? s.reps : 10,
      completed: Boolean(s.completed),
    }))
  }

  if (typeof rawSets === 'number' && rawSets > 0) {
    const defaultReps =
      typeof legacyReps === 'number' && !isNaN(legacyReps) && legacyReps > 0 ? legacyReps : 10
    return Array.from({ length: rawSets }, (_, i) => ({
      id: generateUUID(),
      setNumber: i + 1,
      reps: defaultReps,
      completed: false,
    }))
  }

  return [
    {
      id: generateUUID(),
      setNumber: 1,
      reps: 10,
      completed: false,
    },
  ]
}

export function uncheckRoutineSets<
  TExercise extends { sets: ExerciseSet[] },
  TRoutine extends { exercises: TExercise[] }
>(routine: TRoutine): TRoutine {
  return {
    ...routine,
    exercises: routine.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((s) => ({
        ...s,
        completed: false,
      })),
    })),
  }
}
