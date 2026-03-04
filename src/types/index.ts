// Server Types
export interface Server {
  id: string
  name: string
  url: string
  username: string
  password: string
  isDefault: boolean
  lastSync?: string
}

// Profile Types
export interface Profile {
  id: number
  name: string
  price?: string
  download?: string
  upload?: string
  limit?: string
  uprate?: number
  downrate?: number
  expiration_unit?: number
  expiration_amount?: number
  enabled?: number
}

// User Types
export interface User {
  id: number
  username: string
  firstname?: string
  lastname?: string
  email?: string
  phone?: string
  balance: string
  profile?: string
  profile_id?: number
  profile_name?: string
  status: string
  expiration?: string
  created_at?: string
  last_online?: string
  enabled?: number
  online_status?: number
  parent_id?: number
  parent_username?: string
  debt_days?: number
  notes?: string
  address?: string
  city?: string
  static_ip?: string
  simultaneous_sessions?: number
  daily_traffic_details?: {
    user_id: number
    traffic: number
  }
  profile_details?: {
    id: number
    name: string
    type: number
  }
}

// Manager Types
export interface Manager {
  id: number
  username: string
  email?: string
  firstname?: string
  lastname?: string
  phone?: string
  status?: string
  enabled?: number
  created_at?: string
  last_login?: string
  address?: string
  city?: string
  parent_id?: number
  parent_username?: string
  credits?: string | number
  balance?: string | number
  type?: number
  language?: string
  permissions?: Record<string, unknown>
}

// Stats Types
export interface Stats {
  totalUsers: number
  activeUsers: number
  expiredUsers: number
  totalDebt: number
}

// Server Stats (from dashboard widgets)
export interface ServerStats {
  total_users?: number
  active_users?: number
  expired_users?: number
  online_users?: number
  total_managers?: number
  total_profiles?: number
  total_nas?: number
  total_income?: number
  [key: string]: number | undefined
}

// Activation Log Types
export interface ActivationLog {
  id: number
  user_id: number
  username?: string
  profile_id?: number
  profile_name?: string
  action?: string
  type?: string
  amount?: string | number
  price?: string | number
  duration?: string
  expiration?: string
  created_at?: string
  created_by?: string
  manager_username?: string
  description?: string
  status?: string
}

// Activation Log Types
export interface ActivationLog {
  id: number
  user_id: number
  username?: string
  profile_id?: number
  profile_name?: string
  action?: string
  amount?: number
  price?: number
  months?: number
  created_at?: string
  manager_id?: number
  manager_username?: string
  created_by?: string
  description?: string
  status?: string
}

// Tab Types
export type TabId = 'dashboard' | 'servers' | 'users' | 'profiles' | 'managers' | 'activations'

export interface Tab {
  id: TabId
  label: string
  icon: string
}

// API Response Types
export interface LoginResponse {
  success: boolean
  token?: string
  message?: string
}

export interface ProfilesResponse {
  success: boolean
  profiles?: Profile[]
  message?: string
}

export interface UsersResponse {
  success: boolean
  users?: User[]
  message?: string
  requiresAdmin?: boolean
}

export interface DashboardResponse {
  success: boolean
  dashboard?: unknown
  stats?: Record<string, number>
  message?: string
}

export interface SyncAllResponse {
  success: boolean
  data?: {
    users: User[]
    profiles: Profile[]
    managers: Manager[]
    dashboard: unknown
    stats: Record<string, number>
  }
  message?: string
}
