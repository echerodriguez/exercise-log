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
  const { routines, removeExerciseFromRoutine, resetRoutineCompletedSets, showToast } = useRoutines()
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

  const handleConfirmFinish = async () => {
    if (!routine) return
    await completeRoutine(routine)
    resetRoutineCompletedSets(routine.id)
    setIsFinishModalOpen(false)
    showToast(`¡Rutina "${routine.name}" finalizada y registrada!`)
    if (onGoToHistory) {
      onGoToHistory()
    }
  }

  if (!routine) {
    return (
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
  }

  const exerciseCount = routine.exercises.length
  const totalSetsCount = routine.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
  const completedSetsCount = routine.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  )
  const overallProgress = totalSetsCount > 0 ? (completedSetsCount / totalSetsCount) * 100 : 0

  return (
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
          {exerciseCount} ejercicio{exerciseCount === 1 ? '' : 's'}
        </span>
      </header>

      {/* Barra de progreso global del entrenamiento */}
      {totalSetsCount > 0 && (
        <div className="routine-overall-progress-card">
          <div className="overall-progress-header">
            <span className="overall-progress-label">Progreso del entrenamiento</span>
            <span className="overall-progress-fraction">
              {completedSetsCount} / {totalSetsCount} ({Math.round(overallProgress)}%)
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

      {routine.exercises.length === 0 ? (
        <section className="state-box routine-empty-box" aria-label="Rutina vacía">
          <div className="state-icon">
            <Dumbbell size={22} />
          </div>
          <h3>Esta rutina no tiene ejercicios</h3>
          <span>Agrega ejercicios desde la pestaña Explorar para comenzar a registrar series.</span>
          {onGoToSearch && (
            <button
              type="button"
              className="retry-button"
              onClick={onGoToSearch}
              style={{ marginTop: '16px' }}
            >
              <Plus size={16} /> Agregar ejercicios
            </button>
          )}
        </section>
      ) : (
        <section className="routine-exercises-list" aria-label="Lista de ejercicios en esta rutina">
          {routine.exercises.map((exercise) => (
            <CollapsibleExerciseCard
              key={exercise.id}
              routineId={routine.id}
              exercise={exercise}
              onDeleteExerciseRequest={(ex) => setExerciseToDelete(ex)}
            />
          ))}

          {/* Botón flotante/destacado para finalizar la rutina */}
          <div className="finish-routine-container">
            <button
              type="button"
              className="finish-routine-btn"
              onClick={() => setIsFinishModalOpen(true)}
              disabled={completedSetsCount === 0}
              title={
                completedSetsCount === 0
                  ? 'Completa al menos una serie para finalizar el entrenamiento'
                  : 'Registrar entrenamiento en tu historial'
              }
            >
              <CheckCircle size={18} />
              <span>Finalizar entrenamiento ({completedSetsCount}/{totalSetsCount})</span>
            </button>
          </div>
        </section>
      )}

      {/* Modal de confirmación para eliminar ejercicio */}
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
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </header>

            <div className="confirm-dialog-content">
              <h2 id="confirm-delete-title" className="modal-title confirm-title">
                ¿Eliminar ejercicio?
              </h2>
              <p className="confirm-text">
                ¿Seguro que deseas eliminar <strong>{exerciseToDelete.name}</strong> de esta
                rutina? Se perderán todas sus series configuradas.
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
                  <Trash2 size={15} /> Eliminar ejercicio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para finalizar rutina */}
      {isFinishModalOpen && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFinishModalOpen(false)
          }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-finish-title"
        >
          <div className="modal-card confirm-dialog-card">
            <header className="modal-header">
              <div className="modal-kicker">
                <CheckCircle size={14} />
                <span>Finalizar sesión</span>
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
              <h2 id="confirm-finish-title" className="modal-title confirm-title">
                ¿Finalizar entrenamiento?
              </h2>
              <p className="confirm-text">
                Has completado <strong>{completedSetsCount}</strong> de <strong>{totalSetsCount}</strong> series
                programadas para <strong>{routine.name}</strong>. Esta sesión quedará registrada en tu
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
