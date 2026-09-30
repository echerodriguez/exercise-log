'use client'

import { useState } from 'react'
import type { Exercise } from '../services/exercises'
import { Dumbbell, ImageOff } from 'lucide-react'

interface ExerciseCardProps {
  exercise: Exercise
  onPress?: (exercise: Exercise) => void
}

export function ExerciseCard({ exercise, onPress }: ExerciseCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <button
      type="button"
      className="exercise-card"
      onClick={() => {
        onPress?.(exercise)
      }}
      aria-label={`Ver detalles de ${exercise.name}`}
    >
      <div className="exercise-thumb">
        {!imageError && exercise.gifUrl ? (
          <img
            src={exercise.gifUrl}
            alt={`Demostración de ${exercise.name}`}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="image-fallback" aria-label="Imagen no disponible">
            <ImageOff size={22} />
          </div>
        )}
      </div>
      <div className="exercise-copy">
        <div className="exercise-kicker">
          <Dumbbell size={13} /> {exercise.category}
        </div>
        <h3>{exercise.name}</h3>
        <div className="exercise-meta">
          <span>{exercise.body_part}</span>
          <span>{exercise.equipment}</span>
        </div>
      </div>
      <span className="card-arrow" aria-hidden="true">›</span>
    </button>
  )
}
