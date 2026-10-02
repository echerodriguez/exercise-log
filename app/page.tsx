'use client'

import { useState } from 'react'
import { BottomTabs, type TabType } from '../src/components/BottomTabs'
import { HistoryProvider } from '../src/context/HistoryContext'
import { RoutinesProvider } from '../src/context/RoutinesContext'
import { ExerciseSearchScreen } from '../src/screens/ExerciseSearchScreen'
import { ProfileScreen } from '../src/screens/ProfileScreen'
import { RoutinesScreen } from '../src/screens/RoutinesScreen'

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabType>('search')

  return (
    <RoutinesProvider>
      <HistoryProvider>
        <div className="app-viewport pb-24">
          {activeTab === 'search' && <ExerciseSearchScreen />}
          {activeTab === 'routines' && (
            <RoutinesScreen
              onGoToSearch={() => setActiveTab('search')}
              onGoToHistory={() => setActiveTab('history')}
            />
          )}
          {(activeTab === 'profile' || activeTab === 'history') && (
            <ProfileScreen
              initialTab={activeTab === 'history' ? 'history' : 'info'}
              onGoToRoutines={() => setActiveTab('routines')}
            />
          )}
          <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </HistoryProvider>
    </RoutinesProvider>
  )
}
