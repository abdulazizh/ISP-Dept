'use client'

import { useEffect } from 'react'

export default function Home() {
  // Redirect to the Expo app
  useEffect(() => {
    window.location.href = '/app/'
  }, [])
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <div style={{ fontSize: '2rem' }}>جاري التحويل...</div>
      <div style={{ fontSize: '1rem', opacity: 0.8 }}>
        إذا لم يتم التحويل تلقائياً, <a href="/app/" style={{ color: '#fff', textDecoration: 'underline' }}>اضغط هنا</a>
      </div>
    </div>
  )
}
