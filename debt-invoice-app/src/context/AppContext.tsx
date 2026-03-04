import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  initDatabase,
  getCachedUsers,
  addCachedUser,
  updateCachedUser,
  deleteCachedUser,
  searchCachedUsers,
  getCachedProfiles,
  cacheProfiles,
  addDebtRecord,
  getDebtRecords,
  getUserTotalDebt,
  hasUserDebts,
  addPaymentRecord,
  getPaymentRecords,
  addLocalTransaction,
  getLocalTransactions,
  updateLocalTransaction,
  getStats,
  updateLastSync,
  getLastSync,
  addServer,
  getServers,
  deleteServer as dbDeleteServer,
  getDefaultServer,
  GlobalUser,
  GlobalProfile,
  DebtRecord,
  PaymentRecord,
  LocalTransaction,
  Server,
} from '../database/index';
import { sasApi, SyncResult, SASUser } from '../api/sasApi';

interface AppContextType {
  // Database state
  isDbReady: boolean;

  // Users/Subscribers
  subscribers: GlobalUser[];
  isLoadingSubscribers: boolean;
  refreshSubscribers: () => Promise<void>;
  searchSubscribers: (query: string) => Promise<GlobalUser[]>;
  addSubscriber: (user: Omit<GlobalUser, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
  updateSubscriber: (userId: number, updates: Partial<GlobalUser>) => Promise<void>;
  deleteSubscriber: (userId: number) => Promise<{ success: boolean; message: string }>;

  // Profiles
  profiles: GlobalProfile[];
  refreshProfiles: () => Promise<void>;

  // Debts
  debts: DebtRecord[];
  refreshDebts: () => Promise<void>;
  addDebt: (debt: Omit<DebtRecord, 'id' | 'created_at' | 'updated_at'>) => Promise<number>;
  getUserDebt: (userId: number) => Promise<number>;
  canDeleteUser: (userId: number) => Promise<boolean>;

  // Payments
  addPayment: (payment: Omit<PaymentRecord, 'id' | 'created_at'>) => Promise<number>;
  getPayments: (debtId?: number, userId?: number) => Promise<PaymentRecord[]>;

  // Statistics
  stats: {
    totalUsers: number;
    activeUsers: number;
    expiredUsers: number;
    totalDebt: number;
    pendingDebts: number;
  };
  refreshStats: () => Promise<void>;

  // Sync
  isSyncing: boolean;
  syncStatus: string;
  syncData: () => Promise<SyncResult>;
  lastSync: string | null;

  // Offline operations
  pendingTransactions: LocalTransaction[];
  addTransaction: (transaction: Omit<LocalTransaction, 'id' | 'created_at' | 'status'>) => Promise<number>;
  syncPendingTransactions: () => Promise<{ synced: number; failed: number }>;

  // Servers
  servers: Server[];
  currentServer: Server | null;
  addServer: (server: Omit<Server, 'id' | 'created_at'>) => Promise<number>;
  updateServer: (id: number, updates: Partial<Server>) => Promise<void>;
  deleteServer: (id: number) => Promise<void>;
  selectServer: (server: Server) => Promise<boolean>;

  // Connection
  isConnected: boolean;
  testConnection: (server: Server) => Promise<{ success: boolean; message: string }>;
  
  // SAS API functions
  createUser: (userData: {
    username: string;
    password: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    email?: string;
    profile_id?: number;
    parent_id?: number;
    enabled?: number;
    expiration?: string;
  }) => Promise<{ success: boolean; user?: any; message?: string; errors?: Record<string, string[]> }>;
  deleteUser: (userId: number) => Promise<{ success: boolean; message?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [subscribers, setSubscribers] = useState<GlobalUser[]>([]);
  const [profiles, setProfiles] = useState<GlobalProfile[]>([]);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<LocalTransaction[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [currentServer, setCurrentServer] = useState<Server | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    expiredUsers: 0,
    totalDebt: 0,
    pendingDebts: 0,
  });

  // Initialize database
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        setIsDbReady(true);

        // Load cached data
        await refreshSubscribers();
        await refreshProfiles();
        await refreshDebts();
        await refreshStats();
        await loadPendingTransactions();

        // Load last sync time
        const syncTime = await getLastSync();
        setLastSync(syncTime);

        // Load servers
        const loadedServers = await getServers();
        setServers(loadedServers);

        // Set default server if exists
        const defaultServer = await getDefaultServer();
        if (defaultServer) {
          setCurrentServer(defaultServer);
          sasApi.setServer({
            ...defaultServer,
            is_default: defaultServer.is_default === 1,
          });
        }
      } catch (error) {
        console.error('Database init error:', error);
      }
    };

    init();
  }, []);

  // Load pending transactions
  const loadPendingTransactions = async () => {
    try {
      const pending = await getLocalTransactions('pending');
      setPendingTransactions(pending);
    } catch (error) {
      console.error('Error loading pending transactions:', error);
    }
  };

  // Refresh subscribers from cache
  const refreshSubscribers = async () => {
    setIsLoadingSubscribers(true);
    try {
      const users = await getCachedUsers();
      setSubscribers(users);
    } catch (error) {
      console.error('Error loading subscribers:', error);
    } finally {
      setIsLoadingSubscribers(false);
    }
  };

  // Refresh profiles
  const refreshProfiles = async () => {
    try {
      const profileList = await getCachedProfiles();
      setProfiles(profileList);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  // Refresh debts
  const refreshDebts = async () => {
    try {
      const debtList = await getDebtRecords();
      setDebts(debtList);
    } catch (error) {
      console.error('Error loading debts:', error);
    }
  };

  // Refresh statistics
  const refreshStats = async () => {
    try {
      const serverStats = await getStats();
      setStats(serverStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Search subscribers
  const searchSubscribersHandler = async (query: string): Promise<GlobalUser[]> => {
    if (!query.trim()) {
      return subscribers;
    }
    return await searchCachedUsers(query);
  };

  // Add subscriber
  const addSubscriberHandler = async (user: Omit<GlobalUser, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    const id = await addCachedUser(user);
    await refreshSubscribers();
    await refreshStats();
    return id;
  };

  // Update subscriber
  const updateSubscriberHandler = async (userId: number, updates: Partial<GlobalUser>): Promise<void> => {
    await updateCachedUser(userId, updates);
    await refreshSubscribers();
  };

  // Delete subscriber (with debt check)
  const deleteSubscriberHandler = async (userId: number): Promise<{ success: boolean; message: string }> => {
    // Check if user has debts
    const hasDebts = await hasUserDebts(userId);
    if (hasDebts) {
      return { success: false, message: 'لا يمكن حذف المشترك لأن لديه ديون مسجلة' };
    }

    const deleted = await deleteCachedUser(userId);
    if (deleted) {
      await refreshSubscribers();
      await refreshStats();
      return { success: true, message: 'تم حذف المشترك بنجاح' };
    }
    return { success: false, message: 'فشل حذف المشترك' };
  };

  // Add debt
  const addDebtHandler = async (debt: Omit<DebtRecord, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    const id = await addDebtRecord(debt);
    await refreshDebts();
    await refreshStats();
    return id;
  };

  // Get user debt total
  const getUserDebtHandler = async (userId: number): Promise<number> => {
    return await getUserTotalDebt(userId);
  };

  // Check if user can be deleted
  const canDeleteUserHandler = async (userId: number): Promise<boolean> => {
    return !(await hasUserDebts(userId));
  };

  // Add payment
  const addPaymentHandler = async (payment: Omit<PaymentRecord, 'id' | 'created_at'>): Promise<number> => {
    const id = await addPaymentRecord(payment);
    await refreshDebts();
    await refreshStats();
    return id;
  };

  // Get payments
  const getPaymentsHandler = async (debtId?: number, userId?: number): Promise<PaymentRecord[]> => {
    return await getPaymentRecords(debtId, userId);
  };

  // Sync data from server
  const syncData = async (): Promise<SyncResult> => {
    if (!currentServer) {
      return { success: false, error: 'لم يتم تحديد السيرفر' };
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
        const cachedUsersList: GlobalUser[] = usersResult.users.map((user: SASUser) => ({
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
          enabled: user.enabled,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          source_server: currentServer.name,
        }));

        // Import to database
        const { cacheUsers } = await import('../database/index');
        await cacheUsers(cachedUsersList);
      }

      // Sync profiles
      setSyncStatus('جاري جلب الباقات...');
      const profilesResult = await sasApi.getProfiles();
      if (profilesResult.success && profilesResult.profiles) {
        const cachedProfilesList: GlobalProfile[] = profilesResult.profiles.map((profile: any, index: number) => ({
          profile_id: profile.id || index,
          name: profile.name,
          price: profile.price,
          download_speed: profile.download_speed,
          upload_speed: profile.upload_speed,
          description: profile.description,
          created_at: new Date().toISOString(),
        }));
        await cacheProfiles(cachedProfilesList);
      }

      // Update sync time
      await updateLastSync();
      const syncTime = await getLastSync();
      setLastSync(syncTime);

      // Refresh local data
      await refreshSubscribers();
      await refreshProfiles();
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
  const testConnectionHandler = async (server: Server): Promise<{ success: boolean; message: string }> => {
    return await sasApi.testConnection({
      ...server,
      is_default: server.is_default === 1,
    });
  };

  // Add transaction (offline capable)
  const addTransactionHandler = async (transaction: Omit<LocalTransaction, 'id' | 'created_at' | 'status'>): Promise<number> => {
    const id = await addLocalTransaction(transaction);
    await loadPendingTransactions();
    return id;
  };

  // Sync pending transactions
  const syncPendingTransactionsHandler = async (): Promise<{ synced: number; failed: number }> => {
    if (!currentServer || !isConnected) {
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

  // Add server
  const addNewServerHandler = async (server: Omit<Server, 'id' | 'created_at'>): Promise<number> => {
    const id = await addServer(server);
    const loadedServers = await getServers();
    setServers(loadedServers);
    return id;
  };

  // Update server
  const updateServerHandler = async (id: number, updates: Partial<Server>): Promise<void> => {
    const { updateServer: dbUpdateServer } = await import('../database/index');
    await dbUpdateServer(id, updates);
    const loadedServers = await getServers();
    setServers(loadedServers);
    
    // Update current server if it's the one being edited
    if (currentServer?.id === id) {
      const updated = loadedServers.find(s => s.id === id);
      if (updated) {
        setCurrentServer(updated);
        sasApi.setServer({
          ...updated,
          is_default: updated.is_default === 1,
        });
      }
    }
  };

  // Remove server
  const removeServerHandler = async (id: number): Promise<void> => {
    await dbDeleteServer(id);
    const loadedServers = await getServers();
    setServers(loadedServers);

    if (currentServer?.id === id) {
      setCurrentServer(null);
      sasApi.clearServer();
      setIsConnected(false);
    }
  };

  // Select server - مع جلب البيانات تلقائياً
  const selectServerHandler = async (server: Server): Promise<boolean> => {
    setCurrentServer(server);
    sasApi.setServer({
      ...server,
      is_default: server.is_default === 1,
    });

    // Try to login
    setIsSyncing(true);
    setSyncStatus('جاري الاتصال بالسيرفر...');
    
    const loginResult = await sasApi.login();
    setIsConnected(loginResult.success);

    if (loginResult.success) {
      // جلب البيانات تلقائياً بعد الاتصال الناجح
      setSyncStatus('جاري جلب البيانات تلقائياً...');
      
      try {
        // Sync users
        setSyncStatus('جاري جلب المشتركين...');
        const usersResult = await sasApi.getUsers(1, 5000);

        if (usersResult.success && usersResult.users) {
          const cachedUsersList: GlobalUser[] = usersResult.users.map((user: SASUser) => ({
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
            enabled: user.enabled,
            created_at: user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            source_server: server.name,
          }));

          // Import to database
          const { cacheUsers } = await import('../database/index');
          await cacheUsers(cachedUsersList);
        }

        // Sync profiles
        setSyncStatus('جاري جلب الباقات...');
        const profilesResult = await sasApi.getProfiles();
        if (profilesResult.success && profilesResult.profiles) {
          const cachedProfilesList: GlobalProfile[] = profilesResult.profiles.map((profile: any, index: number) => ({
            profile_id: profile.id || index,
            name: profile.name,
            price: profile.price,
            download_speed: profile.download_speed,
            upload_speed: profile.upload_speed,
            description: profile.description,
            created_at: new Date().toISOString(),
          }));
          await cacheProfiles(cachedProfilesList);
        }

        // Update sync time
        await updateLastSync();
        const syncTime = await getLastSync();
        setLastSync(syncTime);

        // Refresh local data
        await refreshSubscribers();
        await refreshProfiles();
        await refreshStats();

        setSyncStatus('تم جلب البيانات بنجاح');
      } catch (error) {
        console.error('Auto-sync error:', error);
        setSyncStatus('تم الاتصال لكن فشل جلب البيانات');
      }
    }

    setIsSyncing(false);
    return loginResult.success;
  };

  const value: AppContextType = {
    isDbReady,
    subscribers,
    isLoadingSubscribers,
    refreshSubscribers,
    searchSubscribers: searchSubscribersHandler,
    addSubscriber: addSubscriberHandler,
    updateSubscriber: updateSubscriberHandler,
    deleteSubscriber: deleteSubscriberHandler,
    profiles,
    refreshProfiles,
    debts,
    refreshDebts,
    addDebt: addDebtHandler,
    getUserDebt: getUserDebtHandler,
    canDeleteUser: canDeleteUserHandler,
    addPayment: addPaymentHandler,
    getPayments: getPaymentsHandler,
    stats,
    refreshStats,
    isSyncing,
    syncStatus,
    syncData,
    lastSync,
    pendingTransactions,
    addTransaction: addTransactionHandler,
    syncPendingTransactions: syncPendingTransactionsHandler,
    servers,
    currentServer,
    addServer: addNewServerHandler,
    updateServer: updateServerHandler,
    deleteServer: removeServerHandler,
    selectServer: selectServerHandler,
    isConnected,
    testConnection: testConnectionHandler,
    createUser: sasApi.createUser.bind(sasApi),
    deleteUser: sasApi.deleteUser.bind(sasApi),
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
