import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  initDatabase,
  getServers,
  addServer as dbAddServer,
  updateServer as dbUpdateServer,
  deleteServer as dbDeleteServer,
  getDefaultServer,
  getCachedUsers,
  cacheUsers,
  cacheProfiles,
  getCachedProfiles,
  cacheManagers,
  getCachedManagers,
  getServerStats,
  updateServerSyncTime,
  getSyncSettings,
  updateSyncSettings,
  getLocalTransactions,
  addLocalTransaction,
  updateLocalTransaction,
  getLocalInvoices,
  addLocalInvoice,
  Server,
  CachedUser,
  CachedProfile,
  CachedManager,
  LocalTransaction,
  LocalInvoice,
  SyncSettings,
} from '../database/index';
import { sasApi, SyncResult, SASUser } from '../api/sasApi';

interface AppContextType {
  // Database state
  isDbReady: boolean;

  // Servers
  servers: Server[];
  currentServer: Server | null;
  addServer: (server: Omit<Server, 'id' | 'created_at'>) => Promise<number>;
  updateServer: (id: number, server: Partial<Server>) => Promise<void>;
  deleteServer: (id: number) => Promise<void>;
  selectServer: (server: Server) => Promise<boolean>;

  // Users/Subscribers
  subscribers: CachedUser[];
  isLoadingSubscribers: boolean;
  refreshSubscribers: () => Promise<void>;
  searchSubscribers: (query: string) => Promise<CachedUser[]>;

  // Profiles
  profiles: CachedProfile[];
  refreshProfiles: () => Promise<void>;

  // Managers
  managers: CachedManager[];
  refreshManagers: () => Promise<void>;

  // Statistics
  stats: {
    totalUsers: number;
    activeUsers: number;
    expiredUsers: number;
    totalDebt: number;
    unpaidInvoices: number;
    pendingTransactions: number;
  };
  refreshStats: () => Promise<void>;

  // Sync
  isSyncing: boolean;
  syncStatus: string;
  syncData: () => Promise<SyncResult>;
  syncSettings: SyncSettings | null;
  setSyncSettings: (settings: Partial<SyncSettings>) => Promise<void>;

  // Offline operations
  pendingTransactions: LocalTransaction[];
  localInvoices: LocalInvoice[];
  addTransaction: (transaction: Omit<LocalTransaction, 'id' | 'created_at' | 'status'>) => Promise<number>;
  addInvoice: (invoice: Omit<LocalInvoice, 'id' | 'created_at'>) => Promise<number>;
  syncPendingTransactions: () => Promise<{ synced: number; failed: number }>;

  // Connection
  isConnected: boolean;
  isOfflineMode: boolean;
  testConnection: (server: Server) => Promise<{ success: boolean; message: string }>;
  toggleOfflineMode: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [servers, setServers] = useState<Server[]>([]);
  const [currentServer, setCurrentServer] = useState<Server | null>(null);
  const [subscribers, setSubscribers] = useState<CachedUser[]>([]);
  const [profiles, setProfiles] = useState<CachedProfile[]>([]);
  const [managers, setManagers] = useState<CachedManager[]>([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [syncSettings, setSyncSettingsState] = useState<SyncSettings | null>(null);
  const [pendingTransactions, setPendingTransactions] = useState<LocalTransaction[]>([]);
  const [localInvoices, setLocalInvoices] = useState<LocalInvoice[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    expiredUsers: 0,
    totalDebt: 0,
    unpaidInvoices: 0,
    pendingTransactions: 0,
  });

  // Initialize database
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        setIsDbReady(true);

        // Load servers
        const loadedServers = await getServers();
        setServers(loadedServers);

        // Load sync settings
        const settings = await getSyncSettings();
        setSyncSettingsState(settings);
        setIsOfflineMode(settings?.offline_mode || false);

        // Set default server if exists
        const defaultServer = await getDefaultServer();
        if (defaultServer) {
          await selectServer(defaultServer);
        }

        // Load pending transactions
        await loadPendingTransactions();
      } catch (error) {
        console.error('Database init error:', error);
      }
    };

    init();
  }, []);

  // Load pending transactions
  const loadPendingTransactions = async () => {
    try {
      const pending = await getLocalTransactions(undefined, 'pending');
      setPendingTransactions(pending);

      const invoices = await getLocalInvoices();
      setLocalInvoices(invoices);
    } catch (error) {
      console.error('Error loading pending transactions:', error);
    }
  };

  // Add server
  const addServer = async (server: Omit<Server, 'id' | 'created_at'>): Promise<number> => {
    const id = await dbAddServer(server);
    const updatedServers = await getServers();
    setServers(updatedServers);
    return id;
  };

  // Update server
  const updateServer = async (id: number, server: Partial<Server>): Promise<void> => {
    await dbUpdateServer(id, server);
    const updatedServers = await getServers();
    setServers(updatedServers);

    // Update current server if it's the one being updated
    if (currentServer?.id === id) {
      const updated = updatedServers.find(s => s.id === id);
      if (updated) {
        setCurrentServer(updated);
        sasApi.setServer({
          ...updated,
          is_default: updated.is_default === 1,
        });
      }
    }
  };

  // Delete server
  const deleteServer = async (id: number): Promise<void> => {
    await dbDeleteServer(id);
    const updatedServers = await getServers();
    setServers(updatedServers);

    // Clear current server if it's the one being deleted
    if (currentServer?.id === id) {
      setCurrentServer(null);
      sasApi.clearServer();
      setIsConnected(false);
      setSubscribers([]);
      setProfiles([]);
      setManagers([]);
    }
  };

  // Select server
  const selectServer = async (server: Server): Promise<boolean> => {
    setCurrentServer(server);
    sasApi.setServer({
      ...server,
      is_default: server.is_default === 1,
    });

    // Try to login
    const loginResult = await sasApi.login();
    setIsConnected(loginResult.success);

    if (loginResult.success) {
      // Load cached data
      await refreshSubscribers();
      await refreshProfiles();
      await refreshManagers();
      await refreshStats();
    } else {
      // Even if login fails, load cached data for offline mode
      await refreshSubscribers();
      await refreshProfiles();
      await refreshManagers();
      await refreshStats();
    }

    return loginResult.success;
  };

  // Refresh subscribers from cache
  const refreshSubscribers = async () => {
    if (!currentServer?.id) return;

    setIsLoadingSubscribers(true);
    try {
      const users = await getCachedUsers(currentServer.id);
      setSubscribers(users);
    } catch (error) {
      console.error('Error loading subscribers:', error);
    } finally {
      setIsLoadingSubscribers(false);
    }
  };

  // Refresh profiles
  const refreshProfiles = async () => {
    if (!currentServer?.id) return;

    try {
      const profileList = await getCachedProfiles(currentServer.id);
      setProfiles(profileList);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  // Refresh managers
  const refreshManagers = async () => {
    if (!currentServer?.id) return;

    try {
      const managerList = await getCachedManagers(currentServer.id);
      setManagers(managerList);
    } catch (error) {
      console.error('Error loading managers:', error);
    }
  };

  // Search subscribers
  const searchSubscribers = async (query: string): Promise<CachedUser[]> => {
    if (!currentServer?.id || !query.trim()) {
      return subscribers;
    }

    const { searchCachedUsers } = await import('../database/index');
    return await searchCachedUsers(currentServer.id, query);
  };

  // Refresh statistics
  const refreshStats = async () => {
    if (!currentServer?.id) return;

    try {
      const serverStats = await getServerStats(currentServer.id);
      setStats(serverStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Sync data from server
  const syncData = async (): Promise<SyncResult> => {
    if (!currentServer) {
      return { success: false, error: 'لم يتم تحديد السيرفر' };
    }

    if (isOfflineMode) {
      return { success: false, error: 'وضع عدم الاتصال مفعل' };
    }

    setIsSyncing(true);
    setSyncStatus('جاري الاتصال بالسيرفر...');

    try {
      // Ensure connected
      if (!isConnected) {
        const loginResult = await sasApi.login();
        if (!loginResult.success) {
          return { success: false, error: loginResult.message || 'فشل الاتصال' };
        }
        setIsConnected(true);
      }

      // Sync users
      setSyncStatus('جاري جلب المشتركين...');
      const usersResult = await sasApi.getUsers(1, 5000);

      if (usersResult.success && usersResult.users) {
        const cachedUsersList: CachedUser[] = usersResult.users.map((user: SASUser) => ({
          server_id: currentServer.id!,
          user_id: user.id,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          phone: user.phone,
          balance: user.balance || '0',
          profile: user.profile,
          profile_id: user.profile_id,
          status: user.status || 'active',
          expiration: user.expiration,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        await cacheUsers(currentServer.id!, cachedUsersList);
      }

      // Sync profiles
      setSyncStatus('جاري جلب الباقات...');
      const profilesResult = await sasApi.getProfiles();
      if (profilesResult.success && profilesResult.profiles) {
        const cachedProfilesList: CachedProfile[] = profilesResult.profiles.map((profile: any, index: number) => ({
          server_id: currentServer.id!,
          profile_id: profile.id || index,
          name: profile.name,
          price: profile.price,
          download_speed: profile.download_speed,
          upload_speed: profile.upload_speed,
          description: profile.description,
          created_at: new Date().toISOString(),
        }));
        await cacheProfiles(currentServer.id!, cachedProfilesList);
      }

      // Sync managers
      setSyncStatus('جاري جلب المدراء...');
      const managersResult = await sasApi.getManagers();
      if (managersResult.success && managersResult.managers) {
        const cachedManagersList: CachedManager[] = managersResult.managers.map((manager: any) => ({
          server_id: currentServer.id!,
          manager_id: manager.id,
          username: manager.username,
          email: manager.email,
          firstname: manager.firstname,
          lastname: manager.lastname,
          phone: manager.phone,
          status: manager.status,
          created_at: new Date().toISOString(),
        }));
        await cacheManagers(currentServer.id!, cachedManagersList);
      }

      // Update sync time
      await updateServerSyncTime(currentServer.id!);

      // Refresh local data
      await refreshSubscribers();
      await refreshProfiles();
      await refreshManagers();
      await refreshStats();

      setSyncStatus('تمت المزامنة بنجاح');

      return {
        success: true,
        usersCount: usersResult.users?.length || 0,
      };
    } catch (error) {
      setSyncStatus('فشلت المزامنة');
      return { success: false, error: 'حدث خطأ أثناء المزامنة' };
    } finally {
      setIsSyncing(false);
    }
  };

  // Test connection
  const testConnection = async (server: Server): Promise<{ success: boolean; message: string }> => {
    return await sasApi.testConnection({
      ...server,
      is_default: server.is_default === 1,
    });
  };

  // Add transaction (offline capable)
  const addTransaction = async (transaction: Omit<LocalTransaction, 'id' | 'created_at' | 'status'>): Promise<number> => {
    const id = await addLocalTransaction(transaction);
    await loadPendingTransactions();
    return id;
  };

  // Add invoice
  const addInvoice = async (invoice: Omit<LocalInvoice, 'id' | 'created_at'>): Promise<number> => {
    const id = await addLocalInvoice(invoice);
    await loadPendingTransactions();
    return id;
  };

  // Sync pending transactions
  const syncPendingTransactions = async (): Promise<{ synced: number; failed: number }> => {
    if (!currentServer || !isConnected || isOfflineMode) {
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const tx of pendingTransactions) {
      try {
        let result;

        if (tx.type === 'deposit') {
          result = await sasApi.userDeposit(tx.user_id, tx.amount, tx.description);
        } else if (tx.type === 'withdraw') {
          result = await sasApi.userWithdraw(tx.user_id, tx.amount, tx.description);
        } else {
          // Other types can be added here
          result = { success: false, message: 'نوع العملية غير مدعوم' };
        }

        if (result.success) {
          await updateLocalTransaction(tx.id!, {
            status: 'synced',
            synced_at: new Date().toISOString(),
          });
          synced++;
        } else {
          await updateLocalTransaction(tx.id!, {
            status: 'failed',
            error_message: result.message,
          });
          failed++;
        }
      } catch (error: any) {
        await updateLocalTransaction(tx.id!, {
          status: 'failed',
          error_message: error.message,
        });
        failed++;
      }
    }

    await loadPendingTransactions();
    await refreshStats();

    return { synced, failed };
  };

  // Toggle offline mode
  const toggleOfflineMode = async () => {
    const newMode = !isOfflineMode;
    setIsOfflineMode(newMode);
    await updateSyncSettings({ offline_mode: newMode });
  };

  // Set sync settings
  const setSyncSettings = async (settings: Partial<SyncSettings>) => {
    await updateSyncSettings(settings);
    const newSettings = await getSyncSettings();
    setSyncSettingsState(newSettings);
  };

  const value: AppContextType = {
    isDbReady,
    servers,
    currentServer,
    addServer,
    updateServer,
    deleteServer,
    selectServer,
    subscribers,
    isLoadingSubscribers,
    refreshSubscribers,
    searchSubscribers,
    profiles,
    refreshProfiles,
    managers,
    refreshManagers,
    stats,
    refreshStats,
    isSyncing,
    syncStatus,
    syncData,
    syncSettings,
    setSyncSettings,
    pendingTransactions,
    localInvoices,
    addTransaction,
    addInvoice,
    syncPendingTransactions,
    isConnected,
    isOfflineMode,
    testConnection,
    toggleOfflineMode,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
