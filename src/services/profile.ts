export interface UserProfile {
  name: string
  email: string
  birthDate: string
  avatarUrl: string
  username?: string
  lastProfileUpdate?: string | null
}

export interface UpdateCooldownStatus {
  canUpdate: boolean
  remainingHours: number
  remainingMinutes: number
  message: string | null
}

export function checkProfileUpdateCooldown(
  lastUpdateDate: string | Date | null | undefined,
  currentTimestamp: number = Date.now()
): UpdateCooldownStatus {
  if (!lastUpdateDate) {
    return { canUpdate: true, remainingHours: 0, remainingMinutes: 0, message: null }
  }

  const lastUpdate = new Date(lastUpdateDate).getTime()
  if (isNaN(lastUpdate)) {
    return { canUpdate: true, remainingHours: 0, remainingMinutes: 0, message: null }
  }

  const diffMs = currentTimestamp - lastUpdate
  const ONE_DAY_MS = 24 * 60 * 60 * 1000

  if (diffMs >= ONE_DAY_MS || diffMs < 0) {
    return { canUpdate: true, remainingHours: 0, remainingMinutes: 0, message: null }
  }

  const remainingMs = ONE_DAY_MS - diffMs
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60))
  const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))

  return {
    canUpdate: false,
    remainingHours,
    remainingMinutes,
    message: 'Solo puedes actualizar tu información una vez al día',
  }
}

export const MOCK_USER_PROFILE: UserProfile = {
  name: 'Carlos Mendoza',
  email: 'carlos.mendoza@example.com',
  birthDate: '15/05/1995',
  avatarUrl: '/placeholder-user.jpg',
  username: '@carlos.fit',
  lastProfileUpdate: null,
}
