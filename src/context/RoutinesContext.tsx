'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUserId, supabase } from '../../lib/supabase'
import {
  fetchExercises,
  type ExerciseInstructionSteps,
  type ExerciseInstructions,
} from '../services/exercises'
import {
  generateUUID,
  normalizeExerciseSets,
  uncheckRoutineSets,
  type ExerciseSet,
} from './routinesHelpers.ts'

export type { ExerciseSet }
export { generateUUID, normalizeExerciseSets, uncheckRoutineSets }

export interface RoutineExercise {
  id: string
  name: string
  gifUrl: string
  body_part: string
  category?: string
  instruction_steps?: ExerciseInstructionSteps
  instructions?: ExerciseInstructions | string
  sets: ExerciseSet[]
}

export type NewRoutineExercise = {
  id: string
  name: string
  gifUrl: string
  body_part: string
  category?: string
  instruction_steps?: ExerciseInstructionSteps
  instructions?: ExerciseInstructions | string
  sets?: ExerciseSet[]
}

export interface Routine {
  id: string
  name: string
  exercises: RoutineExercise[]
}

export interface AddExerciseResult {
  success: boolean
  message: string
}

export interface RoutinesContextType {
  routines: Routine[]
  isLoading: boolean
  createRoutine: (name: string) => Promise<Routine>
  deleteRoutine: (id: string) => Promise<void>
  addExerciseToRoutine: (routineId: string, exercise: NewRoutineExercise) => Promise<AddExerciseResult>
  removeExerciseFromRoutine: (routineId: string, exerciseId: string) => Promise<void>
  addSetToExercise: (routineId: string, exerciseId: string) => Promise<void>
  removeSetFromExercise: (routineId: string, exerciseId: string, setId: string) => Promise<void>
  updateSetReps: (routineId: string, exerciseId: string, setId: string, reps: number) => Promise<void>
  updateSetPeso: (routineId: string, exerciseId: string, setId: string, peso: number | null) => Promise<void>
  toggleSetCompleted: (routineId: string, exerciseId: string, setId: string) => Promise<void>
  resetRoutineCompletedSets: (routineId: string) => void
  toastMessage: string | null
  showToast: (message: string) => void
}

const RoutinesContext = createContext<RoutinesContextType | undefined>(undefined)

export function RoutinesProvider({ children }: { children: React.ReactNode }) {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (message: string) => {
    setToastMessage(message)
    window.setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current))
    }, 2800)
  }

  const fetchRoutines = async (): Promise<Routine[]> => {
    try {
      const { data, error } = await supabase
        .from('routines')
        .select(`
          id,
          nombre,
          creada_en,
          routine_exercises (
            id,
            routine_id,
            exercise_id,
            orden,
            series_objetivo,
            reps_objetivo,
            exercises (
              id,
              nombre,
              grupo_muscular,
              descripcion
            )
          )
        `)
        .order('creada_en', { ascending: false })

      if (error || !Array.isArray(data)) {
        setRoutines([])
        setIsLoading(false)
        return []
      }

      let catalogMap = new Map<string, string>()
      try {
        const catalog = await fetchExercises()
        catalog.forEach((c) => {
          if (c.id) catalogMap.set(c.id.toLowerCase().trim(), c.gifUrl)
          if (c.name) catalogMap.set(c.name.toLowerCase().trim(), c.gifUrl)
        })
      } catch {
        // Fallback si no hay conexión al dataset
      }

      type RoutineExerciseRow = {
        id: string
        routine_id: string
        exercise_id: string
        orden: number
        series_objetivo: number
        reps_objetivo: number
        exercises: {
          id: string
          nombre: string
          grupo_muscular: string
          descripcion: string | null
        } | null
      }

      const mappedRoutines: Routine[] = data.map((item) => {
        const rawExercises = Array.isArray(item.routine_exercises)
          ? (item.routine_exercises as unknown as RoutineExerciseRow[]).sort(
              (a, b) => (a.orden || 0) - (b.orden || 0)
            )
          : []

        const exercises: RoutineExercise[] = rawExercises.map((re) => {
          const exerciseDetails = re.exercises
          const sets: ExerciseSet[] = Array.from(
            { length: re.series_objetivo || 3 },
            (_, idx) => ({
              id: `${re.id || re.exercise_id}_set_${idx + 1}`,
              setNumber: idx + 1,
              reps: re.reps_objetivo || 10,
              completed: false,
            })
          )

          const exId = (re.exercise_id || '').toLowerCase().trim()
          const exName = (exerciseDetails?.nombre || '').toLowerCase().trim()
          const resolvedGif = catalogMap.get(exId) || catalogMap.get(exName) || ''

          return {
            id: re.exercise_id || generateUUID(),
            name: exerciseDetails?.nombre || 'Ejercicio',
            gifUrl: resolvedGif,
            body_part: exerciseDetails?.grupo_muscular || 'General',
            instructions: exerciseDetails?.descripcion || undefined,
            sets,
          }
        })

        return {
          id: item.id,
          name: item.nombre,
          exercises,
        }
      })

      setRoutines(mappedRoutines)
      setIsLoading(false)
      return mappedRoutines
    } catch {
      setRoutines([])
      setIsLoading(false)
      return []
    }
  }

  useEffect(() => {
    fetchRoutines()

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchRoutines()
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const createRoutine = async (name: string): Promise<Routine> => {
    const trimmed = name.trim() || 'Nueva Rutina'
    let newRoutine: Routine = {
      id: generateUUID(),
      name: trimmed,
      exercises: [],
    }

    try {
      const userId = await getCurrentUserId()
      if (userId) {
        const { data, error } = await supabase
          .from('routines')
          .insert({
            nombre: trimmed,
            user_id: userId,
          })
          .select()
          .single()

        if (!error && data) {
          newRoutine = {
            id: data.id,
            name: data.nombre,
            exercises: [],
          }
        }
      }
    } catch {
      // Fallback local
    }

    setRoutines((prev) => [newRoutine, ...prev])
    showToast(`Rutina "${newRoutine.name}" creada`)
    return newRoutine
  }

  const deleteRoutine = async (id: string): Promise<void> => {
    try {
      await supabase.from('routines').delete().eq('id', id)
    } catch {
      // Backend error handling
    }

    setRoutines((prev) => prev.filter((r) => r.id !== id))
    showToast('Rutina eliminada')
  }

  const addExerciseToRoutine = async (
    routineId: string,
    exercise: NewRoutineExercise
  ): Promise<AddExerciseResult> => {
    const targetRoutine = routines.find((r) => r.id === routineId)
    if (!targetRoutine) {
      return { success: false, message: 'Rutina no encontrada' }
    }

    const alreadyExists = targetRoutine.exercises.some(
      (item) => item.id === exercise.id || (item.name && item.name === exercise.name)
    )

    if (alreadyExists) {
      return {
        success: false,
        message: `"${exercise.name}" ya está en "${targetRoutine.name}"`,
      }
    }

    const initialSets: ExerciseSet[] =
      exercise.sets && exercise.sets.length > 0
        ? exercise.sets
        : [
            {
              id: generateUUID(),
              setNumber: 1,
              reps: 10,
              completed: false,
            },
          ]

    const exerciseWithSets: RoutineExercise = {
      id: exercise.id,
      name: exercise.name,
      gifUrl: exercise.gifUrl,
      body_part: exercise.body_part,
      category: exercise.category,
      instruction_steps: exercise.instruction_steps,
      instructions: exercise.instructions,
      sets: initialSets,
    }

    try {
      await supabase.from('exercises').upsert(
        {
          id: exercise.id,
          nombre: exercise.name,
          grupo_muscular: exercise.body_part || 'General',
          descripcion:
            typeof exercise.instructions === 'string'
              ? exercise.instructions
              : null,
        },
        { onConflict: 'id' }
      )

      await supabase.from('routine_exercises').insert({
        routine_id: routineId,
        exercise_id: exercise.id,
        orden: targetRoutine.exercises.length + 1,
        series_objetivo: initialSets.length,
        reps_objetivo: initialSets[0]?.reps || 10,
      })
    } catch {
      // Backend sync catch
    }

    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine
        return {
          ...routine,
          exercises: [...routine.exercises, exerciseWithSets],
        }
      })
    )

    return {
      success: true,
      message: `"${exercise.name}" agregado a "${targetRoutine.name}"`,
    }
  }

  const removeExerciseFromRoutine = async (
    routineId: string,
    exerciseId: string
  ): Promise<void> => {
    try {
      await supabase
        .from('routine_exercises')
        .delete()
        .eq('routine_id', routineId)
        .eq('exercise_id', exerciseId)
    } catch {
      // Backend sync
    }

    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine
        return {
          ...routine,
          exercises: routine.exercises.filter((ex) => ex.id !== exerciseId),
        }
      })
    )
    showToast('Ejercicio eliminado de la rutina')
  }

  const addSetToExercise = async (routineId: string, exerciseId: string): Promise<void> => {
    let nextCount = 1
    let nextReps = 10

    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine
        return {
          ...routine,
          exercises: routine.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex
            const nextNumber = ex.sets.length + 1
            const lastSetReps = ex.sets.length > 0 ? ex.sets[ex.sets.length - 1].reps : 10
            const newSet: ExerciseSet = {
              id: generateUUID(),
              setNumber: nextNumber,
              reps: lastSetReps,
              completed: false,
            }
            nextCount = nextNumber
            nextReps = lastSetReps
            return {
              ...ex,
              sets: [...ex.sets, newSet],
            }
          }),
        }
      })
    )

    try {
      await supabase
        .from('routine_exercises')
        .update({ series_objetivo: nextCount, reps_objetivo: nextReps })
        .eq('routine_id', routineId)
        .eq('exercise_id', exerciseId)
    } catch {
      // Backend sync
    }
  }

  const removeSetFromExercise = async (
    routineId: string,
    exerciseId: string,
    setId: string
  ): Promise<void> => {
    let nextCount = 1
    let nextReps = 10

    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine
        return {
          ...routine,
          exercises: routine.exercises.map((ex) => {
            if (ex.id !== exerciseId || ex.sets.length <= 1) return ex
            const filtered = ex.sets.filter((s) => s.id !== setId)
            const renumbered = filtered.map((s, index) => ({
              ...s,
              setNumber: index + 1,
            }))
            nextCount = renumbered.length
            nextReps = renumbered[0]?.reps || 10
            return {
              ...ex,
              sets: renumbered,
            }
          }),
        }
      })
    )

    try {
      await supabase
        .from('routine_exercises')
        .update({ series_objetivo: nextCount, reps_objetivo: nextReps })
        .eq('routine_id', routineId)
        .eq('exercise_id', exerciseId)
    } catch {
      // Backend sync
    }
  }

  const updateSetReps = async (
    routineId: string,
    exerciseId: string,
    setId: string,
    reps: number
  ): Promise<void> => {
    const safeReps = Math.max(1, reps)

    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine
        return {
          ...routine,
          exercises: routine.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex
            return {
              ...ex,
              sets: ex.sets.map((s) => (s.id === setId ? { ...s, reps: safeReps } : s)),
            }
          }),
        }
      })
    )

    try {
      await supabase
        .from('routine_exercises')
        .update({ reps_objetivo: safeReps })
        .eq('routine_id', routineId)
        .eq('exercise_id', exerciseId)
    } catch {
      // Backend sync
    }
  }

  const updateSetPeso = async (
    routineId: string,
    exerciseId: string,
    setId: string,
    peso: number | null
  ): Promise<void> => {
    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine
        return {
          ...routine,
          exercises: routine.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex
            return {
              ...ex,
              sets: ex.sets.map((s) => (s.id === setId ? { ...s, peso } : s)),
            }
          }),
        }
      })
    )
  }

  const toggleSetCompleted = async (
    routineId: string,
    exerciseId: string,
    setId: string
  ): Promise<void> => {
    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine
        return {
          ...routine,
          exercises: routine.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex
            return {
              ...ex,
              sets: ex.sets.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s)),
            }
          }),
        }
      })
    )
  }

  const resetRoutineCompletedSets = (routineId: string): void => {
    setRoutines((prev) =>
      prev.map((routine) => {
        if (routine.id !== routineId) return routine
        return uncheckRoutineSets(routine)
      })
    )
  }

  return (
    <RoutinesContext.Provider
      value={{
        routines,
        isLoading,
        createRoutine,
        deleteRoutine,
        addExerciseToRoutine,
        removeExerciseFromRoutine,
        addSetToExercise,
        removeSetFromExercise,
        updateSetReps,
        updateSetPeso,
        toggleSetCompleted,
        resetRoutineCompletedSets,
        toastMessage,
        showToast,
      }}
    >
      {children}
      {toastMessage && (
        <div className="app-toast" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}
    </RoutinesContext.Provider>
  )
}

export function useRoutines(): RoutinesContextType {
  const context = useContext(RoutinesContext)
  if (!context) {
    throw new Error('useRoutines debe usarse dentro de un RoutinesProvider')
  }
  return context
}
