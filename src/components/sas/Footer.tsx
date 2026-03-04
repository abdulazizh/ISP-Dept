'use client'

import { APP_NAME, APP_VERSION, APP_TAGLINE } from '@/utils/constants'

export function Footer() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '2rem',
      color: '#6b7280',
      fontSize: '0.9rem'
    }}>
      {APP_NAME} {APP_VERSION} - {APP_TAGLINE}
    </footer>
  )
}
