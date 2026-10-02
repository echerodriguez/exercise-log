'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  Mail,
  Pencil,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
} from 'lucide-react'
import { HistoryScreen } from './HistoryScreen'
import { EditProfileModal } from '../components/EditProfileModal'
import { useAuth } from '../hooks/useAuth'
import { useHistory } from '../context/HistoryContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { checkProfileUpdateCooldown, MOCK_USER_PROFILE, type UserProfile } from '../services/profile'

export { MOCK_USER_PROFILE, type UserProfile }

export interface ProfileScreenProps {
  initialTab?: 'info' | 'history'
  onGoToRoutines?: () => void
}

function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return 'No especificada'
  const parts = dateStr.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return dateStr
}

function formatLastUpdateDisplay(isoStr?: string | null): string {
  if (!isoStr) return 'Nunca'
  const date = new Date(isoStr)
  if (isNaN(date.getTime())) return 'Nunca'
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ProfileScreen({
  initialTab = 'info',
  onGoToRoutines,
}: ProfileScreenProps) {
  const { user, profile, isAuthenticated, isLoading: authLoading, signOut, refreshProfile } = useAuth()
  const { logs } = useHistory()
  const [activeTab, setActiveTab] = useState<'info' | 'history'>(initialTab)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const displayName = profile?.nombre || user?.user_metadata?.nombre || user?.user_metadata?.name || 'Atleta'
  const displayEmail = profile?.email || user?.email || ''
  const displayBirthDate = profile?.fecha_nacimiento
  const lastProfileUpdate = profile?.last_profile_update
  const isAdmin = profile?.role === 'admin'

  const totalWorkouts = logs.length
  const totalExercisesCompleted = logs.reduce((acc, l) => acc + l.totalExercises, 0)
  const cooldownStatus = checkProfileUpdateCooldown(lastProfileUpdate)

  // Early return: Vista para usuarios no autenticados
  if (!isAuthenticated && !authLoading) {
    return (
      <main className="app-shell profile-shell">
        <header className="app-header mb-4">
          <div className="brand-mark history-brand-mark">
            <User size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="eyebrow">MI CUENTA</p>
            <h1>Perfil</h1>
          </div>
        </header>

        <Card className="profile-empty-state-card">
          <div className="profile-empty-icon-wrap">
            <User size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="profile-empty-title">
              Debes iniciar sesión para ver tu perfil e historial
            </h2>
            <p className="profile-empty-desc">
              Accede con tu cuenta de Exercise Log para consultar tu información personal, tu mapa de actividad y tus registros de entrenamiento.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 w-full mt-2">
            <Link href="/login" className="w-full">
              <Button className="auth-primary-btn">
                <LogIn size={16} />
                <span>Iniciar Sesión</span>
              </Button>
            </Link>
            <Link href="/register" className="w-full">
              <Button variant="outline" className="auth-secondary-btn">
                <UserPlus size={16} />
                <span>Registrarme</span>
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    )
  }

  // Vista principal: Usuario autenticado con pestañas
  return (
    <main className="app-shell profile-shell">
      <header className="app-header">
        <div className="brand-mark history-brand-mark">
          <User size={22} strokeWidth={2.5} />
        </div>
        <div>
          <p className="eyebrow">MI CUENTA</p>
          <h1>Perfil</h1>
        </div>
      </header>

      <Tabs
        defaultValue="info"
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'info' | 'history')}
        className="w-full flex flex-col gap-4"
      >
        <TabsList className="w-full grid grid-cols-2 p-1 bg-[#eef4ef] rounded-xl border border-[#dce6e0] h-11 gap-1">
          <TabsTrigger
            value="info"
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg text-sm font-medium py-2 transition-all cursor-pointer bg-transparent shadow-none border-0 select-none",
              "text-[#516b5c]",
              "data-[state=active]:bg-[#1f5844] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-xs",
              "data-active:bg-[#1f5844] data-active:text-white data-active:font-bold data-active:shadow-xs",
              activeTab === 'info' && "bg-[#1f5844] text-white font-bold shadow-xs"
            )}
          >
            <User size={15} strokeWidth={activeTab === 'info' ? 2.5 : 2} />
            <span className="tracking-tight text-sm">Información</span>
          </TabsTrigger>

          <TabsTrigger
            value="history"
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg text-sm font-medium py-2 transition-all cursor-pointer bg-transparent shadow-none border-0 select-none",
              "text-[#516b5c]",
              "data-[state=active]:bg-[#1f5844] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-xs",
              "data-active:bg-[#1f5844] data-active:text-white data-active:font-bold data-active:shadow-xs",
              activeTab === 'history' && "bg-[#1f5844] text-white font-bold shadow-xs"
            )}
          >
            <Calendar size={15} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
            <span className="tracking-tight text-sm">Historial</span>
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* SOLAPA 1: INFO DE USUARIO                                    */}
        {/* ============================================================ */}
        <TabsContent value="info" className="flex flex-col gap-4 outline-none">
          {/* Tarjeta de Presentación y Avatar */}
          <Card className="profile-surface-card overflow-hidden">
            <CardContent className="p-5 flex flex-col items-center text-center gap-3">
              <div className="relative">
                <Avatar className="size-20 border-2 border-[#1f5844]/20 shadow-xs">
                  <AvatarImage
                    src={MOCK_USER_PROFILE.avatarUrl}
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-[#eef4ef] text-[#1f5844] text-xl font-bold">
                    <User size={32} />
                  </AvatarFallback>
                </Avatar>
                <span
                  className="profile-avatar-status-badge"
                  title="Usuario activo"
                >
                  <CheckCircle2 size={12} />
                </span>
              </div>

              <div>
                <h2 className="profile-user-name">
                  {displayName}
                </h2>
              </div>

              <div className="profile-role-chip">
                {isAdmin ? (
                  <>
                    <Shield size={13} className="text-[#1f5844]" />
                    <span>Administrador</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>Atleta</span>
                  </>
                )}
              </div>

              {/* Botón para editar perfil */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
                className="profile-edit-trigger-btn"
              >
                <Pencil size={15} />
                <span>Editar Datos</span>
              </Button>

              {!cooldownStatus.canUpdate && (
                <p className="profile-cooldown-text">
                  <Clock size={11} />
                  <span>Actualizado hoy (1 cambio permitido cada 24 horas)</span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tarjeta de Datos Personales Detallados */}
          <Card className="profile-surface-card">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="profile-card-title">
                <ShieldCheck size={18} className="text-[#1f5844]" />
                <span>Datos del Perfil</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#6e8076]">
                Información registrada en tu cuenta
              </CardDescription>
            </CardHeader>

            <CardContent className="profile-info-list">
              <div className="profile-info-row">
                <div className="flex items-center gap-3">
                  <div className="profile-info-icon-badge">
                    <User size={18} />
                  </div>
                  <div>
                    <span className="profile-info-key">
                      Nombre
                    </span>
                    <span className="profile-info-val">
                      {displayName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-info-row">
                <div className="flex items-center gap-3">
                  <div className="profile-info-icon-badge">
                    <Mail size={18} />
                  </div>
                  <div>
                    <span className="profile-info-key">
                      Correo electrónico
                    </span>
                    <span className="profile-info-val break-all">
                      {displayEmail}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-info-row">
                <div className="flex items-center gap-3">
                  <div className="profile-info-icon-badge">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="profile-info-key">
                      Fecha de nacimiento
                    </span>
                    <span className="profile-info-val">
                      {formatDateDisplay(displayBirthDate)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta de Gestión de Sesión */}
          <Card className="profile-surface-card">
            <CardContent className="p-4 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await signOut()
                }}
                className="auth-danger-btn"
              >
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* SOLAPA 2: HISTORIAL (Componente HistoryScreen)                */}
        {/* ============================================================ */}
        <TabsContent value="history" className="flex flex-col gap-4 outline-none">
          <HistoryScreen onGoToRoutines={onGoToRoutines} />
        </TabsContent>
      </Tabs>

      {/* Modal de Edición de Perfil con Restricción de 24 horas */}
      {user && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentName={displayName}
          currentBirthDate={displayBirthDate}
          lastProfileUpdate={lastProfileUpdate}
          userId={user.id}
          onProfileUpdated={async () => {
            await refreshProfile()
          }}
        />
      )}
    </main>
  )
}
