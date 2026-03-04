// Global storage for app data - independent of server
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  source_server?: string; // Original server name
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

// ==================== STORAGE KEYS ====================

const KEYS = {
  GLOBAL_USERS: '@global_users',
  GLOBAL_PROFILES: '@global_profiles',
  DEBT_RECORDS: '@debt_records',
  PAYMENT_RECORDS: '@payment_records',
  LOCAL_TRANSACTIONS: '@local_transactions',
  LAST_SYNC: '@last_sync',
};

// ==================== INITIALIZE ====================

export const initDatabase = async (): Promise<boolean> => {
  console.log('Initializing global storage');
  return true;
};

// ==================== GLOBAL USERS ====================

export const cacheUsers = async (users: GlobalUser[]): Promise<void> => {
  await AsyncStorage.setItem(KEYS.GLOBAL_USERS, JSON.stringify(users));
};

export const getCachedUsers = async (status?: string): Promise<GlobalUser[]> => {
  const data = await AsyncStorage.getItem(KEYS.GLOBAL_USERS);
  let users: GlobalUser[] = data ? JSON.parse(data) : [];

  if (status) {
    users = users.filter(u => u.status === status);
  }

  return users.sort((a, b) => a.username.localeCompare(b.username));
};

export const getCachedUserById = async (userId: number): Promise<GlobalUser | null> => {
  const users = await getCachedUsers();
  return users.find(u => u.user_id === userId) || null;
};

export const addCachedUser = async (user: Omit<GlobalUser, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const users = await getCachedUsers();
  
  const newUser: GlobalUser = {
    ...user,
    id: Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  users.push(newUser);
  await AsyncStorage.setItem(KEYS.GLOBAL_USERS, JSON.stringify(users));
  return newUser.id!;
};

export const updateCachedUser = async (userId: number, updates: Partial<GlobalUser>): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.GLOBAL_USERS);
  const users: GlobalUser[] = data ? JSON.parse(data) : [];

  const index = users.findIndex(u => u.user_id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates, updated_at: new Date().toISOString() };
    await AsyncStorage.setItem(KEYS.GLOBAL_USERS, JSON.stringify(users));
  }
};

export const deleteCachedUser = async (userId: number): Promise<boolean> => {
  // Check if user has debts
  const hasDebts = await hasUserDebts(userId);
  if (hasDebts) {
    return false; // Cannot delete user with debts
  }

  const data = await AsyncStorage.getItem(KEYS.GLOBAL_USERS);
  const users: GlobalUser[] = data ? JSON.parse(data) : [];
  const filtered = users.filter(u => u.user_id !== userId);
  await AsyncStorage.setItem(KEYS.GLOBAL_USERS, JSON.stringify(filtered));
  return true;
};

export const searchCachedUsers = async (query: string): Promise<GlobalUser[]> => {
  const users = await getCachedUsers();
  const searchTerm = query.toLowerCase();

  return users.filter(u =>
    u.username.toLowerCase().includes(searchTerm) ||
    u.firstname?.toLowerCase().includes(searchTerm) ||
    u.lastname?.toLowerCase().includes(searchTerm) ||
    u.phone?.includes(query)
  );
};

// ==================== GLOBAL PROFILES ====================

export const cacheProfiles = async (profiles: GlobalProfile[]): Promise<void> => {
  await AsyncStorage.setItem(KEYS.GLOBAL_PROFILES, JSON.stringify(profiles));
};

export const getCachedProfiles = async (): Promise<GlobalProfile[]> => {
  const data = await AsyncStorage.getItem(KEYS.GLOBAL_PROFILES);
  return data ? JSON.parse(data) : [];
};

// ==================== DEBT RECORDS ====================

export const addDebtRecord = async (debt: Omit<DebtRecord, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const data = await AsyncStorage.getItem(KEYS.DEBT_RECORDS);
  const debts: DebtRecord[] = data ? JSON.parse(data) : [];

  const newDebt: DebtRecord = {
    ...debt,
    id: Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  debts.push(newDebt);
  await AsyncStorage.setItem(KEYS.DEBT_RECORDS, JSON.stringify(debts));
  return newDebt.id!;
};

export const getDebtRecords = async (userId?: number, status?: string): Promise<DebtRecord[]> => {
  const data = await AsyncStorage.getItem(KEYS.DEBT_RECORDS);
  let debts: DebtRecord[] = data ? JSON.parse(data) : [];

  if (userId) {
    debts = debts.filter(d => d.user_id === userId);
  }

  if (status) {
    debts = debts.filter(d => d.status === status);
  }

  return debts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const updateDebtRecord = async (id: number, updates: Partial<DebtRecord>): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.DEBT_RECORDS);
  const debts: DebtRecord[] = data ? JSON.parse(data) : [];

  const index = debts.findIndex(d => d.id === id);
  if (index !== -1) {
    debts[index] = { ...debts[index], ...updates, updated_at: new Date().toISOString() };
    await AsyncStorage.setItem(KEYS.DEBT_RECORDS, JSON.stringify(debts));
  }
};

export const deleteDebtRecord = async (id: number): Promise<void> => {
  const data = await AsyncStorage.getItem(KEYS.DEBT_RECORDS);
  const debts: DebtRecord[] = data ? JSON.parse(data) : [];
  const filtered = debts.filter(d => d.id !== id);
  await AsyncStorage.setItem(KEYS.DEBT_RECORDS, JSON.stringify(filtered));
  
  // Also delete related payments
  const paymentData = await AsyncStorage.getItem(KEYS.PAYMENT_RECORDS);
  const payments: PaymentRecord[] = paymentData ? JSON.parse(paymentData) : [];
  await AsyncStorage.setItem(KEYS.PAYMENT_RECORDS, JSON.stringify(payments.filter(p => p.debt_id !== id)));
};

export const getUserTotalDebt = async (userId: number): Promise<number> => {
  const debts = await getDebtRecords(userId);
  return debts
    .filter(d => d.status !== 'paid')
    .reduce((sum, d) => sum + d.remaining_amount, 0);
};

export const hasUserDebts = async (userId: number): Promise<boolean> => {
  const debts = await getDebtRecords(userId);
  return debts.some(d => d.status !== 'paid');
};

// ==================== PAYMENT RECORDS ====================

export const addPaymentRecord = async (payment: Omit<PaymentRecord, 'id' | 'created_at'>): Promise<number> => {
  const data = await AsyncStorage.getItem(KEYS.PAYMENT_RECORDS);
  const payments: PaymentRecord[] = data ? JSON.parse(data) : [];

  const newPayment: PaymentRecord = {
    ...payment,
    id: Date.now(),
    created_at: new Date().toISOString(),
  };

  payments.push(newPayment);
  await AsyncStorage.setItem(KEYS.PAYMENT_RECORDS, JSON.stringify(payments));
  
  // Update debt remaining amount
  const debtData = await AsyncStorage.getItem(KEYS.DEBT_RECORDS);
  const debts: DebtRecord[] = debtData ? JSON.parse(debtData) : [];
  const debtIndex = debts.findIndex(d => d.id === payment.debt_id);
  
  if (debtIndex !== -1) {
    const newRemaining = debts[debtIndex].remaining_amount - payment.amount;
    debts[debtIndex].remaining_amount = Math.max(0, newRemaining);
    debts[debtIndex].status = newRemaining <= 0 ? 'paid' : newRemaining < debts[debtIndex].amount ? 'partial' : 'pending';
    debts[debtIndex].updated_at = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.DEBT_RECORDS, JSON.stringify(debts));
  }
  
  return newPayment.id!;
};

export const getPaymentRecords = async (debtId?: number, userId?: number): Promise<PaymentRecord[]> => {
  const data = await AsyncStorage.getItem(KEYS.PAYMENT_RECORDS);
  let payments: PaymentRecord[] = data ? JSON.parse(data) : [];

  if (debtId) {
    payments = payments.filter(p => p.debt_id === debtId);
  }

  if (userId) {
    payments = payments.filter(p => p.user_id === userId);
  }

  return payments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

export const getLocalTransactions = async (status?: string): Promise<LocalTransaction[]> => {
  const data = await AsyncStorage.getItem(KEYS.LOCAL_TRANSACTIONS);
  let transactions: LocalTransaction[] = data ? JSON.parse(data) : [];

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
  return getLocalTransactions('pending');
};

// ==================== STATISTICS ====================

export const getStats = async () => {
  const users = await getCachedUsers();
  const debts = await getDebtRecords();

  return {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    expiredUsers: users.filter(u => u.status === 'expired').length,
    totalDebt: debts.filter(d => d.status !== 'paid').reduce((sum, d) => sum + d.remaining_amount, 0),
    pendingDebts: debts.filter(d => d.status !== 'paid').length,
  };
};

// ==================== SYNC TIME ====================

export const updateLastSync = async (): Promise<void> => {
  await AsyncStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
};

export const getLastSync = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(KEYS.LAST_SYNC);
};

// ==================== SERVER MANAGEMENT ====================

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

const SERVERS_KEY = '@servers';

export const addServer = async (server: Omit<Server, 'id' | 'created_at'>): Promise<number> => {
  const data = await AsyncStorage.getItem(SERVERS_KEY);
  const servers: Server[] = data ? JSON.parse(data) : [];

  if (server.is_default) {
    servers.forEach(s => s.is_default = 0);
  }

  const newServer: Server = {
    ...server,
    id: Date.now(),
    created_at: new Date().toISOString(),
  };

  servers.push(newServer);
  await AsyncStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
  return newServer.id!;
};

export const getServers = async (): Promise<Server[]> => {
  const data = await AsyncStorage.getItem(SERVERS_KEY);
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

export const updateServer = async (id: number, updates: Partial<Server>): Promise<void> => {
  const data = await AsyncStorage.getItem(SERVERS_KEY);
  const servers: Server[] = data ? JSON.parse(data) : [];

  if (updates.is_default) {
    servers.forEach(s => s.is_default = 0);
  }

  const index = servers.findIndex(s => s.id === id);
  if (index !== -1) {
    servers[index] = { ...servers[index], ...updates };
    await AsyncStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
  }
};

export const deleteServer = async (id: number): Promise<void> => {
  const data = await AsyncStorage.getItem(SERVERS_KEY);
  const servers: Server[] = data ? JSON.parse(data) : [];
  const filtered = servers.filter(s => s.id !== id);
  await AsyncStorage.setItem(SERVERS_KEY, JSON.stringify(filtered));
};

export const updateServerSyncTime = async (id: number): Promise<void> => {
  const data = await AsyncStorage.getItem(SERVERS_KEY);
  const servers: Server[] = data ? JSON.parse(data) : [];

  const index = servers.findIndex(s => s.id === id);
  if (index !== -1) {
    servers[index].last_sync = new Date().toISOString();
    await AsyncStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
  }
};

// Sync Settings
export interface SyncSettings {
  last_sync?: string;
  auto_sync: boolean;
  sync_interval: number;
  offline_mode: boolean;
}

const SYNC_SETTINGS_KEY = '@sync_settings';

export const getSyncSettings = async (): Promise<SyncSettings | null> => {
  const data = await AsyncStorage.getItem(SYNC_SETTINGS_KEY);
  return data ? JSON.parse(data) : null;
};

export const updateSyncSettings = async (settings: Partial<SyncSettings>): Promise<void> => {
  const current = await getSyncSettings();
  const updated = { ...current, ...settings } as SyncSettings;
  await AsyncStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(updated));
};

export const clearCachedData = async (serverId: number): Promise<void> => {
  // This function exists for compatibility but doesn't clear data
  // since we now store data globally independent of server
  console.log('clearCachedData called for server', serverId, '- data preserved globally');
};
