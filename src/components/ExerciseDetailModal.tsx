'use client'

import { useEffect, useState } from 'react'
import { Dumbbell, FolderPlus, ImageOff, X } from 'lucide-react'
import { AddToRoutineModal } from './AddToRoutineModal'
import type { Exercise } from '../services/exercises'

interface ExerciseDetailModalProps {
  exercise: Exercise | null
  isOpen: boolean
  onClose: () => void
}

function getInstructionSteps(exercise: Exercise): string[] {
  let steps: string[] = []

  if (exercise.instruction_steps?.es && exercise.instruction_steps.es.length > 0) {
    steps = exercise.instruction_steps.es
  } else if (typeof exercise.instructions === 'object' && exercise.instructions !== null && exercise.instructions.es) {
    const text = exercise.instructions.es.trim()
    if (text) {
      steps = text.split(/(?<=\.)\s+/).map((s) => s.trim()).filter(Boolean)
    }
  }

  return steps
}

export function ExerciseDetailModal({ exercise, isOpen, onClose }: ExerciseDetailModalProps) {
  const [imageError, setImageError] = useState(false)
  const [isAddToRoutineOpen, setIsAddToRoutineOpen] = useState(false)

  useEffect(() => {
    setImageError(false)
    setIsAddToRoutineOpen(false)
  }, [exercise])

  useEffect(() => {
    let cleanup = () => {}
    if (isOpen) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && !isAddToRoutineOpen) {
          onClose()
        }
      }
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)

      cleanup = () => {
        document.body.style.overflow = previousOverflow
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
    return cleanup
  }, [isOpen, onClose, isAddToRoutineOpen])

  let modalElement: React.ReactNode = null

  if (isOpen && exercise) {
    const steps = getInstructionSteps(exercise)

    modalElement = (
      <>
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onClose()
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-exercise-name"
        >
          <div className="modal-card">
            <header className="modal-header">
              <div className="modal-kicker">
                <Dumbbell size={14} />
                <span>{exercise.category}</span>
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

            <div className="modal-scroll-body">
              <div className="modal-title-row">
                <h2 id="modal-exercise-name" className="modal-title">
                  {exercise.name}
                </h2>
                <button
                  type="button"
                  className="modal-action-btn"
                  onClick={() => setIsAddToRoutineOpen(true)}
                  aria-label="Agregar este ejercicio a una rutina"
                >
                  <FolderPlus size={15} />
                  <span>Agregar a Rutina</span>
                </button>
              </div>

              <div className="modal-meta-badges">
                <span className="modal-badge modal-badge-primary">{exercise.category}</span>
                {exercise.equipment && <span className="modal-badge">{exercise.equipment}</span>}
              </div>

              <div className="modal-media-wrap">
                {!imageError && exercise.gifUrl ? (
                  <img
                    src={exercise.gifUrl}
                    alt={`Demostración detallada de ${exercise.name}`}
                    className="modal-gif"
                    loading="eager"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="modal-media-fallback" aria-label="Animación no disponible">
                    <ImageOff size={32} />
                    <span>Animación no disponible</span>
                  </div>
                )}
              </div>

              <section className="modal-instructions-section" aria-label="Instrucciones paso a paso">
                <h3 className="modal-instructions-heading">Instrucciones paso a paso</h3>
                {steps.length > 0 ? (
                  <ol className="modal-steps-list">
                    {steps.map((step, index) => (
                      <li key={index} className="modal-step-item">
                        <span className="modal-step-number">{index + 1}.</span>
                        <span className="modal-step-text">{step}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="modal-steps-fallback">
                    <p>No hay instrucciones disponibles</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        <AddToRoutineModal
          exercise={exercise}
          isOpen={isAddToRoutineOpen}
          onClose={() => setIsAddToRoutineOpen(false)}
        />
      </>
    )
  }

  return modalElement
}
