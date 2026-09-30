'use client'

import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  formatDateKey,
  formatReadableDate,
  useHistory,
} from '../context/HistoryContext'

export interface ActivityHeatmapProps {
  selectedDateKey: string | null
  onSelectDate: (dateKey: string) => void
  selectedQuarter?: 1 | 2 | 3 | 4
  selectedYear?: number
  onQuarterChange?: (quarter: 1 | 2 | 3 | 4, year: number) => void
}

export const QUARTER_MONTHS: Record<
  number,
  { startMonth: number; months: string[]; label: string }
> = {
  1: { startMonth: 0, months: ['Enero', 'Febrero', 'Marzo'], label: 'Ene - Mar' },
  2: { startMonth: 3, months: ['Abril', 'Mayo', 'Junio'], label: 'Abr - Jun' },
  3: { startMonth: 6, months: ['Julio', 'Agosto', 'Septiembre'], label: 'Jul - Sep' },
  4: { startMonth: 9, months: ['Octubre', 'Noviembre', 'Diciembre'], label: 'Oct - Dic' },
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

interface HeatmapCell {
  dateKey: string
  date: Date
  dayOfMonth: number
  isOutsideQuarter: boolean
  isToday: boolean
  isFuture: boolean
  count: number
  level: 0 | 1 | 2 | 3
}

export function ActivityHeatmap({
  selectedDateKey,
  onSelectDate,
  selectedQuarter,
  selectedYear,
  onQuarterChange,
}: ActivityHeatmapProps) {
  const { logs, getActivityCountForDate, getActivityLevelForDate } = useHistory()

  const today = useMemo(() => new Date(), [])
  const currentYear = today.getFullYear()
  const currentQuarter = (Math.floor(today.getMonth() / 3) + 1) as 1 | 2 | 3 | 4

  const [internalQuarter, setInternalQuarter] = useState<1 | 2 | 3 | 4>(currentQuarter)
  const [internalYear, setInternalYear] = useState<number>(currentYear)

  const activeQuarter = selectedQuarter ?? internalQuarter
  const activeYear = selectedYear ?? internalYear

  const changeQuarter = (q: 1 | 2 | 3 | 4, y: number) => {
    if (onQuarterChange) {
      onQuarterChange(q, y)
    } else {
      setInternalQuarter(q)
      setInternalYear(y)
    }
  }

  // Determine available quarters based on logs, current date and active selection
  const quarterOptions = useMemo(() => {
    let minYear = Math.min(activeYear - 2, currentYear - 2)
    logs.forEach((log) => {
      const logYear = parseInt(log.dateKey.slice(0, 4), 10)
      if (!isNaN(logYear) && logYear < minYear) {
        minYear = logYear
      }
    })

    const maxYear = Math.max(activeYear, currentYear)
    const options: Array<{ year: number; quarter: 1 | 2 | 3 | 4; label: string; value: string }> = []

    for (let y = maxYear; y >= minYear; y--) {
      for (let q = 4; q >= 1; q--) {
        const qNum = q as 1 | 2 | 3 | 4
        const info = QUARTER_MONTHS[qNum]
        options.push({
          year: y,
          quarter: qNum,
          value: `${y}-${qNum}`,
          label: `T${qNum} ${y} (${info.label})`,
        })
      }
    }
    return options
  }, [logs, currentYear, activeYear])

  // Navigate to previous quarter
  const handlePrevQuarter = () => {
    let nextQ: 1 | 2 | 3 | 4 = activeQuarter
    let nextY = activeYear
    if (activeQuarter === 1) {
      nextY = activeYear - 1
      nextQ = 4
    } else {
      nextQ = (activeQuarter - 1) as 1 | 2 | 3 | 4
    }
    changeQuarter(nextQ, nextY)
  }

  // Navigate to next quarter
  const handleNextQuarter = () => {
    let nextQ: 1 | 2 | 3 | 4 = activeQuarter
    let nextY = activeYear
    if (activeQuarter === 4) {
      nextY = activeYear + 1
      nextQ = 1
    } else {
      nextQ = (activeQuarter + 1) as 1 | 2 | 3 | 4
    }
    changeQuarter(nextQ, nextY)
  }

  // Build the 3 months grid
  const weeks = useMemo(() => {
    const qInfo = QUARTER_MONTHS[activeQuarter]
    const startMonth = qInfo.startMonth
    const startDate = new Date(activeYear, startMonth, 1)
    const endDate = new Date(activeYear, startMonth + 3, 0) // last day of 3rd month

    // Monday-first offset: 0 = Mon, 6 = Sun
    const startDayOfWeek = (startDate.getDay() + 6) % 7
    const endDayOfWeek = (endDate.getDay() + 6) % 7

    // Start from the Monday of the first week
    const firstGridDate = new Date(startDate)
    firstGridDate.setDate(startDate.getDate() - startDayOfWeek)

    // End on the Sunday of the last week
    const lastGridDate = new Date(endDate)
    if (endDayOfWeek < 6) {
      lastGridDate.setDate(endDate.getDate() + (6 - endDayOfWeek))
    }

    const todayDateKey = formatDateKey(today)
    const resultWeeks: HeatmapCell[][] = []
    let currentWeek: HeatmapCell[] = []

    const iterateDate = new Date(firstGridDate)

    while (iterateDate <= lastGridDate) {
      const cellDate = new Date(iterateDate)
      const dateKey = formatDateKey(cellDate)
      const isOutsideQuarter = cellDate < startDate || cellDate > endDate
      const isToday = dateKey === todayDateKey
      const isFuture = cellDate > today

      const count = isOutsideQuarter || isFuture ? 0 : getActivityCountForDate(dateKey)
      const level = isOutsideQuarter || isFuture ? 0 : getActivityLevelForDate(dateKey)

      currentWeek.push({
        dateKey,
        date: cellDate,
        dayOfMonth: cellDate.getDate(),
        isOutsideQuarter,
        isToday,
        isFuture,
        count,
        level,
      })

      if (currentWeek.length === 7) {
        resultWeeks.push(currentWeek)
        currentWeek = []
      }

      iterateDate.setDate(iterateDate.getDate() + 1)
    }

    return resultWeeks
  }, [activeYear, activeQuarter, today, getActivityCountForDate, getActivityLevelForDate])

  const activeQuarterInfo = QUARTER_MONTHS[activeQuarter] || QUARTER_MONTHS[1]

  return (
    <section className="heatmap-section quarterly-heatmap-section" aria-label="Mapa de calor de actividad">
      <div className="heatmap-header quarterly-heatmap-header">
        <div className="heatmap-title-group">
          <h2 className="heatmap-title">Mapa de Actividad</h2>
          <p className="heatmap-subtitle">
            Entrenamientos completados en T{activeQuarter} {activeYear}
          </p>
        </div>
      </div>

      {/* Quarter Navigator & Selector - Always centered above the Heatmap Grid */}
      <div className="quarter-selector-center-row">
        <div className="quarter-selector-wrapper">
          <button
            type="button"
            className="quarter-arrow-btn"
            onClick={handlePrevQuarter}
            aria-label="Trimestre anterior"
            title="Trimestre anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="quarter-display-control">
            <span className="quarter-active-badge">
              T{activeQuarter} {activeYear} ({activeQuarterInfo.label})
            </span>
            <select
              value={`${activeYear}-${activeQuarter}`}
              onChange={(e) => {
                const [y, q] = e.target.value.split('-').map(Number)
                changeQuarter(q as 1 | 2 | 3 | 4, y)
              }}
              className="quarter-select-overlay"
              aria-label="Seleccionar trimestre"
            >
              {quarterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="quarter-arrow-btn"
            onClick={handleNextQuarter}
            aria-label="Siguiente trimestre"
            title="Siguiente trimestre"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Centered Heatmap Grid Container */}
      <div className="heatmap-scroll-container is-centered">
        <div className="quarterly-grid-outer">
          <div className="heatmap-grid-wrapper is-centered">
            <div className="heatmap-day-labels">
              {DAY_LABELS.map((label, idx) => (
                <span key={idx}>{label}</span>
              ))}
            </div>

            <div className="heatmap-columns">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="heatmap-week-column">
                  {week.map((cell) => {
                    if (cell.isOutsideQuarter) {
                      return (
                        <div
                          key={cell.dateKey}
                          className="heatmap-cell is-padding"
                          aria-hidden="true"
                        />
                      )
                    }

                    const tooltipText = cell.isFuture
                      ? `${formatReadableDate(cell.dateKey)}`
                      : cell.count === 0
                      ? `${formatReadableDate(cell.dateKey)}: Sin entrenamientos`
                      : `${formatReadableDate(cell.dateKey)}: ${cell.count} ejercicio${
                          cell.count === 1 ? '' : 's'
                        }`

                    return (
                      <button
                        key={cell.dateKey}
                        type="button"
                        className={`heatmap-cell level-${cell.level} ${
                          cell.isToday ? 'is-today' : ''
                        } ${cell.isFuture ? 'is-future' : ''} ${
                          selectedDateKey === cell.dateKey ? 'is-selected' : ''
                        }`}
                        onClick={() => onSelectDate(cell.dateKey)}
                        title={tooltipText}
                        aria-label={tooltipText}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="heatmap-legend quarterly-legend">
        <span className="legend-label">Menos</span>
        <div className="legend-cells">
          <span className="heatmap-cell level-0 legend-cell" title="0 ejercicios" />
          <span className="heatmap-cell level-1 legend-cell" title="1 a 3 ejercicios" />
          <span className="heatmap-cell level-2 legend-cell" title="4 a 6 ejercicios" />
          <span className="heatmap-cell level-3 legend-cell" title="7 o más ejercicios" />
        </div>
        <span className="legend-label">Más</span>
      </div>
    </section>
  )
}
