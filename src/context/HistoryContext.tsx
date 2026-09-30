'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUserId, supabase } from '../../lib/supabase'
import type { Routine } from './RoutinesContext'
import {
  calculateActivityLevel,
  formatDateKey,
  formatReadableDate,
  type ExerciseSetSnapshot,
  type ExerciseSnapshot,
  type ManualWorkoutLogInput,
  type UpdateWorkoutLogInput,
  type WorkoutLog,
} from './historyHelpers.ts'

export type {
  ExerciseSetSnapshot,
  ExerciseSnapshot,
  ManualWorkoutLogInput,
  UpdateWorkoutLogInput,
  WorkoutLog,
}
export { formatDateKey, formatReadableDate, calculateActivityLevel }

export interface HistoryContextType {
  logs: WorkoutLog[]
  isLoading: boolean
  completeRoutine: (routine: Routine) => Promise<WorkoutLog>
  addManualWorkoutLog: (data: ManualWorkoutLogInput) => Promise<WorkoutLog>
  updateWorkoutLog: (logId: string, updatedData: UpdateWorkoutLogInput) => Promise<void>
  deleteWorkoutLog: (id: string) => Promise<void>
  deleteLog: (id: string) => Promise<void>
  getLogsByDate: (dateKey: string) => WorkoutLog[]
  getActivityCountForDate: (dateKey: string) => number
  getActivityLevelForDate: (dateKey: string) => 0 | 1 | 2 | 3
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined)

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchLogs = async (): Promise<WorkoutLog[]> => {
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select(`
          id,
          user_id,
          date,
          duration,
          notes,
          created_at,
          workout_sets (
            id,
            workout_log_id,
            exercise_id,
            reps,
            peso,
            orden,
            exercises (
              id,
              nombre,
              grupo_muscular
            )
          )
        `)
        .order('date', { ascending: false })

      if (error || !Array.isArray(data)) {
        setLogs([])
        setIsLoading(false)
        return []
      }

      type WorkoutSetRow = {
        id: string
        workout_log_id: string
        exercise_id: string
        reps: number
        peso: number
        orden: number
        exercises: {
          id: string
          nombre: string
          grupo_muscular: string
        } | null
      }

      const mappedLogs: WorkoutLog[] = data.map((item) => {
        const rawSets = Array.isArray(item.workout_sets)
          ? (item.workout_sets as unknown as WorkoutSetRow[])
          : []

        const exerciseMap = new Map<string, { name: string; sets: ExerciseSetSnapshot[] }>()

        rawSets.forEach((ws) => {
          const exId = ws.exercise_id || 'general'
          const exDetails = ws.exercises
          const exName = exDetails?.nombre || 'Ejercicio'

          if (!exerciseMap.has(exId)) {
            exerciseMap.set(exId, { name: exName, sets: [] })
          }

          exerciseMap.get(exId)?.sets.push({
            setNumber: ws.orden || 1,
            reps: ws.reps || 10,
            completed: true,
          })
        })

        const exercisesSnapshot: ExerciseSnapshot[] = Array.from(exerciseMap.values()).map(
          (entry) => ({
            name: entry.name,
            setsCount: entry.sets.length,
            sets: entry.sets.sort((a, b) => a.setNumber - b.setNumber),
          })
        )

        const totalExercises = exercisesSnapshot.length
        const totalSets = exercisesSnapshot.reduce((acc, ex) => acc + ex.setsCount, 0)
        const completedSets = exercisesSnapshot.reduce(
          (acc, ex) => acc + ex.sets.filter((s) => s.completed !== false).length,
          0
        )

        return {
          id: item.id,
          routineId: 'supabase',
          routineName: item.notes || 'Entrenamiento',
          completedAt: item.created_at || `${item.date}T12:00:00.000Z`,
          dateKey: item.date,
          totalExercises,
          totalSets,
          completedSets,
          exercisesSnapshot,
        }
      })

      setLogs(mappedLogs)
      setIsLoading(false)
      return mappedLogs
    } catch {
      setLogs([])
      setIsLoading(false)
      return []
    }
  }

  useEffect(() => {
    fetchLogs()

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchLogs()
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const completeRoutine = async (routine: Routine): Promise<WorkoutLog> => {
    const now = new Date()
    const dateKey = formatDateKey(now)

    const exercisesSnapshot: ExerciseSnapshot[] = (routine.exercises || []).map((ex) => ({
      name: ex.name,
      setsCount: ex.sets ? ex.sets.length : 1,
      sets: ex.sets
        ? ex.sets.map((s) => ({
            setNumber: s.setNumber,
            reps: s.reps,
            completed: Boolean(s.completed),
          }))
        : [{ setNumber: 1, reps: 10, completed: false }],
    }))

    const totalExercises = exercisesSnapshot.length
    const totalSets = exercisesSnapshot.reduce((acc, ex) => acc + ex.setsCount, 0)
    const completedSets = exercisesSnapshot.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
      0
    )

    let createdLogId = generateUUID()

    try {
      const userId = await getCurrentUserId()
      if (userId) {
        for (const ex of routine.exercises || []) {
          await supabase.from('exercises').upsert(
            {
              id: ex.id,
              nombre: ex.name,
              grupo_muscular: ex.body_part || 'General',
              descripcion: null,
            },
            { onConflict: 'id' }
          )
        }

        const { data, error } = await supabase
          .from('workout_logs')
          .insert({
            user_id: userId,
            date: dateKey,
            duration: 45,
            notes: routine.name,
          })
          .select()
          .single()

        if (!error && data) {
          createdLogId = data.id
          const setsPayload: Array<{
            workout_log_id: string
            exercise_id: string
            reps: number
            peso: number
            orden: number
          }> = []

          ;(routine.exercises || []).forEach((ex) => {
            ;(ex.sets || []).forEach((set) => {
              setsPayload.push({
                workout_log_id: createdLogId,
                exercise_id: ex.id,
                reps: set.reps,
                peso: 0,
                orden: set.setNumber,
              })
            })
          })

          if (setsPayload.length > 0) {
            await supabase.from('workout_sets').insert(setsPayload)
          }
        }
      }
    } catch {
      // Backend error handling
    }

    const newLog: WorkoutLog = {
      id: createdLogId,
      routineId: routine.id,
      routineName: routine.name,
      completedAt: now.toISOString(),
      dateKey,
      totalExercises,
      totalSets,
      completedSets,
      exercisesSnapshot,
    }

    setLogs((prev) => [newLog, ...prev])
    return newLog
  }

  const addManualWorkoutLog = async (data: ManualWorkoutLogInput): Promise<WorkoutLog> => {
    const totalExercises = data.exercisesSnapshot.length
    const totalSets = data.exercisesSnapshot.reduce((acc, ex) => acc + ex.setsCount, 0)
    const completedSets = data.exercisesSnapshot.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.completed !== false).length,
      0
    )

    const completedAt =
      data.completedAt || new Date(`${data.dateKey}T12:00:00.000Z`).toISOString()

    let createdLogId = generateUUID()

    try {
      const userId = await getCurrentUserId()
      if (userId) {
        for (const ex of data.exercisesSnapshot) {
          const syntheticId = `ex_${ex.name.toLowerCase().replace(/\s+/g, '_')}`
          await supabase.from('exercises').upsert(
            {
              id: syntheticId,
              nombre: ex.name,
              grupo_muscular: 'General',
              descripcion: null,
            },
            { onConflict: 'id' }
          )
        }

        const { data: inserted, error } = await supabase
          .from('workout_logs')
          .insert({
            user_id: userId,
            date: data.dateKey,
            duration: 30,
            notes: data.routineName.trim() || 'Entrenamiento manual',
          })
          .select()
          .single()

        if (!error && inserted) {
          createdLogId = inserted.id
          const setsPayload: Array<{
            workout_log_id: string
            exercise_id: string
            reps: number
            peso: number
            orden: number
          }> = []

          data.exercisesSnapshot.forEach((ex) => {
            const syntheticId = `ex_${ex.name.toLowerCase().replace(/\s+/g, '_')}`
            ex.sets.forEach((set) => {
              setsPayload.push({
                workout_log_id: createdLogId,
                exercise_id: syntheticId,
                reps: set.reps,
                peso: 0,
                orden: set.setNumber,
              })
            })
          })

          if (setsPayload.length > 0) {
            await supabase.from('workout_sets').insert(setsPayload)
          }
        }
      }
    } catch {
      // Backend error handling
    }

    const newLog: WorkoutLog = {
      id: createdLogId,
      routineId: data.routineId || 'manual',
      routineName: data.routineName.trim() || 'Entrenamiento manual',
      completedAt,
      dateKey: data.dateKey,
      totalExercises,
      totalSets,
      completedSets,
      exercisesSnapshot: data.exercisesSnapshot,
    }

    setLogs((prev) => {
      const next = [newLog, ...prev]
      next.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      return next
    })

    return newLog
  }

  const updateWorkoutLog = async (
    logId: string,
    updatedData: UpdateWorkoutLogInput
  ): Promise<void> => {
    try {
      const updatePayload: { date?: string; notes?: string } = {}
      if (updatedData.dateKey) {
        updatePayload.date = updatedData.dateKey
      }
      if (updatedData.routineName) {
        updatePayload.notes = updatedData.routineName.trim()
      }

      if (Object.keys(updatePayload).length > 0) {
        await supabase.from('workout_logs').update(updatePayload).eq('id', logId)
      }
    } catch {
      // Backend error handling
    }

    setLogs((prev) => {
      const next = prev.map((log) => {
        if (log.id !== logId) return log

        const exercises = updatedData.exercisesSnapshot || log.exercisesSnapshot
        const totalExercises = exercises.length
        const totalSets = exercises.reduce((acc, ex) => acc + ex.setsCount, 0)
        const completedSets = exercises.reduce(
          (acc, ex) => acc + ex.sets.filter((s) => s.completed !== false).length,
          0
        )

        const dateKey = updatedData.dateKey || log.dateKey
        const completedAt =
          updatedData.completedAt ||
          (updatedData.dateKey && updatedData.dateKey !== log.dateKey
            ? new Date(`${updatedData.dateKey}T12:00:00.000Z`).toISOString()
            : log.completedAt)

        return {
          ...log,
          routineName: updatedData.routineName ? updatedData.routineName.trim() : log.routineName,
          dateKey,
          completedAt,
          totalExercises,
          totalSets,
          completedSets,
          exercisesSnapshot: exercises,
        }
      })

      next.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      return next
    })
  }

  const deleteWorkoutLog = async (id: string): Promise<void> => {
    try {
      await supabase.from('workout_logs').delete().eq('id', id)
    } catch {
      // Backend error handling
    }
    setLogs((prev) => prev.filter((log) => log.id !== id))
  }

  const deleteLog = async (id: string): Promise<void> => {
    await deleteWorkoutLog(id)
  }

  const getLogsByDate = (dateKey: string): WorkoutLog[] => {
    return logs.filter((log) => log.dateKey === dateKey)
  }

  const getActivityCountForDate = (dateKey: string): number => {
    return logs
      .filter((log) => log.dateKey === dateKey)
      .reduce((acc, log) => acc + log.totalExercises, 0)
  }

  const getActivityLevelForDate = (dateKey: string): 0 | 1 | 2 | 3 => {
    return calculateActivityLevel(getActivityCountForDate(dateKey))
  }

  return (
    <HistoryContext.Provider
      value={{
        logs,
        isLoading,
        completeRoutine,
        addManualWorkoutLog,
        updateWorkoutLog,
        deleteWorkoutLog,
        deleteLog,
        getLogsByDate,
        getActivityCountForDate,
        getActivityLevelForDate,
      }}
    >
      {children}
    </HistoryContext.Provider>
  )
}

export function useHistory(): HistoryContextType {
  const context = useContext(HistoryContext)
  if (!context) {
    throw new Error('useHistory debe usarse dentro de un HistoryProvider')
  }
  return context
}
