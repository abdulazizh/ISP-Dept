// Unified API service - uses Next.js proxy on web, direct connection on native
import { Platform } from 'react-native';
import axios, { AxiosInstance, AxiosError } from 'axios';
import CryptoJS from 'crypto-js';

// API Configuration
const ENCRYPTION_KEY = 'abcdefghijuklmno0123456789012345';

// Proxy URL for web - Next.js server
const PROXY_API_URL = 'https://7caafz-ip-8-218-223-229.tunnelmole.net/api/sas';

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
  profile_id?: number;
  status: string;
  expiration?: string;
  enabled?: number;
  created_at?: string;
  last_online?: string;
}

export interface SyncResult {
  success: boolean;
  usersCount?: number;
  devicesCount?: number;
  invoicesCount?: number;
  error?: string;
}

class SASApiService {
  private adminApi: AxiosInstance | null = null;
  private token: string | null = null;
  private currentServer: ServerConfig | null = null;
  private useProxy: boolean = false;

  // Encrypt payload for POST requests
  private encryptPayload(data: object): string {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY);
    return encrypted.toString();
  }

  // Set server configuration
  setServer(server: ServerConfig): void {
    this.currentServer = server;
    
    // On web platform, use proxy to avoid mixed content issues
    this.useProxy = Platform.OS === 'web';
    
    if (this.useProxy) {
      // Use Next.js API as proxy (with full URL for cross-origin)
      this.adminApi = axios.create({
        baseURL: PROXY_API_URL,
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      // Direct connection for native
      const baseUrl = server.url.replace(/\/$/, '');
      this.adminApi = axios.create({
        baseURL: `${baseUrl}/admin/api/index.php/api`,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    this.token = null;
  }

  // Clear current server
  clearServer(): void {
    this.currentServer = null;
    this.adminApi = null;
    this.token = null;
  }

  // Get current server
  getCurrentServer(): ServerConfig | null {
    return this.currentServer;
  }

  // Login to SAS server
  async login(): Promise<{ success: boolean; token?: string; message?: string }> {
    if (!this.adminApi || !this.currentServer) {
      return { success: false, message: 'لم يتم تحديد السيرفر' };
    }

    try {
      if (this.useProxy) {
        // Use proxy - POST to the proxy URL (baseURL already set)
        const response = await this.adminApi.post('', {
          action: 'login',
          server: {
            url: this.currentServer.url,
            username: this.currentServer.username,
            password: this.currentServer.password,
          },
        });

        if (response.data.success && response.data.token) {
          this.token = response.data.token;
          return { success: true, token: response.data.token };
        }
        return { success: false, message: response.data.message || 'فشل تسجيل الدخول' };
      } else {
        // Direct connection
        const payload = this.encryptPayload({
          username: this.currentServer.username,
          password: this.currentServer.password,
          language: 'ar',
        });

        const response = await this.adminApi.post('/login', { payload });

        if (response.data.status === 200 && response.data.token) {
          this.token = response.data.token;
          return { success: true, token: response.data.token };
        }

        return { success: false, message: response.data.message || 'فشل تسجيل الدخول' };
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return {
        success: false,
        message: axiosError.response?.data?.message || 'حدث خطأ في الاتصال بالسيرفر'
      };
    }
  }

  // Test server connection
  async testConnection(server: ServerConfig): Promise<{ success: boolean; message: string }> {
    const originalServer = this.currentServer;
    const originalApi = this.adminApi;
    const originalToken = this.token;
    const originalUseProxy = this.useProxy;

    try {
      this.setServer(server);
      const result = await this.login();

      if (result.success) {
        return { success: true, message: 'تم الاتصال بنجاح' };
      }
      return { success: false, message: result.message || 'فشل الاتصال' };
    } finally {
      this.currentServer = originalServer;
      this.adminApi = originalApi;
      this.token = originalToken;
      this.useProxy = originalUseProxy;
    }
  }

  // Get users list
  async getUsers(page: number = 1, count: number = 50): Promise<{
    success: boolean;
    users?: SASUser[];
    total?: number;
    message?: string;
  }> {
    if (!this.adminApi || !this.token) {
      // Try to login first
      const loginResult = await this.login();
      if (!loginResult.success) {
        return { success: false, message: loginResult.message };
      }
    }

    try {
      if (this.useProxy) {
        const response = await this.adminApi!.post('', {
          action: 'syncAll',
          server: {
            url: this.currentServer!.url,
            username: this.currentServer!.username,
            password: this.currentServer!.password,
          },
          token: this.token,
        });

        if (response.data.success && response.data.data?.users) {
          return {
            success: true,
            users: response.data.data.users,
            total: response.data.data.users.length,
          };
        }
        return { success: false, message: response.data.message };
      } else {
        const config = {
          headers: { Authorization: `Bearer ${this.token}` },
        };

        const payload = this.encryptPayload({ page, count });
        const response = await this.adminApi!.post('/index/user', { payload }, config);

        if (response.data.status === 200 || Array.isArray(response.data.data)) {
          const users = response.data.data || [];
          return { success: true, users, total: users.length };
        }

        return { success: false, message: response.data.message };
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message || 'حدث خطأ' };
    }
  }

  // Sync all data
  async syncAllData(onProgress?: (status: string) => void): Promise<SyncResult> {
    try {
      if (!this.token) {
        onProgress?.('جاري الاتصال...');
        const loginResult = await this.login();
        if (!loginResult.success) {
          return { success: false, error: loginResult.message };
        }
      }

      onProgress?.('جاري مزامنة البيانات...');

      if (this.useProxy) {
        const response = await this.adminApi!.post('', {
          action: 'syncAll',
          server: {
            url: this.currentServer!.url,
            username: this.currentServer!.username,
            password: this.currentServer!.password,
          },
          token: this.token,
        });

        if (response.data.success) {
          return {
            success: true,
            usersCount: response.data.data?.users?.length || 0,
          };
        }
        return { success: false, error: response.data.message };
      } else {
        const result = await this.getUsers(1, 5000);
        return {
          success: result.success,
          usersCount: result.users?.length || 0,
          error: result.message,
        };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'حدث خطأ أثناء المزامنة' };
    }
  }

  // User deposit
  async userDeposit(userId: number, amount: number, comment?: string): Promise<{ success: boolean; message?: string }> {
    if (!this.adminApi || !this.token) {
      return { success: false, message: 'غير متصل بالسيرفر' };
    }

    try {
      if (this.useProxy) {
        const response = await this.adminApi.post('', {
          action: 'addBalance',
          server: {
            url: this.currentServer!.url,
            username: this.currentServer!.username,
            password: this.currentServer!.password,
          },
          token: this.token,
          userId,
          userData: { amount },
        });
        return response.data;
      } else {
        // Direct implementation for native
        return { success: false, message: 'غير مدعوم حالياً' };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // User withdrawal
  async userWithdraw(userId: number, amount: number, comment?: string): Promise<{ success: boolean; message?: string }> {
    if (!this.adminApi || !this.token) {
      return { success: false, message: 'غير متصل بالسيرفر' };
    }

    try {
      if (this.useProxy) {
        const response = await this.adminApi.post('', {
          action: 'addBalance',
          server: {
            url: this.currentServer!.url,
            username: this.currentServer!.username,
            password: this.currentServer!.password,
          },
          token: this.token,
          userId,
          userData: { amount: -amount },
        });
        return response.data;
      } else {
        return { success: false, message: 'غير مدعوم حالياً' };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // Get profiles
  async getProfiles(): Promise<{ success: boolean; profiles?: any[]; message?: string }> {
    if (!this.adminApi || !this.token) {
      return { success: false, message: 'غير متصل بالسيرفر' };
    }

    try {
      if (this.useProxy) {
        const response = await this.adminApi.post('', {
          action: 'getProfiles',
          server: {
            url: this.currentServer!.url,
            username: this.currentServer!.username,
            password: this.currentServer!.password,
          },
          token: this.token,
        });
        return response.data;
      } else {
        return { success: false, message: 'غير مدعوم حالياً' };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // Get managers
  async getManagers(): Promise<{ success: boolean; managers?: any[]; message?: string }> {
    if (!this.adminApi || !this.token) {
      return { success: false, message: 'غير متصل بالسيرفر' };
    }

    try {
      if (this.useProxy) {
        const response = await this.adminApi.post('', {
          action: 'getManagers',
          server: {
            url: this.currentServer!.url,
            username: this.currentServer!.username,
            password: this.currentServer!.password,
          },
          token: this.token,
        });
        return response.data;
      } else {
        return { success: false, message: 'غير مدعوم حالياً' };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

export const sasApi = new SASApiService();
export default sasApi;
