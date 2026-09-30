import test from 'node:test'
import assert from 'node:assert/strict'
import { checkProfileUpdateCooldown, MOCK_USER_PROFILE } from './profile.ts'

test('MOCK_USER_PROFILE contains basic user profile info', () => {
  assert.ok(MOCK_USER_PROFILE.name, 'Debe contener un nombre')
  assert.ok(MOCK_USER_PROFILE.email, 'Debe contener un email')
  assert.ok(MOCK_USER_PROFILE.birthDate, 'Debe contener fecha de nacimiento')
  assert.ok(MOCK_USER_PROFILE.avatarUrl, 'Debe contener avatarUrl o placeholder')

  assert.match(MOCK_USER_PROFILE.email, /@/, 'El email debe tener un formato válido')
  assert.match(MOCK_USER_PROFILE.birthDate, /\d{2}\/\d{2}\/\d{4}/, 'La fecha debe seguir formato DD/MM/AAAA')
})

test('checkProfileUpdateCooldown allows update when last update is null or undefined', () => {
  const status1 = checkProfileUpdateCooldown(null)
  assert.equal(status1.canUpdate, true)
  assert.equal(status1.message, null)

  const status2 = checkProfileUpdateCooldown(undefined)
  assert.equal(status2.canUpdate, true)
})

test('checkProfileUpdateCooldown blocks update if less than 24 hours have passed', () => {
  const now = 1700000000000
  const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString()
  const status = checkProfileUpdateCooldown(twoHoursAgo, now)

  assert.equal(status.canUpdate, false)
  assert.equal(status.remainingHours, 22)
  assert.equal(status.message, 'Solo puedes actualizar tu información una vez al día')
})

test('checkProfileUpdateCooldown allows update if 24 or more hours have passed', () => {
  const now = 1700000000000
  const twentyFiveHoursAgo = new Date(now - 25 * 60 * 60 * 1000).toISOString()
  const status = checkProfileUpdateCooldown(twentyFiveHoursAgo, now)

  assert.equal(status.canUpdate, true)
  assert.equal(status.message, null)
})
