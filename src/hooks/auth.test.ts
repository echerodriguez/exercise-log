import test from 'node:test'
import assert from 'node:assert/strict'
import type { AuthUserProfile } from './useAuth.ts'

function checkIsAdmin(profile: AuthUserProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin'
}

function resolveDisplayName(profile: AuthUserProfile | null, fallback = 'Atleta'): string {
  if (!profile?.nombre?.trim()) return fallback
  return profile.nombre.trim()
}

test('checkIsAdmin identifies admin role accurately', () => {
  const adminProfile: AuthUserProfile = {
    id: 'u1',
    email: 'admin@ejemplo.com',
    nombre: 'Super Admin',
    role: 'admin',
  }
  const regularProfile: AuthUserProfile = {
    id: 'u2',
    email: 'user@ejemplo.com',
    nombre: 'Usuario Normal',
    role: 'user',
  }

  assert.equal(checkIsAdmin(adminProfile), true)
  assert.equal(checkIsAdmin(regularProfile), false)
  assert.equal(checkIsAdmin(null), false)
})

test('resolveDisplayName falls back to Atleta if profile has no name', () => {
  const customProfile: AuthUserProfile = {
    id: '1',
    email: 'test@test.com',
    nombre: 'Carlos Mendoza',
    role: 'user',
  }
  const emptyNameProfile: AuthUserProfile = {
    id: '2',
    email: 'test@test.com',
    nombre: '   ',
    role: 'user',
  }

  assert.equal(resolveDisplayName(customProfile), 'Carlos Mendoza')
  assert.equal(resolveDisplayName(emptyNameProfile), 'Atleta')
  assert.equal(resolveDisplayName(null), 'Atleta')
})
