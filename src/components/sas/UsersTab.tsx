'use client'

import { useState } from 'react'
import type { User, Profile, Server } from '@/types'
import { formatCurrency, getStatusColor } from '@/utils/formatters'
import { UserDetailModal } from './UserDetailModal'
import { CreateUserModal } from './CreateUserModal'

interface UsersTabProps {
  users: User[]
  profiles: Profile[]
  currentServer: Server | null
  isConnected: boolean
  isLoading: boolean
  onSync: () => void
  onUpdateUser: (userId: number, data: Record<string, unknown>) => Promise<boolean>
  onCreateUser: (userData: Record<string, unknown>) => Promise<boolean>
}

export function UsersTab({ 
  users, 
  profiles,
  currentServer, 
  isConnected, 
  isLoading, 
  onSync,
  onUpdateUser,
  onCreateUser
}: UsersTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'online'>('all')

  const filteredUsers = users.filter(u => {
    // Search filter
    const matchesSearch = 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.firstname && u.firstname.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.includes(searchQuery))
    
    // Status filter
    let matchesStatus = true
    if (statusFilter === 'active') {
      matchesStatus = u.status === 'active' && u.enabled !== 0
    } else if (statusFilter === 'expired') {
      matchesStatus = u.status === 'expired'
    } else if (statusFilter === 'online') {
      matchesStatus = u.online_status === 1
    }
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active' && u.enabled !== 0).length,
    expired: users.filter(u => u.status === 'expired').length,
    online: users.filter(u => u.online_status === 1).length
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, color: '#1e3a5f' }}>
          المشتركين ({filteredUsers.length})
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!isConnected || profiles.length === 0}
            style={{
              background: '#22c55e',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: !isConnected || profiles.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ➕ إضافة مشترك
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="🔍 بحث بالاسم، اسم المستخدم، أو الهاتف..."
          style={{
            width: '100%',
            padding: '1rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            direction: 'rtl'
          }}
        />
      </div>

      {/* Status Filters */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'all', label: `الكل (${stats.total})`, color: '#1e3a5f' },
          { id: 'active', label: `نشط (${stats.active})`, color: '#22c55e' },
          { id: 'online', label: `متصل (${stats.online})`, color: '#3b82f6' },
          { id: 'expired', label: `منتهي (${stats.expired})`, color: '#ef4444' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setStatusFilter(filter.id as 'all' | 'active' | 'expired' | 'online')}
            style={{
              background: statusFilter === filter.id ? filter.color : '#f3f4f6',
              color: statusFilter === filter.id ? 'white' : '#374151',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Users List */}
      {users.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '1rem',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            {!currentServer ? 'لم يتم تحديد سيرفر' : !isConnected ? 'غير متصل بالسيرفر' : 'لا توجد بيانات'}
          </p>
          {currentServer && isConnected && (
            <button
              onClick={onSync}
              disabled={isLoading}
              style={{
                background: '#1e3a5f',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              🔄 مزامنة البيانات
            </button>
          )}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          textAlign: 'center'
        }}>
          <p style={{ color: '#6b7280' }}>لا توجد نتائج مطابقة للبحث</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {filteredUsers.map(user => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              style={{
                background: 'white',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.1s',
                border: user.online_status === 1 ? '1px solid #3b82f6' : '1px solid transparent'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateX(-2px)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateX(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: user.online_status === 1 ? '#3b82f6' : getStatusColor(user.status),
                  boxShadow: user.online_status === 1 ? '0 0 6px #3b82f6' : 'none'
                }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#1e3a5f', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {user.username}
                    {user.enabled === 0 && (
                      <span style={{ 
                        background: '#fee2e2', 
                        color: '#dc2626', 
                        fontSize: '0.7rem', 
                        padding: '0.1rem 0.4rem', 
                        borderRadius: '0.25rem' 
                      }}>معطل</span>
                    )}
                    {user.online_status === 1 && (
                      <span style={{ 
                        background: '#dbeafe', 
                        color: '#1d4ed8', 
                        fontSize: '0.7rem', 
                        padding: '0.1rem 0.4rem', 
                        borderRadius: '0.25rem' 
                      }}>متصل</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {[user.firstname, user.lastname].filter(Boolean).join(' ') || 'بدون اسم'}
                    {user.phone && ` • ${user.phone}`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  background: '#f3f4f6',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.8rem',
                  color: '#374151'
                }}>
                  {user.profile || '-'}
                </span>
                <span style={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: parseFloat(user.balance) < 0 ? '#dc2626' : '#166534'
                }}>
                  {formatCurrency(user.balance)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Detail Modal */}
      <UserDetailModal
        user={selectedUser}
        profiles={profiles}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onUpdate={onUpdateUser}
        onRefresh={onSync}
      />

      {/* Create User Modal */}
      <CreateUserModal
        profiles={profiles}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={onCreateUser}
      />
    </div>
  )
}
