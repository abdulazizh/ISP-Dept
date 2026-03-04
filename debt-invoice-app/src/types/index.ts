// User related types
export interface User {
  id: number;
  username: string;
  enabled: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  balance: string;
  created_at: string;
  expiration: string;
  profile: string;
  status: string;
}

export interface UserProfile {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  balance: string;
  debt_limit: string | null;
  expiration: string;
  profile: string;
  status: 'active' | 'expired' | 'disabled' | 'online';
  download: string;
  upload: string;
  remaining_download: string;
  remaining_upload: string;
  remaining_traffic: string;
}

// Invoice related types
export interface Invoice {
  id: number;
  invoice_no: string;
  date: string;
  type: string;
  amount: string;
  description: string;
  paid: number;
  created_by: string;
  payment_method: string | null;
  username: string;
}

export interface Payment {
  id: number;
  receipt_no: string;
  date: string;
  type: string;
  amount: string;
  description: string;
  created_by: string;
}

// Journal entry type (for debt tracking)
export interface JournalEntry {
  id: number;
  date: string;
  cr: string; // Credit
  dr: string; // Debit
  amount: string;
  balance: string;
  operation: string;
  description: string;
}

// Service/Profile types
export interface Service {
  id: number;
  name: string;
  description: string;
  price: string;
  download_speed: string;
  upload_speed: string;
  traffic_limit: string;
  duration: string;
}

export interface Profile {
  id: number;
  name: string;
  description: string;
  price: string;
}

// Session types
export interface Session {
  id: number;
  started: string;
  ended: string;
  ip: string;
  download: string;
  upload: string;
  mac: string;
  profile: string;
  service: string;
  protocol: string;
}

// Traffic usage types
export interface TrafficUsage {
  download: string;
  upload: string;
  total: string;
  remaining_download: string;
  remaining_upload: string;
  remaining_total: string;
  daily_download: string;
  daily_upload: string;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
  language?: string;
}

export interface AuthResponse {
  status: number;
  token: string;
  message?: string;
}

export interface DashboardData {
  balance: string;
  expiration: string;
  profile: string;
  status: string;
  remaining_days: number;
  download: string;
  upload: string;
  remaining_download: string;
  remaining_upload: string;
}

// API Response types
export interface ApiResponse<T> {
  status: number;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

// Package types for activation
export interface Package {
  id: number;
  name: string;
  profile_id: number;
  profile_name: string;
  price: string;
  duration: number;
  download: string;
  upload: string;
  description: string;
}

// Extension type
export interface Extension {
  id: number;
  name: string;
  duration: number;
  price: string;
  description: string;
}
