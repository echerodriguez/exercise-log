'use client'

import React, { useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Layers,
  Pencil,
  Trash2,
} from 'lucide-react'
import { formatSetDisplayText, type WorkoutLog } from '../context/HistoryContext'

interface WorkoutLogAccordionItemProps {
  log: WorkoutLog
  onEdit: (log: WorkoutLog) => void
  onDeleteRequest: (log: WorkoutLog) => void
  defaultOpen?: boolean
}

function formatReadableDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const formatted = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const clean = formatted.replace(',', '').trim()
  return clean.charAt(0).toLowerCase() + clean.slice(1)
}

export function WorkoutLogAccordionItem({
  log,
  onEdit,
  onDeleteRequest,
  defaultOpen = false,
}: WorkoutLogAccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <article className={`workout-log-accordion ${isOpen ? 'open' : 'closed'}`}>
      <header
        className="workout-accordion-header"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        aria-expanded={isOpen}
      >
        <div className="workout-accordion-main-info">
          <div className="workout-accordion-date-row">
            <Calendar size={14}/>
            <span className="workout-accordion-date">{formatReadableDate(log.dateKey)}</span>
          </div>

          <h3 className="workout-accordion-routine-title">{log.routineName}</h3>

          <div className="workout-accordion-badges-row">
            <span className="history-stat-badge">
              <Dumbbell size={14} /> {log.totalExercises} ejercicio
              {log.totalExercises === 1 ? '' : 's'}
            </span>
            <span className="history-stat-badge">
              <Layers size={14} /> {log.totalSets} series
            </span>
          </div>
        </div>

        <div className="workout-accordion-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="log-edit-action-btn"
            onClick={() => onEdit(log)}
            aria-label={`Editar entrenamiento del ${formatReadableDate(log.dateKey)}`}
            title="Editar entrenamiento"
          >
            <Pencil size={15} />
            <span className="action-btn-text">Editar</span>
          </button>

          <button
            type="button"
            className="log-delete-action-btn"
            onClick={() => onDeleteRequest(log)}
            aria-label={`Eliminar registro de ${log.routineName}`}
            title="Eliminar entrenamiento"
          >
            <Trash2 size={15} />
          </button>

          <button
            type="button"
            className="log-toggle-chevron-btn"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Contraer detalles' : 'Ver ejercicios del entrenamiento'}
          >
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </header>

      {isOpen && (
        <div className="workout-accordion-body">
          <div className="workout-exercises-snapshot-grid">
            {log.exercisesSnapshot.map((exercise, idx) => (
              <div key={idx} className="accordion-exercise-card">
                <div className="accordion-exercise-header">
                  <div className="accordion-exercise-name-wrap">
                    <Dumbbell size={13} />
                    <span className="accordion-exercise-name">{exercise.name}</span>
                  </div>
                  <span className="accordion-sets-count">{exercise.setsCount} series</span>
                </div>

                <div className="accordion-sets-breakdown">
                  {exercise.sets.map((set, sIdx) => (
                    <div
                      key={sIdx}
                      className={`accordion-set-chip ${
                        set.completed ? 'accordion-set-done' : ''
                      }`}
                    >
                      <span className="accordion-set-num">Serie {set.setNumber}</span>
                      <span className="accordion-set-reps">
                        {formatSetDisplayText(set.reps, set.peso)}
                      </span>
                      {set.completed && <CheckCircle2 size={11} className="done-check-icon" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
