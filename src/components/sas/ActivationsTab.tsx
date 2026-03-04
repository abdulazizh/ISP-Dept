'use client'

import { useState, useEffect } from 'react'
import type { ActivationLog, Server } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface ActivationsTabProps {
  currentServer: Server | null
  isConnected: boolean
  isLoading: boolean
  activationLogs: ActivationLog[]
  onGetActivationLog: (userId?: number, page?: number) => Promise<{ success: boolean; logs?: ActivationLog[]; total?: number; message?: string }>
}

export function ActivationsTab({
  currentServer,
  isConnected,
  isLoading,
  activationLogs,
  onGetActivationLog
}: ActivationsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const [loadingLocal, setLoadingLocal] = useState(false)

  useEffect(() => {
    if (isConnected && currentServer) {
      loadActivationLog()
    }
  }, [isConnected, currentServer])

  const loadActivationLog = async (page: number = 1) => {
    setLoadingLocal(true)
    const result = await onGetActivationLog(undefined, page)
    if (result.success && result.total) {
      setTotalLogs(result.total)
      setCurrentPage(page)
    }
    setLoadingLocal(false)
  }

  const filteredLogs = activationLogs.filter(log => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      (log.username && log.username.toLowerCase().includes(query)) ||
      (log.profile_name && log.profile_name.toLowerCase().includes(query)) ||
      (log.manager_username && log.manager_username.toLowerCase().includes(query)) ||
      (log.action && log.action.toLowerCase().includes(query)) ||
      (log.description && log.description.toLowerCase().includes(query))
    )
  })

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const getActionLabel = (action?: string) => {
    switch (action?.toLowerCase()) {
      case 'activate':
      case 'activation':
        return { label: 'تفعيل', color: '#22c55e', bg: '#dcfce7' }
      case 'renew':
      case 'renewal':
        return { label: 'تجديد', color: '#3b82f6', bg: '#dbeafe' }
      case 'deactivate':
      case 'deactivation':
        return { label: 'تعطيل', color: '#ef4444', bg: '#fee2e2' }
      case 'disconnect':
        return { label: 'قطع اتصال', color: '#f97316', bg: '#ffedd5' }
      case 'profile_change':
        return { label: 'تغيير باقة', color: '#8b5cf6', bg: '#ede9fe' }
      default:
        return { label: action || 'عملية', color: '#6b7280', bg: '#f3f4f6' }
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ margin: 0, color: '#1e3a5f' }}>
          سجل التفعيلات ({filteredLogs.length})
        </h2>
        <button
          onClick={() => loadActivationLog(1)}
          disabled={!isConnected || isLoading || loadingLocal}
          style={{
            background: '#1e3a5f',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            cursor: !isConnected || isLoading || loadingLocal ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: !isConnected || isLoading || loadingLocal ? 0.6 : 1
          }}
        >
          🔄 تحديث
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="🔍 بحث بالاسم، الباقة، المدير، أو نوع العملية..."
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

      {/* Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          background: '#dcfce7',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>
            {activationLogs.filter(l => l.action?.toLowerCase() === 'activate' || l.action?.toLowerCase() === 'activation').length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#15803d' }}>تفعيلات</div>
        </div>
        <div style={{
          background: '#dbeafe',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
            {activationLogs.filter(l => l.action?.toLowerCase() === 'renew' || l.action?.toLowerCase() === 'renewal').length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#1d4ed8' }}>تجديدات</div>
        </div>
        <div style={{
          background: '#fee2e2',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
            {activationLogs.filter(l => l.action?.toLowerCase() === 'deactivate' || l.action?.toLowerCase() === 'deactivation').length}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>تعطيلات</div>
        </div>
        <div style={{
          background: '#f3f4f6',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>
            {totalLogs}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>إجمالي السجل</div>
        </div>
      </div>

      {/* Logs List */}
      {!isConnected ? (
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '1rem',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
          <p style={{ color: '#6b7280' }}>يرجى الاتصال بالسيرفر أولاً</p>
        </div>
      ) : loadingLocal || isLoading ? (
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '1rem',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#6b7280' }}>جاري تحميل السجل...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '1rem',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
          <p style={{ color: '#6b7280' }}>
            {searchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'لا يوجد سجل تفعيلات'}
          </p>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
            padding: '1rem',
            background: '#f8fafc',
            borderBottom: '1px solid #e5e7eb',
            fontWeight: 600,
            fontSize: '0.85rem',
            color: '#374151'
          }}>
            <div>المستخدم</div>
            <div>العملية</div>
            <div>الباقة</div>
            <div>المبلغ</div>
            <div>المدير</div>
            <div>التاريخ</div>
          </div>

          {/* Table Body */}
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {filteredLogs.map((log, index) => {
              const actionInfo = getActionLabel(log.action)
              return (
                <div
                  key={log.id || index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid #f3f4f6',
                    fontSize: '0.9rem',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ fontWeight: 500, color: '#1e3a5f' }}>
                    {log.username || `#${log.user_id}`}
                  </div>
                  <div>
                    <span style={{
                      background: actionInfo.bg,
                      color: actionInfo.color,
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.8rem',
                      fontWeight: 500
                    }}>
                      {actionInfo.label}
                    </span>
                  </div>
                  <div style={{ color: '#6b7280' }}>
                    {log.profile_name || '-'}
                  </div>
                  <div style={{ fontWeight: 500, color: parseFloat(String(log.amount || log.price || 0)) > 0 ? '#166534' : '#6b7280' }}>
                    {log.amount || log.price ? formatCurrency(String(log.amount || log.price)) : '-'}
                  </div>
                  <div style={{ color: '#6b7280' }}>
                    {log.manager_username || log.created_by || '-'}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                    {formatDate(log.created_at)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalLogs > 100 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '1rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => loadActivationLog(currentPage - 1)}
                disabled={currentPage === 1 || loadingLocal}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  background: 'white',
                  cursor: currentPage === 1 || loadingLocal ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                السابق
              </button>
              <span style={{ padding: '0.5rem 1rem', color: '#6b7280' }}>
                صفحة {currentPage}
              </span>
              <button
                onClick={() => loadActivationLog(currentPage + 1)}
                disabled={activationLogs.length < 100 || loadingLocal}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  background: 'white',
                  cursor: activationLogs.length < 100 || loadingLocal ? 'not-allowed' : 'pointer',
                  opacity: activationLogs.length < 100 ? 0.5 : 1
                }}
              >
                التالي
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
