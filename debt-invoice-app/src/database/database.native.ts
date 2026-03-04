// Native implementation using SQLite
import * as SQLite from 'expo-sqlite';

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

// ==================== DATABASE ====================

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('debt_invoice_v2.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    -- Servers table
    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_sync TEXT
    );

    -- Cached users table
    CREATE TABLE IF NOT EXISTS cached_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      firstname TEXT,
      lastname TEXT,
      email TEXT,
      phone TEXT,
      balance TEXT DEFAULT '0',
      profile TEXT,
      profile_id INTEGER,
      status TEXT DEFAULT 'active',
      expiration TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES servers(id),
      UNIQUE(server_id, user_id)
    );

    -- Cached profiles table
    CREATE TABLE IF NOT EXISTS cached_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      profile_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price TEXT,
      download_speed TEXT,
      upload_speed TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES servers(id),
      UNIQUE(server_id, profile_id)
    );

    -- Cached managers table
    CREATE TABLE IF NOT EXISTS cached_managers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      manager_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      email TEXT,
      firstname TEXT,
      lastname TEXT,
      phone TEXT,
      status TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES servers(id),
      UNIQUE(server_id, manager_id)
    );

    -- Cached devices table
    CREATE TABLE IF NOT EXISTS cached_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      device_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      device_name TEXT,
      mac_address TEXT,
      ip_address TEXT,
      last_seen TEXT,
      status TEXT DEFAULT 'offline',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES servers(id),
      UNIQUE(server_id, device_id)
    );

    -- Cached invoices table
    CREATE TABLE IF NOT EXISTS cached_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      invoice_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      invoice_no TEXT NOT NULL,
      amount TEXT DEFAULT '0',
      type TEXT,
      description TEXT,
      paid INTEGER DEFAULT 0,
      date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES servers(id),
      UNIQUE(server_id, invoice_id)
    );

    -- Local transactions table (offline operations)
    CREATE TABLE IF NOT EXISTS local_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      months INTEGER,
      profile_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      synced_at TEXT,
      error_message TEXT,
      FOREIGN KEY (server_id) REFERENCES servers(id)
    );

    -- Local invoices table
    CREATE TABLE IF NOT EXISTS local_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      invoice_type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      months INTEGER,
      profile_name TEXT,
      paid INTEGER DEFAULT 0,
      due_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES servers(id)
    );

    -- Sync settings table
    CREATE TABLE IF NOT EXISTS sync_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_sync TEXT,
      auto_sync INTEGER DEFAULT 1,
      sync_interval INTEGER DEFAULT 30,
      offline_mode INTEGER DEFAULT 0
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_users_server ON cached_users(server_id);
    CREATE INDEX IF NOT EXISTS idx_users_status ON cached_users(status);
    CREATE INDEX IF NOT EXISTS idx_profiles_server ON cached_profiles(server_id);
    CREATE INDEX IF NOT EXISTS idx_managers_server ON cached_managers(server_id);
    CREATE INDEX IF NOT EXISTS idx_devices_server ON cached_devices(server_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_server ON cached_invoices(server_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON local_transactions(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_server ON local_transactions(server_id);
  `);

  // Initialize sync settings if not exists
  const settings = await db.getFirstAsync<SyncSettings>('SELECT * FROM sync_settings WHERE id = 1');
  if (!settings) {
    await db.runAsync('INSERT INTO sync_settings (id, auto_sync, sync_interval, offline_mode) VALUES (1, 1, 30, 0)');
  }

  return db;
};

const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    return await initDatabase();
  }
  return db;
};

// ==================== SERVER OPERATIONS ====================

export const addServer = async (server: Omit<Server, 'id' | 'created_at'>): Promise<number> => {
  const database = await getDatabase();

  if (server.is_default) {
    await database.runAsync('UPDATE servers SET is_default = 0');
  }

  const result = await database.runAsync(
    `INSERT INTO servers (name, url, username, password, is_default)
     VALUES (?, ?, ?, ?, ?)`,
    [server.name, server.url, server.username, server.password, server.is_default ? 1 : 0]
  );

  return result.lastInsertRowId;
};

export const updateServer = async (id: number, server: Partial<Server>): Promise<void> => {
  const database = await getDatabase();

  if (server.is_default) {
    await database.runAsync('UPDATE servers SET is_default = 0');
  }

  const updates: string[] = [];
  const values: (string | number)[] = [];

  Object.entries(server).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at' && value !== undefined) {
      updates.push(`${key} = ?`);
      values.push(value as string | number);
    }
  });

  if (updates.length > 0) {
    values.push(id);
    await database.runAsync(
      `UPDATE servers SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }
};

export const deleteServer = async (id: number): Promise<void> => {
  const database = await getDatabase();

  // Delete all cached data
  await database.runAsync('DELETE FROM cached_users WHERE server_id = ?', [id]);
  await database.runAsync('DELETE FROM cached_profiles WHERE server_id = ?', [id]);
  await database.runAsync('DELETE FROM cached_managers WHERE server_id = ?', [id]);
  await database.runAsync('DELETE FROM cached_devices WHERE server_id = ?', [id]);
  await database.runAsync('DELETE FROM cached_invoices WHERE server_id = ?', [id]);
  await database.runAsync('DELETE FROM local_transactions WHERE server_id = ?', [id]);
  await database.runAsync('DELETE FROM local_invoices WHERE server_id = ?', [id]);
  await database.runAsync('DELETE FROM servers WHERE id = ?', [id]);
};

export const getServers = async (): Promise<Server[]> => {
  const database = await getDatabase();
  return await database.getAllAsync<Server>(
    'SELECT * FROM servers ORDER BY is_default DESC, name ASC'
  );
};

export const getDefaultServer = async (): Promise<Server | null> => {
  const database = await getDatabase();
  return await database.getFirstAsync<Server>(
    'SELECT * FROM servers WHERE is_default = 1 LIMIT 1'
  );
};

export const getServerById = async (id: number): Promise<Server | null> => {
  const database = await getDatabase();
  return await database.getFirstAsync<Server>(
    'SELECT * FROM servers WHERE id = ?',
    [id]
  );
};

// ==================== CACHED USERS ====================

export const cacheUsers = async (serverId: number, users: CachedUser[]): Promise<void> => {
  const database = await getDatabase();

  // Clear existing users for this server
  await database.runAsync('DELETE FROM cached_users WHERE server_id = ?', [serverId]);

  // Insert new users
  for (const user of users) {
    await database.runAsync(
      `INSERT INTO cached_users
       (server_id, user_id, username, firstname, lastname, email, phone, balance, profile, profile_id, status, expiration, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        serverId,
        user.user_id,
        user.username,
        user.firstname || null,
        user.lastname || null,
        user.email || null,
        user.phone || null,
        user.balance || '0',
        user.profile || null,
        user.profile_id || null,
        user.status || 'active',
        user.expiration || null,
      ]
    );
  }
};

export const getCachedUsers = async (serverId: number, status?: string): Promise<CachedUser[]> => {
  const database = await getDatabase();

  if (status) {
    return await database.getAllAsync<CachedUser>(
      'SELECT * FROM cached_users WHERE server_id = ? AND status = ? ORDER BY username',
      [serverId, status]
    );
  }

  return await database.getAllAsync<CachedUser>(
    'SELECT * FROM cached_users WHERE server_id = ? ORDER BY username',
    [serverId]
  );
};

export const searchCachedUsers = async (serverId: number, query: string): Promise<CachedUser[]> => {
  const database = await getDatabase();
  const searchTerm = `%${query}%`;

  return await database.getAllAsync<CachedUser>(
    `SELECT * FROM cached_users
     WHERE server_id = ? AND (
       username LIKE ? OR firstname LIKE ? OR lastname LIKE ? OR phone LIKE ?
     )
     ORDER BY username`,
    [serverId, searchTerm, searchTerm, searchTerm, searchTerm]
  );
};

export const updateUserBalance = async (serverId: number, userId: number, newBalance: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE cached_users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE server_id = ? AND user_id = ?',
    [newBalance, serverId, userId]
  );
};

// ==================== CACHED PROFILES ====================

export const cacheProfiles = async (serverId: number, profiles: CachedProfile[]): Promise<void> => {
  const database = await getDatabase();

  await database.runAsync('DELETE FROM cached_profiles WHERE server_id = ?', [serverId]);

  for (const profile of profiles) {
    await database.runAsync(
      `INSERT INTO cached_profiles (server_id, profile_id, name, price, download_speed, upload_speed, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [serverId, profile.profile_id, profile.name, profile.price, profile.download_speed, profile.upload_speed, profile.description]
    );
  }
};

export const getCachedProfiles = async (serverId: number): Promise<CachedProfile[]> => {
  const database = await getDatabase();
  return await database.getAllAsync<CachedProfile>(
    'SELECT * FROM cached_profiles WHERE server_id = ? ORDER BY name',
    [serverId]
  );
};

// ==================== CACHED MANAGERS ====================

export const cacheManagers = async (serverId: number, managers: CachedManager[]): Promise<void> => {
  const database = await getDatabase();

  await database.runAsync('DELETE FROM cached_managers WHERE server_id = ?', [serverId]);

  for (const manager of managers) {
    await database.runAsync(
      `INSERT INTO cached_managers (server_id, manager_id, username, email, firstname, lastname, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [serverId, manager.manager_id, manager.username, manager.email, manager.firstname, manager.lastname, manager.phone, manager.status]
    );
  }
};

export const getCachedManagers = async (serverId: number): Promise<CachedManager[]> => {
  const database = await getDatabase();
  return await database.getAllAsync<CachedManager>(
    'SELECT * FROM cached_managers WHERE server_id = ? ORDER BY username',
    [serverId]
  );
};

// ==================== CACHED DEVICES ====================

export const cacheDevices = async (serverId: number, devices: CachedDevice[]): Promise<void> => {
  const database = await getDatabase();

  await database.runAsync('DELETE FROM cached_devices WHERE server_id = ?', [serverId]);

  for (const device of devices) {
    await database.runAsync(
      `INSERT INTO cached_devices (server_id, device_id, user_id, device_name, mac_address, ip_address, last_seen, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [serverId, device.device_id, device.user_id, device.device_name, device.mac_address, device.ip_address, device.last_seen, device.status]
    );
  }
};

export const getCachedDevices = async (serverId: number): Promise<CachedDevice[]> => {
  const database = await getDatabase();
  return await database.getAllAsync<CachedDevice>(
    'SELECT * FROM cached_devices WHERE server_id = ? ORDER BY device_name',
    [serverId]
  );
};

// ==================== CACHED INVOICES ====================

export const cacheInvoices = async (serverId: number, invoices: CachedInvoice[]): Promise<void> => {
  const database = await getDatabase();

  await database.runAsync('DELETE FROM cached_invoices WHERE server_id = ?', [serverId]);

  for (const invoice of invoices) {
    await database.runAsync(
      `INSERT INTO cached_invoices (server_id, invoice_id, user_id, invoice_no, amount, type, description, paid, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [serverId, invoice.invoice_id, invoice.user_id, invoice.invoice_no, invoice.amount, invoice.type, invoice.description, invoice.paid ? 1 : 0, invoice.date]
    );
  }
};

export const getCachedInvoices = async (serverId: number, paid?: boolean): Promise<CachedInvoice[]> => {
  const database = await getDatabase();

  if (paid !== undefined) {
    return await database.getAllAsync<CachedInvoice>(
      'SELECT * FROM cached_invoices WHERE server_id = ? AND paid = ? ORDER BY date DESC',
      [serverId, paid ? 1 : 0]
    );
  }

  return await database.getAllAsync<CachedInvoice>(
    'SELECT * FROM cached_invoices WHERE server_id = ? ORDER BY date DESC',
    [serverId]
  );
};

// ==================== LOCAL TRANSACTIONS ====================

export const addLocalTransaction = async (transaction: Omit<LocalTransaction, 'id' | 'created_at' | 'status'>): Promise<number> => {
  const database = await getDatabase();

  const result = await database.runAsync(
    `INSERT INTO local_transactions
     (server_id, user_id, username, type, amount, description, months, profile_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [transaction.server_id, transaction.user_id, transaction.username, transaction.type, transaction.amount, transaction.description, transaction.months, transaction.profile_id]
  );

  return result.lastInsertRowId;
};

export const getLocalTransactions = async (serverId?: number, status?: string): Promise<LocalTransaction[]> => {
  const database = await getDatabase();

  let query = 'SELECT * FROM local_transactions WHERE 1=1';
  const params: (number | string)[] = [];

  if (serverId) {
    query += ' AND server_id = ?';
    params.push(serverId);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  return await database.getAllAsync<LocalTransaction>(query, params);
};

export const updateLocalTransaction = async (id: number, updates: Partial<LocalTransaction>): Promise<void> => {
  const database = await getDatabase();

  const updateFields: string[] = [];
  const values: (string | number)[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      updateFields.push(`${key} = ?`);
      values.push(value as string | number);
    }
  });

  if (updateFields.length > 0) {
    values.push(id);
    await database.runAsync(
      `UPDATE local_transactions SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
  }
};

export const getPendingTransactions = async (): Promise<LocalTransaction[]> => {
  return await getLocalTransactions(undefined, 'pending');
};

export const deleteLocalTransaction = async (id: number): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM local_transactions WHERE id = ?', [id]);
};

// ==================== LOCAL INVOICES ====================

export const addLocalInvoice = async (invoice: Omit<LocalInvoice, 'id' | 'created_at'>): Promise<number> => {
  const database = await getDatabase();

  const result = await database.runAsync(
    `INSERT INTO local_invoices
     (server_id, user_id, username, invoice_type, amount, description, months, profile_name, paid, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [invoice.server_id, invoice.user_id, invoice.username, invoice.invoice_type, invoice.amount, invoice.description, invoice.months, invoice.profile_name, invoice.paid ? 1 : 0, invoice.due_date]
  );

  return result.lastInsertRowId;
};

export const getLocalInvoices = async (serverId?: number, userId?: number): Promise<LocalInvoice[]> => {
  const database = await getDatabase();

  let query = 'SELECT * FROM local_invoices WHERE 1=1';
  const params: (number | string)[] = [];

  if (serverId) {
    query += ' AND server_id = ?';
    params.push(serverId);
  }

  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }

  query += ' ORDER BY created_at DESC';

  return await database.getAllAsync<LocalInvoice>(query, params);
};

export const updateLocalInvoice = async (id: number, updates: Partial<LocalInvoice>): Promise<void> => {
  const database = await getDatabase();

  const updateFields: string[] = [];
  const values: (string | number)[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      updateFields.push(`${key} = ?`);
      values.push(value as string | number);
    }
  });

  if (updateFields.length > 0) {
    values.push(id);
    await database.runAsync(
      `UPDATE local_invoices SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
  }
};

export const deleteLocalInvoice = async (id: number): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM local_invoices WHERE id = ?', [id]);
};

// ==================== SYNC SETTINGS ====================

export const getSyncSettings = async (): Promise<SyncSettings | null> => {
  const database = await getDatabase();
  return await database.getFirstAsync<SyncSettings>('SELECT * FROM sync_settings WHERE id = 1');
};

export const updateSyncSettings = async (settings: Partial<SyncSettings>): Promise<void> => {
  const database = await getDatabase();

  const updateFields: string[] = [];
  const values: (string | number)[] = [];

  Object.entries(settings).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      updateFields.push(`${key} = ?`);
      values.push(value as string | number);
    }
  });

  if (updateFields.length > 0) {
    await database.runAsync(
      `UPDATE sync_settings SET ${updateFields.join(', ')} WHERE id = 1`,
      values
    );
  }
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
  const database = await getDatabase();

  const userStats = await database.getFirstAsync<{
    total: number;
    active: number;
    expired: number;
    totalBalance: number;
  }>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
       SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
       SUM(CAST(balance AS REAL)) as totalBalance
     FROM cached_users WHERE server_id = ?`,
    [serverId]
  );

  const invoiceStats = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM cached_invoices WHERE server_id = ? AND paid = 0',
    [serverId]
  );

  const pendingTx = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM local_transactions WHERE server_id = ? AND status = ?',
    [serverId, 'pending']
  );

  return {
    totalUsers: userStats?.total || 0,
    activeUsers: userStats?.active || 0,
    expiredUsers: userStats?.expired || 0,
    totalDebt: userStats?.totalBalance || 0,
    unpaidInvoices: invoiceStats?.count || 0,
    pendingTransactions: pendingTx?.count || 0,
  };
};

// ==================== SYNC OPERATIONS ====================

export const updateServerSyncTime = async (serverId: number): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE servers SET last_sync = CURRENT_TIMESTAMP WHERE id = ?',
    [serverId]
  );
  await database.runAsync(
    'UPDATE sync_settings SET last_sync = CURRENT_TIMESTAMP WHERE id = 1'
  );
};

export const clearCachedData = async (serverId: number): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM cached_users WHERE server_id = ?', [serverId]);
  await database.runAsync('DELETE FROM cached_profiles WHERE server_id = ?', [serverId]);
  await database.runAsync('DELETE FROM cached_managers WHERE server_id = ?', [serverId]);
  await database.runAsync('DELETE FROM cached_devices WHERE server_id = ?', [serverId]);
  await database.runAsync('DELETE FROM cached_invoices WHERE server_id = ?', [serverId]);
  await database.runAsync('DELETE FROM local_transactions WHERE server_id = ?', [serverId]);
  await database.runAsync('DELETE FROM local_invoices WHERE server_id = ?', [serverId]);
};

// ==================== EXPORT ====================

export const exportAllData = async () => {
  const database = await getDatabase();

  const servers = await database.getAllAsync<Server>('SELECT * FROM servers');
  const users = await database.getAllAsync<CachedUser>('SELECT * FROM cached_users');
  const profiles = await database.getAllAsync<CachedProfile>('SELECT * FROM cached_profiles');
  const managers = await database.getAllAsync<CachedManager>('SELECT * FROM cached_managers');
  const devices = await database.getAllAsync<CachedDevice>('SELECT * FROM cached_devices');
  const invoices = await database.getAllAsync<CachedInvoice>('SELECT * FROM cached_invoices');
  const localTransactions = await database.getAllAsync<LocalTransaction>('SELECT * FROM local_transactions');
  const localInvoices = await database.getAllAsync<LocalInvoice>('SELECT * FROM local_invoices');
  const syncSettings = await getSyncSettings();

  return {
    servers,
    users,
    profiles,
    managers,
    devices,
    invoices,
    localTransactions,
    localInvoices,
    syncSettings,
  };
};
