'use client'

import type { Server, Profile } from '@/types'

interface ProfilesTabProps {
  profiles: Profile[]
  currentServer: Server | null
  isConnected: boolean
  isLoading: boolean
  onRefresh: () => void
}

export function ProfilesTab({ profiles, currentServer, isConnected, isLoading, onRefresh }: ProfilesTabProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#1e3a5f' }}>
          الباقات المتاحة ({profiles.length})
        </h2>
        {isConnected && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {isLoading ? '⏳' : '🔄'} تحديث
          </button>
        )}
      </div>

      {profiles.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '1rem',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            {!currentServer ? 'لم يتم تحديد سيرفر' : !isConnected ? 'غير متصل بالسيرفر' : 'لا توجد باقات'}
          </p>
          {currentServer && isConnected && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              style={{
                background: '#1e3a5f',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              🔄 تحميل الباقات
            </button>
          )}
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '1rem' 
        }}>
          {profiles.map(profile => (
            <div
              key={profile.id}
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '1rem',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 40, 
                  height: 40,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #3a5a8f 100%)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white', 
                  fontSize: '1.2rem'
                }}>
                  📦
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1e3a5f', fontSize: '1.1rem' }}>
                    {profile.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    ID: {profile.id}
                  </div>
                </div>
              </div>
              {profile.price && (
                <div style={{
                  background: '#f0fdf4',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  color: '#166534',
                  fontWeight: 600
                }}>
                  {profile.price}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
