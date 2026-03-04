import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { Card, StatCard, InfoRow } from '../../src/components/Card';
import { Button } from '../../src/components/Buttons';
import { COLORS, SIZES, SHADOWS, formatCurrency } from '../../src/utils/theme';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const {
    currentServer,
    isConnected,
    isSyncing,
    syncStatus,
    syncData,
    stats,
    servers,
  } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const onRefresh = async () => {
    setRefreshing(true);
    if (isConnected) {
      await syncData();
    }
    setRefreshing(false);
  };

  const handleSync = async () => {
    const result = await syncData();
    if (!result.success) {
      console.log('Sync failed:', result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerRight}>
              <Text style={styles.headerTitle}>إدارة الفواتير</Text>
              <Text style={styles.headerSubtitle}>
                نظام إدارة المشتركين والديون
              </Text>
            </View>
            <View style={styles.logoContainer}>
              <Ionicons name="receipt-outline" size={32} color={COLORS.textLight} />
            </View>
          </View>

          {/* Server Status */}
          <View style={styles.statusBar}>
            <View style={styles.statusInfo}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? COLORS.success : COLORS.error }]} />
              <Text style={styles.statusText}>
                {currentServer ? currentServer.name : 'لم يتم تحديد سيرفر'}
              </Text>
            </View>
            {isConnected && (
              <TouchableOpacity onPress={handleSync} disabled={isSyncing}>
                {isSyncing ? (
                  <Text style={styles.syncButtonText}>جاري المزامنة...</Text>
                ) : (
                  <Ionicons name="sync-outline" size={20} color={COLORS.textLight} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Sync Progress */}
        {isSyncing && (
          <View style={styles.syncBar}>
            <Text style={styles.syncText}>{syncStatus}</Text>
          </View>
        )}

        {/* No Server Warning */}
        {!currentServer && (
          <Card style={styles.warningCard}>
            <View style={styles.warningContent}>
              <Ionicons name="warning-outline" size={40} color={COLORS.warning} />
              <Text style={styles.warningTitle}>لم يتم إضافة سيرفر</Text>
              <Text style={styles.warningText}>
                قم بإضافة سيرفر SAS للبدء باستخدام التطبيق
              </Text>
              <Button
                title="إضافة سيرفر"
                onPress={() => router.push('/servers')}
                style={styles.warningButton}
              />
            </View>
          </Card>
        )}

        {/* Server Exists but Not Connected */}
        {currentServer && !isConnected && (
          <Card style={styles.warningCard}>
            <View style={styles.warningContent}>
              <Ionicons name="cloud-offline-outline" size={40} color={COLORS.error} />
              <Text style={styles.warningTitle}>غير متصل بالسيرفر</Text>
              <Text style={styles.warningText}>
                تأكد من صحة بيانات السيرفر وحالة الاتصال
              </Text>
              <Button
                title="إدارة السيرفرات"
                onPress={() => router.push('/servers')}
                style={styles.warningButton}
              />
            </View>
          </Card>
        )}

        {/* Connected - Show Stats */}
        {currentServer && isConnected && (
          <>
            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <StatCard
                title="المشتركين"
                value={stats.totalUsers.toString()}
                subtitle="إجمالي"
                color={COLORS.primary}
                icon={<Ionicons name="people-outline" size={24} color={COLORS.primary} />}
              />
              <StatCard
                title="النشطين"
                value={stats.activeUsers.toString()}
                subtitle="مشترك"
                color={COLORS.success}
                icon={<Ionicons name="checkmark-circle-outline" size={24} color={COLORS.success} />}
              />
            </View>

            <View style={styles.statsContainer}>
              <StatCard
                title="المنتهين"
                value={stats.expiredUsers.toString()}
                subtitle="مشترك"
                color={COLORS.error}
                icon={<Ionicons name="close-circle-outline" size={24} color={COLORS.error} />}
              />
              <StatCard
                title="إجمالي الديون"
                value={formatCurrency(stats.totalDebt.toString())}
                subtitle="رصيد سلبي"
                color={COLORS.warning}
                icon={<Ionicons name="wallet-outline" size={24} color={COLORS.warning} />}
              />
            </View>

            {/* Quick Actions */}
            <Card title="إجراءات سريعة" style={styles.card}>
              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => router.push('/subscribers')}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primary + '20' }]}>
                    <Ionicons name="people-outline" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.actionLabel}>المشتركين</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => router.push('/invoices')}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: COLORS.info + '20' }]}>
                    <Ionicons name="receipt-outline" size={24} color={COLORS.info} />
                  </View>
                  <Text style={styles.actionLabel}>الفواتير</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => router.push('/servers')}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: COLORS.success + '20' }]}>
                    <Ionicons name="server-outline" size={24} color={COLORS.success} />
                  </View>
                  <Text style={styles.actionLabel}>السيرفرات</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handleSync}
                >
                  <View style={[styles.actionIconContainer, { backgroundColor: COLORS.warning + '20' }]}>
                    <Ionicons name="sync-outline" size={24} color={COLORS.warning} />
                  </View>
                  <Text style={styles.actionLabel}>مزامنة</Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* Unpaid Invoices Warning */}
            {stats.unpaidInvoices > 0 && (
              <Card style={styles.alertCard}>
                <View style={styles.alertContent}>
                  <Ionicons name="alert-circle-outline" size={24} color={COLORS.warning} />
                  <View style={styles.alertText}>
                    <Text style={styles.alertTitle}>فواتير غير مدفوعة</Text>
                    <Text style={styles.alertValue}>
                      يوجد {stats.unpaidInvoices} فاتورة غير مدفوعة
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => router.push('/invoices')}>
                  <Ionicons name="chevron-back-outline" size={20} color={COLORS.textTertiary} />
                </TouchableOpacity>
              </Card>
            )}
          </>
        )}

        {/* Servers Summary */}
        {servers.length > 0 && (
          <Card title="السيرفرات المسجلة" style={styles.card}>
            {servers.map((server, index) => (
              <View key={server.id} style={styles.serverItem}>
                <View style={styles.serverItemInfo}>
                  <Text style={styles.serverItemName}>{server.name}</Text>
                  <Text style={styles.serverItemUrl}>{server.url}</Text>
                </View>
                <View style={styles.serverItemStatus}>
                  {currentServer?.id === server.id && isConnected && (
                    <View style={styles.connectedBadge}>
                      <Text style={styles.connectedText}>متصّل</Text>
                    </View>
                  )}
                  {server.is_default === 1 && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>افتراضي</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* App Info */}
        <Card title="معلومات التطبيق" style={styles.card}>
          <InfoRow
            label="الإصدار"
            value="1.0.0"
            icon={<Ionicons name="information-circle-outline" size={18} color={COLORS.textSecondary} />}
          />
          <InfoRow
            label="عدد السيرفرات"
            value={servers.length.toString()}
            icon={<Ionicons name="server-outline" size={18} color={COLORS.textSecondary} />}
          />
        </Card>

        {/* Space for bottom tab */}
        <View style={{ height: 100 }} />
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
  },
  headerRight: {
    flex: 1,
  },
  headerTitle: {
    fontSize: SIZES.h1,
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
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SIZES.margin,
    marginHorizontal: SIZES.margin,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: SIZES.radius,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  syncButtonText: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  syncBar: {
    padding: SIZES.padding,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  syncText: {
    fontSize: SIZES.body3,
    color: COLORS.primary,
  },
  warningCard: {
    margin: SIZES.margin,
  },
  warningContent: {
    alignItems: 'center',
    padding: SIZES.padding,
  },
  warningTitle: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SIZES.base,
  },
  warningText: {
    fontSize: SIZES.body2,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.base,
  },
  warningButton: {
    marginTop: SIZES.margin,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: SIZES.base,
  },
  card: {
    marginHorizontal: SIZES.margin,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: (width - SIZES.margin * 2 - SIZES.padding * 2 - SIZES.base) / 2,
    alignItems: 'center',
    marginBottom: SIZES.margin,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  actionLabel: {
    fontSize: SIZES.body3,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SIZES.margin,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  alertValue: {
    fontSize: SIZES.body3,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  serverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  serverItemInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  serverItemName: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  serverItemUrl: {
    fontSize: SIZES.body3,
    color: COLORS.textTertiary,
    textAlign: 'right',
  },
  serverItemStatus: {
    flexDirection: 'row',
    gap: SIZES.base,
  },
  connectedBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.base / 2,
    borderRadius: 4,
  },
  connectedText: {
    fontSize: SIZES.caption,
    color: COLORS.success,
    fontWeight: '500',
  },
  defaultBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.base / 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: SIZES.caption,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
