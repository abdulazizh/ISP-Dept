// Web implementation using AsyncStorage with full offline support
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== TYPES ====================

export interface Server {
  id?: number;
  name: string;
  url: string;
  username: string;
  password: string;
  is_default: number;
  created_at: string;
  last_sync?: string;
}

export interface CachedUser {
  id?: number;
  server_id: number;
  user_id: number;
  username: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  balance: string;
  profile?: string;
  profile_id?: number;
  status: string;
  expiration?: string;
  created_at: string;
  updated_at: string;
}

export interface CachedProfile {
  id?: number;
  server_id: number;
  profile_id: number;
  name: string;
  price?: string;
  download_speed?: string;
  upload_speed?: string;
  description?: string;
  created_at: string;
}

export interface CachedManager {
  id?: number;
  server_id: number;
  manager_id: number;
  username: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  status?: string;
  created_at: string;
}

export interface CachedDevice {
  id?: number;
  server_id: number;
  device_id: number;
  user_id: number;
  device_name?: string;
  mac_address?: string;
  ip_address?: string;
  last_seen?: string;
  status: string;
  created_at: string;
}

export interface CachedInvoice {
  id?: number;
  server_id: number;
  invoice_id: number;
  user_id: number;
  invoice_no: string;
  amount: string;
  type: string;
  description?: string;
  paid: number;
  date: string;
  created_at: string;
}

// العمليات المالية المحلية
export interface LocalTransaction {
  id?: number;
  server_id: number;
  user_id: number;
  username: string;
  type: 'deposit' | 'withdraw' | 'renewal' | 'activation' | 'profile_change';
  amount: number;
  description?: string;
  months?: number; // للتجديد
  profile_id?: number; // لتغيير الباقة
  status: 'pending' | 'synced' | 'failed';
  created_at: string;
  synced_at?: string;
  error_message?: string;
}

// الفواتير المحلية
export interface LocalInvoice {
  id?: number;
  server_id: number;
  user_id: number;
  username: string;
  invoice_type: 'subscription' | 'renewal' | 'profile_change' | 'custom';
  amount: number;
  description?: string;
  months?: number;
  profile_name?: string;
  paid: boolean;
  due_date?: string;
  created_at: string;
}

// إعدادات المزامنة
export interface SyncSettings {
  last_sync?: string;
  auto_sync: boolean;
  sync_interval: number; // بالدقائق
  offline_mode: boolean;
}

// ==================== STORAGE KEYS ====================

const KEYS = {
  SERVERS: '@servers',
  USERS: '@users',
  PROFILES: '@profiles',
  MANAGERS: '@managers',
  DEVICES: '@devices',
  INVOICES: '@invoices',
  LOCAL_TRANSACTIONS: '@local_transactions',
  LOCAL_INVOICES: '@local_invoices',
  SYNC_SETTINGS: '@sync_settings',
};

// ==================== INITIALIZE ====================

export const initDatabase = async (): Promise<boolean> => {
  console.log('Initializing web storage (AsyncStorage)');
  
  // Initialize sync settings if not exists
  const settings = await getSyncSettings();
  if (!settings) {
    await updateSyncSettings({
      auto_sync: true,
      sync_interval: 30,
      offline_mode: false,
    });
  }
  
  return true;
};

// ==================== SERVER OPERATIONS ====================

export const addServer = async (server: Omit<Server, 'id' | 'created_at'>): Promise<number> => {
  const servers = await getServers();
  
  if (server.is_default) {
    servers.forEach(s => s.is_default = 0);
  }

  const newServer: Server = {
    ...server,
    id: Date.now(),
    created_at: new Date().toISOString(),
  };

  servers.push(newServer);
  await AsyncStorage.setItem(KEYS.SERVERS, JSON.stringify(servers));
  return newServer.id!;
};

export const updateServer = async (id: number, server: Partial<Server>): Promise<void> => {
  const servers = await getServers();

  if (server.is_default) {
    servers.forEach(s => s.is_default = 0);
  }

  const index = servers.findIndex(s => s.id === id);
  if (index !== -1) {
    servers[index] = { ...servers[index], ...server };
    await AsyncStorage.setItem(KEYS.SERVERS, JSON.stringify(servers));
  }
};

export const deleteServer = async (id: number): Promise<void> => {
  const servers = await getServers();
  const filtered = servers.filter(s => s.id !== id);
  await AsyncStorage.setItem(KEYS.SERVERS, JSON.stringify(filtered));

  // Delete all cached data for this server
  await clearCachedData(id);
};

export const getServers = async (): Promise<Server[]> => {
  const data = await AsyncStorage.getItem(KEYS.SERVERS);
  return data ? JSON.parse(data) : [];
};

export const getDefaultServer = async (): Promise<Server | null> => {
  const servers = await getServers();
  return servers.find(s => s.is_default === 1) || null;
};

export const getServerById = async (id: number): Promise<Server | null> => {
  const servers = await getServers();
  return servers.find(s => s.id === id) || null;
};

// ==================== CACHED USERS ====================

const getCachedUsersRaw = async (): Promise<CachedUser[]> => {
  const data = await AsyncStorage.getItem(KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const cacheUsers = async (serverId: number, users: CachedUser[]): Promise<void> => {
  const existingUsers = await getCachedUsersRaw();
  const filtered = existingUsers.filter(u => u.server_id !== serverId);

  const newUsers = users.map((user, index) => ({
    ...user,
    id: Date.now() + index,
    updated_at: new Date().toISOString(),
  }));

  await AsyncStorage.setItem(KEYS.USERS, JSON.stringify([...filtered, ...newUsers]));
};

export const getCachedUsers = async (serverId: number, status?: string): Promise<CachedUser[]> => {
  const users = await getCachedUsersRaw();
  let filtered = users.filter(u => u.server_id === serverId);

  if (status) {
    filtered = filtered.filter(u => u.status === status);
  }

  return filtered.sort((a, b) => a.username.localeCompare(b.username));
};

export const searchCachedUsers = async (serverId: number, query: string): Promise<CachedUser[]> => {
  const users = await getCachedUsers(serverId);
  const searchTerm = query.toLowerCase();

  return users.filter(u =>
    u.username.toLowerCase().includes(searchTerm) ||
    u.firstname?.toLowerCase().includes(searchTerm) ||
    u.lastname?.toLowerCase().includes(searchTerm) ||
    u.phone?.includes(query)
  );
};

export const updateUserBalance = async (serverId: number, userId: number, newBalance: string): Promise<void> => {
  const users = await getCachedUsersRaw();
  const index = users.findIndex(u => u.server_id === serverId && u.user_id === userId);
  if (index !== -1) {
    users[index].balance = newBalance;
    users[index].updated_at = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }
};

// ==================== CACHED PROFILES ====================

export const cacheProfiles = async (serverId: number, profiles: CachedProfile[]): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.PROFILES);
  const existing: CachedProfile[] = data ? JSON.parse(data) : [];
  const filtered = existing.filter(p => p.server_id !== serverId);

  const newProfiles = profiles.map((profile, index) => ({
    ...profile,
    id: Date.now() + index,
  }));

  await AsyncStorage.setItem(KEYS.PROFILES, JSON.stringify([...filtered, ...newProfiles]));
};

export const getCachedProfiles = async (serverId: number): Promise<CachedProfile[]> => {
  const data = await AsyncStorage.getItem(KEYS.PROFILES);
  const profiles: CachedProfile[] = data ? JSON.parse(data) : [];
  return profiles.filter(p => p.server_id === serverId);
};

// ==================== CACHED MANAGERS ====================

export const cacheManagers = async (serverId: number, managers: CachedManager[]): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.MANAGERS);
  const existing: CachedManager[] = data ? JSON.parse(data) : [];
  const filtered = existing.filter(m => m.server_id !== serverId);

  const newManagers = managers.map((manager, index) => ({
    ...manager,
    id: Date.now() + index,
  }));

  await AsyncStorage.setItem(KEYS.MANAGERS, JSON.stringify([...filtered, ...newManagers]));
};

export const getCachedManagers = async (serverId: number): Promise<CachedManager[]> => {
  const data = await AsyncStorage.getItem(KEYS.MANAGERS);
  const managers: CachedManager[] = data ? JSON.parse(data) : [];
  return managers.filter(m => m.server_id === serverId);
};

// ==================== CACHED DEVICES ====================

export const cacheDevices = async (serverId: number, devices: CachedDevice[]): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.DEVICES);
  const existing: CachedDevice[] = data ? JSON.parse(data) : [];
  const filtered = existing.filter(d => d.server_id !== serverId);

  const newDevices = devices.map((device, index) => ({
    ...device,
    id: Date.now() + index,
  }));

  await AsyncStorage.setItem(KEYS.DEVICES, JSON.stringify([...filtered, ...newDevices]));
};

export const getCachedDevices = async (serverId: number): Promise<CachedDevice[]> => {
  const data = await AsyncStorage.getItem(KEYS.DEVICES);
  const devices: CachedDevice[] = data ? JSON.parse(data) : [];
  return devices.filter(d => d.server_id === serverId);
};

// ==================== CACHED INVOICES ====================

export const cacheInvoices = async (serverId: number, invoices: CachedInvoice[]): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.INVOICES);
  const existing: CachedInvoice[] = data ? JSON.parse(data) : [];
  const filtered = existing.filter(i => i.server_id !== serverId);

  const newInvoices = invoices.map((invoice, index) => ({
    ...invoice,
    id: Date.now() + index,
  }));

  await AsyncStorage.setItem(KEYS.INVOICES, JSON.stringify([...filtered, ...newInvoices]));
};

export const getCachedInvoices = async (serverId: number, paid?: boolean): Promise<CachedInvoice[]> => {
  const data = await AsyncStorage.getItem(KEYS.INVOICES);
  const invoices: CachedInvoice[] = data ? JSON.parse(data) : [];

  let filtered = invoices.filter(i => i.server_id === serverId);

  if (paid !== undefined) {
    filtered = filtered.filter(i => i.paid === (paid ? 1 : 0));
  }

  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// ==================== LOCAL TRANSACTIONS ====================

export const addLocalTransaction = async (transaction: Omit<LocalTransaction, 'id' | 'created_at' | 'status'>): Promise<number> => {
  const data = await AsyncStorage.getItem(KEYS.LOCAL_TRANSACTIONS);
  const transactions: LocalTransaction[] = data ? JSON.parse(data) : [];

  const newTransaction: LocalTransaction = {
    ...transaction,
    id: Date.now(),
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  transactions.push(newTransaction);
  await AsyncStorage.setItem(KEYS.LOCAL_TRANSACTIONS, JSON.stringify(transactions));
  return newTransaction.id!;
};

export const getLocalTransactions = async (serverId?: number, status?: string): Promise<LocalTransaction[]> => {
  const data = await AsyncStorage.getItem(KEYS.LOCAL_TRANSACTIONS);
  let transactions: LocalTransaction[] = data ? JSON.parse(data) : [];

  if (serverId) {
    transactions = transactions.filter(t => t.server_id === serverId);
  }

  if (status) {
    transactions = transactions.filter(t => t.status === status);
  }

  return transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const updateLocalTransaction = async (id: number, updates: Partial<LocalTransaction>): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.LOCAL_TRANSACTIONS);
  const transactions: LocalTransaction[] = data ? JSON.parse(data) : [];

  const index = transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...updates };
    await AsyncStorage.setItem(KEYS.LOCAL_TRANSACTIONS, JSON.stringify(transactions));
  }
};

export const getPendingTransactions = async (): Promise<LocalTransaction[]> => {
  return getLocalTransactions(undefined, 'pending');
};

export const deleteLocalTransaction = async (id: number): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.LOCAL_TRANSACTIONS);
  const transactions: LocalTransaction[] = data ? JSON.parse(data) : [];
  const filtered = transactions.filter(t => t.id !== id);
  await AsyncStorage.setItem(KEYS.LOCAL_TRANSACTIONS, JSON.stringify(filtered));
};

// ==================== LOCAL INVOICES ====================

export const addLocalInvoice = async (invoice: Omit<LocalInvoice, 'id' | 'created_at'>): Promise<number> => {
  const data = await AsyncStorage.getItem(KEYS.LOCAL_INVOICES);
  const invoices: LocalInvoice[] = data ? JSON.parse(data) : [];

  const newInvoice: LocalInvoice = {
    ...invoice,
    id: Date.now(),
    created_at: new Date().toISOString(),
  };

  invoices.push(newInvoice);
  await AsyncStorage.setItem(KEYS.LOCAL_INVOICES, JSON.stringify(invoices));
  return newInvoice.id!;
};

export const getLocalInvoices = async (serverId?: number, userId?: number): Promise<LocalInvoice[]> => {
  const data = await AsyncStorage.getItem(KEYS.LOCAL_INVOICES);
  let invoices: LocalInvoice[] = data ? JSON.parse(data) : [];

  if (serverId) {
    invoices = invoices.filter(i => i.server_id === serverId);
  }

  if (userId) {
    invoices = invoices.filter(i => i.user_id === userId);
  }

  return invoices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const updateLocalInvoice = async (id: number, updates: Partial<LocalInvoice>): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.LOCAL_INVOICES);
  const invoices: LocalInvoice[] = data ? JSON.parse(data) : [];

  const index = invoices.findIndex(i => i.id === id);
  if (index !== -1) {
    invoices[index] = { ...invoices[index], ...updates };
    await AsyncStorage.setItem(KEYS.LOCAL_INVOICES, JSON.stringify(invoices));
  }
};

export const deleteLocalInvoice = async (id: number): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.LOCAL_INVOICES);
  const invoices: LocalInvoice[] = data ? JSON.parse(data) : [];
  const filtered = invoices.filter(i => i.id !== id);
  await AsyncStorage.setItem(KEYS.LOCAL_INVOICES, JSON.stringify(filtered));
};

// ==================== SYNC SETTINGS ====================

export const getSyncSettings = async (): Promise<SyncSettings | null> => {
  const data = await AsyncStorage.getItem(KEYS.SYNC_SETTINGS);
  return data ? JSON.parse(data) : null;
};

export const updateSyncSettings = async (settings: Partial<SyncSettings>): Promise<void> => {
  const current = await getSyncSettings();
  const updated = { ...current, ...settings } as SyncSettings;
  await AsyncStorage.setItem(KEYS.SYNC_SETTINGS, JSON.stringify(updated));
};

// ==================== STATISTICS ====================

export const getServerStats = async (serverId: number): Promise<{
  totalUsers: number;
  activeUsers: number;
  expiredUsers: number;
  totalDebt: number;
  unpaidInvoices: number;
  pendingTransactions: number;
}> => {
  const users = await getCachedUsers(serverId);
  const invoices = await getCachedInvoices(serverId);
  const pendingTx = await getPendingTransactions();

  return {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    expiredUsers: users.filter(u => u.status === 'expired').length,
    totalDebt: users.reduce((sum, u) => sum + parseFloat(u.balance || '0'), 0),
    unpaidInvoices: invoices.filter(i => i.paid === 0).length,
    pendingTransactions: pendingTx.filter(t => t.server_id === serverId).length,
  };
};

// ==================== SYNC OPERATIONS ====================

export const updateServerSyncTime = async (serverId: number): Promise<void> => {
  const servers = await getServers();
  const index = servers.findIndex(s => s.id === serverId);

  if (index !== -1) {
    servers[index].last_sync = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.SERVERS, JSON.stringify(servers));
  }

  // Update sync settings
  await updateSyncSettings({ last_sync: new Date().toISOString() });
};

export const clearCachedData = async (serverId: number): Promise<void> => {
  // Clear users
  const users = await getCachedUsersRaw();
  await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users.filter(u => u.server_id !== serverId)));

  // Clear devices
  const data = await AsyncStorage.getItem(KEYS.DEVICES);
  const devices: CachedDevice[] = data ? JSON.parse(data) : [];
  await AsyncStorage.setItem(KEYS.DEVICES, JSON.stringify(devices.filter(d => d.server_id !== serverId)));

  // Clear invoices
  const invoicesData = await AsyncStorage.getItem(KEYS.INVOICES);
  const invoices: CachedInvoice[] = invoicesData ? JSON.parse(invoicesData) : [];
  await AsyncStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices.filter(i => i.server_id !== serverId)));

  // Clear profiles
  const profilesData = await AsyncStorage.getItem(KEYS.PROFILES);
  const profiles: CachedProfile[] = profilesData ? JSON.parse(profilesData) : [];
  await AsyncStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles.filter(p => p.server_id !== serverId)));

  // Clear managers
  const managersData = await AsyncStorage.getItem(KEYS.MANAGERS);
  const managers: CachedManager[] = managersData ? JSON.parse(managersData) : [];
  await AsyncStorage.setItem(KEYS.MANAGERS, JSON.stringify(managers.filter(m => m.server_id !== serverId)));

  // Clear local transactions
  const txData = await AsyncStorage.getItem(KEYS.LOCAL_TRANSACTIONS);
  const transactions: LocalTransaction[] = txData ? JSON.parse(txData) : [];
  await AsyncStorage.setItem(KEYS.LOCAL_TRANSACTIONS, JSON.stringify(transactions.filter(t => t.server_id !== serverId)));

  // Clear local invoices
  const localInvData = await AsyncStorage.getItem(KEYS.LOCAL_INVOICES);
  const localInvoices: LocalInvoice[] = localInvData ? JSON.parse(localInvData) : [];
  await AsyncStorage.setItem(KEYS.LOCAL_INVOICES, JSON.stringify(localInvoices.filter(i => i.server_id !== serverId)));
};

// ==================== EXPORT ALL DATA ====================

export const exportAllData = async (): Promise<{
  servers: Server[];
  users: CachedUser[];
  profiles: CachedProfile[];
  managers: CachedManager[];
  devices: CachedDevice[];
  invoices: CachedInvoice[];
  localTransactions: LocalTransaction[];
  localInvoices: LocalInvoice[];
  syncSettings: SyncSettings | null;
}> => {
  return {
    servers: await getServers(),
    users: await getCachedUsersRaw(),
    profiles: (await AsyncStorage.getItem(KEYS.PROFILES)) ? JSON.parse((await AsyncStorage.getItem(KEYS.PROFILES))!) : [],
    managers: (await AsyncStorage.getItem(KEYS.MANAGERS)) ? JSON.parse((await AsyncStorage.getItem(KEYS.MANAGERS))!) : [],
    devices: (await AsyncStorage.getItem(KEYS.DEVICES)) ? JSON.parse((await AsyncStorage.getItem(KEYS.DEVICES))!) : [],
    invoices: (await AsyncStorage.getItem(KEYS.INVOICES)) ? JSON.parse((await AsyncStorage.getItem(KEYS.INVOICES))!) : [],
    localTransactions: await getLocalTransactions(),
    localInvoices: await getLocalInvoices(),
    syncSettings: await getSyncSettings(),
  };
};
