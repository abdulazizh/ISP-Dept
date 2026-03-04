'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Server, TabId, ServerStats } from '@/types'
import { useSAS } from '@/hooks/useSAS'
import { useServers } from '@/hooks/useServers'
import {
  Header,
  Navigation,
  StatsCards,
  StatusMessage,
  ServersTab,
  ProfilesTab,
  UsersTab,
  ManagersTab,
  ActivationsTab,
  Footer
} from '@/components/sas'
import { STORAGE_KEYS } from '@/utils/constants'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [currentServer, setCurrentServer] = useState<Server | null>(null)
  const [serverStats, setServerStats] = useState<ServerStats>({})
  
  const {
    token,
    isConnected,
    isLoading,
    users,
    profiles,
    managers,
    stats,
    syncStatus,
    activationLogs,
    login,
    syncAll,
    createUser,
    updateUser,
    deleteUser,
    setSyncStatus,
    setToken,
    setIsConnected,
    getActivationLog,
    activateUser,
    deactivateUser,
    disconnectUser,
    renewSubscription
  } = useSAS()
  
  const { servers, addServer, updateServer, deleteServer, setDefaultServer } = useServers()
  
  // Load saved server on mount
  useEffect(() => {
    const savedServerId = localStorage.getItem(STORAGE_KEYS.CURRENT_SERVER)
    if (savedServerId) {
      const server = servers.find(s => s.id === savedServerId)
      if (server) {
        setCurrentServer(server)
      }
    } else if (servers.length > 0) {
      const defaultServer = servers.find(s => s.isDefault) || servers[0]
      setCurrentServer(defaultServer)
    }
  }, [servers])
  
  // Auto-connect on mount if server exists
  useEffect(() => {
    const autoConnect = async () => {
      if (currentServer && !token) {
        try {
          const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN_PREFIX + currentServer.id)
          if (savedToken) {
            setToken(savedToken)
            setIsConnected(true)
          } else {
            await login(currentServer)
          }
        } catch (error) {
          console.error('Auto-connect failed:', error)
        }
      }
    }
    autoConnect()
  }, [currentServer, token, login, setToken, setIsConnected])
  
  // Handle server select
  const handleSelectServer = useCallback(async (server: Server) => {
    setCurrentServer(server)
    localStorage.setItem(STORAGE_KEYS.CURRENT_SERVER, server.id)
    setSyncStatus('')
    
    try {
      await login(server)
    } catch (error) {
      console.error('Login failed:', error)
    }
  }, [login, setSyncStatus])
  
  // Handle sync
  const handleSync = useCallback(async () => {
    if (!currentServer || !token) return
    
    try {
      const result = await syncAll(currentServer, token)
      if (result.success && result.data?.stats) {
        setServerStats(result.data.stats)
      }
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }, [currentServer, token, syncAll])
  
  // Handle create user
  const handleCreateUser = useCallback(async (userData: Record<string, unknown>) => {
    if (!currentServer || !token) return false
    
    const result = await createUser(currentServer, token, userData)
    if (result.success) {
      await handleSync()
    }
    return result.success
  }, [currentServer, token, createUser, handleSync])
  
  // Handle update user
  const handleUpdateUser = useCallback(async (userId: number, userData: Record<string, unknown>) => {
    if (!currentServer || !token) return false
    
    const result = await updateUser(currentServer, token, userId, userData)
    if (result.success) {
      await handleSync()
    }
    return result.success
  }, [currentServer, token, updateUser, handleSync])
  
  // Handle delete user
  const handleDeleteUser = useCallback(async (userId: number) => {
    if (!currentServer || !token) return false
    
    const result = await deleteUser(currentServer, token, userId)
    if (result.success) {
      await handleSync()
    }
    return result.success
  }, [currentServer, token, deleteUser, handleSync])
  
  // Handle get activation log
  const handleGetActivationLog = useCallback(async (userId?: number, page?: number) => {
    if (!currentServer || !token) {
      return { success: false, message: 'غير متصل بالسيرفر' }
    }
    return getActivationLog(currentServer, token, userId, page)
  }, [currentServer, token, getActivationLog])

  // Handle test connection
  const handleTestConnection = useCallback(async (url: string, username: string, password: string) => {
    try {
      const response = await fetch('/api/sas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          server: { url, username, password }
        })
      })
      const data = await response.json()
      return data.success
    } catch {
      return false
    }
  }, [])

  // Handle add server
  const handleAddServer = useCallback((data: { name: string; url: string; username: string; password: string }) => {
    addServer(data)
  }, [addServer])

  // Handle delete server
  const handleDeleteServer = useCallback((id: string) => {
    deleteServer(id)
    if (currentServer?.id === id) {
      setCurrentServer(null)
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SERVER)
    }
  }, [deleteServer, currentServer])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f7fa',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header
        currentServer={currentServer}
        isConnected={isConnected}
        isLoading={isLoading}
        onSync={handleSync}
      />
      
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <main style={{
        flex: 1,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1rem',
        width: '100%'
      }}>
        {syncStatus && (
          <StatusMessage message={syncStatus} />
        )}
        
        {activeTab === 'dashboard' && (
          <>
            <StatsCards
              stats={stats}
              serverStats={serverStats}
            />
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              marginTop: '1rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{ color: '#1e3a5f', marginBottom: '1rem' }}>مرحباً بك في نظام إدارة المشتركين</h3>
              <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
                هذا النظام يتيح لك إدارة السيرفرات والمشتركين والباقات والتفعيلات.
                اختر من القائمة أعلاه للبدء.
              </p>
              {!isConnected && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#fef3c7',
                  borderRadius: '0.5rem',
                  color: '#92400e'
                }}>
                  ⚠️ يرجى اختيار سيرفر والاتصال به للبدء
                </div>
              )}
            </div>
          </>
        )}
        
        {activeTab === 'servers' && (
          <ServersTab
            servers={servers}
            currentServer={currentServer}
            isConnected={isConnected}
            isLoading={isLoading}
            onConnect={handleSelectServer}
            onDelete={handleDeleteServer}
            onAddServer={handleAddServer}
            onTestConnection={handleTestConnection}
          />
        )}
        
        {activeTab === 'profiles' && (
          <ProfilesTab
            profiles={profiles}
            currentServer={currentServer}
            isConnected={isConnected}
            isLoading={isLoading}
            onRefresh={handleSync}
          />
        )}
        
        {activeTab === 'users' && (
          <UsersTab
            users={users}
            profiles={profiles}
            currentServer={currentServer}
            isConnected={isConnected}
            isLoading={isLoading}
            onSync={handleSync}
            onUpdateUser={handleUpdateUser}
            onCreateUser={handleCreateUser}
          />
        )}
        
        {activeTab === 'managers' && (
          <ManagersTab
            managers={managers}
          />
        )}
        
        {activeTab === 'activations' && (
          <ActivationsTab
            currentServer={currentServer}
            isConnected={isConnected}
            isLoading={isLoading}
            activationLogs={activationLogs}
            onGetActivationLog={handleGetActivationLog}
          />
        )}
      </main>
      
      <Footer />
    </div>
  )
}
