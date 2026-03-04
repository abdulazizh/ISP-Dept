'use client'

import { useState } from 'react'
import { cleanUrl } from '@/utils/formatters'
import { DEFAULT_ADMIN } from '@/utils/constants'

interface ServerFormProps {
  onSubmit: (data: { name: string; url: string; username: string; password: string }) => void
  onCancel: () => void
  isLoading: boolean
  onTestConnection: (url: string, username: string, password: string) => Promise<boolean>
}

export function ServerForm({ onSubmit, onCancel, isLoading, onTestConnection }: ServerFormProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [username, setUsername] = useState(DEFAULT_ADMIN.username)
  const [password, setPassword] = useState(DEFAULT_ADMIN.password)

  const handleSubmit = () => {
    if (!name || !url || !username || !password) {
      alert('يرجى ملء جميع الحقول')
      return
    }
    
    onSubmit({
      name,
      url: cleanUrl(url),
      username,
      password
    })
  }

  const handleTest = async () => {
    if (!url || !username || !password) {
      alert('يرجى إدخال بيانات السيرفر')
      return
    }
    
    const success = await onTestConnection(cleanUrl(url), username, password)
    if (success) {
      alert('✅ تم الاتصال بنجاح!')
    } else {
      alert('❌ فشل الاتصال')
    }
  }

  return (
    <div style={{
      background: 'white',
      padding: '2rem',
      borderRadius: '1rem',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
    }}>
      <h3 style={{ margin: '0 0 1.5rem 0', color: '#1e3a5f' }}>إضافة سيرفر جديد</h3>
      
      <div style={{ display: 'grid', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>
            اسم السيرفر *
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="مثال: السيرفر الرئيسي"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              direction: 'rtl'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>
            عنوان URL *
          </label>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="http://82.26.94.240"
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
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>
            اسم المستخدم *
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="admin"
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
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#374151' }}>
            كلمة المرور *
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
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
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button
          onClick={handleTest}
          disabled={isLoading}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '1rem'
          }}
        >
          🧪 اختبار الاتصال
        </button>
        <button
          onClick={handleSubmit}
          style={{
            background: '#22c55e',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            flex: 1
          }}
        >
          💾 حفظ
        </button>
        <button
          onClick={onCancel}
          style={{
            background: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          إلغاء
        </button>
      </div>
    </div>
  )
}
