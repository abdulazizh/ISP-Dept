import { NextRequest, NextResponse } from 'next/server'
import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = 'abcdefghijuklmno0123456789012345'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Helper function to add CORS to all responses
function corsResponse(data: object) {
  return NextResponse.json(data, { headers: corsHeaders })
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

function encryptPayload(data: object): string {
  const json = JSON.stringify(data)
  const encrypted = CryptoJS.AES.encrypt(json, ENCRYPTION_KEY)
  return encrypted.toString()
}

interface ApiResponse {
  status?: number
  data?: unknown
  message?: string
  errors?: Record<string, string[]>
}

async function apiRequest(
  baseUrl: string, 
  method: string, 
  endpoint: string, 
  token: string, 
  body?: object
): Promise<ApiResponse> {
  const url = `${baseUrl}/admin/api/index.php/api${endpoint}`
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  if (body && method !== 'GET') {
    options.body = JSON.stringify({ payload: encryptPayload(body) })
  }

  try {
    const response = await fetch(url, options)
    const text = await response.text()
    
    try {
      return JSON.parse(text)
    } catch {
      return { status: response.status, message: text.substring(0, 100) }
    }
  } catch (e) {
    return { status: 500, message: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, server, token, userId, userData } = body

    console.log('API Request:', action)

    // ==================== LOGIN ====================
    if (action === 'login') {
      const payload = encryptPayload({
        username: server.username,
        password: server.password,
        language: 'ar'
      })

      const response = await fetch(`${server.url}/admin/api/index.php/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload })
      })

      const data: ApiResponse = await response.json()

      if (data.status === 200 && (data as { token?: string }).token) {
        return corsResponse({ success: true, token: (data as { token: string }).token })
      }
      return corsResponse({ success: false, message: data.message || 'فشل تسجيل الدخول' })
    }

    // ==================== SYNC ALL DATA ====================
    if (action === 'syncAll') {
      const [usersRes, profilesRes, managersRes, dashRes, onlineRes] = await Promise.all([
        apiRequest(server.url, 'POST', '/index/user', token, { page: 1, count: 5000 }),
        apiRequest(server.url, 'GET', '/list/profile/0', token),
        apiRequest(server.url, 'POST', '/index/manager', token, { page: 1, count: 5000 }),
        apiRequest(server.url, 'GET', '/dashboard', token),
        apiRequest(server.url, 'POST', '/index/online', token, { page: 1, count: 5000 })
      ])

      const results = {
        users: [] as unknown[],
        profiles: [] as unknown[],
        managers: [] as unknown[],
        dashboard: dashRes.data,
        stats: {} as Record<string, number>,
        onlineUsers: [] as unknown[]
      }

      // Process users
      if (Array.isArray(usersRes.data)) {
        results.users = usersRes.data.map((u: Record<string, unknown>) => {
          const profileDetails = u.profile_details as { name?: string } | undefined
          const dailyTrafficDetails = u.daily_traffic_details as { traffic?: number } | undefined
          return {
            id: u.id,
            username: u.username,
            firstname: u.firstname || '',
            lastname: u.lastname || '',
            email: u.email || '',
            phone: u.phone || '',
            balance: String(u.balance || '0'),
            profile: profileDetails?.name || u.profile_id,
            profile_id: u.profile_id,
            status: u.enabled === 1 ? 'active' : 'disabled',
            expiration: u.expiration || '',
            enabled: u.enabled,
            online_status: u.online_status,
            last_online: u.last_online,
            created_at: u.created_at,
            parent_username: u.parent_username,
            debt_days: u.debt_days,
            daily_traffic: dailyTrafficDetails?.traffic
          }
        })
      }

      // Process profiles
      if (Array.isArray(profilesRes.data)) {
        results.profiles = profilesRes.data
      }

      // Process managers
      if (Array.isArray(managersRes.data)) {
        results.managers = managersRes.data.map((m: Record<string, unknown>) => ({
          id: m.id,
          username: m.username,
          email: m.email || '',
          firstname: m.firstname || '',
          lastname: m.lastname || '',
          phone: m.phone || '',
          status: m.enabled === 1 ? 'active' : 'disabled',
          enabled: m.enabled,
          created_at: m.created_at,
          last_login: m.last_login,
          address: m.address,
          city: m.city,
          parent_id: m.parent_id,
          parent_username: m.parent_username,
          credits: m.credits,
          balance: m.balance,
          type: m.type,
          language: m.language,
          permissions: m.permissions
        }))
      }

      // Process dashboard widgets
      if (dashRes.data && typeof dashRes.data === 'object') {
        const dashData = dashRes.data as { widgets?: unknown[] }
        for (const row of (dashData.widgets || []) as { widgets?: unknown[] }[]) {
          for (const widget of (row.widgets || []) as { name?: string; value?: number }[]) {
            if (widget.value !== undefined) {
              results.stats[widget.name?.toLowerCase().replace(/\s+/g, '_') || ''] = widget.value
            }
          }
        }
      }

      // Process online users
      if (Array.isArray(onlineRes.data)) {
        results.onlineUsers = onlineRes.data.filter((u: { online_status?: number }) => u.online_status === 1)
      }

      return corsResponse({ success: true, data: results })
    }

    // ==================== GET USER ====================
    if (action === 'getUser') {
      const result = await apiRequest(server.url, 'GET', `/user/${userId}`, token)
      if (result.data) {
        return corsResponse({ success: true, user: result.data })
      }
      return corsResponse({ success: false, message: result.message || 'فشل تحميل بيانات المستخدم' })
    }

    // ==================== CREATE USER ====================
    if (action === 'createUser') {
      const result = await apiRequest(server.url, 'POST', '/user', token, userData)
      if (result.status === 200 || result.status === 201) {
        return corsResponse({ success: true, user: result.data, message: result.message || 'تم إنشاء المستخدم بنجاح' })
      }
      return corsResponse({ success: false, message: result.message || 'فشل إنشاء المستخدم', errors: result.errors })
    }

    // ==================== UPDATE USER ====================
    if (action === 'updateUser') {
      const result = await apiRequest(server.url, 'PUT', `/user/${userId}`, token, userData)
      if (result.status === 200) {
        return corsResponse({ success: true, message: 'تم تحديث المستخدم بنجاح' })
      }
      return corsResponse({ success: false, message: result.message || 'فشل تحديث المستخدم', errors: result.errors })
    }

    // ==================== DELETE USER ====================
    if (action === 'deleteUser') {
      const result = await apiRequest(server.url, 'DELETE', `/user/${userId}`, token)
      if (result.status === 200) {
        return corsResponse({ success: true, message: 'تم حذف المستخدم بنجاح' })
      }
      return corsResponse({ success: false, message: result.message || 'فشل حذف المستخدم' })
    }

    // ==================== TOGGLE USER STATUS ====================
    if (action === 'toggleUser') {
      const newEnabled = userData?.enabled === 1 ? 0 : 1
      const result = await apiRequest(server.url, 'PUT', `/user/${userId}`, token, { enabled: newEnabled })
      if (result.status === 200) {
        return corsResponse({ success: true, message: newEnabled === 1 ? 'تم تفعيل المستخدم' : 'تم تعطيل المستخدم' })
      }
      return corsResponse({ success: false, message: result.message || 'فشل تغيير حالة المستخدم' })
    }

    // ==================== RENEW USER ====================
    if (action === 'renewUser') {
      const { profile_id, months } = userData || {}
      const result = await apiRequest(server.url, 'PUT', `/user/${userId}`, token, {
        profile_id,
        expiration: new Date(Date.now() + (months || 1) * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      })
      if (result.status === 200) {
        return corsResponse({ success: true, message: 'تم تجديد الاشتراك بنجاح' })
      }
      return corsResponse({ success: false, message: result.message || 'فشل تجديد الاشتراك' })
    }

    // ==================== ADD BALANCE ====================
    if (action === 'addBalance') {
      const { amount } = userData || {}
      const result = await apiRequest(server.url, 'PUT', `/user/${userId}`, token, { balance: amount })
      if (result.status === 200) {
        return corsResponse({ success: true, message: 'تم إضافة الرصيد بنجاح' })
      }
      return corsResponse({ success: false, message: result.message || 'فشل إضافة الرصيد' })
    }

    // ==================== GET PROFILES ====================
    if (action === 'getProfiles') {
      const result = await apiRequest(server.url, 'GET', '/list/profile/0', token)
      if (result.data) {
        return corsResponse({ success: true, profiles: result.data })
      }
      return corsResponse({ success: false, message: result.message || 'فشل تحميل الباقات' })
    }

    // ==================== GET PROFILE ====================
    if (action === 'getProfile') {
      const result = await apiRequest(server.url, 'GET', `/profile/${userId}`, token)
      if (result.data) {
        return corsResponse({ success: true, profile: result.data })
      }
      return corsResponse({ success: false, message: result.message || 'فشل تحميل الباقة' })
    }

    // ==================== GET NAS LIST ====================
    if (action === 'getNas') {
      const result = await apiRequest(server.url, 'GET', '/nas', token)
      if (result.data) {
        return corsResponse({ success: true, nas: result.data })
      }
      return corsResponse({ success: false, message: result.message || 'فشل تحميل NAS' })
    }

    // ==================== GET MANAGERS ====================
    if (action === 'getManagers') {
      const result = await apiRequest(server.url, 'GET', '/index/manager', token)
      if (result.data) {
        return corsResponse({ success: true, managers: result.data })
      }
      return corsResponse({ success: false, message: result.message || 'فشل تحميل المدراء' })
    }

    // ==================== GET ONLINE USERS ====================
    if (action === 'getOnlineUsers') {
      const result = await apiRequest(server.url, 'POST', '/index/user', token, { page: 1, count: 5000 })
      if (result.data) {
        const onlineUsers = (result.data as { online_status?: number }[]).filter(u => u.online_status === 1)
        return corsResponse({ success: true, onlineUsers })
      }
      return corsResponse({ success: false, message: result.message || 'فشل تحميل المتصلين' })
    }

    // ==================== SEARCH USERS ====================
    if (action === 'searchUsers') {
      const { query } = userData || {}
      const result = await apiRequest(server.url, 'POST', '/index/user', token, { page: 1, count: 100, search: query })
      if (result.data) {
        return corsResponse({ success: true, users: result.data })
      }
      return corsResponse({ success: false, message: result.message || 'فشل البحث' })
    }

    // ==================== GET ACTIVATION LOG ====================
    if (action === 'getActivationLog') {
      const { page = 1, count = 100, userId } = body
      const requestBody: Record<string, unknown> = { page, count }
      if (userId) {
        requestBody.user_id = userId
      }
      const result = await apiRequest(server.url, 'POST', '/report/activations', token, requestBody)
      if (result.data) {
        const logs = Array.isArray(result.data) ? result.data : (result.data as { data?: unknown[] }).data || []
        const total = (result.data as { total?: number }).total || logs.length
        return corsResponse({ success: true, logs, total })
      }
      return corsResponse({ success: false, message: result.message || 'فشل تحميل سجل التفعيلات' })
    }

    // ==================== ACTIVATE USER ====================
    if (action === 'activateUser') {
      const { profileId, months, amount } = body
      const activationData: Record<string, unknown> = {
        user_id: userId,
        profile_id: profileId
      }
      if (months) {
        activationData.months = months
      }
      if (amount) {
        activationData.amount = amount
      }
      const result = await apiRequest(server.url, 'POST', `/user/${userId}/activate`, token, activationData)
      if (result.status === 200) {
        return corsResponse({ success: true, message: 'تم تفعيل المستخدم بنجاح' })
      }
      return corsResponse({ success: false, message: result.message || 'فشل تفعيل المستخدم' })
    }

    // ==================== DEACTIVATE USER ====================
    if (action === 'deactivateUser') {
      const result = await apiRequest(server.url, 'PUT', `/user/${userId}`, token, { enabled: 0 })
      if (result.status === 200) {
        return corsResponse({ success: true, message: 'تم تعطيل المستخدم بنجاح' })
      }
      return corsResponse({ success: false, message: result.message || 'فشل تعطيل المستخدم' })
    }

    // ==================== DISCONNECT USER ====================
    if (action === 'disconnectUser') {
      const result = await apiRequest(server.url, 'POST', `/user/${userId}/disconnect`, token, {})
      if (result.status === 200) {
        return corsResponse({ success: true, message: 'تم قطع اتصال المستخدم بنجاح' })
      }
      return corsResponse({ success: false, message: result.message || 'فشل قطع اتصال المستخدم' })
    }

    // ==================== RENEW SUBSCRIPTION ====================
    if (action === 'renewSubscription') {
      const { months, profileId, amount } = body
      const renewData: Record<string, unknown> = {
        user_id: userId
      }
      if (profileId) {
        renewData.profile_id = profileId
      }
      if (months) {
        renewData.months = months
      }
      if (amount) {
        renewData.amount = amount
      }
      const result = await apiRequest(server.url, 'POST', `/user/${userId}/activate`, token, renewData)
      if (result.status === 200) {
        return corsResponse({ success: true, message: 'تم تجديد الاشتراك بنجاح' })
      }
      return corsResponse({ success: false, message: result.message || 'فشل تجديد الاشتراك' })
    }

    return corsResponse({ success: false, message: 'إجراء غير معروف' })

  } catch (error) {
    console.error('SAS API Error:', error)
    return corsResponse({
      success: false,
      message: 'خطأ: ' + (error instanceof Error ? error.message : 'خطأ غير معروف')
    })
  }
}
