'use client'

import type { Manager } from '@/types'

interface ManagersTabProps {
  managers: Manager[]
}

export function ManagersTab({ managers }: ManagersTabProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#1e3a5f' }}>
          المدراء ({managers.length})
        </h2>
      </div>

      {managers.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '1rem',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👨‍💼</div>
          <p style={{ color: '#6b7280' }}>لا يوجد مدراء</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {managers.map(manager => (
            <div
              key={manager.id}
              style={{
                background: 'white',
                padding: '1.25rem 1.5rem',
                borderRadius: '0.75rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #e5e7eb'
              }}
            >
              {/* Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #3a5a8f 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem'
                  }}>
                    👨‍💼
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e3a5f', fontSize: '1.1rem' }}>
                      {manager.firstname && manager.lastname 
                        ? `${manager.firstname} ${manager.lastname}` 
                        : manager.username}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      @{manager.username}
                    </div>
                  </div>
                </div>
                <span style={{
                  background: manager.status === 'active' ? '#dcfce7' : '#fee2e2',
                  color: manager.status === 'active' ? '#166534' : '#991b1b',
                  padding: '0.35rem 1rem',
                  borderRadius: '1rem',
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}>
                  {manager.status === 'active' ? '✓ نشط' : '✗ معطل'}
                </span>
              </div>

              {/* Details Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '0.75rem',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '0.5rem'
              }}>
                {manager.email && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>البريد الإلكتروني</span>
                    <span style={{ color: '#374151' }}>{manager.email}</span>
                  </div>
                )}
                {manager.phone && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>الهاتف</span>
                    <span style={{ color: '#374151' }}>{manager.phone}</span>
                  </div>
                )}
                {manager.city && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>المدينة</span>
                    <span style={{ color: '#374151' }}>{manager.city}</span>
                  </div>
                )}
                {manager.address && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>العنوان</span>
                    <span style={{ color: '#374151' }}>{manager.address}</span>
                  </div>
                )}
                {manager.balance !== undefined && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>الرصيد</span>
                    <span style={{ color: '#059669', fontWeight: 600 }}>{manager.balance}</span>
                  </div>
                )}
                {manager.credits !== undefined && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>الرصيد المتاح</span>
                    <span style={{ color: '#1e3a5f', fontWeight: 600 }}>{manager.credits}</span>
                  </div>
                )}
                {manager.parent_username && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>المدير الأب</span>
                    <span style={{ color: '#374151' }}>@{manager.parent_username}</span>
                  </div>
                )}
                {manager.created_at && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>تاريخ الإنشاء</span>
                    <span style={{ color: '#374151' }}>{manager.created_at}</span>
                  </div>
                )}
                {manager.last_login && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>آخر دخول</span>
                    <span style={{ color: '#374151' }}>{manager.last_login}</span>
                  </div>
                )}
                {manager.language && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>اللغة</span>
                    <span style={{ color: '#374151' }}>{manager.language === 'ar' ? 'العربية' : manager.language}</span>
                  </div>
                )}
                {manager.type !== undefined && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block' }}>النوع</span>
                    <span style={{ 
                      color: manager.type === 1 ? '#1e3a5f' : '#6b7280',
                      fontWeight: manager.type === 1 ? 600 : 400
                    }}>
                      {manager.type === 1 ? 'مدير رئيسي' : 'مدير فرعي'}
                    </span>
                  </div>
                )}
              </div>

              {/* Permissions Preview */}
              {manager.permissions && Object.keys(manager.permissions).length > 0 && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#eff6ff', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.5rem' }}>
                    الصلاحيات
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {Object.entries(manager.permissions).slice(0, 8).map(([key, value]) => (
                      <span
                        key={key}
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.25rem 0.5rem',
                          background: value ? '#dbeafe' : '#f3f4f6',
                          color: value ? '#1e40af' : '#6b7280',
                          borderRadius: '0.25rem'
                        }}
                      >
                        {key}
                      </span>
                    ))}
                    {Object.keys(manager.permissions).length > 8 && (
                      <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                        +{Object.keys(manager.permissions).length - 8} المزيد
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
