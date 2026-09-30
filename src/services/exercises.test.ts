import test from 'node:test'
import assert from 'node:assert/strict'
import { getExerciseDetails, resolveGifUrl, uniqueOptions, type Exercise } from './exercises.ts'

test('resolveGifUrl resolves absolute urls directly', () => {
  const url = 'https://example.com/demo.gif'
  const result = resolveGifUrl(url)
  assert.equal(result, url)
})

test('resolveGifUrl resolves relative video paths with VIDEO_BASE_URL', () => {
  const result = resolveGifUrl('videos/0001-demo.gif')
  assert.equal(result, 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/videos/0001-demo.gif')
})

test('resolveGifUrl resolves id and mediaId combination when gifUrl is empty', () => {
  const result = resolveGifUrl('', '0001', 'xyz123')
  assert.equal(result, 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0001-xyz123.gif')
})

test('uniqueOptions sorts and filters values', () => {
  const mockExercises: Exercise[] = [
    { id: '1', name: 'Exercise A', category: 'Chest', body_part: 'Chest', equipment: 'Barbell', gifUrl: '' },
    { id: '2', name: 'Exercise B', category: 'Abs', body_part: 'Waist', equipment: 'Body weight', gifUrl: '' },
    { id: '3', name: 'Exercise C', category: 'Chest', body_part: 'Chest', equipment: 'Dumbbell', gifUrl: '' },
  ]
  const categories = uniqueOptions(mockExercises, 'category')
  assert.deepEqual(categories, ['Abs', 'Chest'])
})

test('getExerciseDetails finds exercise and retrieves instruction steps', async () => {
  const exercise = await getExerciseDetails('0001', '3/4 sit-up')
  assert.notEqual(exercise, null)
  assert.equal(exercise?.id, '0001')
  assert.ok(exercise?.instruction_steps?.en)
  assert.ok(Array.isArray(exercise?.instruction_steps?.en))
  assert.ok(exercise?.instruction_steps?.en.length > 0)
})
