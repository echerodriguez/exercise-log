'use client'

import React, { useState } from 'react'
import { Dumbbell, FolderHeart, Plus, Trash2, X } from 'lucide-react'
import { AuthRequiredModal } from '../components/AuthRequiredModal'
import { CreateRoutineModal } from '../components/CreateRoutineModal'
import { RoutineDetailScreen } from './RoutineDetailScreen'
import { useAuth } from '../hooks/useAuth'
import { useRoutines, type Routine } from '../context/RoutinesContext'

interface RoutinesScreenProps {
  onGoToSearch?: () => void
  onGoToHistory?: () => void
}

export function RoutinesScreen({ onGoToSearch, onGoToHistory }: RoutinesScreenProps) {
  const { routines, createRoutine, deleteRoutine } = useRoutines()
  const { isAuthenticated } = useAuth()
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null)

  const handleOpenCreateRoutine = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
    } else {
      setIsCreateModalOpen(true)
    }
  }

  if (selectedRoutineId) {
    return (
      <RoutineDetailScreen
        routineId={selectedRoutineId}
        onBack={() => setSelectedRoutineId(null)}
        onGoToSearch={onGoToSearch}
        onGoToHistory={onGoToHistory}
      />
    )
  }

  return (
    <main className="app-shell">
        <header className="app-header">
          <div className="brand-mark">
            <FolderHeart size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="eyebrow">ENTRENAMIENTO</p>
            <h1>Rutinas</h1>
          </div>
          <button
            type="button"
            className="create-routine-top-btn"
            onClick={handleOpenCreateRoutine}
            aria-label="Crear nueva rutina"
          >
            <Plus size={16} />
            <span>Nueva Rutina</span>
          </button>
        </header>

        <section className="routines-content-section" aria-label="Lista de rutinas">
          {routines.length === 0 ? (
            <div className="state-box routines-empty-box">
              <div className="state-icon">
                <Dumbbell size={20} />
              </div>
              <h3>No tienes rutinas todavía</h3>
              <span>
                Crea tu primera rutina para organizar tus ejercicios favoritos y entrenar a tu ritmo.
              </span>
              <div className="empty-actions-row">
                <button
                  type="button"
                  className="retry-button"
                  onClick={handleOpenCreateRoutine}
                >
                  <Plus size={16} /> Crear mi primera rutina
                </button>
                {onGoToSearch && (
                  <button
                    type="button"
                    className="secondary-outline-button"
                    onClick={onGoToSearch}
                  >
                    Explorar catálogo
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="routines-list">
              {routines.map((routine) => {
                const count = routine.exercises.length

                return (
                  <article
                    key={routine.id}
                    className="routine-card routine-card-clickable"
                    onClick={() => setSelectedRoutineId(routine.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedRoutineId(routine.id)
                      }
                    }}
                    aria-label={`Abrir detalle de rutina ${routine.name}`}
                  >
                    <div className="routine-card-main">
                      <div className="routine-header-info">
                        <div className="routine-icon-badge">
                          <Dumbbell size={22} />
                        </div>
                        <div className="routine-title-box">
                          <h2 className="routine-name">{routine.name}</h2>
                          <span className="routine-pill-badge">
                            {count} ejercicio{count === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>

                      <div
                        className="routine-header-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="delete-routine-btn"
                          onClick={() => setRoutineToDelete(routine)}
                          aria-label={`Eliminar rutina ${routine.name}`}
                          title="Eliminar rutina"
                        >
                          <Trash2 size={16} />
                        </button>
                        <span className="card-arrow" aria-hidden="true">
                          ›
                        </span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* Modal Crear Rutina Modular Rediseñado */}
        <CreateRoutineModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={async (name) => {
            const created = await createRoutine(name)
            setSelectedRoutineId(created.id)
          }}
        />

        {/* Modal de Aviso de Autenticación Requerida */}
        <AuthRequiredModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          title="Inicia sesión para crear rutinas"
          description="Para poder crear y sincronizar tus rutinas en la nube necesitas ingresar a tu cuenta de Exercise Log."
        />

        {routineToDelete && (
          <div
            className="modal-backdrop modal-backdrop-top"
            onClick={(e) => {
              if (e.target === e.currentTarget) setRoutineToDelete(null)
            }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-routine-delete-title"
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
                  onClick={() => setRoutineToDelete(null)}
                  aria-label="Cancelar eliminación"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="confirm-dialog-content">
                <h2 id="confirm-routine-delete-title" className="modal-title confirm-title">
                  ¿Eliminar rutina?
                </h2>
                <p className="confirm-text">
                  ¿Seguro que deseas eliminar la rutina <strong>{routineToDelete.name}</strong>? Se
                  perderán todos los ejercicios guardados en ella.
                </p>

                <div className="confirm-actions-row">
                  <button
                    type="button"
                    className="dialog-cancel-btn"
                    onClick={() => setRoutineToDelete(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="confirm-danger-btn"
                    onClick={async () => {
                      await deleteRoutine(routineToDelete.id)
                      setRoutineToDelete(null)
                    }}
                  >
                    <Trash2 size={15} /> Eliminar rutina
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
  )
}
