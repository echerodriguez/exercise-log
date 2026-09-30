'use client'

import React, { useEffect, useState } from 'react'
import { Dumbbell, ImageOff, X } from 'lucide-react'
import type { RoutineExercise } from '../context/RoutinesContext'
import {
  getExerciseDetails,
  type Exercise,
  type ExerciseInstructionSteps,
  type ExerciseInstructions,
} from '../services/exercises'

interface ExerciseTechniqueModalProps {
  exercise: RoutineExercise | null
  isOpen: boolean
  onClose: () => void
}

function getTechniqueSteps(exercise: {
  instruction_steps?: ExerciseInstructionSteps
  instructions?: ExerciseInstructions | string
}): string[] {
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


export function ExerciseTechniqueModal({
  exercise,
  isOpen,
  onClose,
}: ExerciseTechniqueModalProps) {
  const [imageError, setImageError] = useState(false)
  const [fullDetails, setFullDetails] = useState<Exercise | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  useEffect(() => {
    let isCancelled = false
    setImageError(false)

    if (isOpen && exercise) {
      const existingSteps = getTechniqueSteps(exercise)
      if (existingSteps.length === 0) {
        setIsLoadingDetails(true)
        getExerciseDetails(exercise.id, exercise.name)
          .then((details) => {
            if (!isCancelled) {
              setFullDetails(details)
              setIsLoadingDetails(false)
            }
          })
          .catch(() => {
            if (!isCancelled) {
              setIsLoadingDetails(false)
            }
          })
      } else {
        setFullDetails(null)
        setIsLoadingDetails(false)
      }
    }

    return () => {
      isCancelled = true
    }
  }, [exercise, isOpen])

  useEffect(() => {
    let cleanup = () => {}
    if (isOpen) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
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
  }, [isOpen, onClose])

  let content: React.ReactNode = null

  if (isOpen && exercise) {
    const effectiveExercise = fullDetails || exercise
    const steps = getTechniqueSteps(effectiveExercise)
    const category = effectiveExercise.category || exercise.category
    const equipment = 'equipment' in effectiveExercise ? effectiveExercise.equipment : ''
    const gifUrl = effectiveExercise.gifUrl || exercise.gifUrl

    content = (
      <div
        className="modal-backdrop"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClose()
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="technique-modal-title"
      >
        <div className="modal-card">
          <header className="modal-header">
            <div className="modal-kicker">
              <Dumbbell size={14} />
              <span>{category || 'Ejercicio'}</span>
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
              <h2 id="technique-modal-title" className="modal-title">
                {exercise.name}
              </h2>
            </div>

            <div className="modal-meta-badges">
              {category && <span className="modal-badge modal-badge-primary">{category}</span>}
              {equipment && <span className="modal-badge">{equipment}</span>}
            </div>

            <div className="modal-media-wrap">
              {!imageError && gifUrl ? (
                <img
                  src={gifUrl}
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
              {isLoadingDetails ? (
                <div className="state-box" style={{ padding: '24px 16px' }}>
                  <div className="spinner spinner-small" />
                  <span style={{ fontSize: '12.5px', marginTop: '6px' }}>
                    Cargando instrucciones...
                  </span>
                </div>
              ) : steps.length > 0 ? (
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
    )
  }

  return content
}
