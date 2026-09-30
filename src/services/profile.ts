export interface UserProfile {
  name: string
  email: string
  birthDate: string
  avatarUrl: string
  username?: string
}

export const MOCK_USER_PROFILE: UserProfile = {
  name: 'Carlos Mendoza',
  email: 'carlos.mendoza@example.com',
  birthDate: '15/05/1995',
  avatarUrl: '/placeholder-user.jpg',
  username: '@carlos.fit',
}
