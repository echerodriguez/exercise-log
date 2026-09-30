'use client'

import React, { useState } from 'react'
import { AlertCircle, Calendar, CheckCircle2, Clock, Loader2, Save, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { checkProfileUpdateCooldown, type UpdateCooldownStatus } from '../services/profile'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  currentName: string
  currentBirthDate?: string | null
  lastProfileUpdate?: string | null
  userId: string
  onProfileUpdated: () => Promise<void> | void
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentName,
  currentBirthDate,
  lastProfileUpdate,
  userId,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [name, setName] = useState(currentName)
  const [birthDate, setBirthDate] = useState(currentBirthDate || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const cooldownStatus: UpdateCooldownStatus = checkProfileUpdateCooldown(lastProfileUpdate)

  const handleSave = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name.trim()) {
      setError('El nombre no puede estar vacío.')
      return
    }

    if (!cooldownStatus.canUpdate) {
      setError('Solo puedes actualizar tu información una vez al día.')
      return
    }

    setLoading(true)
    try {
      const nowIso = new Date().toISOString()
      let { error: updateError } = await supabase
        .from('profiles')
        .update({
          nombre: name.trim(),
          fecha_nacimiento: birthDate ? birthDate : null,
          last_profile_update: nowIso,
        })
        .eq('id', userId)

      // Fallback defensivo si la columna aún no existe o no se ha recargado el schema cache en Supabase
      if (updateError && updateError.message?.toLowerCase().includes('last_profile_update')) {
        const retryRes = await supabase
          .from('profiles')
          .update({
            nombre: name.trim(),
            fecha_nacimiento: birthDate ? birthDate : null,
          })
          .eq('id', userId)
        updateError = retryRes.error
      }

      if (updateError) {
        setError(updateError.message || 'Error al actualizar el perfil.')
        return
      }

      setSuccess('Perfil actualizado correctamente.')
      await onProfileUpdated()
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch {
      setError('Ocurrió un error inesperado al guardar los cambios.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="modal-backdrop modal-backdrop-top"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
    >
      <div className="modal-card confirm-dialog-card max-w-md w-full">
        <header className="modal-header">
          <div className="modal-kicker">
            <User size={14} />
            <span>Editar Información</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal de edición"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSave} className="flex flex-col gap-4 p-5 pt-3">
          <div>
            <h2 id="edit-profile-title" className="text-lg font-extrabold text-[#14201a]">
              Editar Perfil
            </h2>
            <p className="text-xs text-[#6e8076] mt-0.5">
              Modifica tu nombre público y fecha de nacimiento.
            </p>
          </div>

          {/* Aviso de restricción de 24 horas */}
          {!cooldownStatus.canUpdate ? (
            <div className="modal-alert-cooldown" role="alert">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle size={16} className="shrink-0 text-red-600" />
                <span>Solo puedes actualizar tu información una vez al día</span>
              </div>
              <p className="modal-cooldown-countdown">
                <Clock size={12} />
                <span>
                  Próxima actualización en: {cooldownStatus.remainingHours}h {cooldownStatus.remainingMinutes}m
                </span>
              </p>
            </div>
          ) : (
            <div className="modal-notice-banner">
              <Clock size={14} className="shrink-0" />
              <span>
                Recuerda: Solo está permitido actualizar estos datos una vez cada 24 horas.
              </span>
            </div>
          )}

          {error && (
            <div className="auth-alert-error" role="alert">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="auth-alert-success" role="status">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Input Nombre */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-profile-name" className="flex items-center gap-1.5">
              <User size={13} className="text-[#6e8076]" />
              <span>Nombre completo</span>
            </Label>
            <Input
              id="edit-profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              disabled={!cooldownStatus.canUpdate || loading}
              required
            />
          </div>

          {/* Input Fecha de Nacimiento */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-profile-birthdate" className="flex items-center gap-1.5">
              <Calendar size={13} className="text-[#6e8076]" />
              <span>Fecha de nacimiento</span>
            </Label>
            <Input
              id="edit-profile-birthdate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              disabled={!cooldownStatus.canUpdate || loading}
            />
          </div>

          {/* Botones de acción */}
          <div className="modal-actions-footer">
            <Button
              type="submit"
              disabled={!cooldownStatus.canUpdate || loading}
              className="auth-primary-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Guardando cambios...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Guardar Cambios</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="auth-secondary-btn h-9"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
