'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Dumbbell, Loader2, Lock, Mail } from 'lucide-react'
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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError(signInError.message || 'Credenciales inválidas o error de inicio de sesión.')
        return
      }

      if (data.session) {
        router.push('/')
      }
    } catch {
      setError('Ocurrió un error inesperado al intentar iniciar sesión.')
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
              Control y registro de entrenamientos
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="auth-surface-card">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xl font-extrabold text-[#14201a]">
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-xs text-[#6e8076]">
              Ingresa tus credenciales para acceder a tus rutinas e historial
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="p-6 pt-4 flex flex-col gap-4">
              {error && (
                <div className="auth-alert-error" role="alert">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="auth-field-label">
                  <Mail size={13} className="text-[#6e8076]" />
                  <span>Correo Electrónico</span>
                </label>
                <Input
                  id="email"
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
                <label htmlFor="password" className="auth-field-label">
                  <Lock size={13} className="text-[#6e8076]" />
                  <span>Contraseña</span>
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Submit button */}
              <Button type="submit" disabled={loading} className="auth-primary-btn">
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <span>Ingresar</span>
                )}
              </Button>
            </CardContent>

            <CardFooter className="auth-card-footer-text">
              <span>¿No tienes una cuenta aún?</span>
              <Link
                href="/register"
                className="ml-1.5 font-bold text-[#1f5844] hover:underline"
              >
                Regístrate aquí
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
