'use client'

import { useState } from 'react'
import type { Server } from '@/types'
import { ServerCard } from './ServerCard'
import { ServerForm } from './ServerForm'

interface ServersTabProps {
  servers: Server[]
  currentServer: Server | null
  isConnected: boolean
  isLoading: boolean
  onConnect: (server: Server) => void
  onDelete: (id: string) => void
  onAddServer: (data: { name: string; url: string; username: string; password: string }) => void
  onTestConnection: (url: string, username: string, password: string) => Promise<boolean>
}

export function ServersTab({ 
  servers, 
  currentServer, 
  isConnected,
  isLoading,
  onConnect, 
  onDelete, 
  onAddServer,
  onTestConnection
}: ServersTabProps) {
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, color: '#1e3a5f' }}>
          السيرفرات المسجلة ({servers.length})
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            background: '#1e3a5f',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          ➕ إضافة سيرفر
        </button>
      </div>

      {showAddForm && (
        <ServerForm
          onSubmit={(data) => {
            onAddServer(data)
            setShowAddForm(false)
          }}
          onCancel={() => setShowAddForm(false)}
          isLoading={isLoading}
          onTestConnection={onTestConnection}
        />
      )}

      {servers.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '1rem',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🖥️</div>
          <p style={{ color: '#6b7280' }}>لا توجد سيرفرات مسجلة</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {servers.map(server => (
            <ServerCard
              key={server.id}
              server={server}
              isActive={currentServer?.id === server.id}
              isConnected={isConnected && currentServer?.id === server.id}
              onConnect={() => onConnect(server)}
              onDelete={() => onDelete(server.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
