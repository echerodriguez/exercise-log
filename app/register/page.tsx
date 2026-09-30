'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Dumbbell, Loader2, Lock, Mail, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nombre: name.trim(),
            name: name.trim(),
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message || 'Error al crear la cuenta.')
        return
      }

      if (data.session) {
        router.push('/')
        return
      }

      setSuccess(
        '¡Registro completado! Si tu proyecto tiene activada la confirmación por email, revisa tu bandeja de entrada.'
      )
    } catch {
      setError('Ocurrió un error inesperado al intentar registrarte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page-layout">
      <div className="auth-form-container">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="auth-brand-badge">
            <Dumbbell size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#14201a]">Exercise Log</h1>
            <p className="auth-eyebrow-text">
              Crea tu cuenta de atleta
            </p>
          </div>
        </div>

        {/* Register Card */}
        <Card className="auth-surface-card">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xl font-extrabold text-[#14201a]">
              Crear Cuenta
            </CardTitle>
            <CardDescription className="text-xs text-[#6e8076]">
              Registra tus datos para guardar tus rutinas y progreso en la nube
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleRegister}>
            <CardContent className="p-6 pt-4 flex flex-col gap-4">
              {error && (
                <div className="auth-alert-error" role="alert">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="auth-alert-success" role="status">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  <span>{success}</span>
                </div>
              )}

              {/* Nombre completo */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="register-name" className="auth-field-label">
                  <User size={13} className="text-[#6e8076]" />
                  <span>Nombre completo</span>
                </label>
                <Input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ej. Carlos Mendoza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Email field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="register-email" className="auth-field-label">
                  <Mail size={13} className="text-[#6e8076]" />
                  <span>Correo Electrónico</span>
                </label>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="register-password" className="auth-field-label">
                  <Lock size={13} className="text-[#6e8076]" />
                  <span>Contraseña</span>
                </label>
                <Input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Confirm Password field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="register-confirm-password" className="auth-field-label">
                  <Lock size={13} className="text-[#6e8076]" />
                  <span>Confirmar Contraseña</span>
                </label>
                <Input
                  id="register-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {/* Submit button */}
              <Button type="submit" disabled={loading} className="auth-primary-btn">
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creando cuenta...</span>
                  </>
                ) : (
                  <span>Registrarme</span>
                )}
              </Button>
            </CardContent>

            <CardFooter className="auth-card-footer-text">
              <span>¿Ya tienes una cuenta?</span>
              <Link
                href="/login"
                className="ml-1.5 font-bold text-[#1f5844] hover:underline"
              >
                Inicia sesión aquí
              </Link>
            </CardFooter>
          </form>
        </Card>

        {/* Back to app link */}
        <div className="text-center">
          <Link
            href="/"
            className="auth-back-link"
          >
            ← Volver a la aplicación
          </Link>
        </div>
      </div>
    </main>
  )
}
