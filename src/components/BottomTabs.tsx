'use client'

import React from 'react'
import { FolderHeart, Search, User } from 'lucide-react'
import { useRoutines } from '../context/RoutinesContext'

export type TabType = 'search' | 'routines' | 'history' | 'profile'

interface BottomTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export function BottomTabs({ activeTab, onTabChange }: BottomTabsProps) {
  const { routines } = useRoutines()
  const routinesCount = routines.length
  const isProfileActive = activeTab === 'profile' || activeTab === 'history'

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
          className={`bottom-tab-item ${isProfileActive ? 'active' : ''}`}
          onClick={() => onTabChange('profile')}
          aria-selected={isProfileActive}
          role="tab"
        >
          <User size={20} />
          <span>Perfil</span>
        </button>
      </div>
    </nav>
  )
}
