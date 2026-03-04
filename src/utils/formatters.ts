import { STATUS_COLORS } from './constants'

/**
 * Format a number as Iraqi Dinar currency
 */
export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return num.toLocaleString('ar-IQ') + ' د.ع'
}

/**
 * Get the color for a user status
 */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS.disabled
}

/**
 * Format a date to Arabic locale
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format a datetime to Arabic locale
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('ar')
}

/**
 * Get connection status text
 */
export function getConnectionStatus(isConnected: boolean): string {
  return isConnected ? '✅ متصل' : '❌ غير متصل'
}

/**
 * Get server display text
 */
export function getServerDisplayText(serverName: string | null, isConnected: boolean): string {
  if (!serverName) return 'لم يتم تحديد سيرفر'
  return `${serverName} - ${getConnectionStatus(isConnected)}`
}

/**
 * Clean URL by removing trailing slash
 */
export function cleanUrl(url: string): string {
  return url.replace(/\/$/, '')
}
