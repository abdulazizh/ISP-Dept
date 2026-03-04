'use client'

import type { Stats, ServerStats } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface StatsCardsProps {
  stats: Stats
  serverStats?: ServerStats
}

export function StatsCards({ stats, serverStats }: StatsCardsProps) {
  // Use server stats if available, otherwise fall back to local stats
  const displayStats = {
    totalUsers: serverStats?.total_users || stats.totalUsers,
    activeUsers: serverStats?.active_users || stats.activeUsers,
    expiredUsers: serverStats?.expired_users || stats.expiredUsers,
    onlineUsers: serverStats?.online_users || 0,
    totalManagers: serverStats?.total_managers || 0,
    totalProfiles: serverStats?.total_profiles || 0,
    totalDebt: stats.totalDebt
  }

  const cards = [
    { label: 'إجمالي المشتركين', value: displayStats.totalUsers, color: '#1e3a5f', icon: '👥' },
    { label: 'المشتركين النشطين', value: displayStats.activeUsers, color: '#22c55e', icon: '✅' },
    { label: 'المشتركين المتصلين', value: displayStats.onlineUsers, color: '#3b82f6', icon: '🌐' },
    { label: 'المنتهين', value: displayStats.expiredUsers, color: '#ef4444', icon: '⏰' },
    { label: 'إجمالي الديون', value: formatCurrency(displayStats.totalDebt), color: '#f59e0b', isText: true, icon: '💰' },
    { label: 'الباقات', value: displayStats.totalProfiles, color: '#8b5cf6', icon: '📦' },
    { label: 'المدراء', value: displayStats.totalManagers, color: '#06b6d4', icon: '👨‍💼' },
  ]

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
      gap: '1rem', 
      marginBottom: '2rem' 
    }}>
      {cards.map((card, index) => (
        <div 
          key={index}
          style={{ 
            background: 'white', 
            padding: '1.25rem', 
            borderRadius: '1rem', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            transition: 'transform 0.2s ease',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: '#6b7280', 
            fontSize: '0.85rem', 
            marginBottom: '0.5rem' 
          }}>
            <span style={{ fontSize: '1.1rem' }}>{card.icon}</span>
            {card.label}
          </div>
          <div style={{ 
            fontSize: card.isText ? '1.25rem' : '1.75rem', 
            fontWeight: 'bold', 
            color: card.color 
          }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  )
}
