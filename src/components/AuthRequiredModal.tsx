'use client'

import React from 'react'
import Link from 'next/link'
import { Dumbbell, LogIn, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AuthRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
}

export function AuthRequiredModal({
  isOpen,
  onClose,
  title = 'Inicia sesión para crear rutinas',
  description = 'Para organizar tus entrenamientos y sincronizar tus rutinas en todos tus dispositivos, necesitas tener una cuenta activa.',
}: AuthRequiredModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="modal-backdrop modal-backdrop-top"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="auth-required-title"
    >
      <div className="modal-card confirm-dialog-card">
        <header className="modal-header">
          <div className="modal-kicker">
            <Dumbbell size={14} />
            <span>Acceso Requerido</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar aviso"
          >
            <X size={18} />
          </button>
        </header>

        <div className="confirm-dialog-content">
          <div className="modal-auth-icon-badge">
            <LogIn size={24} strokeWidth={2.5} />
          </div>

          <h2 id="auth-required-title" className="modal-title confirm-title text-center">
            {title}
          </h2>
          <p className="confirm-text text-center">
            {description}
          </p>

          <div className="flex flex-col gap-2.5 mt-4 w-full">
            <Link href="/login" className="w-full" onClick={onClose}>
              <Button className="auth-primary-btn">
                <LogIn size={16} />
                <span>Iniciar Sesión</span>
              </Button>
            </Link>
            <Link href="/register" className="w-full" onClick={onClose}>
              <Button variant="outline" className="auth-secondary-btn">
                <UserPlus size={16} />
                <span>Crear Cuenta Nueva</span>
              </Button>
            </Link>
            <button
              type="button"
              className="dialog-cancel-btn w-full mt-1 text-xs"
              onClick={onClose}
            >
              Continuar explorando
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
