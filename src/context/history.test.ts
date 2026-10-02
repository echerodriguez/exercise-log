import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateActivityLevel,
  formatDateKey,
  formatSetDisplayText,
  parseSetPeso,
  sanitizeDecimalInput,
  type ExerciseSetSnapshot,
  type ManualWorkoutLogInput,
  type UpdateWorkoutLogInput,
  type WorkoutLog,
} from './historyHelpers.ts'
import type { Routine } from './RoutinesContext.ts'

test('formatDateKey formats date to YYYY-MM-DD', () => {
  const date = new Date(2026, 8, 29) // 29 de septiembre de 2026
  const key = formatDateKey(date)
  assert.equal(key, '2026-09-29')
})

test('workout log captures an immutable snapshot of exercises and sets with completion status', () => {
  const routine: Routine = {
    id: 'r-test',
    name: 'Espalda y Bíceps',
    exercises: [
      {
        id: 'ex-1',
        name: 'Dominadas',
        gifUrl: '',
        body_part: 'back',
        sets: [
          { id: 's1', setNumber: 1, reps: 8, completed: true },
          { id: 's2', setNumber: 2, reps: 10, completed: false },
        ],
      },
      {
        id: 'ex-2',
        name: 'Curl con Mancuerna',
        gifUrl: '',
        body_part: 'arms',
        sets: [{ id: 's3', setNumber: 1, reps: 12, completed: true }],
      },
    ],
  }

  const exercisesSnapshot = routine.exercises.map((ex) => ({
    name: ex.name,
    setsCount: ex.sets.length,
    sets: ex.sets.map((s) => ({
      setNumber: s.setNumber,
      reps: s.reps,
      completed: s.completed,
    })),
  }))

  const completedSets = exercisesSnapshot.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  )

  const log: WorkoutLog = {
    id: 'log-1',
    routineId: routine.id,
    routineName: routine.name,
    completedAt: new Date(2026, 8, 29, 14, 30).toISOString(),
    dateKey: '2026-09-29',
    totalExercises: exercisesSnapshot.length,
    totalSets: exercisesSnapshot.reduce((acc, ex) => acc + ex.setsCount, 0),
    completedSets,
    exercisesSnapshot,
  }

  assert.equal(log.totalExercises, 2)
  assert.equal(log.totalSets, 3)
  assert.equal(log.completedSets, 2)
  assert.equal(log.exercisesSnapshot[0].sets[0].completed, true)
  assert.equal(log.exercisesSnapshot[0].sets[1].completed, false)

  routine.name = 'Nombre Modificado'
  routine.exercises = []

  assert.equal(log.routineName, 'Espalda y Bíceps')
  assert.equal(log.exercisesSnapshot.length, 2)
})

test('addManualWorkoutLog creates log with retro date and calculated metrics', () => {
  const manualInput: ManualWorkoutLogInput = {
    routineId: 'r-retro',
    routineName: 'Piernas Intenso',
    dateKey: '2026-09-20',
    exercisesSnapshot: [
      {
        name: 'Sentadilla',
        setsCount: 3,
        sets: [
          { setNumber: 1, reps: 12, completed: true },
          { setNumber: 2, reps: 10, completed: true },
          { setNumber: 3, reps: 8, completed: true },
        ],
      },
    ],
  }

  const newLog: WorkoutLog = {
    id: 'manual-1',
    routineId: manualInput.routineId || 'manual',
    routineName: manualInput.routineName,
    completedAt: new Date(`${manualInput.dateKey}T12:00:00.000Z`).toISOString(),
    dateKey: manualInput.dateKey,
    totalExercises: manualInput.exercisesSnapshot.length,
    totalSets: manualInput.exercisesSnapshot.reduce((acc, ex) => acc + ex.setsCount, 0),
    completedSets: 3,
    exercisesSnapshot: manualInput.exercisesSnapshot,
  }

  assert.equal(newLog.dateKey, '2026-09-20')
  assert.equal(newLog.totalExercises, 1)
  assert.equal(newLog.totalSets, 3)
  assert.equal(newLog.exercisesSnapshot[0].name, 'Sentadilla')
})

test('updateWorkoutLog updates dateKey, name and recalculates totals', () => {
  let log: WorkoutLog = {
    id: 'log-edit-1',
    routineId: 'r-1',
    routineName: 'Torso A',
    completedAt: '2026-09-25T10:00:00.000Z',
    dateKey: '2026-09-25',
    totalExercises: 1,
    totalSets: 2,
    completedSets: 2,
    exercisesSnapshot: [
      {
        name: 'Press Militar',
        setsCount: 2,
        sets: [
          { setNumber: 1, reps: 10, completed: true },
          { setNumber: 2, reps: 10, completed: true },
        ],
      },
    ],
  }

  const update = (target: WorkoutLog, input: UpdateWorkoutLogInput) => {
    const exercises = input.exercisesSnapshot || target.exercisesSnapshot
    return {
      ...target,
      routineName: input.routineName || target.routineName,
      dateKey: input.dateKey || target.dateKey,
      totalExercises: exercises.length,
      totalSets: exercises.reduce((acc, ex) => acc + ex.setsCount, 0),
      exercisesSnapshot: exercises,
    }
  }

  const updated = update(log, {
    dateKey: '2026-09-24',
    routineName: 'Torso A (Ajustado)',
    exercisesSnapshot: [
      {
        name: 'Press Militar',
        setsCount: 3,
        sets: [
          { setNumber: 1, reps: 10, completed: true },
          { setNumber: 2, reps: 10, completed: true },
          { setNumber: 3, reps: 8, completed: true },
        ],
      },
    ],
  })

  assert.equal(updated.dateKey, '2026-09-24')
  assert.equal(updated.routineName, 'Torso A (Ajustado)')
  assert.equal(updated.totalSets, 3)
})

test('calculateActivityLevel computes correctly according to requirements', () => {
  assert.equal(calculateActivityLevel(0), 0)
  assert.equal(calculateActivityLevel(1), 1)
  assert.equal(calculateActivityLevel(3), 1)
  assert.equal(calculateActivityLevel(4), 2)
  assert.equal(calculateActivityLevel(6), 2)
  assert.equal(calculateActivityLevel(7), 3)
  assert.equal(calculateActivityLevel(15), 3)
})

test('quarter dates generate exact 3 months range', () => {
  const getQuarterRange = (year: number, quarter: 1 | 2 | 3 | 4) => {
    const startMonth = (quarter - 1) * 3
    const startDate = new Date(year, startMonth, 1)
    const endDate = new Date(year, startMonth + 3, 0)
    return {
      startKey: formatDateKey(startDate),
      endKey: formatDateKey(endDate),
    }
  }

  // T1: Ene - Mar
  const q1 = getQuarterRange(2026, 1)
  assert.equal(q1.startKey, '2026-01-01')
  assert.equal(q1.endKey, '2026-03-31')

  // T2: Abr - Jun
  const q2 = getQuarterRange(2026, 2)
  assert.equal(q2.startKey, '2026-04-01')
  assert.equal(q2.endKey, '2026-06-30')

  // T3: Jul - Sep
  const q3 = getQuarterRange(2026, 3)
  assert.equal(q3.startKey, '2026-07-01')
  assert.equal(q3.endKey, '2026-09-30')

  // T4: Oct - Dic
  const q4 = getQuarterRange(2026, 4)
  assert.equal(q4.startKey, '2026-10-01')
  assert.equal(q4.endKey, '2026-12-31')
})

test('filters workout logs strictly belonging to the selected quarter', () => {
  const logs: WorkoutLog[] = [
    {
      id: 'l1',
      routineId: 'r1',
      routineName: 'R1',
      completedAt: '2026-02-15T12:00:00Z',
      dateKey: '2026-02-15', // T1
      totalExercises: 2,
      totalSets: 6,
      exercisesSnapshot: [],
    },
    {
      id: 'l2',
      routineId: 'r2',
      routineName: 'R2',
      completedAt: '2026-05-10T12:00:00Z',
      dateKey: '2026-05-10', // T2
      totalExercises: 3,
      totalSets: 9,
      exercisesSnapshot: [],
    },
    {
      id: 'l3',
      routineId: 'r3',
      routineName: 'R3',
      completedAt: '2026-08-20T12:00:00Z',
      dateKey: '2026-08-20', // T3
      totalExercises: 4,
      totalSets: 12,
      exercisesSnapshot: [],
    },
    {
      id: 'l4',
      routineId: 'r4',
      routineName: 'R4',
      completedAt: '2026-09-29T12:00:00Z',
      dateKey: '2026-09-29', // T3
      totalExercises: 1,
      totalSets: 3,
      exercisesSnapshot: [],
    },
    {
      id: 'l5',
      routineId: 'r5',
      routineName: 'R5',
      completedAt: '2026-11-04T12:00:00Z',
      dateKey: '2026-11-04', // T4
      totalExercises: 5,
      totalSets: 15,
      exercisesSnapshot: [],
    },
  ]

  // Filter for T3 2026 (2026-07-01 to 2026-09-30)
  const t3Logs = logs.filter(
    (l) => l.dateKey >= '2026-07-01' && l.dateKey <= '2026-09-30'
  )
  assert.equal(t3Logs.length, 2)
  assert.equal(t3Logs[0].id, 'l3')
  assert.equal(t3Logs[1].id, 'l4')

  // Filter for T1 2026
  const t1Logs = logs.filter(
    (l) => l.dateKey >= '2026-01-01' && l.dateKey <= '2026-03-31'
  )
  assert.equal(t1Logs.length, 1)
  assert.equal(t1Logs[0].id, 'l1')

  // Filter for empty quarter (e.g. T3 2025)
  const emptyLogs = logs.filter(
    (l) => l.dateKey >= '2025-07-01' && l.dateKey <= '2025-09-30'
  )
  assert.equal(emptyLogs.length, 0)
})

test('formatSetDisplayText formats reps with and without peso', () => {
  // Con peso decimal
  assert.equal(formatSetDisplayText(12, 50.5), '12 reps @ 50.5 kg')
  // Con peso entero
  assert.equal(formatSetDisplayText(10, 60), '10 reps @ 60 kg')
  // Con peso 0
  assert.equal(formatSetDisplayText(15, 0), '15 reps @ 0 kg')
  // Con peso nulo o indefinido: solo repeticiones
  assert.equal(formatSetDisplayText(12, null), '12 reps')
  assert.equal(formatSetDisplayText(12, undefined), '12 reps')
  // Con peso NaN
  assert.equal(formatSetDisplayText(8, NaN), '8 reps')
})

test('parseSetPeso parses string and numeric inputs into float or null', () => {
  assert.equal(parseSetPeso('50.5'), 50.5)
  assert.equal(parseSetPeso('50,5'), 50.5)
  assert.equal(parseSetPeso(75.25), 75.25)
  assert.equal(parseSetPeso('0'), 0)
  assert.equal(parseSetPeso(''), null)
  assert.equal(parseSetPeso('   '), null)
  assert.equal(parseSetPeso(null), null)
  assert.equal(parseSetPeso(undefined), null)
  assert.equal(parseSetPeso('invalido'), null)
})

test('workout log and snapshot interfaces correctly handle peso property', () => {
  const setWithWeight: ExerciseSetSnapshot = {
    setNumber: 1,
    reps: 12,
    peso: 50.5,
    completed: true,
  }

  const setWithoutWeight: ExerciseSetSnapshot = {
    setNumber: 2,
    reps: 10,
    peso: null,
    completed: true,
  }

  const setUndefinedWeight: ExerciseSetSnapshot = {
    setNumber: 3,
    reps: 8,
  }

  assert.equal(setWithWeight.peso, 50.5)
  assert.equal(setWithoutWeight.peso, null)
  assert.equal(setUndefinedWeight.peso, undefined)

  assert.equal(formatSetDisplayText(setWithWeight.reps, setWithWeight.peso), '12 reps @ 50.5 kg')
  assert.equal(formatSetDisplayText(setWithoutWeight.reps, setWithoutWeight.peso), '10 reps')
  assert.equal(formatSetDisplayText(setUndefinedWeight.reps, setUndefinedWeight.peso), '8 reps')
})

test('sanitizeDecimalInput and parseSetPeso support comma decimal separator like 2,5', () => {
  // Saneado de caracteres no numéricos
  assert.equal(sanitizeDecimalInput('2,5'), '2,5')
  assert.equal(sanitizeDecimalInput('2.5'), '2.5')
  assert.equal(sanitizeDecimalInput('100'), '100')
  assert.equal(sanitizeDecimalInput('abc2,5xyz'), '2,5')
  assert.equal(sanitizeDecimalInput('2,,5'), '2,5')
  assert.equal(sanitizeDecimalInput('2.5.5'), '2.55')
  assert.equal(sanitizeDecimalInput('2,5.5'), '2,55')

  // Conversión con parseSetPeso
  assert.equal(parseSetPeso('2,5'), 2.5)
  assert.equal(parseSetPeso('2.5'), 2.5)
  assert.equal(parseSetPeso('0,75'), 0.75)
  assert.equal(parseSetPeso('12,25'), 12.25)
})


