'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ExerciseInstructionSteps, ExerciseInstructions } from '../services/exercises'

export interface ExerciseSet {
  id: string
  setNumber: number
  reps: number
  completed: boolean
}

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
  createRoutine: (name: string) => Routine
  deleteRoutine: (id: string) => void
  addExerciseToRoutine: (routineId: string, exercise: NewRoutineExercise) => AddExerciseResult
  removeExerciseFromRoutine: (routineId: string, exerciseId: string) => void
  addSetToExercise: (routineId: string, exerciseId: string) => void
  removeSetFromExercise: (routineId: string, exerciseId: string, setId: string) => void
  updateSetReps: (routineId: string, exerciseId: string, setId: string, reps: number) => void
  toggleSetCompleted: (routineId: string, exerciseId: string, setId: string) => void
  toastMessage: string | null
  showToast: (message: string) => void
}

const STORAGE_KEY = 'exercise_browser_routines_v1'

function generateUUID(): string {
  let id = ''
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    id = crypto.randomUUID()
  } else {
    id = `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
  return id
}

function normalizeExerciseSets(rawSets: unknown, legacyReps?: unknown): ExerciseSet[] {
  let normalized: ExerciseSet[] = []

  if (Array.isArray(rawSets) && rawSets.length > 0) {
    normalized = rawSets.map((s, index) => ({
      id: s.id ? String(s.id) : generateUUID(),
      setNumber: typeof s.setNumber === 'number' ? s.setNumber : index + 1,
      reps: typeof s.reps === 'number' && !isNaN(s.reps) && s.reps > 0 ? s.reps : 10,
      completed: Boolean(s.completed),
    }))
  } else if (typeof rawSets === 'number' && rawSets > 0) {
    const defaultReps =
      typeof legacyReps === 'number' && !isNaN(legacyReps) && legacyReps > 0 ? legacyReps : 10
    normalized = Array.from({ length: rawSets }, (_, i) => ({
      id: generateUUID(),
      setNumber: i + 1,
      reps: defaultReps,
      completed: false,
    }))
  } else {
    normalized = [
      {
        id: generateUUID(),
        setNumber: 1,
        reps: 10,
        completed: false,
      },
    ]
  }

  return normalized
}

const RoutinesContext = createContext<RoutinesContextType | undefined>(undefined)

export function RoutinesProvider({ children }: { children: React.ReactNode }) {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    let savedRoutines: Routine[] = []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Array<{
          id: string
          name: string
          exercises?: Array<{
            id: string
            name: string
            gifUrl: string
            body_part: string
            category?: string
            instruction_steps?: ExerciseInstructionSteps
            instructions?: ExerciseInstructions | string
            sets?: unknown
            reps?: unknown
          }>
        }>
        savedRoutines = parsed.map((routine) => ({
          id: routine.id,
          name: routine.name,
          exercises: (routine.exercises || []).map((ex) => ({
            id: ex.id,
            name: ex.name,
            gifUrl: ex.gifUrl,
            body_part: ex.body_part,
            category: ex.category,
            instruction_steps: ex.instruction_steps,
            instructions: ex.instructions,
            sets: normalizeExerciseSets(ex.sets, ex.reps),
          })),
        }))
      }
    } catch {
      savedRoutines = []
    }
    setRoutines(savedRoutines)
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(routines))
      } catch {
        // Silently catch quota or privacy errors
      }
    }
  }, [routines, isLoaded])

  const showToast = (message: string) => {
    setToastMessage(message)
    window.setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current))
    }, 2800)
  }

  const createRoutine = (name: string): Routine => {
    const trimmed = name.trim() || 'Nueva Rutina'
    const newRoutine: Routine = {
      id: `routine_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: trimmed,
      exercises: [],
    }
    setRoutines((prev) => [newRoutine, ...prev])
    showToast(`Rutina "${trimmed}" creada`)
    return newRoutine
  }

  const deleteRoutine = (id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id))
    showToast('Rutina eliminada')
  }

  const addExerciseToRoutine = (
    routineId: string,
    exercise: NewRoutineExercise
  ): AddExerciseResult => {
    let result: AddExerciseResult = { success: false, message: 'Rutina no encontrada' }

    setRoutines((prev) => {
      const routineIndex = prev.findIndex((r) => r.id === routineId)
      let nextRoutines = prev

      if (routineIndex !== -1) {
        const targetRoutine = prev[routineIndex]
        const alreadyExists = targetRoutine.exercises.some(
          (item) => item.id === exercise.id || (item.name && item.name === exercise.name)
        )

        if (alreadyExists) {
          result = {
            success: false,
            message: `"${exercise.name}" ya está en "${targetRoutine.name}"`,
          }
        } else {
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

          const updatedRoutine: Routine = {
            ...targetRoutine,
            exercises: [...targetRoutine.exercises, exerciseWithSets],
          }

          nextRoutines = [
            ...prev.slice(0, routineIndex),
            updatedRoutine,
            ...prev.slice(routineIndex + 1),
          ]

          result = {
            success: true,
            message: `"${exercise.name}" agregado a "${targetRoutine.name}"`,
          }
        }
      }
      return nextRoutines
    })

    return result
  }

  const removeExerciseFromRoutine = (routineId: string, exerciseId: string) => {
    setRoutines((prev) =>
      prev.map((routine) => {
        let updated = routine
        if (routine.id === routineId) {
          updated = {
            ...routine,
            exercises: routine.exercises.filter((ex) => ex.id !== exerciseId),
          }
        }
        return updated
      })
    )
    showToast('Ejercicio eliminado de la rutina')
  }

  const addSetToExercise = (routineId: string, exerciseId: string) => {
    setRoutines((prev) =>
      prev.map((routine) => {
        let updatedRoutine = routine
        if (routine.id === routineId) {
          updatedRoutine = {
            ...routine,
            exercises: routine.exercises.map((ex) => {
              let updatedEx = ex
              if (ex.id === exerciseId) {
                const nextNumber = ex.sets.length + 1
                const lastSetReps =
                  ex.sets.length > 0 ? ex.sets[ex.sets.length - 1].reps : 10
                const newSet: ExerciseSet = {
                  id: generateUUID(),
                  setNumber: nextNumber,
                  reps: lastSetReps,
                  completed: false,
                }
                updatedEx = {
                  ...ex,
                  sets: [...ex.sets, newSet],
                }
              }
              return updatedEx
            }),
          }
        }
        return updatedRoutine
      })
    )
  }

  const removeSetFromExercise = (routineId: string, exerciseId: string, setId: string) => {
    setRoutines((prev) =>
      prev.map((routine) => {
        let updatedRoutine = routine
        if (routine.id === routineId) {
          updatedRoutine = {
            ...routine,
            exercises: routine.exercises.map((ex) => {
              let updatedEx = ex
              if (ex.id === exerciseId && ex.sets.length > 1) {
                const filtered = ex.sets.filter((s) => s.id !== setId)
                const renumbered = filtered.map((s, index) => ({
                  ...s,
                  setNumber: index + 1,
                }))
                updatedEx = {
                  ...ex,
                  sets: renumbered,
                }
              }
              return updatedEx
            }),
          }
        }
        return updatedRoutine
      })
    )
  }

  const updateSetReps = (
    routineId: string,
    exerciseId: string,
    setId: string,
    reps: number
  ) => {
    setRoutines((prev) =>
      prev.map((routine) => {
        let updatedRoutine = routine
        if (routine.id === routineId) {
          updatedRoutine = {
            ...routine,
            exercises: routine.exercises.map((ex) => {
              let updatedEx = ex
              if (ex.id === exerciseId) {
                updatedEx = {
                  ...ex,
                  sets: ex.sets.map((s) => {
                    let updatedSet = s
                    if (s.id === setId) {
                      updatedSet = {
                        ...s,
                        reps: Math.max(1, reps),
                      }
                    }
                    return updatedSet
                  }),
                }
              }
              return updatedEx
            }),
          }
        }
        return updatedRoutine
      })
    )
  }

  const toggleSetCompleted = (routineId: string, exerciseId: string, setId: string) => {
    setRoutines((prev) =>
      prev.map((routine) => {
        let updatedRoutine = routine
        if (routine.id === routineId) {
          updatedRoutine = {
            ...routine,
            exercises: routine.exercises.map((ex) => {
              let updatedEx = ex
              if (ex.id === exerciseId) {
                updatedEx = {
                  ...ex,
                  sets: ex.sets.map((s) => {
                    let updatedSet = s
                    if (s.id === setId) {
                      updatedSet = {
                        ...s,
                        completed: !s.completed,
                      }
                    }
                    return updatedSet
                  }),
                }
              }
              return updatedEx
            }),
          }
        }
        return updatedRoutine
      })
    )
  }

  return (
    <RoutinesContext.Provider
      value={{
        routines,
        createRoutine,
        deleteRoutine,
        addExerciseToRoutine,
        removeExerciseFromRoutine,
        addSetToExercise,
        removeSetFromExercise,
        updateSetReps,
        toggleSetCompleted,
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
