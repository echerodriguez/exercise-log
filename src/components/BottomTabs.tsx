'use client'

import React from 'react'
import { Calendar, FolderHeart, Search } from 'lucide-react'
import { useRoutines } from '../context/RoutinesContext'

export type TabType = 'search' | 'routines' | 'history'

interface BottomTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export function BottomTabs({ activeTab, onTabChange }: BottomTabsProps) {
  const { routines } = useRoutines()
  const routinesCount = routines.length

  return (
    <nav className="bottom-tabs-nav" aria-label="Navegación principal">
      <div className="bottom-tabs-container">
        <button
          type="button"
          className={`bottom-tab-item ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => onTabChange('search')}
          aria-selected={activeTab === 'search'}
          role="tab"
        >
          <Search size={20} />
          <span>Buscador</span>
        </button>

        <button
          type="button"
          className={`bottom-tab-item ${activeTab === 'routines' ? 'active' : ''}`}
          onClick={() => onTabChange('routines')}
          aria-selected={activeTab === 'routines'}
          role="tab"
        >
          <div className="tab-icon-wrapper">
            <FolderHeart size={20} />
            {routinesCount > 0 && <span className="tab-counter-badge">{routinesCount}</span>}
          </div>
          <span>Rutinas</span>
        </button>

        <button
          type="button"
          className={`bottom-tab-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => onTabChange('history')}
          aria-selected={activeTab === 'history'}
          role="tab"
        >
          <Calendar size={20} />
          <span>Historial</span>
        </button>
      </div>
    </nav>
  )
}
