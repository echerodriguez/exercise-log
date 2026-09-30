'use client'

import React, { useEffect, useState } from 'react'
import { Calendar, Dumbbell, Minus, Plus, Trash2, X } from 'lucide-react'
import {
  formatDateKey,
  useHistory,
  type ExerciseSnapshot,
  type ExerciseSetSnapshot,
  type WorkoutLog,
} from '../context/HistoryContext'
import { useRoutines } from '../context/RoutinesContext'

interface EditWorkoutLogModalProps {
  log: WorkoutLog | null
  isOpen: boolean
  onClose: () => void
}

export function EditWorkoutLogModal({ log, isOpen, onClose }: EditWorkoutLogModalProps) {
  const { showToast } = useRoutines()
  const { updateWorkoutLog } = useHistory()

  const todayKey = formatDateKey(new Date())
  const [dateKey, setDateKey] = useState(todayKey)
  const [exercises, setExercises] = useState<ExerciseSnapshot[]>([])
  const [newExerciseName, setNewExerciseName] = useState('')

  useEffect(() => {
    if (isOpen && log) {
      setDateKey(log.dateKey)
      setExercises(
        log.exercisesSnapshot.map((ex) => ({
          name: ex.name,
          setsCount: ex.sets.length,
          sets: ex.sets.map((s) => ({
            setNumber: s.setNumber,
            reps: s.reps,
            completed: s.completed !== false,
          })),
        }))
      )
    }
  }, [isOpen, log])

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExerciseName.trim()) return
    const newEx: ExerciseSnapshot = {
      name: newExerciseName.trim(),
      setsCount: 3,
      sets: [
        { setNumber: 1, reps: 10, completed: true },
        { setNumber: 2, reps: 10, completed: true },
        { setNumber: 3, reps: 10, completed: true },
      ],
    }
    setExercises((prev) => [...prev, newEx])
    setNewExerciseName('')
  }

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddSet = (exerciseIndex: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        let updated = ex
        if (i === exerciseIndex) {
          const nextSetNumber = ex.sets.length + 1
          const lastReps = ex.sets.length > 0 ? ex.sets[ex.sets.length - 1].reps : 10
          const newSet: ExerciseSetSnapshot = {
            setNumber: nextSetNumber,
            reps: lastReps,
            completed: true,
          }
          const nextSets = [...ex.sets, newSet]
          updated = {
            ...ex,
            setsCount: nextSets.length,
            sets: nextSets,
          }
        }
        return updated
      })
    )
  }

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        let updated = ex
        if (i === exerciseIndex && ex.sets.length > 1) {
          const filtered = ex.sets.filter((_, sI) => sI !== setIndex)
          const renumbered = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }))
          updated = {
            ...ex,
            setsCount: renumbered.length,
            sets: renumbered,
          }
        }
        return updated
      })
    )
  }

  const handleUpdateReps = (exerciseIndex: number, setIndex: number, reps: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        let updated = ex
        if (i === exerciseIndex) {
          const nextSets = ex.sets.map((s, sI) => {
            let updatedSet = s
            if (sI === setIndex) {
              updatedSet = { ...s, reps: Math.max(1, reps) }
            }
            return updatedSet
          })
          updated = { ...ex, sets: nextSets }
        }
        return updated
      })
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!log || !dateKey || exercises.length === 0) return

    await updateWorkoutLog(log.id, {
      routineName: log.routineName,
      dateKey,
      exercisesSnapshot: exercises,
    })

    showToast('¡Entrenamiento actualizado correctamente!')
    onClose()
  }

  let content: React.ReactNode = null

  if (isOpen && log) {
    content = (
      <div
        className="modal-backdrop modal-backdrop-top"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-workout-title"
      >
        <div className="modal-card manual-workout-card">
          <header className="modal-header">
            <div className="modal-kicker">
              <Calendar size={14} />
              <span>Editar Entrenamiento</span>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </header>

          <form onSubmit={handleSave} className="modal-scroll-body manual-workout-form">
            <h2 id="edit-workout-title" className="modal-title manual-modal-title">
              Editar sesión registrada
            </h2>
            <p className="manual-modal-subtitle">
              Modifica la fecha asignada o ajusta las repeticiones y ejercicios que realizaste.
            </p>

            <div className="manual-inputs-row">
              <div className="manual-field-group">
                <label htmlFor="edit-date" className="manual-field-label">
                  Fecha del entrenamiento
                </label>
                <input
                  id="edit-date"
                  type="date"
                  max={todayKey}
                  value={dateKey}
                  onChange={(e) => setDateKey(e.target.value)}
                  className="manual-date-input"
                  required
                />
              </div>

              <div className="manual-field-group">
                <span className="manual-field-label">Sesión / Rutina</span>
                <div className="read-only-name-box">
                  <Dumbbell size={14} />
                  <span>{log.routineName}</span>
                </div>
              </div>
            </div>

            <section className="manual-exercises-editor" aria-label="Editor de ejercicios y series">
              <div className="manual-editor-header">
                <h3 className="manual-editor-heading">Ejercicios y Series Realizadas</h3>
                <span className="manual-editor-count">
                  {exercises.length} ejercicio{exercises.length === 1 ? '' : 's'}
                </span>
              </div>

              {exercises.length === 0 ? (
                <div className="state-box" style={{ padding: '20px' }}>
                  <span>No hay ejercicios en esta sesión. Agrega al menos uno para guardar.</span>
                </div>
              ) : (
                <div className="manual-exercises-list">
                  {exercises.map((ex, exIdx) => (
                    <div key={exIdx} className="manual-exercise-box">
                      <div className="manual-exercise-top">
                        <div className="manual-exercise-name-wrap">
                          <Dumbbell size={14} />
                          <span className="manual-exercise-name">{ex.name}</span>
                        </div>
                        <button
                          type="button"
                          className="manual-delete-ex-btn"
                          onClick={() => handleRemoveExercise(exIdx)}
                          aria-label={`Quitar ${ex.name}`}
                          title="Quitar ejercicio"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="manual-sets-list">
                        {ex.sets.map((set, setIdx) => (
                          <div key={setIdx} className="manual-set-row">
                            <span className="manual-set-num">Serie {set.setNumber}</span>
                            <div className="manual-set-input-wrap">
                              <input
                                type="number"
                                min="1"
                                max="999"
                                value={set.reps}
                                onChange={(e) =>
                                  handleUpdateReps(
                                    exIdx,
                                    setIdx,
                                    parseInt(e.target.value, 10) || 1
                                  )
                                }
                                className="manual-reps-input"
                                aria-label={`Repeticiones serie ${set.setNumber}`}
                              />
                              <span className="manual-reps-tag">reps</span>
                            </div>

                            <button
                              type="button"
                              className="manual-remove-set-btn"
                              onClick={() => handleRemoveSet(exIdx, setIdx)}
                              disabled={ex.sets.length <= 1}
                              aria-label={`Eliminar serie ${set.setNumber}`}
                              title={
                                ex.sets.length <= 1
                                  ? 'No puedes eliminar la única serie'
                                  : `Eliminar serie ${set.setNumber}`
                              }
                            >
                              <Minus size={13} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="manual-add-set-btn"
                        onClick={() => handleAddSet(exIdx)}
                      >
                        <Plus size={13} /> Agregar serie
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add exercise input */}
              <div className="manual-add-exercise-form">
                <input
                  type="text"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="Agregar otro ejercicio al entrenamiento..."
                  className="manual-new-ex-input"
                />
                <button
                  type="button"
                  className="manual-new-ex-btn"
                  onClick={handleAddExercise}
                  disabled={!newExerciseName.trim()}
                >
                  <Plus size={15} /> Añadir
                </button>
              </div>
            </section>

            <div className="dialog-action-buttons" style={{ marginTop: '16px' }}>
              <button type="button" className="dialog-cancel-btn" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="confirm-success-btn"
                disabled={exercises.length === 0 || !dateKey}
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return content
}
