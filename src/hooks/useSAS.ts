import { useState, useCallback } from 'react'
import type { Server, User, Profile, Stats, ServerStats, Manager } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'

interface SyncAllResponse {
  success: boolean
  data?: {
    users: User[]
    profiles: Profile[]
    managers: Manager[]
    dashboard: unknown
    stats: Record<string, number>
    onlineUsers?: User[]
    errors?: string[]
  }
  message?: string
}

interface UseSASReturn {
  token: string | null
  isConnected: boolean
  isLoading: boolean
  users: User[]
  profiles: Profile[]
  managers: Manager[]
  dashboard: unknown
  serverStats: ServerStats
  stats: Stats
  syncStatus: string
  login: (server: Server) => Promise<string>
  syncAll: (server: Server, token: string) => Promise<SyncAllResponse>
  createUser: (server: Server, token: string, userData: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>
  updateUser: (server: Server, token: string, userId: number, userData: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>
  deleteUser: (server: Server, token: string, userId: number) => Promise<{ success: boolean; message?: string }>
  syncProfiles: (serverUrl: string, token: string) => Promise<void>
  loadCachedUsers: (serverId: string) => void
  setSyncStatus: (status: string) => void
  setToken: (token: string | null) => void
  setIsConnected: (connected: boolean) => void
}

export function useSAS(): UseSASReturn {
  const [token, setToken] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [dashboard, setDashboard] = useState<unknown>(null)
  const [serverStats, setServerStats] = useState<ServerStats>({})
  const [stats, setStats] = useState<Stats>({ 
    totalUsers: 0, 
    activeUsers: 0, 
    expiredUsers: 0, 
    totalDebt: 0 
  })
  const [syncStatus, setSyncStatus] = useState('')

  // Calculate stats from users list
  const calculateStats = useCallback((userList: User[]) => {
    const totalUsers = userList.length
    const activeUsers = userList.filter(u => u.enabled !== 0 && u.status === 'active').length
    const expiredUsers = userList.filter(u => u.status === 'expired').length
    const totalDebt = userList.reduce((sum, u) => sum + parseFloat(u.balance || '0'), 0)
    setStats({ totalUsers, activeUsers, expiredUsers, totalDebt })
  }, [])

  // Login to SAS server
  const login = useCallback(async (server: Server): Promise<string> => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/sas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          server: {
            url: server.url,
            username: server.username,
            password: server.password
          }
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.token) {
        setToken(data.token)
        setIsConnected(true)
        return data.token
      } else {
        setIsConnected(false)
        throw new Error(data.message || 'فشل تسجيل الدخول')
      }
    } catch (error) {
      setIsConnected(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load cached users from localStorage
  const loadCachedUsers = useCallback((serverId: string) => {
    const cached = localStorage.getItem(STORAGE_KEYS.USERS_PREFIX + serverId)
    if (cached) {
      try {
        const parsed: User[] = JSON.parse(cached)
        setUsers(parsed)
        calculateStats(parsed)
      } catch (e) {
        console.error('Failed to load cached users:', e)
      }
    }
  }, [calculateStats])

  // Sync profiles only
  const syncProfiles = useCallback(async (serverUrl: string, authToken: string) => {
    try {
      const response = await fetch('/api/sas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getProfiles',
          server: { url: serverUrl },
          token: authToken
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.profiles) {
        setProfiles(data.profiles)
      }
    } catch (e) {
      console.error('Failed to sync profiles:', e)
    }
  }, [])

  // Sync all data from server
  const syncAll = useCallback(async (server: Server, authToken: string): Promise<SyncAllResponse> => {
    setIsLoading(true)
    setSyncStatus('جاري تحميل جميع البيانات...')
    
    try {
      const response = await fetch('/api/sas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'syncAll',
          server: { url: server.url },
          token: authToken
        })
      })
      
      const data: SyncAllResponse = await response.json()
      
      if (data.success && data.data) {
        if (data.data.users && data.data.users.length > 0) {
          setUsers(data.data.users)
          calculateStats(data.data.users)
          localStorage.setItem(STORAGE_KEYS.USERS_PREFIX + server.id, JSON.stringify(data.data.users))
        }
        
        if (data.data.profiles) {
          setProfiles(data.data.profiles)
        }
        
        if (data.data.managers) {
          setManagers(data.data.managers)
        }
        
        if (data.data.dashboard) {
          setDashboard(data.data.dashboard)
        }
        
        if (data.data.stats) {
          setServerStats(data.data.stats)
        }
        
        const msg = `✅ تم تحميل ${data.data.users?.length || 0} مشترك، ${data.data.profiles?.length || 0} باقة، ${data.data.managers?.length || 0} مدير`
        setSyncStatus(msg)
        
        return data
      } else {
        setSyncStatus('❌ ' + (data.message || 'فشل تحميل البيانات'))
        return data
      }
    } catch (error) {
      const errorMsg = 'خطأ في تحميل البيانات: ' + (error instanceof Error ? error.message : 'خطأ غير معروف')
      setSyncStatus(errorMsg)
      return { success: false, message: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [calculateStats])

  // Create user
  const createUser = useCallback(async (
    server: Server, 
    authToken: string, 
    userData: Record<string, unknown>
  ): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/sas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createUser',
          server: { url: server.url },
          token: authToken,
          userData
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSyncStatus('✅ تم إنشاء المستخدم بنجاح')
        return { success: true, message: data.message }
      } else {
        setSyncStatus('❌ ' + (data.message || 'فشل إنشاء المستخدم'))
        return { success: false, message: data.message }
      }
    } catch (error) {
      const errorMsg = 'خطأ: ' + (error instanceof Error ? error.message : 'خطأ غير معروف')
      setSyncStatus(errorMsg)
      return { success: false, message: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update user
  const updateUser = useCallback(async (
    server: Server, 
    authToken: string, 
    userId: number, 
    userData: Record<string, unknown>
  ): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/sas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateUser',
          server: { url: server.url },
          token: authToken,
          userId,
          userData
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSyncStatus('✅ تم تحديث المستخدم بنجاح')
        return { success: true, message: data.message }
      } else {
        setSyncStatus('❌ ' + (data.message || 'فشل تحديث المستخدم'))
        return { success: false, message: data.message }
      }
    } catch (error) {
      const errorMsg = 'خطأ: ' + (error instanceof Error ? error.message : 'خطأ غير معروف')
      setSyncStatus(errorMsg)
      return { success: false, message: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Delete user
  const deleteUser = useCallback(async (
    server: Server, 
    authToken: string, 
    userId: number
  ): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/sas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteUser',
          server: { url: server.url },
          token: authToken,
          userId
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSyncStatus('✅ تم حذف المستخدم بنجاح')
        return { success: true, message: data.message }
      } else {
        setSyncStatus('❌ ' + (data.message || 'فشل حذف المستخدم'))
        return { success: false, message: data.message }
      }
    } catch (error) {
      const errorMsg = 'خطأ: ' + (error instanceof Error ? error.message : 'خطأ غير معروف')
      setSyncStatus(errorMsg)
      return { success: false, message: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    token,
    isConnected,
    isLoading,
    users,
    profiles,
    managers,
    dashboard,
    serverStats,
    stats,
    syncStatus,
    login,
    syncAll,
    createUser,
    updateUser,
    deleteUser,
    syncProfiles,
    loadCachedUsers,
    setSyncStatus,
    setToken,
    setIsConnected
  }
}
