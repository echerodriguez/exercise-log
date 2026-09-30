'use client'

import { useState } from 'react'
import { BottomTabs, type TabType } from '../src/components/BottomTabs'
import { HistoryProvider } from '../src/context/HistoryContext'
import { RoutinesProvider } from '../src/context/RoutinesContext'
import { ExerciseSearchScreen } from '../src/screens/ExerciseSearchScreen'
import { HistoryScreen } from '../src/screens/HistoryScreen'
import { RoutinesScreen } from '../src/screens/RoutinesScreen'

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabType>('search')

  return (
    <RoutinesProvider>
      <HistoryProvider>
        <div className="app-viewport">
          {activeTab === 'search' && <ExerciseSearchScreen />}
          {activeTab === 'routines' && (
            <RoutinesScreen
              onGoToSearch={() => setActiveTab('search')}
              onGoToHistory={() => setActiveTab('history')}
            />
          )}
          {activeTab === 'history' && (
            <HistoryScreen onGoToRoutines={() => setActiveTab('routines')} />
          )}
          <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </HistoryProvider>
    </RoutinesProvider>
  )
}
