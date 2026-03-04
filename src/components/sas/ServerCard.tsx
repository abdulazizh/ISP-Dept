'use client'

import type { Server } from '@/types'

interface ServerCardProps {
  server: Server
  isActive: boolean
  isConnected: boolean
  onConnect: () => void
  onDelete: () => void
}

export function ServerCard({ server, isActive, isConnected, onConnect, onDelete }: ServerCardProps) {
  return (
    <div
      style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: 50, 
          height: 50, 
          borderRadius: '50%',
          background: isActive && isConnected ? '#dcfce7' : '#f3f4f6',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '1.5rem'
        }}>
          {isActive && isConnected ? '✅' : '🖥️'}
        </div>
        <div>
          <div style={{ fontWeight: 'bold', color: '#1e3a5f', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {server.name}
            {server.isDefault && (
              <span style={{
                background: '#dbeafe',
                color: '#1e40af',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem'
              }}>
                افتراضي
              </span>
            )}
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>{server.url}</div>
          {server.lastSync && (
            <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
              آخر مزامنة: {server.lastSync}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={onConnect}
          style={{
            background: isActive && isConnected ? '#dcfce7' : '#dbeafe',
            color: isActive && isConnected ? '#166534' : '#1e40af',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          {isActive && isConnected ? 'متصّل' : 'اتصال'}
        </button>
        <button
          onClick={onDelete}
          style={{
            background: '#fee2e2',
            color: '#dc2626',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          حذف
        </button>
      </div>
    </div>
  )
}
