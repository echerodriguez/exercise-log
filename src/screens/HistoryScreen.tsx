'use client'

import React, { useMemo, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Dumbbell,
  Info,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { ActivityHeatmap, QUARTER_MONTHS } from '../components/ActivityHeatmap'
import { EditWorkoutLogModal } from '../components/EditWorkoutLogModal'
import { ManualWorkoutModal } from '../components/ManualWorkoutModal'
import { WorkoutLogAccordionItem } from '../components/WorkoutLogAccordionItem'
import {
  formatDateKey,
  formatReadableDate,
  formatSetDisplayText,
  useHistory,
  type WorkoutLog,
} from '../context/HistoryContext'

export interface HistoryScreenProps {
  onGoToRoutines?: () => void
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export function HistoryScreen({ onGoToRoutines }: HistoryScreenProps) {
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

  // Filtrado de registros del trimestre activo
  const quarterLogs = useMemo(() => {
    const { startKey, endKey } = quarterDateRange
    return logs.filter((log) => log.dateKey >= startKey && log.dateKey <= endKey)
  }, [logs, quarterDateRange])

  const selectedDayLogs: WorkoutLog[] = useMemo(() => {
    if (!selectedDateKey) return []
    return getLogsByDate(selectedDateKey)
  }, [selectedDateKey, getLogsByDate])

  const totalWorkouts = logs.length
  const totalExercisesCompleted = logs.reduce((acc, l) => acc + l.totalExercises, 0)
  const activeQuarterLabel = QUARTER_MONTHS[selectedQuarter]?.label || ''

  return (
    <div className="flex flex-col gap-4 outline-none w-full">
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
            <p className="">
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
                                  Serie {s.setNumber}: {formatSetDisplayText(s.reps, s.peso)}
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
    </div>
  )
}
