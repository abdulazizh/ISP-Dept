// Platform-specific database implementation
import { Platform } from 'react-native';

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

export interface LocalTransaction {
  id?: number;
  server_id: number;
  user_id: number;
  username: string;
  type: 'deposit' | 'withdraw' | 'renewal' | 'activation' | 'profile_change';
  amount: number;
  description?: string;
  months?: number;
  profile_id?: number;
  status: 'pending' | 'synced' | 'failed';
  created_at: string;
  synced_at?: string;
  error_message?: string;
}

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

export interface SyncSettings {
  last_sync?: string;
  auto_sync: boolean;
  sync_interval: number;
  offline_mode: boolean;
}

// ==================== LAZY LOADING ====================

let dbImpl: any = null;

const getDb = async () => {
  if (dbImpl) return dbImpl;

  if (Platform.OS === 'web') {
    dbImpl = await import('./database.web');
  } else {
    dbImpl = await import('./database.native');
  }

  return dbImpl;
};

// ==================== EXPORT FUNCTIONS ====================

export const initDatabase = async () => {
  const db = await getDb();
  return db.initDatabase();
};

// Servers
export const addServer = async (server: Omit<Server, 'id' | 'created_at'>): Promise<number> => {
  const db = await getDb();
  return db.addServer(server);
};

export const updateServer = async (id: number, server: Partial<Server>): Promise<void> => {
  const db = await getDb();
  return db.updateServer(id, server);
};

export const deleteServer = async (id: number): Promise<void> => {
  const db = await getDb();
  return db.deleteServer(id);
};

export const getServers = async (): Promise<Server[]> => {
  const db = await getDb();
  return db.getServers();
};

export const getDefaultServer = async (): Promise<Server | null> => {
  const db = await getDb();
  return db.getDefaultServer();
};

export const getServerById = async (id: number): Promise<Server | null> => {
  const db = await getDb();
  return db.getServerById(id);
};

// Users
export const cacheUsers = async (serverId: number, users: CachedUser[]): Promise<void> => {
  const db = await getDb();
  return db.cacheUsers(serverId, users);
};

export const getCachedUsers = async (serverId: number, status?: string): Promise<CachedUser[]> => {
  const db = await getDb();
  return db.getCachedUsers(serverId, status);
};

export const searchCachedUsers = async (serverId: number, query: string): Promise<CachedUser[]> => {
  const db = await getDb();
  return db.searchCachedUsers(serverId, query);
};

export const updateUserBalance = async (serverId: number, userId: number, newBalance: string): Promise<void> => {
  const db = await getDb();
  return db.updateUserBalance(serverId, userId, newBalance);
};

// Profiles
export const cacheProfiles = async (serverId: number, profiles: CachedProfile[]): Promise<void> => {
  const db = await getDb();
  return db.cacheProfiles(serverId, profiles);
};

export const getCachedProfiles = async (serverId: number): Promise<CachedProfile[]> => {
  const db = await getDb();
  return db.getCachedProfiles(serverId);
};

// Managers
export const cacheManagers = async (serverId: number, managers: CachedManager[]): Promise<void> => {
  const db = await getDb();
  return db.cacheManagers(serverId, managers);
};

export const getCachedManagers = async (serverId: number): Promise<CachedManager[]> => {
  const db = await getDb();
  return db.getCachedManagers(serverId);
};

// Devices
export const cacheDevices = async (serverId: number, devices: CachedDevice[]): Promise<void> => {
  const db = await getDb();
  return db.cacheDevices(serverId, devices);
};

export const getCachedDevices = async (serverId: number): Promise<CachedDevice[]> => {
  const db = await getDb();
  return db.getCachedDevices(serverId);
};

// Invoices
export const cacheInvoices = async (serverId: number, invoices: CachedInvoice[]): Promise<void> => {
  const db = await getDb();
  return db.cacheInvoices(serverId, invoices);
};

export const getCachedInvoices = async (serverId: number, paid?: boolean): Promise<CachedInvoice[]> => {
  const db = await getDb();
  return db.getCachedInvoices(serverId, paid);
};

// Local Transactions
export const addLocalTransaction = async (transaction: Omit<LocalTransaction, 'id' | 'created_at' | 'status'>): Promise<number> => {
  const db = await getDb();
  return db.addLocalTransaction(transaction);
};

export const getLocalTransactions = async (serverId?: number, status?: string): Promise<LocalTransaction[]> => {
  const db = await getDb();
  return db.getLocalTransactions(serverId, status);
};

export const updateLocalTransaction = async (id: number, updates: Partial<LocalTransaction>): Promise<void> => {
  const db = await getDb();
  return db.updateLocalTransaction(id, updates);
};

export const getPendingTransactions = async (): Promise<LocalTransaction[]> => {
  const db = await getDb();
  return db.getPendingTransactions();
};

export const deleteLocalTransaction = async (id: number): Promise<void> => {
  const db = await getDb();
  return db.deleteLocalTransaction(id);
};

// Local Invoices
export const addLocalInvoice = async (invoice: Omit<LocalInvoice, 'id' | 'created_at'>): Promise<number> => {
  const db = await getDb();
  return db.addLocalInvoice(invoice);
};

export const getLocalInvoices = async (serverId?: number, userId?: number): Promise<LocalInvoice[]> => {
  const db = await getDb();
  return db.getLocalInvoices(serverId, userId);
};

export const updateLocalInvoice = async (id: number, updates: Partial<LocalInvoice>): Promise<void> => {
  const db = await getDb();
  return db.updateLocalInvoice(id, updates);
};

export const deleteLocalInvoice = async (id: number): Promise<void> => {
  const db = await getDb();
  return db.deleteLocalInvoice(id);
};

// Sync Settings
export const getSyncSettings = async (): Promise<SyncSettings | null> => {
  const db = await getDb();
  return db.getSyncSettings();
};

export const updateSyncSettings = async (settings: Partial<SyncSettings>): Promise<void> => {
  const db = await getDb();
  return db.updateSyncSettings(settings);
};

// Statistics
export const getServerStats = async (serverId: number) => {
  const db = await getDb();
  return db.getServerStats(serverId);
};

// Sync Operations
export const updateServerSyncTime = async (serverId: number): Promise<void> => {
  const db = await getDb();
  return db.updateServerSyncTime(serverId);
};

export const clearCachedData = async (serverId: number): Promise<void> => {
  const db = await getDb();
  return db.clearCachedData(serverId);
};

// Export
export const exportAllData = async () => {
  const db = await getDb();
  return db.exportAllData();
};
