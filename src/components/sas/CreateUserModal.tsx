'use client'

import { useState } from 'react'
import type { Profile } from '@/types'

interface CreateUserModalProps {
  profiles: Profile[]
  isOpen: boolean
  onClose: () => void
  onCreate: (userData: Record<string, unknown>) => Promise<boolean>
}

export function CreateUserModal({ profiles, isOpen, onClose, onCreate }: CreateUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    profile_id: '',
    parent_id: 1,
    enabled: 1
  })

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!formData.username || !formData.password || !formData.profile_id) {
      setError('يرجى ملء الحقول المطلوبة')
      return
    }

    setIsLoading(true)
    setError('')

    const success = await onCreate({
      username: formData.username,
      password: formData.password,
      firstname: formData.firstname,
      lastname: formData.lastname,
      email: formData.email,
      phone: formData.phone,
      profile_id: parseInt(formData.profile_id),
      parent_id: formData.parent_id,
      enabled: formData.enabled
    })

    setIsLoading(false)
    
    if (success) {
      // Reset form
      setFormData({
        username: '',
        password: '',
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        profile_id: '',
        parent_id: 1,
        enabled: 1
      })
      onClose()
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
    let pass = ''
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, password: pass })
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
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          color: 'white',
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>➕ إضافة مشترك جديد</h2>
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

        {/* Form */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#dc2626',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Username */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>
                اسم المستخدم <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                placeholder="مثال: ahmed.mohammed.123"
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

            {/* Password */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>
                كلمة المرور <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="كلمة المرور"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    direction: 'ltr'
                  }}
                />
                <button
                  onClick={generatePassword}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  توليد
                </button>
              </div>
            </div>

            {/* Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>الاسم الأول</label>
                <input
                  type="text"
                  value={formData.firstname}
                  onChange={e => setFormData({ ...formData, firstname: e.target.value })}
                  placeholder="أحمد"
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
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>الاسم الأخير</label>
                <input
                  type="text"
                  value={formData.lastname}
                  onChange={e => setFormData({ ...formData, lastname: e.target.value })}
                  placeholder="محمد"
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

            {/* Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
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
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>رقم الهاتف</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="07701234567"
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

            {/* Profile */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>
                الباقة <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={formData.profile_id}
                onChange={e => setFormData({ ...formData, profile_id: e.target.value })}
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

            {/* Submit */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                style={{
                  flex: 1,
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 500
                }}
              >
                {isLoading ? '⏳ جاري إنشاء...' : '✅ إنشاء المشترك'}
              </button>
              <button
                onClick={onClose}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
