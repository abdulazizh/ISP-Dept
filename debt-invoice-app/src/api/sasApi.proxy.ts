// Proxy API service for web - uses Next.js server as proxy to avoid mixed content issues
import { Platform } from 'react-native';
import axios from 'axios';

// Types
export interface ServerConfig {
  id?: number;
  name: string;
  url: string;
  username: string;
  password: string;
  is_default?: boolean;
}

export interface SASUser {
  id: number;
  username: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  balance: string;
  profile?: string;
  status: string;
  expiration?: string;
  enabled?: number;
  created_at?: string;
}

export interface SyncResult {
  success: boolean;
  usersCount?: number;
  error?: string;
}

// Proxy API URL - Next.js server
const getProxyUrl = () => {
  // On web, use the Next.js server as proxy
  if (Platform.OS === 'web') {
    // Use relative URL if served from same origin, otherwise use the known Next.js server
    return '/api/sas';
  }
  // On native, connect directly to SAS server (no mixed content issues)
  return null;
};

class ProxyApiService {
  private currentServer: ServerConfig | null = null;
  private token: string | null = null;
  private useProxy: boolean = false;

  setServer(server: ServerConfig): void {
    this.currentServer = server;
    this.useProxy = Platform.OS === 'web';
    
    // On web, we need to use proxy; on native, direct connection
    if (this.useProxy) {
      console.log('Using proxy mode for web');
    } else {
      console.log('Using direct connection for native');
    }
    
    this.token = null;
  }

  clearServer(): void {
    this.currentServer = null;
    this.token = null;
  }

  getCurrentServer(): ServerConfig | null {
    return this.currentServer;
  }

  // Make request through proxy
  private async proxyRequest(action: string, extraData?: object): Promise<any> {
    const response = await axios.post('/api/sas', {
      action,
      server: this.currentServer ? {
        url: this.currentServer.url,
        username: this.currentServer.username,
        password: this.currentServer.password,
      } : null,
      token: this.token,
      ...extraData,
    });
    
    return response.data;
  }

  // Login
  async login(): Promise<{ success: boolean; token?: string; message?: string }> {
    if (!this.currentServer) {
      return { success: false, message: 'لم يتم تحديد السيرفر' };
    }

    try {
      if (this.useProxy) {
        const result = await this.proxyRequest('login');
        if (result.success && result.token) {
          this.token = result.token;
          return { success: true, token: result.token };
        }
        return { success: false, message: result.message || 'فشل تسجيل الدخول' };
      } else {
        // Direct connection for native (using the original sasApi)
        const { sasApi: directApi } = await import('./sasApi.native');
        directApi.setServer(this.currentServer);
        const result = await directApi.login();
        if (result.success && result.token) {
          this.token = result.token;
        }
        return result;
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'حدث خطأ في الاتصال'
      };
    }
  }

  // Test connection
  async testConnection(server: ServerConfig): Promise<{ success: boolean; message: string }> {
    const originalServer = this.currentServer;
    const originalToken = this.token;

    try {
      this.setServer(server);
      const result = await this.login();

      if (result.success) {
        return { success: true, message: 'تم الاتصال بنجاح' };
      }
      return { success: false, message: result.message || 'فشل الاتصال' };
    } finally {
      this.currentServer = originalServer;
      this.token = originalToken;
    }
  }

  // Get users
  async getUsers(page: number = 1, count: number = 50): Promise<{
    success: boolean;
    users?: SASUser[];
    message?: string;
  }> {
    try {
      if (this.useProxy) {
        const result = await this.proxyRequest('syncAll');
        if (result.success && result.data?.users) {
          return { success: true, users: result.data.users };
        }
        return { success: false, message: result.message };
      } else {
        const { sasApi: directApi } = await import('./sasApi.native');
        return await directApi.getUsers(page, count);
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // Sync data
  async syncAllData(onProgress?: (status: string) => void): Promise<SyncResult> {
    try {
      if (!this.token) {
        const loginResult = await this.login();
        if (!loginResult.success) {
          return { success: false, error: loginResult.message };
        }
      }

      onProgress?.('جاري المزامنة...');

      if (this.useProxy) {
        const result = await this.proxyRequest('syncAll');
        if (result.success) {
          return {
            success: true,
            usersCount: result.data?.users?.length || 0,
          };
        }
        return { success: false, error: result.message };
      } else {
        const { sasApi: directApi } = await import('./sasApi.native');
        return await directApi.syncAllData(onProgress);
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // User deposit
  async userDeposit(userId: number, amount: number, comment?: string): Promise<{ success: boolean; message?: string }> {
    try {
      if (this.useProxy) {
        return await this.proxyRequest('addBalance', { userId, userData: { amount } });
      } else {
        const { sasApi: directApi } = await import('./sasApi.native');
        return await directApi.userDeposit(userId, amount, comment);
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // User withdrawal
  async userWithdraw(userId: number, amount: number, comment?: string): Promise<{ success: boolean; message?: string }> {
    try {
      if (this.useProxy) {
        return await this.proxyRequest('addBalance', { userId, userData: { amount: -amount } });
      } else {
        const { sasApi: directApi } = await import('./sasApi.native');
        return await directApi.userWithdraw(userId, amount, comment);
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

export const sasApi = new ProxyApiService();
export default sasApi;
