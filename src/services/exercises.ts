export type ExerciseInstructionSteps = {
  en?: string[]
  es?: string[]
  [language: string]: string[] | undefined
}

export type ExerciseInstructions = {
  en?: string
  es?: string
  [language: string]: string | undefined
}

export type Exercise = {
  id: string
  name: string
  category: string
  body_part: string
  equipment: string
  gifUrl: string
  instruction_steps?: ExerciseInstructionSteps
  instructions?: ExerciseInstructions | string
}

type RawExercise = {
  id?: string | number
  name?: string
  category?: string
  bodyPart?: string
  body_part?: string
  equipment?: string
  gifUrl?: string
  gif_url?: string
  media_id?: string
  instruction_steps?: ExerciseInstructionSteps
  instructions?: ExerciseInstructions | string
}

const DATASET_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json'
const VIDEO_BASE_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/'

export function resolveGifUrl(gifUrl = '', id = '', mediaId = '') {
  const cleanPath = gifUrl.trim().replace(/^\/+/, '').replaceAll('\\', '/')
  let resolvedUrl = ''
  if (cleanPath.startsWith('http')) {
    resolvedUrl = cleanPath
  } else if (id && mediaId) {
    resolvedUrl = `${VIDEO_BASE_URL}${encodeURIComponent(id)}-${encodeURIComponent(mediaId)}.gif`
  } else if (cleanPath) {
    resolvedUrl = `${VIDEO_BASE_URL}${cleanPath}`
  }
  return resolvedUrl
}

let cachedExercisesPromise: Promise<Exercise[]> | null = null

export async function fetchExercises(signal?: AbortSignal): Promise<Exercise[]> {
  if (!cachedExercisesPromise) {
    cachedExercisesPromise = fetch(DATASET_URL, { signal, next: { revalidate: 3600 } })
      .then((response) => {
        if (!response.ok) {
          throw new Error('No se pudo cargar el catálogo de ejercicios.')
        }
        return response.json() as Promise<RawExercise[]>
      })
      .then((data) => {
        return data.map((item, index) => ({
          id: String(item.id ?? index),
          name: item.name?.trim() || 'Ejercicio sin nombre',
          category: item.category?.trim() || 'Sin categoría',
          body_part: (item.body_part ?? item.bodyPart)?.trim() || 'Sin especificar',
          equipment: item.equipment?.trim() || 'Sin equipo',
          gifUrl: resolveGifUrl(
            item.gifUrl ?? item.gif_url ?? '',
            String(item.id ?? index).trim(),
            item.media_id?.trim() || ''
          ),
          instruction_steps: item.instruction_steps,
          instructions: item.instructions,
        }))
      })
      .catch((error) => {
        cachedExercisesPromise = null
        throw error
      })
  }

  return cachedExercisesPromise
}

export async function getExerciseDetails(id = '', name = ''): Promise<Exercise | null> {
  const allExercises = await fetchExercises()
  const cleanId = id.trim()
  const cleanName = name.trim().toLowerCase()

  const match = allExercises.find((item) => {
    const idMatch = cleanId ? item.id === cleanId : false
    const nameMatch = cleanName ? item.name.toLowerCase() === cleanName : false
    return idMatch || nameMatch
  })

  return match || null
}

export function uniqueOptions(exercises: Exercise[], key: keyof Pick<Exercise, 'category' | 'body_part' | 'equipment'>) {
  return Array.from(new Set(exercises.map((exercise) => exercise[key]).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}
