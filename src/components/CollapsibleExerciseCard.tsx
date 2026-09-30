'use client'

import React, { useEffect, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronUp,
  ImageOff,
  Info,
  Minus,
  Plus,
  Trash2,
} from 'lucide-react'
import { ExerciseTechniqueModal } from './ExerciseTechniqueModal'
import {
  useRoutines,
  type ExerciseSet,
  type RoutineExercise,
} from '../context/RoutinesContext'

interface SetRowProps {
  set: ExerciseSet
  routineId: string
  exerciseId: string
  isOnlySet: boolean
  onRemoveSet: (setId: string) => void
  onToggleCompleted: (setId: string) => void
}

function SetRow({
  set,
  routineId,
  exerciseId,
  isOnlySet,
  onRemoveSet,
  onToggleCompleted,
}: SetRowProps) {
  const { updateSetReps } = useRoutines()
  const [localReps, setLocalReps] = useState(String(set.reps))

  useEffect(() => {
    setLocalReps(String(set.reps))
  }, [set.reps])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalReps(val)
    const num = parseInt(val, 10)
    if (!isNaN(num) && num > 0) {
      updateSetReps(routineId, exerciseId, set.id, num)
    }
  }

  const handleBlur = () => {
    const num = parseInt(localReps, 10)
    const valid = isNaN(num) || num < 1 ? 10 : num
    setLocalReps(String(valid))
    updateSetReps(routineId, exerciseId, set.id, valid)
  }

  return (
    <div className={`set-row ${set.completed ? 'set-row-completed' : ''}`}>
      <button
        type="button"
        className={`set-check-btn ${set.completed ? 'checked' : ''}`}
        onClick={() => onToggleCompleted(set.id)}
        aria-label={
          set.completed
            ? `Marcar Serie ${set.setNumber} como pendiente`
            : `Marcar Serie ${set.setNumber} como realizada`
        }
        title={set.completed ? 'Serie realizada (clic para desmarcar)' : 'Marcar como realizada'}
      >
        {set.completed ? (
          <span className="set-check-badge" aria-hidden="true">
            <Check size={13} strokeWidth={3} />
          </span>
        ) : (
          <span className="check-ring" aria-hidden="true" />
        )}
      </button>

      <span className={`set-label ${set.completed ? 'text-completed' : ''}`}>
        Serie {set.setNumber}
      </span>

      <div className={`set-reps-input-wrap ${set.completed ? 'input-completed' : ''}`}>
        <input
          type="number"
          min="1"
          max="999"
          value={localReps}
          onChange={handleChange}
          onBlur={handleBlur}
          className="set-reps-input"
          aria-label={`Repeticiones para Serie ${set.setNumber}`}
        />
        <span className="set-reps-unit">reps</span>
      </div>

      <button
        type="button"
        className="remove-set-btn"
        onClick={() => onRemoveSet(set.id)}
        disabled={isOnlySet}
        aria-label={`Eliminar Serie ${set.setNumber}`}
        title={
          isOnlySet
            ? 'No puedes eliminar la única serie'
            : `Eliminar Serie ${set.setNumber}`
        }
      >
        <Minus size={14} />
      </button>
    </div>
  )
}

interface CollapsibleExerciseCardProps {
  exercise: RoutineExercise
  routineId: string
  onDeleteExerciseRequest: (exercise: RoutineExercise) => void
  defaultOpen?: boolean
}

export function CollapsibleExerciseCard({
  exercise,
  routineId,
  onDeleteExerciseRequest,
  defaultOpen = true,
}: CollapsibleExerciseCardProps) {
  const { addSetToExercise, removeSetFromExercise, toggleSetCompleted } = useRoutines()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isTechniqueModalOpen, setIsTechniqueModalOpen] = useState(false)

  const setsCount = exercise.sets.length
  const completedCount = exercise.sets.filter((s) => s.completed).length
  const progressPercent = setsCount > 0 ? (completedCount / setsCount) * 100 : 0
  const isAllCompleted = setsCount > 0 && completedCount === setsCount

  return (
    <>
      <article className={`collapsible-exercise-card ${isOpen ? 'open' : 'closed'}`}>
        <header
          className="exercise-card-header"
          onClick={() => setIsOpen(!isOpen)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsOpen(!isOpen)
            }
          }}
          aria-expanded={isOpen}
        >
          <div className="exercise-header-thumb">
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
              <div className="exercise-thumb-fallback">
                <ImageOff size={18} />
              </div>
            )}
          </div>

          <div className="exercise-header-info">
            <div className="exercise-title-row">
              <h3 className="exercise-header-title">{exercise.name}</h3>
            </div>

            <div className="exercise-header-meta">
              <span className={`exercise-progress-badge ${isAllCompleted ? 'all-done' : ''}`}>
                {completedCount}/{setsCount}
              </span>
              {exercise.body_part && (
                <span className="exercise-bodypart-badge">{exercise.body_part}</span>
              )}
              <button
                type="button"
                className="exercise-technique-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsTechniqueModalOpen(true)
                }}
                aria-label={`Ver técnica explicativa de ${exercise.name}`}
                title="Consultar técnica de ejecución"
              >
                <Info size={13} />
                <span>Ver técnica</span>
              </button>
            </div>
          </div>

          <div className="exercise-header-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="exercise-delete-btn"
              onClick={() => onDeleteExerciseRequest(exercise)}
              aria-label={`Eliminar ${exercise.name} de la rutina`}
              title="Eliminar ejercicio de la rutina"
            >
              <Trash2 size={16} />
            </button>
            <button
              type="button"
              className="exercise-toggle-btn"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Colapsar series' : 'Expandir series'}
            >
              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </header>

        <div className="exercise-card-progress-bar" aria-hidden="true">
          <div
            className="exercise-card-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {isOpen && (
          <div className="exercise-sets-accordion-content">
            <div className="sets-list">
              {exercise.sets.map((set) => (
                <SetRow
                  key={set.id}
                  set={set}
                  routineId={routineId}
                  exerciseId={exercise.id}
                  isOnlySet={setsCount <= 1}
                  onRemoveSet={(setId) =>
                    removeSetFromExercise(routineId, exercise.id, setId)
                  }
                  onToggleCompleted={(setId) =>
                    toggleSetCompleted(routineId, exercise.id, setId)
                  }
                />
              ))}
            </div>

            <button
              type="button"
              className="add-set-btn"
              onClick={() => addSetToExercise(routineId, exercise.id)}
              aria-label={`Agregar serie a ${exercise.name}`}
            >
              <Plus size={15} />
              <span>+ Agregar serie</span>
            </button>
          </div>
        )}
      </article>

      <ExerciseTechniqueModal
        exercise={exercise}
        isOpen={isTechniqueModalOpen}
        onClose={() => setIsTechniqueModalOpen(false)}
      />
    </>
  )
}
