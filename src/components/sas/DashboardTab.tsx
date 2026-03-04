'use client'

import type { Server, Stats, ServerStats } from '@/types'
import { StatsCards } from './StatsCards'

interface DashboardTabProps {
  currentServer: Server | null
  stats: Stats
  serverStats?: ServerStats
  onAddServer: () => void
}

export function DashboardTab({ currentServer, stats, serverStats, onAddServer }: DashboardTabProps) {
  return (
    <div>
      <StatsCards stats={stats} serverStats={serverStats} />

      {!currentServer && (
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '1rem',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🖥️</div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e3a5f' }}>لم يتم إضافة سيرفر</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            قم بإضافة سيرفر SAS للبدء باستخدام التطبيق
          </p>
          <button
            onClick={onAddServer}
            style={{
              background: '#1e3a5f',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            إضافة سيرفر جديد
          </button>
        </div>
      )}
    </div>
  )
}
