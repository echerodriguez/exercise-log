'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Exercise, fetchExercises, uniqueOptions } from '../services/exercises'

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 12000)
      const result = await fetchExercises(controller.signal)
      clearTimeout(timeout)
      setExercises(result)
    } catch {
      setError('No pudimos conectar con el catálogo. Revisa tu conexión e inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const options = useMemo(() => ({
    category: uniqueOptions(exercises, 'category'),
    body_part: uniqueOptions(exercises, 'body_part'),
    equipment: uniqueOptions(exercises, 'equipment'),
  }), [exercises])

  return { exercises, options, isLoading, error, retry: load }
}
