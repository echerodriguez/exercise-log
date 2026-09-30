'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  Info,
  LogIn,
  LogOut,
  Mail,
  Pencil,
  Plus,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  UserPlus,
  X,
} from 'lucide-react'
import { ActivityHeatmap, QUARTER_MONTHS } from '../components/ActivityHeatmap'
import { EditProfileModal } from '../components/EditProfileModal'
import { EditWorkoutLogModal } from '../components/EditWorkoutLogModal'
import { ManualWorkoutModal } from '../components/ManualWorkoutModal'
import { WorkoutLogAccordionItem } from '../components/WorkoutLogAccordionItem'
import {
  formatDateKey,
  formatReadableDate,
  useHistory,
  type WorkoutLog,
} from '../context/HistoryContext'
import { useAuth } from '../hooks/useAuth'
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

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
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
  const [activeTab, setActiveTab] = useState<'info' | 'history'>(initialTab)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // --- LÓGICA DE HISTORIAL ---
  const { logs, deleteWorkoutLog, getLogsByDate } = useHistory()

  const today = useMemo(() => new Date(), [])
  const currentYear = today.getFullYear()
  const currentQuarter = (Math.floor(today.getMonth() / 3) + 1) as 1 | 2 | 3 | 4

  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(currentQuarter)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<WorkoutLog | null>(null)
  const [logToDelete, setLogToDelete] = useState<WorkoutLog | null>(null)

  // Rango de fechas para el trimestre activo
  const quarterDateRange = useMemo(() => {
    const qInfo = QUARTER_MONTHS[selectedQuarter]
    const startMonth = qInfo.startMonth
    const startDate = new Date(selectedYear, startMonth, 1)
    const endDate = new Date(selectedYear, startMonth + 3, 0)
    return {
      startKey: formatDateKey(startDate),
      endKey: formatDateKey(endDate),
    }
  }, [selectedYear, selectedQuarter])

  // Filtrado estricto de registros del trimestre activo
  const quarterLogs = useMemo(() => {
    const { startKey, endKey } = quarterDateRange
    return logs.filter((log) => log.dateKey >= startKey && log.dateKey <= endKey)
  }, [logs, quarterDateRange])

  const selectedDayLogs: WorkoutLog[] = useMemo(() => {
    if (!selectedDateKey) return []
    return getLogsByDate(selectedDateKey)
  }, [selectedDateKey, getLogsByDate])

  // Métricas del historial
  const totalWorkouts = logs.length
  const totalExercisesCompleted = logs.reduce((acc, l) => acc + l.totalExercises, 0)
  const activeQuarterLabel = QUARTER_MONTHS[selectedQuarter]?.label || ''

  const displayName = profile?.nombre || user?.user_metadata?.nombre || user?.user_metadata?.name || 'Atleta'
  const displayEmail = profile?.email || user?.email || ''
  const displayBirthDate = profile?.fecha_nacimiento
  const lastProfileUpdate = profile?.last_profile_update
  const isAdmin = profile?.role === 'admin'

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
              Accede con tu cuenta tu mapa de actividad y tus registros de entrenamiento.
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

  // Vista principal: Usuario autenticado
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
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'info' | 'history')}
        className="w-full flex flex-col gap-4"
      >
        <TabsList className="profile-tabs-track">
          <TabsTrigger
            value="info"
            className={cn(
              "profile-tab-pill",
              activeTab === 'info' ? "profile-tab-active" : "profile-tab-inactive"
            )}
          >
            <div
              className={cn(
                "profile-tab-icon-wrap",
                activeTab === 'info' ? "bg-white/20 text-white" : "bg-[#eef4ef] text-[#1f5844]"
              )}
            >
              <User size={15} strokeWidth={activeTab === 'info' ? 2.5 : 2} />
            </div>
            <span className="tracking-tight text-sm">Información</span>
          </TabsTrigger>

          <TabsTrigger
            value="history"
            className={cn(
              "profile-tab-pill",
              activeTab === 'history' ? "profile-tab-active" : "profile-tab-inactive"
            )}
          >
            <div
              className={cn(
                "profile-tab-icon-wrap",
                activeTab === 'history' ? "bg-white/20 text-white" : "bg-[#eef4ef] text-[#1f5844]"
              )}
            >
              <Calendar size={15} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
            </div>
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
                    <span>Usuario</span>
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
        {/* SOLAPA 2: HISTORIAL                                          */}
        {/* ============================================================ */}
        <TabsContent value="history" className="flex flex-col gap-4 outline-none">
          <section className="history-kpis-grid" aria-label="Resumen de actividad">
            <div className="kpi-card">
              <div className="kpi-icon-wrap kpi-green">
                <CheckCircle2 size={16} />
              </div>
              <div className="kpi-info">
                <span className="kpi-value">{totalWorkouts}</span>
                <span className="kpi-label">Entrenamientos</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap kpi-lime">
                <Dumbbell size={16} />
              </div>
              <div className="kpi-info">
                <span className="kpi-value">{totalExercisesCompleted}</span>
                <span className="kpi-label">Ejercicios</span>
              </div>
            </div>
          </section>

          <ActivityHeatmap
            selectedDateKey={selectedDateKey}
            onSelectDate={(dateKey) => setSelectedDateKey(dateKey)}
            selectedQuarter={selectedQuarter}
            selectedYear={selectedYear}
            onQuarterChange={(q, y) => {
              setSelectedQuarter(q)
              setSelectedYear(y)
            }}
          />

          <section
            className="history-logs-section"
            aria-label="Entrenamientos realizados en el trimestre"
          >
            <div className="history-logs-heading-row">
              <div>
                <h2 className="history-section-title">
                  Entrenamientos Realizados
                </h2>
                <p className="eyebrow">
                  {quarterLogs.length} entrenamiento{quarterLogs.length === 1 ? '' : 's'} en T{selectedQuarter} {selectedYear}
                </p>
              </div>
            </div>

            {quarterLogs.length === 0 ? (
              <div className="state-box history-empty-box">
                <div className="state-icon">
                  <Calendar size={22} />
                </div>
                <h3>Sin entrenamientos en este trimestre</h3>
                <span>
                  No hay entrenamientos registrados para T{selectedQuarter} {selectedYear} ({activeQuarterLabel}).
                  Toca un día en el mapa de actividad para registrar una sesión en este período.
                </span>
                {onGoToRoutines && (
                  <div className="empty-actions-row">
                    <button
                      type="button"
                      className="secondary-outline-button"
                      onClick={onGoToRoutines}
                    >
                      <Dumbbell size={16} /> Ir a mis rutinas
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="history-logs-list">
                {quarterLogs.map((log) => (
                  <WorkoutLogAccordionItem
                    key={log.id}
                    log={log}
                    onEdit={(l) => setEditingLog(l)}
                    onDeleteRequest={(l) => setLogToDelete(l)}
                  />
                ))}
              </div>
            )}
          </section>
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

      {/* Diálogo de Confirmación para Eliminar Registro */}
      {logToDelete && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLogToDelete(null)
          }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-log-delete-title"
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
                onClick={() => setLogToDelete(null)}
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </header>

            <div className="confirm-dialog-content">
              <h2 id="confirm-log-delete-title" className="modal-title confirm-title">
                ¿Eliminar entrenamiento?
              </h2>
              <p className="confirm-text">
                ¿Deseas eliminar el registro de <strong>{logToDelete.routineName}</strong> del{' '}
                <strong>{formatReadableDate(logToDelete.dateKey)}</strong>? Se actualizará tu mapa de
                actividad.
              </p>

              <div className="confirm-actions-row">
                <button
                  type="button"
                  className="dialog-cancel-btn"
                  onClick={() => setLogToDelete(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="confirm-danger-btn"
                  onClick={async () => {
                    await deleteWorkoutLog(logToDelete.id)
                    setLogToDelete(null)
                  }}
                >
                  <Trash2 size={15} /> Eliminar registro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición de Registro */}
      <EditWorkoutLogModal
        log={editingLog}
        isOpen={Boolean(editingLog)}
        onClose={() => setEditingLog(null)}
      />

      {/* Modal de Detalle del Día */}
      {selectedDateKey && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDateKey(null)
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-detail-title"
        >
          <div className="modal-card day-detail-card">
            <header className="modal-header">
              <div className="modal-kicker">
                <Calendar size={14} />
                <span>Detalle del Día</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedDateKey(null)}
                aria-label="Cerrar detalle"
              >
                <X size={18} />
              </button>
            </header>

            <div className="modal-scroll-body">
              <div className="day-detail-header-block">
                <h2 id="day-detail-title" className="modal-title day-detail-date">
                  {formatReadableDate(selectedDateKey)}
                </h2>
              </div>

              {selectedDayLogs.length === 0 ? (
                <div className="day-empty-state">
                  <div className="day-empty-icon">
                    <Info size={24} />
                  </div>
                  <p className="day-empty-title">
                    Sin entrenamientos registrados este día
                  </p>
                  <button
                    type="button"
                    className="retry-button"
                    style={{ marginTop: '8px' }}
                    onClick={() => setIsManualModalOpen(true)}
                  >
                    <Plus size={15} /> Cargar entrenamiento pasado
                  </button>
                </div>
              ) : (
                <div className="day-logs-container">
                  <p className="day-logs-summary">
                    Completaste {selectedDayLogs.length} rutina
                    {selectedDayLogs.length === 1 ? '' : 's'}:
                  </p>

                  {selectedDayLogs.map((log) => (
                    <div key={log.id} className="day-routine-block">
                      <div className="day-routine-header">
                        <h3 className="day-routine-name">{log.routineName}</h3>
                        <span className="day-routine-time">
                          {formatTime(log.completedAt)}
                        </span>
                      </div>

                      <div className="day-routine-meta-chips">
                        <span className="day-chip">
                          {log.totalExercises} ejercicio
                          {log.totalExercises === 1 ? '' : 's'}
                        </span>
                        <span className="day-chip">{log.totalSets} series</span>
                      </div>

                      <div className="day-exercises-breakdown">
                        {log.exercisesSnapshot.map((ex, eIdx) => (
                          <div key={eIdx} className="day-exercise-breakdown-row">
                            <span className="day-breakdown-name">{ex.name}</span>
                            <div className="day-breakdown-sets">
                              {ex.sets.map((s, sIdx) => (
                                <span key={sIdx} className="day-breakdown-badge">
                                  Serie {s.setNumber}: {s.reps} reps
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Carga Manual de Entrenamiento */}
      {selectedDateKey && (
        <ManualWorkoutModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          selectedDateKey={selectedDateKey}
          onGoToRoutines={onGoToRoutines}
        />
      )}
    </main>
  )
}
