'use client'

interface StatusMessageProps {
  message: string
}

export function StatusMessage({ message }: StatusMessageProps) {
  if (!message) return null

  const getBackground = () => {
    if (message.includes('✅')) return '#dcfce7'
    if (message.includes('⚠️')) return '#fef3c7'
    return '#dbeafe'
  }

  const getColor = () => {
    if (message.includes('✅')) return '#166534'
    if (message.includes('⚠️')) return '#92400e'
    return '#1e40af'
  }

  return (
    <div style={{
      background: getBackground(),
      color: getColor(),
      padding: '1rem',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
      textAlign: 'center',
      fontSize: '0.95rem'
    }}>
      {message}
    </div>
  )
}
