'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, Check, ChevronDown, Filter, RotateCcw, Search, X } from 'lucide-react'
import { ExerciseCard } from '../components/ExerciseCard'
import { ExerciseDetailModal } from '../components/ExerciseDetailModal'
import { useExercises } from '../hooks/useExercises'
import type { Exercise } from '../services/exercises'

type FilterKey = 'category' | 'equipment'
const labels: Record<FilterKey, string> = {
  category: 'Categoría',
  equipment: 'Equipo',
}

export function ExerciseSearchScreen() {
  const { exercises, options, isLoading, error, retry } = useExercises()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    category: '',
    equipment: '',
  })
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)

  const filtered = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesQuery = exercise.name
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase())
      return (
        matchesQuery &&
        Object.entries(filters).every(
          ([key, value]) => !value || exercise[key as FilterKey] === value
        )
      )
    })
  }, [exercises, filters, query])

  const reset = () => {
    setQuery('')
    setFilters({ category: '', equipment: '' })
    setOpenFilter(null)
  }

  const activeFilters = Object.values(filters).filter(Boolean).length
  const pageSize = 20
  const [page, setPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const displayedExercises = filtered.slice(0, page * pageSize)
  const hasMore = displayedExercises.length < filtered.length

  useEffect(() => {
    setPage(1)
  }, [query, filters, exercises])

  const loadMore = () => {
    if (!hasMore || isLoadingMore) return
    setIsLoadingMore(true)
    window.setTimeout(() => {
      setPage((current) => current + 1)
      setIsLoadingMore(false)
    }, 120)
  }

  return (
    <main className="app-shell pb-24">
      <header className="app-header">
        <div className="brand-mark">
          <Activity size={22} strokeWidth={2.5} />
        </div>
        <div>
          <p className="eyebrow">BUSCADOR</p>
          <h1>Explora Ejercicios</h1>
        </div>
      </header>

      {/* Compact Search & Horizontal Filters */}
      <section className="filter-panel" aria-label="Filtros de ejercicios">
        <div className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre..."
            aria-label="Buscar por nombre"
          />
          {query && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setQuery('')}
              aria-label="Borrar búsqueda"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Sliding Horizontal Filter Chips */}
        <div className="filter-chips-slider no-scrollbar">
          {(Object.keys(labels) as FilterKey[]).map((key) => {
            const isSelected = Boolean(filters[key])
            const displayLabel = filters[key] || labels[key]

            return (
              <div className="filter-wrap" key={key}>
                <button
                  type="button"
                  className={`filter-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => setOpenFilter(openFilter === key ? null : key)}
                  aria-expanded={openFilter === key}
                  aria-label={`Filtrar por ${labels[key]}`}
                >
                  <span style={{ textTransform: isSelected ? 'capitalize' : 'none' }}>
                    {displayLabel}
                  </span>
                  <ChevronDown size={14} />
                </button>
              </div>
            )
          })}

          <button
            type="button"
            className="reset-button"
            onClick={reset}
            disabled={!query && !activeFilters}
          >
            <RotateCcw size={14} /> Limpiar
          </button>
        </div>
      </section>

      <section className="results-section" aria-live="polite">
        <div className="results-heading">
            <p className="eyebrow">CATÁLOGO</p>
            <p className="eyebrow">{isLoading ? 'Cargando...' : `${filtered.length} EJERCICIOS`}</p>
        </div>

        {isLoading && (
          <div className="state-box">
            <div className="spinner" />
            <p>Preparando tu catálogo</p>
            <span>Cargando ejercicios desde GitHub</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="state-box">
            <p className="state-icon">!</p>
            <h3>Algo salió mal</h3>
            <span>{error}</span>
            <button type="button" className="retry-button" onClick={retry}>
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="state-box">
            <p className="state-icon">⌕</p>
            <h3>No encontramos resultados</h3>
            <span>Prueba quitando algún filtro o usando otro nombre.</span>
            <button type="button" className="retry-button" onClick={reset}>
              Ver todos
            </button>
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <>
            <div className="exercise-list">
              {displayedExercises.map((exercise) => (
                <ExerciseCard
                  exercise={exercise}
                  key={exercise.id || exercise.name}
                  onPress={(item) => setSelectedExercise(item)}
                />
              ))}
            </div>
            {hasMore && (
              <button
                type="button"
                className="load-more-button"
                onClick={loadMore}
                disabled={isLoadingMore}
                aria-label="Cargar más ejercicios"
              >
                {isLoadingMore ? (
                  <>
                    <span className="spinner spinner-small" /> Cargando más
                  </>
                ) : (
                  'Cargar más ejercicios'
                )}
              </button>
            )}
          </>
        )}
      </section>

      <footer><span className="status-dot" /> Datos sincronizados desde exercises-dataset</footer>

      {/* Modal Deslizable / Bottom Sheet para selección de opciones de filtro */}
      {openFilter && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenFilter(null)
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-picker-title"
        >
          <div className="routine-modal-card" style={{ maxHeight: '80dvh' }}>
            <header className="routine-modal-header">
              <div>
                <h2 id="filter-picker-title" className="routine-modal-title">
                  Filtrar por {labels[openFilter]}
                </h2>
                <p className="routine-modal-subtitle">
                  Selecciona una opción para aplicar al catálogo
                </p>
              </div>
              <button
                type="button"
                className="routine-modal-close-btn"
                onClick={() => setOpenFilter(null)}
                aria-label="Cerrar filtro"
              >
                <X size={18} />
              </button>
            </header>

            <div className="routine-modal-body" style={{ padding: '14px 18px 24px' }}>
              <div className="filter-options-picker-list">
                <button
                  type="button"
                  className={`filter-option-item ${!filters[openFilter] ? 'is-selected' : ''}`}
                  onClick={() => {
                    setFilters({ ...filters, [openFilter]: '' })
                    setOpenFilter(null)
                  }}
                >
                  <span>Todos ({labels[openFilter]})</span>
                  {!filters[openFilter] && <Check size={16} strokeWidth={2.5} />}
                </button>

                {options[openFilter].map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={`filter-option-item ${
                      filters[openFilter] === option ? 'is-selected' : ''
                    }`}
                    onClick={() => {
                      setFilters({ ...filters, [openFilter]: option })
                      setOpenFilter(null)
                    }}
                  >
                    <span style={{ textTransform: 'capitalize' }}>{option}</span>
                    {filters[openFilter] === option && <Check size={16} strokeWidth={2.5} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <ExerciseDetailModal
        exercise={selectedExercise}
        isOpen={Boolean(selectedExercise)}
        onClose={() => setSelectedExercise(null)}
      />
    </main>
  )
}
