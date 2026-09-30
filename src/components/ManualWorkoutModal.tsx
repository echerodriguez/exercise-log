'use client'

import React, { useEffect, useState } from 'react'
import { Calendar, Dumbbell, Minus, Plus, Trash2, X } from 'lucide-react'
import {
  formatDateKey,
  formatReadableDate,
  useHistory,
  type ExerciseSnapshot,
  type ExerciseSetSnapshot,
} from '../context/HistoryContext'
import { useRoutines } from '../context/RoutinesContext'

interface ManualWorkoutModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDateKey: string
  onGoToRoutines?: () => void
}

export function ManualWorkoutModal({
  isOpen,
  onClose,
  selectedDateKey,
  onGoToRoutines,
}: ManualWorkoutModalProps) {
  const { routines, showToast } = useRoutines()
  const { addManualWorkoutLog } = useHistory()

  const [selectedRoutineId, setSelectedRoutineId] = useState<string>('')
  const [exercises, setExercises] = useState<ExerciseSnapshot[]>([])

  useEffect(() => {
    if (isOpen) {
      if (routines.length > 0) {
        const first = routines[0]
        setSelectedRoutineId(first.id)
        const mapped: ExerciseSnapshot[] = first.exercises.map((ex) => ({
          name: ex.name,
          setsCount: ex.sets.length,
          sets: ex.sets.map((s) => ({
            setNumber: s.setNumber,
            reps: s.reps,
            completed: true,
          })),
        }))
        setExercises(mapped)
      } else {
        setSelectedRoutineId('')
        setExercises([])
      }
    }
  }, [isOpen, routines])

  const handleRoutineSelect = (routineId: string) => {
    setSelectedRoutineId(routineId)
    const routine = routines.find((r) => r.id === routineId)
    if (routine) {
      const mapped: ExerciseSnapshot[] = routine.exercises.map((ex) => ({
        name: ex.name,
        setsCount: ex.sets.length,
        sets: ex.sets.map((s) => ({
          setNumber: s.setNumber,
          reps: s.reps,
          completed: true,
        })),
      }))
      setExercises(mapped)
    } else {
      setExercises([])
    }
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

  const selectedRoutine = routines.find((r) => r.id === selectedRoutineId)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDateKey || !selectedRoutine || exercises.length === 0) return

    addManualWorkoutLog({
      routineId: selectedRoutine.id,
      routineName: selectedRoutine.name,
      dateKey: selectedDateKey,
      exercisesSnapshot: exercises,
    })

    showToast(`¡"${selectedRoutine.name}" registrada en ${formatReadableDate(selectedDateKey)}!`)
    onClose()
  }

  let content: React.ReactNode = null

  if (isOpen) {
    content = (
      <div
        className="modal-backdrop modal-backdrop-top"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-workout-title"
      >
        <div className="modal-card manual-workout-card">
          <header className="modal-header">
            <div className="modal-kicker">
              <Calendar size={14} />
              <span>Registro Retroactivo</span>
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
            <h2 id="manual-workout-title" className="modal-title manual-modal-title">
              Cargar entrenamiento pasado
            </h2>
            <p className="manual-modal-subtitle">
              Registra una rutina completada para el día seleccionado en el mapa de actividad.
            </p>

            {/* Locked Date & Auto Session Info */}
            <div className="retro-info-strip">
              <div className="retro-strip-item">
                <span className="retro-strip-label">Fecha fijada:</span>
                <span className="retro-strip-val">
                  <Calendar size={13} /> {formatReadableDate(selectedDateKey)}
                </span>
              </div>
              {selectedRoutine && (
                <div className="retro-strip-item">
                  <span className="retro-strip-label">Sesión:</span>
                  <span className="retro-strip-val bold">{selectedRoutine.name}</span>
                </div>
              )}
            </div>

            {routines.length === 0 ? (
              <div className="state-box" style={{ padding: '24px 16px' }}>
                <Dumbbell size={24} style={{ color: 'var(--green)', margin: '0 auto 6px' }} />
                <h3>No tienes rutinas creadas todavía</h3>
                <span>
                  Para registrar un entrenamiento pasado, primero debes crear al menos una rutina con
                  tus ejercicios habituales.
                </span>
                {onGoToRoutines && (
                  <button
                    type="button"
                    className="retry-button"
                    style={{ marginTop: '12px' }}
                    onClick={() => {
                      onClose()
                      onGoToRoutines()
                    }}
                  >
                    Crear mi primera rutina
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="manual-field-group">
                  <label htmlFor="manual-routine-select" className="manual-field-label">
                    Selecciona la rutina que realizaste
                  </label>
                  <select
                    id="manual-routine-select"
                    value={selectedRoutineId}
                    onChange={(e) => handleRoutineSelect(e.target.value)}
                    className="manual-select-input"
                    required
                  >
                    {routines.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.exercises.length} ejercicios)
                      </option>
                    ))}
                  </select>
                </div>

                <section
                  className="manual-exercises-editor"
                  aria-label="Ejercicios y series de la rutina"
                >
                  <div className="manual-editor-header">
                    <div>
                      <h3 className="manual-editor-heading">Ejercicios y Series Realizadas</h3>
                      <span className="manual-editor-subhint">
                        Ajusta las series o repeticiones que realizaste ese día
                      </span>
                    </div>
                    <span className="manual-editor-count">
                      {exercises.length} ejercicio{exercises.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {exercises.length === 0 ? (
                    <div className="state-box" style={{ padding: '20px' }}>
                      <span>
                        La rutina seleccionada no contiene ejercicios guardados. Ve a tus rutinas
                        para agregar ejercicios.
                      </span>
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
                              aria-label={`Omitir ${ex.name} de este registro`}
                              title="Omitir ejercicio si no lo realizaste"
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
                </section>

                <div className="dialog-action-buttons" style={{ marginTop: '16px' }}>
                  <button type="button" className="dialog-cancel-btn" onClick={onClose}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="confirm-success-btn"
                    disabled={exercises.length === 0 || !selectedRoutine}
                  >
                    Guardar en historial
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    )
  }

  return content
}
