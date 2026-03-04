'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TabId, Server, User } from '@/types'
import { useServers } from '@/hooks/useServers'
import { useSAS } from '@/hooks/useSAS'
import { cleanUrl } from '@/utils/formatters'
import {
  Header,
  Navigation,
  StatusMessage,
  PermissionInfo,
  DashboardTab,
  ServersTab,
  ProfilesTab,
  UsersTab,
  ManagersTab,
  Footer
} from '@/components/sas'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  
  // Server management hook
  const {
    servers,
    currentServer,
    setCurrentServer,
    addServer,
    deleteServer,
    updateLastSync
  } = useServers()
  
  // SAS API hook
  const {
    token,
    isConnected,
    isLoading,
    users,
    profiles,
    managers,
    serverStats,
    stats,
    syncStatus,
    login,
    syncAll,
    createUser,
    updateUser,
    loadCachedUsers,
    setSyncStatus,
    setToken,
    setIsConnected
  } = useSAS()

  // Connect to server
  const connectToServer = useCallback(async (server: Server) => {
    setCurrentServer(server)
    
    try {
      const authToken = await login(server)
      loadCachedUsers(server.id)
      await syncAll(server, authToken)
    } catch (error) {
      alert('فشل الاتصال: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'))
    }
  }, [login, loadCachedUsers, setCurrentServer, syncAll])

  // Auto-connect to default server on mount
  useEffect(() => {
    if (currentServer && !isConnected && !token) {
      connectToServer(currentServer)
    }
  }, [])

  // Handle add server
  const handleAddServer = useCallback((data: { name: string; url: string; username: string; password: string }) => {
    const newServer = addServer(data)
    connectToServer(newServer)
  }, [addServer, connectToServer])

  // Handle delete server
  const handleDeleteServer = useCallback((id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السيرفر؟')) return
    
    deleteServer(id)
    
    if (currentServer?.id === id) {
      setCurrentServer(null)
      setIsConnected(false)
      setToken(null)
    }
  }, [deleteServer, currentServer, setCurrentServer, setIsConnected, setToken])

  // Test connection
  const testConnection = useCallback(async (url: string, username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/sas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          server: {
            url: cleanUrl(url),
            username,
            password
          }
        })
      })
      
      const data = await response.json()
      return data.success
    } catch {
      return false
    }
  }, [])

  // Handle sync all data
  const handleSync = useCallback(async () => {
    if (!currentServer || !token) return
    
    const result = await syncAll(currentServer, token)
    if (result.success) {
      updateLastSync(currentServer.id)
    }
  }, [currentServer, token, syncAll, updateLastSync])

  // Handle create user
  const handleCreateUser = useCallback(async (userData: Record<string, unknown>): Promise<boolean> => {
    if (!currentServer || !token) {
      alert('غير متصل بالسيرفر')
      return false
    }
    
    const result = await createUser(currentServer, token, userData)
    if (result.success) {
      await handleSync()
      return true
    } else {
      alert(result.message || 'فشل إنشاء المشترك')
      return false
    }
  }, [currentServer, token, createUser, handleSync])

  // Handle update user
  const handleUpdateUser = useCallback(async (userId: number, userData: Record<string, unknown>): Promise<boolean> => {
    if (!currentServer || !token) {
      alert('غير متصل بالسيرفر')
      return false
    }
    
    const result = await updateUser(currentServer, token, userId, userData)
    if (result.success) {
      await handleSync()
      return true
    } else {
      alert(result.message || 'فشل تحديث المشترك')
      return false
    }
  }, [currentServer, token, updateUser, handleSync])

  // Handle tab change
  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab)
  }, [])

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <Header
        currentServer={currentServer}
        isConnected={isConnected}
        isLoading={isLoading}
        onSync={handleSync}
      />

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Status Message */}
        <StatusMessage message={syncStatus} />
        
        {/* Permission Info */}
        <PermissionInfo
          currentServer={currentServer}
          isConnected={isConnected}
        />

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            currentServer={currentServer}
            stats={stats}
            serverStats={serverStats}
            onAddServer={() => setActiveTab('servers')}
          />
        )}

        {/* Servers Tab */}
        {activeTab === 'servers' && (
          <ServersTab
            servers={servers}
            currentServer={currentServer}
            isConnected={isConnected}
            isLoading={isLoading}
            onConnect={connectToServer}
            onDelete={handleDeleteServer}
            onAddServer={handleAddServer}
            onTestConnection={testConnection}
          />
        )}

        {/* Profiles Tab */}
        {activeTab === 'profiles' && (
          <ProfilesTab
            profiles={profiles}
            currentServer={currentServer}
            isConnected={isConnected}
            isLoading={isLoading}
            onRefresh={handleSync}
          />
        )}

        {/* Users Tab */}
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

        {/* Managers Tab */}
        {activeTab === 'managers' && (
          <ManagersTab managers={managers} />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
