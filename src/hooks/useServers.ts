import { useState, useCallback } from 'react'
import type { Server } from '@/types'
import { STORAGE_KEYS } from '@/utils/constants'

interface UseServersReturn {
  servers: Server[]
  currentServer: Server | null
  setCurrentServer: (server: Server | null) => void
  addServer: (server: Omit<Server, 'id' | 'isDefault'>) => Server
  deleteServer: (id: string) => void
  updateServer: (id: string, updates: Partial<Server>) => void
  setDefaultServer: (id: string) => void
  updateLastSync: (id: string) => void
  saveServers: (servers: Server[]) => void
}

// Helper function to load servers from localStorage
function loadSavedServers(): { servers: Server[], defaultServer: Server | null } {
  if (typeof window === 'undefined') {
    return { servers: [], defaultServer: null }
  }
  
  const saved = localStorage.getItem(STORAGE_KEYS.SERVERS)
  if (saved) {
    try {
      const parsed: Server[] = JSON.parse(saved)
      const defaultServer = parsed.find(s => s.isDefault) || null
      return { servers: parsed, defaultServer }
    } catch (e) {
      console.error('Failed to load servers:', e)
    }
  }
  return { servers: [], defaultServer: null }
}

export function useServers(): UseServersReturn {
  // Use lazy initialization with a function
  const [servers, setServers] = useState<Server[]>(() => loadSavedServers().servers)
  const [currentServer, setCurrentServer] = useState<Server | null>(() => loadSavedServers().defaultServer)

  // Save servers to localStorage
  const saveServers = useCallback((newServers: Server[]) => {
    localStorage.setItem(STORAGE_KEYS.SERVERS, JSON.stringify(newServers))
    setServers(newServers)
  }, [])

  // Add a new server
  const addServer = useCallback((serverData: Omit<Server, 'id' | 'isDefault'>): Server => {
    const newServer: Server = {
      ...serverData,
      id: Date.now().toString(),
      isDefault: servers.length === 0
    }
    
    const updated = [...servers, newServer]
    saveServers(updated)
    
    return newServer
  }, [servers, saveServers])

  // Delete a server
  const deleteServer = useCallback((id: string) => {
    const updated = servers.filter(s => s.id !== id)
    saveServers(updated)
    
    if (currentServer?.id === id) {
      setCurrentServer(null)
    }
  }, [servers, currentServer, saveServers])

  // Update a server
  const updateServer = useCallback((id: string, updates: Partial<Server>) => {
    const updated = servers.map(s => 
      s.id === id ? { ...s, ...updates } : s
    )
    saveServers(updated)
    
    if (currentServer?.id === id) {
      setCurrentServer({ ...currentServer, ...updates })
    }
  }, [servers, currentServer, saveServers])

  // Set default server
  const setDefaultServer = useCallback((id: string) => {
    const updated = servers.map(s => ({
      ...s,
      isDefault: s.id === id
    }))
    saveServers(updated)
  }, [servers, saveServers])

  // Update last sync time
  const updateLastSync = useCallback((id: string) => {
    updateServer(id, { lastSync: new Date().toLocaleString('ar') })
  }, [updateServer])

  return {
    servers,
    currentServer,
    setCurrentServer,
    addServer,
    deleteServer,
    updateServer,
    setDefaultServer,
    updateLastSync,
    saveServers
  }
}
