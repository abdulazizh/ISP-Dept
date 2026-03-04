// App Info
export const APP_NAME = 'إدارة الفواتير والديون'
export const APP_VERSION = 'v1.0.0'
export const APP_TAGLINE = 'مدعوم من SAS Radius Server'

// Default Admin Credentials
export const DEFAULT_ADMIN = {
  username: 'admin',
  password: '34833'
}

// Storage Keys
export const STORAGE_KEYS = {
  SERVERS: 'sas_servers',
  USERS_PREFIX: 'sas_users_',
  TOKEN_PREFIX: 'sas_token_',
  CURRENT_SERVER: 'sas_current_server'
}

// API Endpoints
export const API_ENDPOINTS = {
  LOGIN: '/admin/api/index.php/api/login',
  DASHBOARD: '/admin/api/index.php/api/dashboard',
  PROFILES: '/admin/api/index.php/api/list/profile/0',
  MANAGERS: '/admin/api/index.php/api/index/manager',
  USERS: [
    '/index/user?page=1&count=500',
    '/users?page=1&count=500',
    '/list/user/0'
  ]
}

// Status Colors
export const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  expired: '#ef4444',
  disabled: '#6b7280'
}

// Theme Colors
export const COLORS = {
  primary: '#1e3a5f',
  primaryLight: '#3a5a8f',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  gray: '#6b7280'
}
