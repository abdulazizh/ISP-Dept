// Platform-specific database implementation
import { Platform } from 'react-native';

// ==================== TYPES ====================

export interface GlobalUser {
  id?: number;
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
  enabled?: number;
  created_at: string;
  updated_at: string;
  source_server?: string;
}

export interface GlobalProfile {
  id?: number;
  profile_id: number;
  name: string;
  price?: string;
  download_speed?: string;
  upload_speed?: string;
  description?: string;
  created_at: string;
}

export interface DebtRecord {
  id?: number;
  user_id: number;
  username: string;
  amount: number;
  description?: string;
  months?: number;
  profile_name?: string;
  status: 'pending' | 'partial' | 'paid';
  remaining_amount: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id?: number;
  debt_id: number;
  user_id: number;
  username: string;
  amount: number;
  payment_method?: string;
  notes?: string;
  created_at: string;
}

export interface LocalTransaction {
  id?: number;
  user_id: number;
  username: string;
  type: 'deposit' | 'withdraw' | 'renewal' | 'activation' | 'profile_change' | 'create_user';
  amount: number;
  description?: string;
  months?: number;
  profile_id?: number;
  status: 'pending' | 'synced' | 'failed';
  created_at: string;
  synced_at?: string;
  error_message?: string;
}

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

// Users
export const cacheUsers = async (users: GlobalUser[]): Promise<void> => {
  const db = await getDb();
  return db.cacheUsers(users);
};

export const getCachedUsers = async (status?: string): Promise<GlobalUser[]> => {
  const db = await getDb();
  return db.getCachedUsers(status);
};

export const getCachedUserById = async (userId: number): Promise<GlobalUser | null> => {
  const db = await getDb();
  return db.getCachedUserById(userId);
};

export const addCachedUser = async (user: Omit<GlobalUser, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const db = await getDb();
  return db.addCachedUser(user);
};

export const updateCachedUser = async (userId: number, updates: Partial<GlobalUser>): Promise<void> => {
  const db = await getDb();
  return db.updateCachedUser(userId, updates);
};

export const deleteCachedUser = async (userId: number): Promise<boolean> => {
  const db = await getDb();
  return db.deleteCachedUser(userId);
};

export const searchCachedUsers = async (query: string): Promise<GlobalUser[]> => {
  const db = await getDb();
  return db.searchCachedUsers(query);
};

// Profiles
export const cacheProfiles = async (profiles: GlobalProfile[]): Promise<void> => {
  const db = await getDb();
  return db.cacheProfiles(profiles);
};

export const getCachedProfiles = async (): Promise<GlobalProfile[]> => {
  const db = await getDb();
  return db.getCachedProfiles();
};

// Debt Records
export const addDebtRecord = async (debt: Omit<DebtRecord, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const db = await getDb();
  return db.addDebtRecord(debt);
};

export const getDebtRecords = async (userId?: number, status?: string): Promise<DebtRecord[]> => {
  const db = await getDb();
  return db.getDebtRecords(userId, status);
};

export const updateDebtRecord = async (id: number, updates: Partial<DebtRecord>): Promise<void> => {
  const db = await getDb();
  return db.updateDebtRecord(id, updates);
};

export const deleteDebtRecord = async (id: number): Promise<void> => {
  const db = await getDb();
  return db.deleteDebtRecord(id);
};

export const getUserTotalDebt = async (userId: number): Promise<number> => {
  const db = await getDb();
  return db.getUserTotalDebt(userId);
};

export const hasUserDebts = async (userId: number): Promise<boolean> => {
  const db = await getDb();
  return db.hasUserDebts(userId);
};

// Payment Records
export const addPaymentRecord = async (payment: Omit<PaymentRecord, 'id' | 'created_at'>): Promise<number> => {
  const db = await getDb();
  return db.addPaymentRecord(payment);
};

export const getPaymentRecords = async (debtId?: number, userId?: number): Promise<PaymentRecord[]> => {
  const db = await getDb();
  return db.getPaymentRecords(debtId, userId);
};

// Local Transactions
export const addLocalTransaction = async (transaction: Omit<LocalTransaction, 'id' | 'created_at' | 'status'>): Promise<number> => {
  const db = await getDb();
  return db.addLocalTransaction(transaction);
};

export const getLocalTransactions = async (status?: string): Promise<LocalTransaction[]> => {
  const db = await getDb();
  return db.getLocalTransactions(status);
};

export const updateLocalTransaction = async (id: number, updates: Partial<LocalTransaction>): Promise<void> => {
  const db = await getDb();
  return db.updateLocalTransaction(id, updates);
};

export const getPendingTransactions = async (): Promise<LocalTransaction[]> => {
  const db = await getDb();
  return db.getPendingTransactions();
};

// Statistics
export const getStats = async () => {
  const db = await getDb();
  return db.getStats();
};

// Sync
export const updateLastSync = async (): Promise<void> => {
  const db = await getDb();
  return db.updateLastSync();
};

export const getLastSync = async (): Promise<string | null> => {
  const db = await getDb();
  return db.getLastSync();
};

// Servers
export const addServer = async (server: Omit<Server, 'id' | 'created_at'>): Promise<number> => {
  const db = await getDb();
  return db.addServer(server);
};

export const getServers = async (): Promise<Server[]> => {
  const db = await getDb();
  return db.getServers();
};

export const updateServer = async (id: number, server: Partial<Server>): Promise<void> => {
  const db = await getDb();
  return db.updateServer(id, server);
};

export const deleteServer = async (id: number): Promise<void> => {
  const db = await getDb();
  return db.deleteServer(id);
};

export const getDefaultServer = async (): Promise<Server | null> => {
  const db = await getDb();
  return db.getDefaultServer();
};

export const getServerById = async (id: number): Promise<Server | null> => {
  const db = await getDb();
  return db.getServerById(id);
};

export const getSyncSettings = async (): Promise<SyncSettings | null> => {
  const db = await getDb();
  return db.getSyncSettings();
};

export const updateSyncSettings = async (settings: Partial<SyncSettings>): Promise<void> => {
  const db = await getDb();
  return db.updateSyncSettings(settings);
};

export const updateServerSyncTime = async (serverId: number): Promise<void> => {
  const db = await getDb();
  return db.updateServerSyncTime(serverId);
};

export const clearCachedData = async (serverId: number): Promise<void> => {
  const db = await getDb();
  return db.clearCachedData(serverId);
};
