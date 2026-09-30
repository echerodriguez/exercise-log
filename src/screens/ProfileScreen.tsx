'use client'

import React, { useMemo, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Dumbbell,
  Info,
  Mail,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { ActivityHeatmap, QUARTER_MONTHS } from '../components/ActivityHeatmap'
import { EditWorkoutLogModal } from '../components/EditWorkoutLogModal'
import { ManualWorkoutModal } from '../components/ManualWorkoutModal'
import { WorkoutLogAccordionItem } from '../components/WorkoutLogAccordionItem'
import {
  formatDateKey,
  formatReadableDate,
  useHistory,
  type WorkoutLog,
} from '../context/HistoryContext'
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
import { MOCK_USER_PROFILE, type UserProfile } from '../services/profile'

export { MOCK_USER_PROFILE, type UserProfile }

export interface ProfileScreenProps {
  initialTab?: 'info' | 'history'
  onGoToRoutines?: () => void
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export function ProfileScreen({
  initialTab = 'info',
  onGoToRoutines,
}: ProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'history'>(initialTab)

  // --- LÓGICA DE HISTORIAL (Preservada intacta de HistoryScreen) ---
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
    return selectedDateKey ? getLogsByDate(selectedDateKey) : []
  }, [selectedDateKey, getLogsByDate])

  // Métricas del historial
  const totalWorkouts = logs.length
  const totalExercisesCompleted = logs.reduce((acc, l) => acc + l.totalExercises, 0)
  const activeQuarterLabel = QUARTER_MONTHS[selectedQuarter]?.label || ''

  return (
    <main className="app-shell">
      {/* Encabezado principal del perfil */}
      <header className="app-header">
        <div className="brand-mark history-brand-mark">
          <User size={22} strokeWidth={2.5} />
        </div>
        <div>
          <p className="eyebrow">MI CUENTA</p>
          <h1>Perfil</h1>
        </div>
      </header>

      {/* Navegación por Pestañas (Tabs) */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'info' | 'history')}
        className="w-full flex flex-col gap-4"
      >
        <TabsList className="w-full grid grid-cols-2 h-11 p-1 bg-[#eef4ef] rounded-xl border border-[#dbe4dc]">
          <TabsTrigger
            value="info"
            className="flex items-center justify-center gap-2 rounded-lg text-sm font-semibold py-2 transition-all data-active:bg-[#1f5844] data-active:text-white data-active:shadow-sm text-[#6e8076]"
          >
            <User size={16} />
            <span>Info</span>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex items-center justify-center gap-2 rounded-lg text-sm font-semibold py-2 transition-all data-active:bg-[#1f5844] data-active:text-white data-active:shadow-sm text-[#6e8076]"
          >
            <Calendar size={16} />
            <span>Historial</span>
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* SOLAPA 1: INFO DE USUARIO                                    */}
        {/* ============================================================ */}
        <TabsContent value="info" className="flex flex-col gap-4 outline-none">
          {/* Tarjeta de Presentación y Avatar */}
          <Card className="border border-[#dbe4dc] bg-white rounded-2xl shadow-none overflow-hidden">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="relative mb-3">
                <Avatar className="size-24 border-2 border-[#1f5844]/20 shadow-sm">
                  <AvatarImage
                    src={MOCK_USER_PROFILE.avatarUrl}
                    alt={MOCK_USER_PROFILE.name}
                  />
                  <AvatarFallback className="bg-[#eef4ef] text-[#1f5844] text-xl font-bold">
                    <User size={36} />
                  </AvatarFallback>
                </Avatar>
                <span
                  className="absolute bottom-0 right-0 size-6 rounded-full bg-[#1f5844] border-2 border-white flex items-center justify-center text-white"
                  title="Usuario activo"
                >
                  <CheckCircle2 size={13} />
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-[#14201a] tracking-tight">
                {MOCK_USER_PROFILE.name}
              </h2>
              <p className="text-xs font-semibold text-[#6e8076] mt-0.5">
                {MOCK_USER_PROFILE.username}
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef4ef] text-[#1f5844] text-xs font-semibold">
                <Sparkles size={13} />
                <span>Atleta Activo</span>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta de Datos Básicos */}
          <Card className="border border-[#dbe4dc] bg-white rounded-2xl shadow-none">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-base font-bold text-[#14201a] flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#1f5844]" />
                <span>Datos Básicos</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#6e8076]">
                Información personal del perfil del usuario
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 pt-2 flex flex-col divide-y divide-[#dbe4dc]/60">
              {/* Campo Nombre */}
              <div className="py-3 first:pt-1 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-[#eef4ef] flex items-center justify-center text-[#1f5844] shrink-0">
                    <User size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#6e8076] uppercase tracking-wider block">
                      Nombre
                    </span>
                    <span className="text-sm font-semibold text-[#14201a]">
                      {MOCK_USER_PROFILE.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Campo Email */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-[#eef4ef] flex items-center justify-center text-[#1f5844] shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#6e8076] uppercase tracking-wider block">
                      Email
                    </span>
                    <span className="text-sm font-semibold text-[#14201a] break-all">
                      {MOCK_USER_PROFILE.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Campo Fecha de Nacimiento */}
              <div className="py-3 last:pb-1 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-[#eef4ef] flex items-center justify-center text-[#1f5844] shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#6e8076] uppercase tracking-wider block">
                      Fecha de nacimiento
                    </span>
                    <span className="text-sm font-semibold text-[#14201a]">
                      {MOCK_USER_PROFILE.birthDate}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta de Resumen Rápido de Actividad */}
          <Card className="border border-[#dbe4dc] bg-white rounded-2xl shadow-none">
            <CardContent className="p-5 flex items-center justify-around text-center">
              <div>
                <span className="text-2xl font-black text-[#1f5844] block">
                  {totalWorkouts}
                </span>
                <span className="text-xs font-semibold text-[#6e8076]">
                  Entrenamientos
                </span>
              </div>
              <div className="h-8 w-px bg-[#dbe4dc]" />
              <div>
                <span className="text-2xl font-black text-[#1f5844] block">
                  {totalExercisesCompleted}
                </span>
                <span className="text-xs font-semibold text-[#6e8076]">
                  Ejercicios
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* SOLAPA 2: HISTORIAL (Contenido y Lógica completa)            */}
        {/* ============================================================ */}
        <TabsContent value="history" className="flex flex-col gap-4 outline-none">
          {/* Tarjetas KPI de Resumen */}
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

          {/* Mapa de Calor Trimestral */}
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

          {/* Lista de entrenamientos del trimestre */}
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

      {/* ============================================================ */}
      {/* MODALES DEL HISTORIAL                                        */}
      {/* ============================================================ */}

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
                  onClick={() => {
                    deleteWorkoutLog(logToDelete.id)
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
