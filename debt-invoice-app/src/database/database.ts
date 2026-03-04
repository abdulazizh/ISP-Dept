import * as SQLite from 'expo-sqlite';

// Database types
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
  status: string;
  expiration?: string;
  created_at: string;
  updated_at: string;
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

let db: SQLite.SQLiteDatabase | null = null;

// Initialize database
export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('debt_invoice.db');

  // Create tables
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
      status TEXT DEFAULT 'active',
      expiration TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES servers(id),
      UNIQUE(server_id, user_id)
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

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_users_server ON cached_users(server_id);
    CREATE INDEX IF NOT EXISTS idx_users_status ON cached_users(status);
    CREATE INDEX IF NOT EXISTS idx_devices_server ON cached_devices(server_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_server ON cached_invoices(server_id);
  `);

  return db;
};

// Get database instance
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    return await initDatabase();
  }
  return db;
};

// ============ SERVER OPERATIONS ============

export const addServer = async (server: Omit<Server, 'id' | 'created_at'>): Promise<number> => {
  const database = await getDatabase();

  // If this is default, unset other defaults
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

  // Delete cached data
  await database.runAsync('DELETE FROM cached_users WHERE server_id = ?', [id]);
  await database.runAsync('DELETE FROM cached_devices WHERE server_id = ?', [id]);
  await database.runAsync('DELETE FROM cached_invoices WHERE server_id = ?', [id]);
  await database.runAsync('DELETE FROM servers WHERE id = ?', [id]);
};

export const getServers = async (): Promise<Server[]> => {
  const database = await getDatabase();
  const result = await database.getAllAsync<Server>(
    'SELECT * FROM servers ORDER BY is_default DESC, name ASC'
  );
  return result;
};

export const getDefaultServer = async (): Promise<Server | null> => {
  const database = await getDatabase();
  const result = await database.getFirstAsync<Server>(
    'SELECT * FROM servers WHERE is_default = 1 LIMIT 1'
  );
  return result || null;
};

export const getServerById = async (id: number): Promise<Server | null> => {
  const database = await getDatabase();
  const result = await database.getFirstAsync<Server>(
    'SELECT * FROM servers WHERE id = ?',
    [id]
  );
  return result || null;
};

// ============ CACHED USERS OPERATIONS ============

export const cacheUsers = async (serverId: number, users: CachedUser[]): Promise<void> => {
  const database = await getDatabase();

  for (const user of users) {
    await database.runAsync(
      `INSERT OR REPLACE INTO cached_users
       (server_id, user_id, username, firstname, lastname, email, phone, balance, profile, status, expiration, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
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

// ============ CACHED DEVICES OPERATIONS ============

export const cacheDevices = async (serverId: number, devices: CachedDevice[]): Promise<void> => {
  const database = await getDatabase();

  for (const device of devices) {
    await database.runAsync(
      `INSERT OR REPLACE INTO cached_devices
       (server_id, device_id, user_id, device_name, mac_address, ip_address, last_seen, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        serverId,
        device.device_id,
        device.user_id,
        device.device_name || null,
        device.mac_address || null,
        device.ip_address || null,
        device.last_seen || null,
        device.status || 'offline',
      ]
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

// ============ CACHED INVOICES OPERATIONS ============

export const cacheInvoices = async (serverId: number, invoices: CachedInvoice[]): Promise<void> => {
  const database = await getDatabase();

  for (const invoice of invoices) {
    await database.runAsync(
      `INSERT OR REPLACE INTO cached_invoices
       (server_id, invoice_id, user_id, invoice_no, amount, type, description, paid, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        serverId,
        invoice.invoice_id,
        invoice.invoice_id,
        invoice.invoice_no,
        invoice.amount || '0',
        invoice.type || null,
        invoice.description || null,
        invoice.paid ? 1 : 0,
        invoice.date || null,
      ]
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

// ============ STATISTICS ============

export const getServerStats = async (serverId: number): Promise<{
  totalUsers: number;
  activeUsers: number;
  expiredUsers: number;
  totalDebt: number;
  unpaidInvoices: number;
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

  return {
    totalUsers: userStats?.total || 0,
    activeUsers: userStats?.active || 0,
    expiredUsers: userStats?.expired || 0,
    totalDebt: userStats?.totalBalance || 0,
    unpaidInvoices: invoiceStats?.count || 0,
  };
};

// ============ SYNC OPERATIONS ============

export const updateServerSyncTime = async (serverId: number): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE servers SET last_sync = CURRENT_TIMESTAMP WHERE id = ?',
    [serverId]
  );
};

export const clearCachedData = async (serverId: number): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM cached_users WHERE server_id = ?', [serverId]);
  await database.runAsync('DELETE FROM cached_devices WHERE server_id = ?', [serverId]);
  await database.runAsync('DELETE FROM cached_invoices WHERE server_id = ?', [serverId]);
};
