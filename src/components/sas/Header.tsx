'use client'

import type { Server } from '@/types'
import { APP_NAME } from '@/utils/constants'
import { getServerDisplayText } from '@/utils/formatters'

interface HeaderProps {
  currentServer: Server | null
  isConnected: boolean
  isLoading: boolean
  onSync: () => void
}

export function Header({ currentServer, isConnected, isLoading, onSync }: HeaderProps) {
  return (
    <header style={{
      background: 'linear-gradient(135deg, #1e3a5f 0%, #3a5a8f 100%)',
      color: 'white',
      padding: '1.5rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 50, 
            height: 50, 
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}>
            📊
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{APP_NAME}</h1>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>
              {getServerDisplayText(currentServer?.name || null, isConnected)}
            </p>
          </div>
        </div>
        
        {isConnected && (
          <button
            onClick={onSync}
            disabled={isLoading}
            style={{
              background: isLoading ? '#6b7280' : '#22c55e',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isLoading ? '⏳' : '🔄'} مزامنة
          </button>
        )}
      </div>
    </header>
  )
}
