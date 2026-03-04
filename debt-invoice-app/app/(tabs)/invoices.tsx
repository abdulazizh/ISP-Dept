import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../src/context/AppContext';
import { Card } from '../../src/components/Card';
import { SearchInput } from '../../src/components/Input';
import { COLORS, SIZES, SHADOWS, formatCurrency, formatArabicDate } from '../../src/utils/theme';
import { getCachedInvoices, CachedInvoice } from '../../src/database/index';

export default function InvoicesScreen() {
  const { currentServer, isConnected, isSyncing, syncData, syncStatus } = useApp();
  const [invoices, setInvoices] = useState<CachedInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInvoices = async () => {
    if (!currentServer?.id) return;

    setIsLoading(true);
    try {
      const data = await getCachedInvoices(currentServer.id);
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentServer?.id && isConnected) {
      fetchInvoices();
    }
  }, [currentServer, isConnected]);

  const onRefresh = async () => {
    setRefreshing(true);
    await syncData();
    await fetchInvoices();
    setRefreshing(false);
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInvoiceTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      activation: 'تفعيل',
      renewal: 'تجديد',
      extension: 'تمديد',
      profile_change: 'تغيير الباقة',
      deposit: 'إيداع',
      withdrawal: 'سحب',
      refund: 'استرداد',
    };
    return types[type?.toLowerCase()] || type || 'أخرى';
  };

  const renderInvoiceItem = ({ item }: { item: CachedInvoice }) => (
    <Card style={styles.invoiceCard}>
      <View style={styles.invoiceHeader}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.paid ? COLORS.success + '20' : COLORS.warning + '20' }
        ]}>
          <Ionicons
            name={item.paid ? 'checkmark-circle' : 'time'}
            size={14}
            color={item.paid ? COLORS.success : COLORS.warning}
          />
          <Text style={[
            styles.statusText,
            { color: item.paid ? COLORS.success : COLORS.warning }
          ]}>
            {item.paid ? 'مدفوع' : 'غير مدفوع'}
          </Text>
        </View>
        <Text style={styles.invoiceNo}>#{item.invoice_no}</Text>
      </View>

      <View style={styles.invoiceBody}>
        <Text style={styles.invoiceType}>{getInvoiceTypeLabel(item.type)}</Text>
        <Text style={styles.invoiceDesc} numberOfLines={2}>
          {item.description || 'لا يوجد وصف'}
        </Text>
      </View>

      <View style={styles.invoiceFooter}>
        <Text style={styles.invoiceAmount}>
          {formatCurrency(item.amount)}
        </Text>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textTertiary} />
          <Text style={styles.invoiceDate}>
            {item.date ? formatArabicDate(item.date) : '-'}
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={80} color={COLORS.border} />
      <Text style={styles.emptyTitle}>
        {!currentServer ? 'لم يتم تحديد سيرفر' : !isConnected ? 'غير متصل' : 'لا توجد فواتير'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {!currentServer
          ? 'قم بإضافة والاتصال بسيرفر أولاً'
          : !isConnected
          ? 'تأكد من الاتصال بالسيرفر'
          : 'قم بمزامنة البيانات لتحديث القائمة'}
      </Text>
    </View>
  );

  // Calculate summary
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.paid).length;
  const unpaidInvoices = invoices.filter(i => !i.paid).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>الفواتير والديون</Text>
          <Text style={styles.headerSubtitle}>
            تتبع جميع فواتيرك ومديونياتك
          </Text>
        </View>

        {currentServer && (
          <View style={styles.connectionBar}>
            <Ionicons
              name={isConnected ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={isConnected ? COLORS.success : COLORS.error}
            />
            <Text style={styles.connectionText}>
              {currentServer.name} - {isConnected ? 'متصل' : 'غير متصل'}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Sync Status */}
      {isSyncing && (
        <View style={styles.syncBar}>
          <Text style={styles.syncText}>{syncStatus}</Text>
        </View>
      )}

      {/* Search */}
      {isConnected && invoices.length > 0 && (
        <View style={styles.searchContainer}>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="بحث في الفواتير..."
          />
        </View>
      )}

      {/* Summary */}
      {isConnected && invoices.length > 0 && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalInvoices}</Text>
            <Text style={styles.summaryLabel}>إجمالي</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
              {unpaidInvoices}
            </Text>
            <Text style={styles.summaryLabel}>غير مدفوعة</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>
              {paidInvoices}
            </Text>
            <Text style={styles.summaryLabel}>مدفوعة</Text>
          </View>
        </View>
      )}

      {/* Invoice List */}
      <FlatList
        data={filteredInvoices}
        renderItem={renderInvoiceItem}
        keyExtractor={(item) => `${item.server_id}-${item.invoice_id}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: SIZES.padding,
    paddingBottom: SIZES.padding,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingHorizontal: SIZES.padding,
  },
  headerTitle: {
    fontSize: SIZES.h2,
    fontWeight: '700',
    color: COLORS.textLight,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    opacity: 0.8,
    textAlign: 'right',
    marginTop: SIZES.base / 2,
  },
  connectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.base,
    marginTop: SIZES.base,
    paddingHorizontal: SIZES.padding,
  },
  connectionText: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    opacity: 0.9,
  },
  syncBar: {
    padding: SIZES.base,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  syncText: {
    fontSize: SIZES.body3,
    color: COLORS.primary,
  },
  searchContainer: {
    padding: SIZES.padding,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginHorizontal: SIZES.margin,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.base,
    ...SHADOWS.light,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  summaryLabel: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
    marginTop: SIZES.base / 2,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.border,
  },
  listContainer: {
    padding: SIZES.padding,
    paddingBottom: 100,
  },
  invoiceCard: {
    marginBottom: SIZES.base,
    padding: SIZES.padding,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  invoiceNo: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.base / 2,
    borderRadius: SIZES.radius,
    gap: SIZES.base / 2,
  },
  statusText: {
    fontSize: SIZES.caption,
    fontWeight: '500',
  },
  invoiceBody: {
    marginBottom: SIZES.base,
  },
  invoiceType: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'right',
    marginBottom: SIZES.base / 2,
  },
  invoiceDesc: {
    fontSize: SIZES.body3,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SIZES.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  invoiceAmount: {
    fontSize: SIZES.h4,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base / 2,
  },
  invoiceDate: {
    fontSize: SIZES.body3,
    color: COLORS.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding * 4,
  },
  emptyTitle: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SIZES.margin,
  },
  emptySubtitle: {
    fontSize: SIZES.body3,
    color: COLORS.textTertiary,
    marginTop: SIZES.base,
    textAlign: 'center',
  },
});
