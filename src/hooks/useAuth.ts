'use client'

import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export interface AuthUserProfile {
  id: string
  email: string
  nombre: string
  fecha_nacimiento?: string | null
  last_profile_update?: string | null
  role: string
}

export interface UseAuthReturn {
  session: Session | null
  user: User | null
  profile: AuthUserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthUserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async (currentUser: User): Promise<void> => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('id, nombre, email, fecha_nacimiento, last_profile_update, role')
        .eq('id', currentUser.id)
        .single()

      // Si falla porque last_profile_update aún no está en el schema cache de Supabase
      if (error && error.message?.toLowerCase().includes('last_profile_update')) {
        const fallbackRes = await supabase
          .from('profiles')
          .select('id, nombre, email, fecha_nacimiento, role')
          .eq('id', currentUser.id)
          .single()

        if (!fallbackRes.error && fallbackRes.data) {
          data = { ...fallbackRes.data, last_profile_update: null }
          error = null
        }
      }

      if (error || !data) {
        setProfile({
          id: currentUser.id,
          email: currentUser.email || '',
          nombre:
            currentUser.user_metadata?.nombre ||
            currentUser.user_metadata?.name ||
            'Atleta',
          fecha_nacimiento: null,
          last_profile_update: null,
          role: 'user',
        })
        return
      }

      setProfile({
        id: currentUser.id,
        email: currentUser.email || data.email || '',
        nombre:
          data.nombre ||
          currentUser.user_metadata?.nombre ||
          currentUser.user_metadata?.name ||
          'Atleta',
        fecha_nacimiento: data.fecha_nacimiento || null,
        last_profile_update: data.last_profile_update || null,
        role: data.role || 'user',
      })
    } catch {
      setProfile({
        id: currentUser.id,
        email: currentUser.email || '',
        nombre:
          currentUser.user_metadata?.nombre ||
          currentUser.user_metadata?.name ||
          'Atleta',
        fecha_nacimiento: null,
        last_profile_update: null,
        role: 'user',
      })
    }
  }

  useEffect(() => {
    let isMounted = true

    const initAuth = async (): Promise<void> => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (!isMounted) return

        const currentSession = sessionData?.session ?? null
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          await fetchProfile(currentSession.user)
        } else {
          setProfile(null)
        }
      } catch {
        if (!isMounted) return
        setSession(null)
        setUser(null)
        setProfile(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    initAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!isMounted) return

        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        if (currentSession?.user) {
          await fetchProfile(currentSession.user)
        } else {
          setProfile(null)
        }
        setIsLoading(false)
      }
    )

    return () => {
      isMounted = false
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async (): Promise<void> => {
    if (!user) return
    await fetchProfile(user)
  }

  return {
    session,
    user,
    profile,
    isAuthenticated: Boolean(session && user),
    isLoading,
    signOut,
    refreshProfile,
  }
}
