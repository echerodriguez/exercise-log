'use client'

import React, { useState } from 'react'
import { Check, FolderPlus, ImageOff, Plus, X } from 'lucide-react'
import { useRoutines } from '../context/RoutinesContext'
import type { Exercise } from '../services/exercises'

interface AddToRoutineModalProps {
  exercise: Exercise
  isOpen: boolean
  onClose: () => void
}

export function AddToRoutineModal({ exercise, isOpen, onClose }: AddToRoutineModalProps) {
  const { routines, createRoutine, addExerciseToRoutine } = useRoutines()
  const [newRoutineName, setNewRoutineName] = useState('')
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  const handleSelectRoutine = (routineId: string) => {
    addExerciseToRoutine(routineId, {
      id: exercise.id,
      name: exercise.name,
      gifUrl: exercise.gifUrl,
      body_part: exercise.body_part,
      category: exercise.category,
      instruction_steps: exercise.instruction_steps,
      instructions: exercise.instructions,
    })
    onClose()
  }

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoutineName.trim()) return
    const created = createRoutine(newRoutineName.trim())
    addExerciseToRoutine(created.id, {
      id: exercise.id,
      name: exercise.name,
      gifUrl: exercise.gifUrl,
      body_part: exercise.body_part,
      category: exercise.category,
      instruction_steps: exercise.instruction_steps,
      instructions: exercise.instructions,
    })
    setNewRoutineName('')
    setIsCreatingNew(false)
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
        aria-labelledby="add-to-routine-title"
      >
        <div className="routine-modal-card add-to-routine-card">
          <header className="routine-modal-header">
            <div>
              <h2 id="add-to-routine-title" className="routine-modal-title">
                Agregar a una rutina
              </h2>
              <p className="routine-modal-subtitle">
                Selecciona la rutina donde deseas guardar este ejercicio
              </p>
            </div>
            <button
              type="button"
              className="routine-modal-close-btn"
              onClick={onClose}
              aria-label="Cerrar selección de rutina"
            >
              <X size={18} />
            </button>
          </header>

          <div className="routine-modal-body">
            {/* Ficha previa del ejercicio */}
            <div className="add-routine-exercise-preview" aria-label="Ejercicio a guardar">
              <div className="preview-thumb">
                {exercise.gifUrl ? (
                  <img
                    src={exercise.gifUrl}
                    alt={exercise.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="preview-thumb-fallback">
                    <ImageOff size={16} />
                  </div>
                )}
              </div>
              <div className="preview-copy">
                <span className="preview-name">{exercise.name}</span>
                <div className="preview-badges">
                  {exercise.category && (
                    <span className="preview-badge category">{exercise.category}</span>
                  )}
                  {exercise.body_part && (
                    <span className="preview-badge">{exercise.body_part}</span>
                  )}
                </div>
              </div>
            </div>

            {routines.length === 0 && !isCreatingNew ? (
              <div className="empty-routines-inline-box">
                <p className="empty-routines-inline-title">No tienes rutinas creadas todavía</p>
                <span className="empty-routines-inline-subtitle">
                  Crea tu primera rutina para comenzar a organizar tus ejercicios.
                </span>
                <button
                  type="button"
                  className="routine-btn-primary"
                  style={{ marginTop: '12px', width: '100%' }}
                  onClick={() => setIsCreatingNew(true)}
                >
                  <Plus size={16} />
                  <span>Crear mi primera rutina</span>
                </button>
              </div>
            ) : isCreatingNew ? (
              <form onSubmit={handleCreateAndAdd} className="inline-create-routine-form">
                <div className="routine-form-group">
                  <label htmlFor="inline-routine-name" className="inline-create-label">
                    Nombre de la nueva rutina
                  </label>
                  <input
                    id="inline-routine-name"
                    type="text"
                    value={newRoutineName}
                    onChange={(e) => setNewRoutineName(e.target.value)}
                    placeholder="Ej. Espalda y Bíceps, Piernas Hipertrofia..."
                    className="routine-modal-input"
                    autoFocus
                    required
                  />
                </div>
                <div className="routine-modal-actions">
                  <button
                    type="button"
                    className="routine-btn-secondary"
                    onClick={() => {
                      setIsCreatingNew(false)
                      setNewRoutineName('')
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="routine-btn-primary"
                    disabled={!newRoutineName.trim()}
                  >
                    <Plus size={16} />
                    <span>Crear y agregar</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="routines-selection-container">
                <span className="routines-list-label">Tus rutinas:</span>
                <div className="routines-scroll-list max-h-60 overflow-y-auto space-y-2 pr-1">
                  {routines.map((routine) => {
                    const alreadyInRoutine = routine.exercises.some(
                      (ex) => ex.id === exercise.id || ex.name === exercise.name
                    )

                    return (
                      <button
                        key={routine.id}
                        type="button"
                        className={`routine-item-row ${alreadyInRoutine ? 'is-added' : ''}`}
                        onClick={() => handleSelectRoutine(routine.id)}
                        disabled={alreadyInRoutine}
                        aria-label={
                          alreadyInRoutine
                            ? `Ya agregado a ${routine.name}`
                            : `Agregar a rutina ${routine.name}`
                        }
                      >
                        <div className="routine-row-info">
                          <span className="routine-row-name">{routine.name}</span>
                          <span className="routine-row-count">
                            {routine.exercises.length} ejercicio
                            {routine.exercises.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        {alreadyInRoutine ? (
                          <span className="already-added-badge">
                            <Check size={12} strokeWidth={2.5} /> Ya agregado
                          </span>
                        ) : (
                          <span className="add-plus-badge" aria-hidden="true">
                            <Plus size={15} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <button
                  type="button"
                  className="btn-create-routine-inline"
                  onClick={() => setIsCreatingNew(true)}
                  aria-label="Crear nueva rutina"
                >
                  <Plus size={15} />
                  <span>+ Crear nueva rutina</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return content
}
