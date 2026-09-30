'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
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
  completeRoutine: (routine: Routine) => WorkoutLog
  addManualWorkoutLog: (data: ManualWorkoutLogInput) => WorkoutLog
  updateWorkoutLog: (logId: string, updatedData: UpdateWorkoutLogInput) => void
  deleteWorkoutLog: (id: string) => void
  deleteLog: (id: string) => void
  getLogsByDate: (dateKey: string) => WorkoutLog[]
  getActivityCountForDate: (dateKey: string) => number
  getActivityLevelForDate: (dateKey: string) => 0 | 1 | 2 | 3
}

const STORAGE_KEY = 'exercise_browser_history_v1'

function generateUUID(): string {
  let id = ''
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    id = crypto.randomUUID()
  } else {
    id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
  return id
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined)

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let savedLogs: WorkoutLog[] = []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        savedLogs = JSON.parse(stored) as WorkoutLog[]
      }
    } catch {
      savedLogs = []
    }
    // Sort logs descending by completedAt / dateKey
    savedLogs.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    setLogs(savedLogs)
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
      } catch {
        // Silently catch quota or privacy errors
      }
    }
  }, [logs, isLoaded])

  const completeRoutine = (routine: Routine): WorkoutLog => {
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

    const newLog: WorkoutLog = {
      id: generateUUID(),
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

  const addManualWorkoutLog = (data: ManualWorkoutLogInput): WorkoutLog => {
    const totalExercises = data.exercisesSnapshot.length
    const totalSets = data.exercisesSnapshot.reduce((acc, ex) => acc + ex.setsCount, 0)
    const completedSets = data.exercisesSnapshot.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.completed !== false).length,
      0
    )

    const completedAt =
      data.completedAt || new Date(`${data.dateKey}T12:00:00.000Z`).toISOString()

    const newLog: WorkoutLog = {
      id: generateUUID(),
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

  const updateWorkoutLog = (logId: string, updatedData: UpdateWorkoutLogInput) => {
    setLogs((prev) => {
      const next = prev.map((log) => {
        let updated = log
        if (log.id === logId) {
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

          updated = {
            ...log,
            routineName: updatedData.routineName ? updatedData.routineName.trim() : log.routineName,
            dateKey,
            completedAt,
            totalExercises,
            totalSets,
            completedSets,
            exercisesSnapshot: exercises,
          }
        }
        return updated
      })

      next.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      return next
    })
  }

  const deleteWorkoutLog = (id: string) => {
    setLogs((prev) => prev.filter((log) => log.id !== id))
  }

  const deleteLog = (id: string) => {
    deleteWorkoutLog(id)
  }

  const getLogsByDate = (dateKey: string): WorkoutLog[] => {
    return logs.filter((log) => log.dateKey === dateKey)
  }

  const getActivityCountForDate = (dateKey: string): number => {
    const dayLogs = logs.filter((log) => log.dateKey === dateKey)
    return dayLogs.reduce((acc, log) => acc + log.totalExercises, 0)
  }

  const getActivityLevelForDate = (dateKey: string): 0 | 1 | 2 | 3 => {
    const count = getActivityCountForDate(dateKey)
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

  return (
    <HistoryContext.Provider
      value={{
        logs,
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
