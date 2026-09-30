import test from 'node:test'
import assert from 'node:assert/strict'
import { MOCK_USER_PROFILE } from './profile.ts'

test('MOCK_USER_PROFILE contains basic user profile info', () => {
  assert.ok(MOCK_USER_PROFILE.name, 'Debe contener un nombre')
  assert.ok(MOCK_USER_PROFILE.email, 'Debe contener un email')
  assert.ok(MOCK_USER_PROFILE.birthDate, 'Debe contener fecha de nacimiento')
  assert.ok(MOCK_USER_PROFILE.avatarUrl, 'Debe contener avatarUrl o placeholder')

  assert.match(MOCK_USER_PROFILE.email, /@/, 'El email debe tener un formato válido')
  assert.match(MOCK_USER_PROFILE.birthDate, /\d{2}\/\d{2}\/\d{4}/, 'La fecha debe seguir formato DD/MM/AAAA')
})
