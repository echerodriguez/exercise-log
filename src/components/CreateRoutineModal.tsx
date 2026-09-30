'use client'

import React, { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'

interface CreateRoutineModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string) => void
}

export function CreateRoutineModal({ isOpen, onClose, onCreate }: CreateRoutineModalProps) {
  const [name, setName] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setTouched(false)
    }
  }, [isOpen])

  useEffect(() => {
    let cleanup = () => {}
    if (isOpen) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      cleanup = () => window.removeEventListener('keydown', handleKeyDown)
    }
    return cleanup
  }, [isOpen, onClose])

  const trimmed = name.trim()
  const isInvalid = touched && !trimmed

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!trimmed) return
    onCreate(trimmed)
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
        aria-labelledby="create-routine-title"
      >
        <div className="routine-modal-card">
          <header className="routine-modal-header">
            <div>
              <h2 id="create-routine-title" className="routine-modal-title">
                Nueva Rutina
              </h2>
              <p className="routine-modal-subtitle">
                Elige un nombre para organizar tus ejercicios
              </p>
            </div>
            <button
              type="button"
              className="routine-modal-close-btn"
              onClick={onClose}
              aria-label="Cerrar modal de creación"
            >
              <X size={18} />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="routine-modal-body">
            <div className="routine-form-group">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (!touched) setTouched(true)
                }}
                onBlur={() => setTouched(true)}
                placeholder="Ej. Espalda y Bíceps, Piernas Hipertrofia..."
                className={`routine-modal-input ${isInvalid ? 'input-error' : ''}`}
                autoFocus
                required
              />
              {isInvalid && (
                <span className="routine-input-validation" role="alert">
                  Ingresa un nombre para la rutina (no puede estar vacío).
                </span>
              )}
            </div>

            <div className="routine-modal-actions">
              <button
                type="button"
                className="routine-btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="routine-btn-primary"
                disabled={!trimmed}
              >
                <Plus size={16} />
                <span>Crear Rutina</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return content
}
