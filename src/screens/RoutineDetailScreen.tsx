'use client'

import React, { useState } from 'react'
import { ArrowLeft, CheckCircle, Dumbbell, Plus, Trash2, X } from 'lucide-react'
import { CollapsibleExerciseCard } from '../components/CollapsibleExerciseCard'
import { useHistory } from '../context/HistoryContext'
import { useRoutines, type Routine, type RoutineExercise } from '../context/RoutinesContext'

interface RoutineDetailScreenProps {
  routineId: string
  onBack: () => void
  onGoToSearch?: () => void
  onGoToHistory?: () => void
}

export function RoutineDetailScreen({
  routineId,
  onBack,
  onGoToSearch,
  onGoToHistory,
}: RoutineDetailScreenProps) {
  const { routines, removeExerciseFromRoutine, showToast } = useRoutines()
  const { completeRoutine } = useHistory()
  const [exerciseToDelete, setExerciseToDelete] = useState<RoutineExercise | null>(null)
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)

  const routine: Routine | undefined = routines.find((r) => r.id === routineId)

  const handleConfirmDelete = () => {
    if (exerciseToDelete && routine) {
      removeExerciseFromRoutine(routine.id, exerciseToDelete.id)
      setExerciseToDelete(null)
    }
  }

  const handleConfirmFinish = () => {
    if (routine) {
      completeRoutine(routine)
      setIsFinishModalOpen(false)
      showToast(`¡Rutina "${routine.name}" finalizada y registrada!`)
      if (onGoToHistory) {
        onGoToHistory()
      }
    }
  }

  let content: React.ReactNode = null

  if (!routine) {
    content = (
      <main className="app-shell">
        <header className="app-header">
          <button
            type="button"
            className="icon-button back-btn"
            onClick={onBack}
            aria-label="Volver a la lista de rutinas"
          >
            <ArrowLeft size={19} />
          </button>
          <div>
            <p className="eyebrow">RUTINAS</p>
            <h1>Rutina no encontrada</h1>
          </div>
        </header>
        <div className="state-box">
          <p className="state-icon">!</p>
          <h3>La rutina ya no está disponible</h3>
          <span>Es posible que haya sido eliminada o que el identificador sea inválido.</span>
          <button type="button" className="retry-button" onClick={onBack}>
            Volver a Rutinas
          </button>
        </div>
      </main>
    )
  } else {
    const exerciseCount = routine.exercises.length
    const totalSetsCount = routine.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
    const completedSetsCount = routine.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
      0
    )
    const overallProgress = totalSetsCount > 0 ? (completedSetsCount / totalSetsCount) * 100 : 0

    content = (
      <main className="app-shell">
        <header className="app-header routine-detail-header">
          <button
            type="button"
            className="icon-button back-btn"
            onClick={onBack}
            aria-label="Volver a la lista de rutinas"
          >
            <ArrowLeft size={19} />
          </button>
          <div className="routine-header-titles">
            <p className="eyebrow">DETALLE DE RUTINA</p>
            <h1>{routine.name}</h1>
          </div>
          <span className="routine-count-badge" aria-label={`${exerciseCount} ejercicios en total`}>
            {exerciseCount} {exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}
          </span>
        </header>

        {exerciseCount > 0 && (
          <div className="overall-routine-progress-box" aria-label="Progreso general de la rutina">
            <div className="overall-progress-info">
              <span className="overall-progress-label">Progreso general</span>
              <span className="overall-progress-stats">
                {completedSetsCount}/{totalSetsCount} ({Math.round(overallProgress)}%)
              </span>
            </div>
            <div className="overall-progress-track" aria-hidden="true">
              <div
                className="overall-progress-fill"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}

        <section className="routine-detail-body" aria-label="Ejercicios de la rutina">
          {exerciseCount === 0 ? (
            <div className="state-box routine-detail-empty">
              <div className="state-icon">
                <Dumbbell size={22} />
              </div>
              <h3>No hay ejercicios aún</h3>
              <span>
                Esta rutina está vacía. Ve al catálogo de ejercicios para seleccionar y agregar los que
                desees.
              </span>
              {onGoToSearch && (
                <button
                  type="button"
                  className="retry-button"
                  onClick={onGoToSearch}
                >
                  <Plus size={16} /> Explorar catálogo de ejercicios
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="routine-exercises-list">
                {routine.exercises.map((exercise) => (
                  <CollapsibleExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    routineId={routine.id}
                    onDeleteExerciseRequest={(ex) => setExerciseToDelete(ex)}
                  />
                ))}
              </div>

              <div className="finish-routine-container">
                <button
                  type="button"
                  className="finish-routine-btn"
                  onClick={() => setIsFinishModalOpen(true)}
                  aria-label="Terminar y registrar rutina en historial"
                >
                  <CheckCircle size={18} />
                  <span>Terminar Rutina</span>
                </button>
              </div>
            </>
          )}
        </section>

        {exerciseToDelete && (
          <div
            className="modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setExerciseToDelete(null)
            }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
          >
            <div className="modal-card confirm-dialog-card">
              <header className="modal-header">
                <div className="modal-kicker">
                  <Trash2 size={14} />
                  <span>Confirmación</span>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setExerciseToDelete(null)}
                  aria-label="Cancelar eliminación"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="confirm-dialog-content">
                <h2 id="confirm-delete-title" className="modal-title confirm-title">
                  ¿Quitar ejercicio?
                </h2>
                <p className="confirm-text">
                  ¿Deseas quitar <strong>{exerciseToDelete.name}</strong> de la rutina{' '}
                  <strong>{routine.name}</strong>?
                </p>

                <div className="confirm-actions-row">
                  <button
                    type="button"
                    className="dialog-cancel-btn"
                    onClick={() => setExerciseToDelete(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="confirm-danger-btn"
                    onClick={handleConfirmDelete}
                  >
                    <Trash2 size={15} /> Quitar ejercicio
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isFinishModalOpen && (
          <div
            className="modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsFinishModalOpen(false)
            }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="finish-routine-modal-title"
          >
            <div className="modal-card confirm-dialog-card">
              <header className="modal-header">
                <div className="modal-kicker">
                  <CheckCircle size={14} />
                  <span>Finalizar Rutina</span>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setIsFinishModalOpen(false)}
                  aria-label="Cerrar modal"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="confirm-dialog-content">
                <h2 id="finish-routine-modal-title" className="modal-title confirm-title">
                  ¿Finalizar y registrar rutina?
                </h2>
                <p className="confirm-text">
                  ¿Deseas finalizar y registrar la rutina de hoy? Se guardará un registro de{' '}
                  <strong>{routine.name}</strong> ({routine.exercises.length} ejercicios) en tu
                  historial de entrenamientos.
                </p>

                <div className="confirm-actions-row">
                  <button
                    type="button"
                    className="dialog-cancel-btn"
                    onClick={() => setIsFinishModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="confirm-success-btn"
                    onClick={handleConfirmFinish}
                  >
                    <CheckCircle size={16} />
                    <span>Sí, finalizar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    )
  }

  return content
}
