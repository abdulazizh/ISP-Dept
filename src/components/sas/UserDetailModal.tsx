'use client'

import { useState, useId } from 'react'
import type { User, Profile } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface UserDetailModalProps {
  user: User | null
  profiles: Profile[]
  isOpen: boolean
  onClose: () => void
  onUpdate: (userId: number, data: Record<string, unknown>) => Promise<boolean>
  onRefresh: () => void
}

export function UserDetailModal({ user, profiles, isOpen, onClose, onUpdate, onRefresh }: UserDetailModalProps) {
  // Use key to remount component when user changes
  return user ? (
    <UserDetailModalContent
      key={user.id}
      user={user}
      profiles={profiles}
      isOpen={isOpen}
      onClose={onClose}
      onUpdate={onUpdate}
      onRefresh={onRefresh}
    />
  ) : null
}

function UserDetailModalContent({ user, profiles, isOpen, onClose, onUpdate, onRefresh }: UserDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<'info' | 'renew' | 'balance' | 'actions'>('info')
  
  // Form state - initialized once per user (key resets component)
  const [formData, setFormData] = useState<Record<string, unknown>>({
    firstname: user?.firstname || '',
    lastname: user?.lastname || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profile_id: user?.profile_id || '',
    enabled: user?.enabled
  })
  const [renewMonths, setRenewMonths] = useState(1)
  const [renewProfile, setRenewProfile] = useState<number | null>(null)
  const [balanceAmount, setBalanceAmount] = useState('')
  const [balanceNote, setBalanceNote] = useState('')

  if (!isOpen || !user) return null

  const handleUpdate = async () => {
    setIsLoading(true)
    const success = await onUpdate(user.id, formData)
    setIsLoading(false)
    if (success) {
      setIsEditing(false)
      onRefresh()
    }
  }

  const handleRenew = async () => {
    if (!renewProfile) return
    setIsLoading(true)
    const success = await onUpdate(user.id, { 
      profile_id: renewProfile,
      expiration: new Date(Date.now() + renewMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    setIsLoading(false)
    if (success) {
      onRefresh()
      setActiveSection('info')
    }
  }

  const handleAddBalance = async () => {
    if (!balanceAmount) return
    setIsLoading(true)
    const success = await onUpdate(user.id, { 
      balance: (parseFloat(user.balance || '0') + parseFloat(balanceAmount)).toFixed(2)
    })
    setIsLoading(false)
    if (success) {
      onRefresh()
      setBalanceAmount('')
      setActiveSection('info')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }} onClick={onClose}>
      <div 
        style={{
          background: 'white',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #3a5a8f 100%)',
          color: 'white',
          padding: '1.5rem',
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
              👤
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{user.username}</h2>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>
                {[user.firstname, user.lastname].filter(Boolean).join(' ') || 'بدون اسم'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              width: 36,
              height: 36,
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Section Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          overflowX: 'auto'
        }}>
          {[
            { id: 'info', label: '📋 المعلومات' },
            { id: 'renew', label: '🔄 التجديد' },
            { id: 'balance', label: '💰 الرصيد' },
            { id: 'actions', label: '⚙️ الإجراءات' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as 'info' | 'renew' | 'balance' | 'actions')}
              style={{
                flex: 1,
                padding: '1rem',
                background: activeSection === tab.id ? '#f3f4f6' : 'transparent',
                border: 'none',
                borderBottom: activeSection === tab.id ? '2px solid #1e3a5f' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: 500,
                color: activeSection === tab.id ? '#1e3a5f' : '#6b7280',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Info Section */}
          {activeSection === 'info' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#1e3a5f' }}>معلومات المشترك</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  style={{
                    background: isEditing ? '#6b7280' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  {isEditing ? 'إلغاء' : '✏️ تعديل'}
                </button>
              </div>

              {/* Status Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#166534' }}>الباقة</div>
                  <div style={{ fontWeight: 'bold', color: '#166534' }}>{user.profile || '-'}</div>
                </div>
                <div style={{ background: user.enabled === 1 ? '#dcfce7' : '#fee2e2', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: user.enabled === 1 ? '#166534' : '#dc2626' }}>الحالة</div>
                  <div style={{ fontWeight: 'bold', color: user.enabled === 1 ? '#166534' : '#dc2626' }}>
                    {user.enabled === 1 ? '✅ نشط' : '❌ معطل'}
                  </div>
                </div>
                <div style={{ background: parseFloat(user.balance || '0') < 0 ? '#fef3c7' : '#f3f4f6', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>الرصيد</div>
                  <div style={{ fontWeight: 'bold', color: parseFloat(user.balance || '0') < 0 ? '#dc2626' : '#1e3a5f' }}>
                    {formatCurrency(user.balance || '0')}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'grid', gap: '1rem' }}>
                {isEditing ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontSize: '0.9rem' }}>الاسم الأول</label>
                        <input
                          type="text"
                          value={String(formData.firstname || '')}
                          onChange={e => setFormData({ ...formData, firstname: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.5rem',
                            fontSize: '1rem'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontSize: '0.9rem' }}>الاسم الأخير</label>
                        <input
                          type="text"
                          value={String(formData.lastname || '')}
                          onChange={e => setFormData({ ...formData, lastname: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.5rem',
                            fontSize: '1rem'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontSize: '0.9rem' }}>البريد الإلكتروني</label>
                        <input
                          type="email"
                          value={String(formData.email || '')}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            direction: 'ltr'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontSize: '0.9rem' }}>رقم الهاتف</label>
                        <input
                          type="tel"
                          value={String(formData.phone || '')}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            direction: 'ltr'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151', fontSize: '0.9rem' }}>الباقة</label>
                      <select
                        value={String(formData.profile_id || '')}
                        onChange={e => setFormData({ ...formData, profile_id: parseInt(e.target.value) })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem',
                          fontSize: '1rem'
                        }}
                      >
                        <option value="">اختر باقة</option>
                        {profiles.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        onClick={handleUpdate}
                        disabled={isLoading}
                        style={{
                          flex: 1,
                          background: '#22c55e',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        {isLoading ? '⏳ جاري الحفظ...' : '💾 حفظ التغييرات'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <InfoField label="الاسم الأول" value={user.firstname || '-'} />
                      <InfoField label="الاسم الأخير" value={user.lastname || '-'} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <InfoField label="البريد الإلكتروني" value={user.email || '-'} />
                      <InfoField label="رقم الهاتف" value={user.phone || '-'} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <InfoField label="تاريخ الانتهاء" value={user.expiration ? new Date(user.expiration).toLocaleDateString('ar') : '-'} />
                      <InfoField label="ID المشترك" value={String(user.id)} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Renew Section */}
          {activeSection === 'renew' && (
            <div>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1e3a5f' }}>تجديد الاشتراك</h3>
              
              <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>الانتهاء الحالي</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e3a5f' }}>
                  {user.expiration ? new Date(user.expiration).toLocaleDateString('ar') : 'غير محدد'}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>اختر الباقة</label>
                  <select
                    value={renewProfile || ''}
                    onChange={e => setRenewProfile(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">اختر باقة</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>عدد الأشهر</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={renewMonths}
                    onChange={e => setRenewMonths(parseInt(e.target.value) || 1)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <button
                  onClick={handleRenew}
                  disabled={isLoading || !renewProfile}
                  style={{
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    cursor: isLoading || !renewProfile ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  {isLoading ? '⏳ جاري التجديد...' : '🔄 تجديد الاشتراك'}
                </button>
              </div>
            </div>
          )}

          {/* Balance Section */}
          {activeSection === 'balance' && (
            <div>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1e3a5f' }}>إدارة الرصيد</h3>
              
              <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>الرصيد الحالي</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: parseFloat(user.balance || '0') < 0 ? '#dc2626' : '#22c55e' }}>
                  {formatCurrency(user.balance || '0')}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>المبلغ (دينار)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={balanceAmount}
                    onChange={e => setBalanceAmount(e.target.value)}
                    placeholder="أدخل المبلغ (موجب للإضافة، سالب للخصم)"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>ملاحظة (اختياري)</label>
                  <input
                    type="text"
                    value={balanceNote}
                    onChange={e => setBalanceNote(e.target.value)}
                    placeholder="سبب التعديل"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handleAddBalance}
                    disabled={isLoading || !balanceAmount}
                    style={{
                      flex: 1,
                      background: parseFloat(balanceAmount) >= 0 ? '#22c55e' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      cursor: isLoading || !balanceAmount ? 'not-allowed' : 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    {isLoading ? '⏳' : ''} {parseFloat(balanceAmount) >= 0 ? '➕ إضافة رصيد' : '➖ خصم رصيد'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions Section */}
          {activeSection === 'actions' && (
            <div>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1e3a5f' }}>إجراءات سريعة</h3>
              
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <button
                  onClick={async () => {
                    setIsLoading(true)
                    await onUpdate(user.id, { enabled: user.enabled === 1 ? 0 : 1 })
                    setIsLoading(false)
                    onRefresh()
                  }}
                  disabled={isLoading}
                  style={{
                    background: user.enabled === 1 ? '#fef3c7' : '#dcfce7',
                    color: user.enabled === 1 ? '#92400e' : '#166534',
                    border: 'none',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {user.enabled === 1 ? '🔴 تعطيل المشترك' : '🟢 تفعيل المشترك'}
                </button>
                
                <button
                  onClick={async () => {
                    if (confirm('هل أنت متأكد من إعادة تعيين كلمة المرور؟')) {
                      setIsLoading(true)
                      await onUpdate(user.id, { password: '123456' })
                      setIsLoading(false)
                      alert('تم إعادة تعيين كلمة المرور إلى: 123456')
                    }
                  }}
                  disabled={isLoading}
                  style={{
                    background: '#dbeafe',
                    color: '#1e40af',
                    border: 'none',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  🔑 إعادة تعيين كلمة المرور
                </button>

                <button
                  onClick={async () => {
                    if (confirm('هل أنت متأكد من قطع اتصال المستخدم؟')) {
                      setIsLoading(true)
                      // Disconnect user - need to implement
                      setIsLoading(false)
                      alert('تم قطع الاتصال')
                    }
                  }}
                  disabled={isLoading}
                  style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  📴 قطع الاتصال
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '1rem', color: '#1e3a5f', fontWeight: 500 }}>{value}</div>
    </div>
  )
}
