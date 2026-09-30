'use client'

import React from 'react'
import { ProfileScreen, type ProfileScreenProps } from './ProfileScreen'

export interface HistoryScreenProps {
  onGoToRoutines?: () => void
}

/**
 * HistoryScreen ahora delega a ProfileScreen en su pestaña de 'Historial',
 * preservando compatibilidad con navegaciones existentes y la conexión con HistoryContext.
 */
export function HistoryScreen(props: HistoryScreenProps) {
  return <ProfileScreen initialTab="history" {...props} />
}
