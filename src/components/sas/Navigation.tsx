'use client'

import type { TabId, Tab } from '@/types'

interface NavigationProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const TABS: Tab[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: '📊' },
  { id: 'servers', label: 'السيرفرات', icon: '🖥️' },
  { id: 'profiles', label: 'الباقات', icon: '📦' },
  { id: 'users', label: 'المشتركين', icon: '👥' },
  { id: 'managers', label: 'المدراء', icon: '👨‍💼' }
]

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav style={{
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '0.5rem 1rem'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'flex', 
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {TABS.map((tab: Tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              background: activeTab === tab.id ? '#1e3a5f' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#374151',
              border: 'none',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
