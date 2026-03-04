// App Theme Constants
export const COLORS = {
  // Primary colors
  primary: '#1E3A5F',
  primaryLight: '#3A5A8F',
  primaryDark: '#0F1D30',
  
  // Secondary colors
  secondary: '#4CAF50',
  secondaryLight: '#81C784',
  secondaryDark: '#388E3C',
  
  // Accent colors
  accent: '#FF6B35',
  accentLight: '#FF8A5B',
  accentDark: '#E55A25',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',
  
  // Background colors
  background: '#F5F7FA',
  backgroundDark: '#E8ECF1',
  surface: '#FFFFFF',
  surfaceDark: '#F0F2F5',
  
  // Text colors
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textLight: '#FFFFFF',
  textMuted: '#AAAAAA',
  
  // Border colors
  border: '#E0E0E0',
  borderDark: '#CCCCCC',
  
  // Special colors for debt/invoice
  debt: '#F44336',
  credit: '#4CAF50',
  paid: '#4CAF50',
  unpaid: '#FF9800',
  overdue: '#F44336',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  light: 'System',
};

export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 16,
  margin: 16,
  
  // Font sizes
  h1: 28,
  h2: 24,
  h3: 20,
  h4: 18,
  body1: 16,
  body2: 14,
  body3: 12,
  caption: 11,
  small: 10,
  
  // App dimensions
  width: null,
  height: null,
};

export const SHADOWS = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Status translations
export const STATUS_LABELS: Record<string, string> = {
  active: 'نشط',
  expired: 'منتهي',
  disabled: 'معطل',
  online: 'متصل',
  offline: 'غير متصل',
  paid: 'مدفوع',
  unpaid: 'غير مدفوع',
  overdue: 'متأخر',
};

// Invoice type translations
export const INVOICE_TYPES: Record<string, string> = {
  activation: 'تفعيل',
  renewal: 'تجديد',
  extension: 'تمديد',
  profile_change: 'تغيير الباقة',
  deposit: 'إيداع',
  withdrawal: 'سحب',
  refund: 'استرداد',
};

// Arabic month names
export const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل',
  'مايو', 'يونيو', 'يوليو', 'أغسطس',
  'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// Arabic day names
export const ARABIC_DAYS = [
  'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء',
  'الخميس', 'الجمعة', 'السبت'
];

// Format date to Arabic
export const formatArabicDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = ARABIC_MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
};

// Format date with time
export const formatArabicDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = ARABIC_MONTHS[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} - ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
};

// Format currency
export const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${num.toLocaleString('ar-IQ')} د.ع`;
};

// Format data size
export const formatDataSize = (megabytes: string | number): string => {
  const mb = typeof megabytes === 'string' ? parseFloat(megabytes) : megabytes;
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} جيجابايت`;
  }
  return `${mb.toFixed(0)} ميجابايت`;
};

// Calculate remaining days
export const calculateRemainingDays = (expirationDate: string): number => {
  try {
    const expiration = new Date(expirationDate);
    const now = new Date();
    const diff = expiration.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

// Get status color
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    active: COLORS.success,
    expired: COLORS.error,
    disabled: COLORS.textTertiary,
    online: COLORS.info,
    paid: COLORS.success,
    unpaid: COLORS.warning,
    overdue: COLORS.error,
  };
  return statusColors[status.toLowerCase()] || COLORS.textSecondary;
};
