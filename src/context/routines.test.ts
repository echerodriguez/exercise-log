import test from 'node:test'
import assert from 'node:assert/strict'
import type { Routine, RoutineExercise, ExerciseSet } from './RoutinesContext.ts'

test('routine stores exercises with dynamic sets collection and completed status', () => {
  const routine: Routine = {
    id: 'r1',
    name: 'Piernas y Glúteos',
    exercises: [],
  }

  const ex1: RoutineExercise = {
    id: '0001',
    name: '3/4 sit-up',
    gifUrl: 'https://example.com/situp.gif',
    body_part: 'waist',
    sets: [
      { id: 's1', setNumber: 1, reps: 10, completed: false },
      { id: 's2', setNumber: 2, reps: 12, completed: true },
    ],
  }

  routine.exercises.push(ex1)
  assert.equal(routine.exercises.length, 1)
  assert.equal(routine.exercises[0].sets.length, 2)
  assert.equal(routine.exercises[0].sets[0].reps, 10)
  assert.equal(routine.exercises[0].sets[0].completed, false)
  assert.equal(routine.exercises[0].sets[1].reps, 12)
  assert.equal(routine.exercises[0].sets[1].completed, true)
})

test('addSetToExercise autoincrements setNumber and sets completed to false', () => {
  const exercise: RoutineExercise = {
    id: 'ex-1',
    name: 'Incline Dumbbell Press',
    gifUrl: 'https://example.com/press.gif',
    body_part: 'chest',
    sets: [{ id: 'set-1', setNumber: 1, reps: 10, completed: false }],
  }

  const addSet = (ex: RoutineExercise) => {
    const nextNumber = ex.sets.length + 1
    const lastReps = ex.sets[ex.sets.length - 1].reps
    ex.sets.push({
      id: `set-${nextNumber}`,
      setNumber: nextNumber,
      reps: lastReps,
      completed: false,
    })
  }

  addSet(exercise)
  assert.equal(exercise.sets.length, 2)
  assert.equal(exercise.sets[1].setNumber, 2)
  assert.equal(exercise.sets[1].reps, 10)
  assert.equal(exercise.sets[1].completed, false)

  addSet(exercise)
  assert.equal(exercise.sets.length, 3)
  assert.equal(exercise.sets[2].setNumber, 3)
})

test('removeSetFromExercise removes set and renumbers remaining sets', () => {
  const exercise: RoutineExercise = {
    id: 'ex-2',
    name: 'Squat',
    gifUrl: 'https://example.com/squat.gif',
    body_part: 'legs',
    sets: [
      { id: 's1', setNumber: 1, reps: 10, completed: false },
      { id: 's2', setNumber: 2, reps: 12, completed: false },
      { id: 's3', setNumber: 3, reps: 14, completed: false },
    ],
  }

  const removeSet = (ex: RoutineExercise, setId: string) => {
    if (ex.sets.length <= 1) return
    const filtered = ex.sets.filter((s) => s.id !== setId)
    ex.sets = filtered.map((s, index) => ({
      ...s,
      setNumber: index + 1,
    }))
  }

  removeSet(exercise, 's2')
  assert.equal(exercise.sets.length, 2)
  assert.equal(exercise.sets[0].id, 's1')
  assert.equal(exercise.sets[0].setNumber, 1)
  assert.equal(exercise.sets[0].reps, 10)
  assert.equal(exercise.sets[1].id, 's3')
  assert.equal(exercise.sets[1].setNumber, 2)
  assert.equal(exercise.sets[1].reps, 14)

  removeSet(exercise, 's1')
  assert.equal(exercise.sets.length, 1)
  assert.equal(exercise.sets[0].setNumber, 1)

  removeSet(exercise, 's3')
  assert.equal(exercise.sets.length, 1)
})

test('updateSetReps updates independent reps for a specific set', () => {
  const exercise: RoutineExercise = {
    id: 'ex-3',
    name: 'Pull up',
    gifUrl: 'https://example.com/pullup.gif',
    body_part: 'back',
    sets: [
      { id: 'set-a', setNumber: 1, reps: 8, completed: false },
      { id: 'set-b', setNumber: 2, reps: 8, completed: false },
    ],
  }

  const updateReps = (ex: RoutineExercise, setId: string, reps: number) => {
    ex.sets = ex.sets.map((s) => (s.id === setId ? { ...s, reps: Math.max(1, reps) } : s))
  }

  updateReps(exercise, 'set-b', 12)
  assert.equal(exercise.sets[0].reps, 8)
  assert.equal(exercise.sets[1].reps, 12)
})

test('toggleSetCompleted toggles completed status of a specific set', () => {
  const exercise: RoutineExercise = {
    id: 'ex-4',
    name: 'Bench Press',
    gifUrl: '',
    body_part: 'chest',
    sets: [
      { id: 's1', setNumber: 1, reps: 10, completed: false },
      { id: 's2', setNumber: 2, reps: 10, completed: false },
    ],
  }

  const toggle = (ex: RoutineExercise, setId: string) => {
    ex.sets = ex.sets.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s))
  }

  toggle(exercise, 's1')
  assert.equal(exercise.sets[0].completed, true)
  assert.equal(exercise.sets[1].completed, false)

  toggle(exercise, 's1')
  assert.equal(exercise.sets[0].completed, false)
})
