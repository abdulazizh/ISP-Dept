'use client'

import type { Server } from '@/types'

interface PermissionInfoProps {
  currentServer: Server | null
  isConnected: boolean
}

export function PermissionInfo({ currentServer, isConnected }: PermissionInfoProps) {
  // Don't show for admin users
  if (!currentServer || !isConnected) return null
  if (currentServer.username.toLowerCase() === 'admin') return null

  return (
    <div style={{
      background: '#fef3c7',
      border: '1px solid #fcd34d',
      padding: '1rem',
      borderRadius: '0.5rem',
      marginBottom: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
        <strong style={{ color: '#92400e' }}>معلومات الصلاحيات</strong>
      </div>
      <p style={{ margin: 0, color: '#78350f', fontSize: '0.9rem' }}>
        المستخدم الحالي &quot;{currentServer.username}&quot; لديه صلاحيات محدودة. 
        لعرض قائمة المشتركين والإحصائيات الكاملة، يرجى استخدام حساب مدير (Admin).
      </p>
    </div>
  )
}
