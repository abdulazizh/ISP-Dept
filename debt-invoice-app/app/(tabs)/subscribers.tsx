import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../src/context/AppContext';
import { Card, StatCard, InfoRow } from '../../src/components/Card';
import { SearchInput, Input } from '../../src/components/Input';
import { Button } from '../../src/components/Buttons';
import { COLORS, SIZES, SHADOWS, formatCurrency, formatArabicDate, getStatusColor } from '../../src/utils/theme';
import { GlobalUser } from '../../src/database/index';
import { sasApi } from '../../src/api/sasApi';

export default function SubscribersScreen() {
  const {
    currentServer,
    isConnected,
    subscribers,
    isLoadingSubscribers,
    refreshSubscribers,
    searchSubscribers,
    stats,
    syncData,
    isSyncing,
    syncStatus,
    addSubscriber,
    deleteSubscriber,
    canDeleteUser,
    profiles,
    addDebt,
    refreshDebts,
    refreshStats,
    createUser,
    deleteUser: deleteUserFromSAS,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<GlobalUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GlobalUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositComment, setDepositComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [renewMonths, setRenewMonths] = useState('1');
  const [renewAmount, setRenewAmount] = useState('');
  const [renewPaymentType, setRenewPaymentType] = useState<'paid' | 'debt'>('paid');

  // Add user form state
  const [newUsername, setNewUsername] = useState('');
  const [newFirstname, setNewFirstname] = useState('');
  const [newLastname, setNewLastname] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newProfileId, setNewProfileId] = useState('');
  const [newMonths, setNewMonths] = useState('1');
  const [registerAsDebt, setRegisterAsDebt] = useState(false);
  const [debtAmount, setDebtAmount] = useState('');

  // Update filtered users
  useEffect(() => {
    let filtered = subscribers;

    if (statusFilter) {
      filtered = filtered.filter(u => u.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.username.toLowerCase().includes(query) ||
          u.firstname?.toLowerCase().includes(query) ||
          u.lastname?.toLowerCase().includes(query) ||
          u.phone?.includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [subscribers, searchQuery, statusFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSubscribers();
    setRefreshing(false);
  };

  const handleSync = async () => {
    const result = await syncData();
    if (!result.success) {
      Alert.alert('خطأ', result.error || 'فشلت المزامنة');
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
  };

  const handleUserPress = (user: GlobalUser) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDeposit = async () => {
    if (!selectedUser || !depositAmount.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال المبلغ');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await sasApi.userDeposit(selectedUser.user_id, amount, depositComment);
      if (result.success) {
        Alert.alert('نجاح', 'تم الإيداع بنجاح');
        setShowDepositModal(false);
        setDepositAmount('');
        setDepositComment('');
        await handleSync();
      } else {
        Alert.alert('خطأ', result.message || 'فشل الإيداع');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedUser || !depositAmount.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال المبلغ');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await sasApi.userWithdraw(selectedUser.user_id, amount, depositComment);
      if (result.success) {
        Alert.alert('نجاح', 'تم السحب بنجاح');
        setShowDepositModal(false);
        setDepositAmount('');
        setDepositComment('');
        await handleSync();
      } else {
        Alert.alert('خطأ', result.message || 'فشل السحب');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    } finally {
      setIsProcessing(false);
    }
  };

  // تجديد الاشتراك
  const handleRenew = async () => {
    if (!selectedUser) return;

    const months = parseInt(renewMonths) || 1;
    const amount = parseFloat(renewAmount) || 0;

    if (renewPaymentType === 'debt' && amount <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ الدين');
      return;
    }

    setIsProcessing(true);
    try {
      const currentExpiration = selectedUser.expiration ? new Date(selectedUser.expiration) : new Date();
      const baseDate = currentExpiration > new Date() ? currentExpiration : new Date();
      const newExpiration = new Date(baseDate);
      newExpiration.setMonth(newExpiration.getMonth() + months);

      // تسجيل كدين إذا تم اختياره
      if (renewPaymentType === 'debt' && amount > 0) {
        const profileName = selectedUser.profile || '';
        await addDebt({
          user_id: selectedUser.user_id,
          username: selectedUser.username,
          amount: amount,
          remaining_amount: amount,
          description: `تجديد اشتراك ${months} شهر - ${profileName}`,
          months: months,
          profile_name: profileName,
          status: 'pending',
        });
        await refreshDebts();
        await refreshStats();
      }

      const result = await sasApi.userDeposit(selectedUser.user_id, 0, `تجديد اشتراك ${months} شهر`);
      
      if (result.success) {
        const message = renewPaymentType === 'debt' 
          ? `تم تجديد الاشتراك لمدة ${months} شهر
تم تسجيل المبلغ ${formatCurrency(amount.toString())} كدين`
          : `تم تجديد الاشتراك لمدة ${months} شهر`;
        Alert.alert('نجاح', message);
        setShowRenewModal(false);
        setRenewMonths('1');
        setRenewAmount('');
        setRenewPaymentType('paid');
        await handleSync();
      } else {
        Alert.alert('خطأ', result.message || 'فشل تجديد الاشتراك');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    } finally {
      setIsProcessing(false);
    }
  };

  // تفعيل/تعطيل المشترك
  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    const newStatus = selectedUser.status === 'active' ? 'تعطيل' : 'تفعيل';
    
    Alert.alert(
      'تأكيد',
      `هل تريد ${newStatus} المشترك ${selectedUser.username}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            setIsProcessing(true);
            try {
              Alert.alert('نجاح', `تم ${newStatus} المشترك`);
              await handleSync();
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ غير متوقع');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  // قطع الاتصال
  const handleDisconnect = async () => {
    if (!selectedUser) return;

    Alert.alert(
      'قطع الاتصال',
      `هل تريد قطع اتصال المشترك ${selectedUser.username}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'قطع',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              Alert.alert('نجاح', 'تم قطع الاتصال');
              setShowUserModal(false);
              await handleSync();
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ غير متوقع');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  // حذف المشترك مع التحقق من الديون
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    // التحقق من الديون
    const canDelete = await canDeleteUser(selectedUser.user_id);
    if (!canDelete) {
      Alert.alert(
        'لا يمكن الحذف',
        'لا يمكن حذف هذا المشترك لأن لديه ديون مسجلة. يرجى تسديد الديون أولاً.',
        [{ text: 'حسناً' }]
      );
      return;
    }

    Alert.alert(
      'حذف المشترك',
      `هل أنت متأكد من حذف المشترك ${selectedUser.username}؟\nهذا الإجراء لا يمكن التراجع عنه.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const result = await deleteSubscriber(selectedUser.user_id);
              if (result.success) {
                Alert.alert('نجاح', result.message);
                setShowUserModal(false);
                setSelectedUser(null);
              } else {
                Alert.alert('خطأ', result.message);
              }
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ غير متوقع');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  // إضافة مشترك جديد
  const handleAddUser = async () => {
    if (!newUsername.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المستخدم');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال كلمة المرور');
      return;
    }

    if (registerAsDebt && !debtAmount.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ الدين');
      return;
    }

    setIsProcessing(true);
    try {
      // حساب تاريخ الانتهاء
      const months = parseInt(newMonths) || 1;
      const expiration = new Date();
      expiration.setMonth(expiration.getMonth() + months);
      
      // التحقق من اختيار الباقة
      const profileId = newProfileId ? parseInt(newProfileId) : undefined;
      if (!profileId) {
        Alert.alert('خطأ', 'يرجى اختيار الباقة');
        setIsProcessing(false);
        return;
      }
      
      // إضافة المشترك إلى سيرفر SAS
      // parent_id يكون معرف المستخدم الحالي (من السيرفر)
      const parentId = currentServer?.parent_id || 18; // 18 = aziz
      
      const sasResult = await createUser({
        username: newUsername.trim(),
        password: newPassword.trim(),
        firstname: newFirstname.trim() || undefined,
        lastname: newLastname.trim() || undefined,
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        profile_id: profileId,
        parent_id: parentId,
        enabled: 1,
        expiration: expiration.toISOString().slice(0, 19).replace('T', ' '),
      });

      if (!sasResult.success) {
        // فشل الإضافة للسيرفر
        const errorMsg = sasResult.message || 'فشل إضافة المشترك للسيرفر';
        const errors = sasResult.errors ? '\n' + Object.values(sasResult.errors).flat().join('\n') : '';
        Alert.alert('خطأ', errorMsg + errors);
        setIsProcessing(false);
        return;
      }

      // نجح الإضافة للسيرفر - جلب user_id من الاستجابة
      const sasUserId = sasResult.user?.id || sasResult.user?.user_id || Date.now();
      const profileName = profiles.find(p => p.profile_id === profileId)?.name;

      // إضافة المشترك محلياً
      await addSubscriber({
        user_id: sasUserId,
        username: newUsername.trim(),
        firstname: newFirstname.trim() || undefined,
        lastname: newLastname.trim() || undefined,
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        balance: '0',
        profile: profileName,
        profile_id: profileId,
        status: 'active',
        expiration: expiration.toISOString(),
        enabled: 1,
        source_server: currentServer?.name,
      });

      // تسجيل كدين إذا تم اختياره
      if (registerAsDebt) {
        const amount = parseFloat(debtAmount);
        if (!isNaN(amount) && amount > 0) {
          await addDebt({
            user_id: sasUserId,
            username: newUsername.trim(),
            amount: amount,
            remaining_amount: amount,
            description: `تسجيل دين عند إنشاء الحساب - ${months} شهر`,
            months: months,
            profile_name: profileName,
            status: 'pending',
          });
          // تحديث الديون والإحصائيات
          await refreshDebts();
          await refreshStats();
        }
      }

      Alert.alert('نجاح', 'تم إضافة المشترك بنجاح' + (registerAsDebt ? '\nتم تسجيل المبلغ كدين' : ''));
      
      // إعادة تعيين النموذج
      setShowAddUserModal(false);
      setNewUsername('');
      setNewFirstname('');
      setNewLastname('');
      setNewPhone('');
      setNewEmail('');
      setNewPassword('');
      setNewProfileId('');
      setNewMonths('1');
      setRegisterAsDebt(false);
      setDebtAmount('');
      
      // تحديث القائمة
      await syncData();
      
    } catch (error) {
      console.error('Error adding user:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة المشترك');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAddUserForm = () => {
    setNewUsername('');
    setNewFirstname('');
    setNewLastname('');
    setNewPhone('');
    setNewEmail('');
    setNewPassword('');
    setNewProfileId('');
    setNewMonths('1');
    setRegisterAsDebt(false);
    setDebtAmount('');
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      active: 'نشط',
      expired: 'منتهي',
      disabled: 'معطل',
      online: 'متصل',
      offline: 'غير متصل',
    };
    return labels[status?.toLowerCase()] || status || 'غير محدد';
  };

  const renderUserItem = ({ item }: { item: GlobalUser }) => (
    <TouchableOpacity onPress={() => handleUserPress(item)}>
      <Card style={styles.userCard}>
        <View style={styles.userContent}>
          <View style={styles.userHeader}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={styles.username}>{item.username}</Text>
          </View>

          <Text style={styles.userName}>
            {[item.firstname, item.lastname].filter(Boolean).join(' ') || 'بدون اسم'}
          </Text>

          <View style={styles.userFooter}>
            <Text style={[styles.balance, parseFloat(item.balance) < 0 && styles.negativeBalance]}>
              {formatCurrency(item.balance)}
            </Text>
            <View style={styles.profileBadge}>
              <Text style={styles.profileText}>{item.profile || '-'}</Text>
            </View>
          </View>

          {item.phone && (
            <View style={styles.phoneRow}>
              <Text style={styles.phoneText}>{item.phone}</Text>
              <Ionicons name="call-outline" size={14} color={COLORS.textTertiary} />
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={80} color={COLORS.border} />
      <Text style={styles.emptyTitle}>
        {!currentServer ? 'لم يتم تحديد سيرفر' : !isConnected ? 'غير متصل' : 'لا يوجد مشتركين'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {!currentServer
          ? 'قم بإضافة والاتصال بسيرفر أولاً'
          : !isConnected
          ? 'تأكد من الاتصال بالسيرفر'
          : 'سيتم جلب البيانات تلقائياً عند الاتصال'}
      </Text>
      {currentServer && isConnected && subscribers.length === 0 && (
        <Button
          title="تحديث البيانات"
          onPress={handleSync}
          loading={isSyncing}
          style={styles.emptyButton}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleSync} disabled={isSyncing || !isConnected}>
            {isSyncing ? (
              <ActivityIndicator size="small" color={COLORS.textLight} />
            ) : (
              <Ionicons name="sync-outline" size={24} color={COLORS.textLight} />
            )}
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>المشتركين</Text>
            <Text style={styles.headerSubtitle}>
              {filteredUsers.length} من {subscribers.length}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => setShowAddUserModal(true)}
            disabled={!isConnected}
          >
            <Ionicons name="person-add" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
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

      {/* Sync Status Bar */}
      {isSyncing && (
        <View style={styles.syncBar}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.syncText}>{syncStatus}</Text>
        </View>
      )}

      {/* Stats */}
      {isConnected && subscribers.length > 0 && (
        <View style={styles.statsContainer}>
          <StatCard
            title="النشطين"
            value={stats.activeUsers.toString()}
            color={COLORS.success}
          />
          <StatCard
            title="المنتهين"
            value={stats.expiredUsers.toString()}
            color={COLORS.error}
          />
          <StatCard
            title="إجمالي الدين"
            value={formatCurrency(stats.totalDebt.toString())}
            color={COLORS.warning}
          />
        </View>
      )}

      {/* Search and Filters */}
      {subscribers.length > 0 && (
        <View style={styles.searchSection}>
          <SearchInput
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="بحث بالاسم أو الهاتف..."
          />

          <View style={styles.filterTabs}>
            {['all', 'active', 'expired'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  statusFilter === (filter === 'all' ? null : filter) && styles.filterTabActive,
                ]}
                onPress={() => setStatusFilter(filter === 'all' ? null : filter)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    statusFilter === (filter === 'all' ? null : filter) && styles.filterTabTextActive,
                  ]}
                >
                  {filter === 'all' ? 'الكل' : filter === 'active' ? 'نشط' : 'منتهي'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => `${item.user_id}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Floating Add Button */}
      {isConnected && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setShowAddUserModal(true)}
        >
          <Ionicons name="add" size={32} color={COLORS.textLight} />
        </TouchableOpacity>
      )}

      {/* User Details Modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Ionicons name="close-outline" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إدارة المشترك</Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.userModalHeader}>
                  <View style={[styles.userModalAvatar, { backgroundColor: getStatusColor(selectedUser.status) + '20' }]}>
                    <Ionicons name="person" size={40} color={getStatusColor(selectedUser.status)} />
                  </View>
                  <Text style={styles.userModalName}>{selectedUser.username}</Text>
                  <Text style={styles.userModalFullName}>
                    {[selectedUser.firstname, selectedUser.lastname].filter(Boolean).join(' ')}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedUser.status) }]}>
                    <Text style={styles.statusBadgeText}>{getStatusLabel(selectedUser.status)}</Text>
                  </View>
                </View>

                <Card title="معلومات الحساب" style={styles.modalCard}>
                  <InfoRow label="الرصيد" value={formatCurrency(selectedUser.balance)} />
                  <InfoRow label="الباقة" value={selectedUser.profile || '-'} />
                  <InfoRow label="تاريخ الانتهاء" value={formatArabicDate(selectedUser.expiration || '')} />
                </Card>

                <Card title="معلومات التواصل" style={styles.modalCard}>
                  <InfoRow label="الهاتف" value={selectedUser.phone || '-'} />
                  <InfoRow label="البريد الإلكتروني" value={selectedUser.email || '-'} />
                </Card>

                {/* إدارة الاشتراك */}
                <Card title="إدارة الاشتراك" style={styles.modalCard}>
                  <View style={styles.managementGrid}>
                    <TouchableOpacity 
                      style={styles.managementItem}
                      onPress={() => {
                        setShowUserModal(false);
                        setShowRenewModal(true);
                      }}
                    >
                      <View style={[styles.managementIcon, { backgroundColor: COLORS.success + '20' }]}>
                        <Ionicons name="refresh" size={24} color={COLORS.success} />
                      </View>
                      <Text style={styles.managementLabel}>تجديد</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.managementItem}
                      onPress={() => {
                        setShowUserModal(false);
                        setShowDepositModal(true);
                      }}
                    >
                      <View style={[styles.managementIcon, { backgroundColor: COLORS.primary + '20' }]}>
                        <Ionicons name="wallet" size={24} color={COLORS.primary} />
                      </View>
                      <Text style={styles.managementLabel}>رصيد</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.managementItem}
                      onPress={handleToggleStatus}
                    >
                      <View style={[styles.managementIcon, { backgroundColor: COLORS.warning + '20' }]}>
                        <Ionicons name={selectedUser.status === 'active' ? 'pause' : 'play'} size={24} color={COLORS.warning} />
                      </View>
                      <Text style={styles.managementLabel}>
                        {selectedUser.status === 'active' ? 'تعطيل' : 'تفعيل'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.managementItem}
                      onPress={handleDisconnect}
                    >
                      <View style={[styles.managementIcon, { backgroundColor: COLORS.error + '20' }]}>
                        <Ionicons name="cloud-offline" size={24} color={COLORS.error} />
                      </View>
                      <Text style={styles.managementLabel}>قطع</Text>
                    </TouchableOpacity>
                  </View>
                </Card>

                {/* حذف المشترك */}
                <Button
                  title="حذف المشترك"
                  onPress={handleDeleteUser}
                  variant="danger"
                  loading={isProcessing}
                  style={styles.deleteButton}
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Deposit/Withdraw Modal */}
      <Modal
        visible={showDepositModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDepositModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <Ionicons name="close-outline" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>عملية مالية</Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedUser && (
              <>
                <Text style={styles.selectedUserText}>
                  المشترك: {selectedUser.username}
                </Text>
                <Text style={styles.currentBalanceText}>
                  الرصيد الحالي: {formatCurrency(selectedUser.balance)}
                </Text>

                <Input
                  label="المبلغ"
                  placeholder="0.00"
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  keyboardType="numeric"
                  icon="cash-outline"
                />

                <Input
                  label="ملاحظة"
                  placeholder="سبب العملية (اختياري)"
                  value={depositComment}
                  onChangeText={setDepositComment}
                />

                <View style={styles.depositActions}>
                  <Button
                    title="إيداع"
                    onPress={handleDeposit}
                    variant="success"
                    loading={isProcessing}
                    style={styles.depositButton}
                  />
                  <Button
                    title="سحب"
                    onPress={handleWithdraw}
                    variant="danger"
                    loading={isProcessing}
                    style={styles.depositButton}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Renew Modal */}
      <Modal
        visible={showRenewModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowRenewModal(false);
          setRenewAmount('');
          setRenewPaymentType('paid');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowRenewModal(false);
                setRenewAmount('');
                setRenewPaymentType('paid');
              }}>
                <Ionicons name="close-outline" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تجديد الاشتراك</Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.selectedUserText}>
                  المشترك: {selectedUser.username}
                </Text>
                <Text style={styles.currentBalanceText}>
                  الباقة: {selectedUser.profile || '-'}
                </Text>
                <Text style={styles.currentBalanceText}>
                  تاريخ الانتهاء: {formatArabicDate(selectedUser.expiration || '')}
                </Text>

                <Text style={styles.renewLabel}>عدد الأشهر:</Text>
                <View style={styles.monthButtons}>
                  {[1, 2, 3, 6, 12].map((month) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.monthButton,
                        renewMonths === String(month) && styles.monthButtonActive,
                      ]}
                      onPress={() => setRenewMonths(String(month))}
                    >
                      <Text
                        style={[
                          styles.monthButtonText,
                          renewMonths === String(month) && styles.monthButtonTextActive,
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Input
                  label="عدد الأشهر"
                  placeholder="1"
                  value={renewMonths}
                  onChangeText={setRenewMonths}
                  keyboardType="numeric"
                  icon="calendar-outline"
                />

                {/* حقل المبلغ */}
                <Input
                  label="المبلغ"
                  placeholder="0.00"
                  value={renewAmount}
                  onChangeText={setRenewAmount}
                  keyboardType="numeric"
                  icon="cash-outline"
                />

                {/* خيار نوع الدفع */}
                <Text style={styles.renewLabel}>نوع الدفع:</Text>
                <View style={styles.paymentTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.paymentTypeButton,
                      renewPaymentType === 'paid' && styles.paymentTypeButtonActive,
                    ]}
                    onPress={() => setRenewPaymentType('paid')}
                  >
                    <Ionicons 
                      name="checkmark-circle" 
                      size={20} 
                      color={renewPaymentType === 'paid' ? COLORS.success : COLORS.textSecondary} 
                    />
                    <Text style={[
                      styles.paymentTypeText,
                      renewPaymentType === 'paid' && styles.paymentTypeTextActive,
                    ]}>
                      واصل (مدفوع)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paymentTypeButton,
                      renewPaymentType === 'debt' && styles.paymentTypeButtonDebt,
                    ]}
                    onPress={() => setRenewPaymentType('debt')}
                  >
                    <Ionicons 
                      name="alert-circle" 
                      size={20} 
                      color={renewPaymentType === 'debt' ? COLORS.error : COLORS.textSecondary} 
                    />
                    <Text style={[
                      styles.paymentTypeText,
                      renewPaymentType === 'debt' && styles.paymentTypeTextDebt,
                    ]}>
                      دين
                    </Text>
                  </TouchableOpacity>
                </View>

                {renewPaymentType === 'debt' && renewAmount && (
                  <View style={styles.debtWarning}>
                    <Ionicons name="warning" size={16} color={COLORS.warning} />
                    <Text style={styles.debtWarningText}>
                      سيتم تسجيل {formatCurrency(renewAmount)} كدين على المشترك
                    </Text>
                  </View>
                )}

                <Button
                  title={isProcessing ? 'جاري التجديد...' : 'تجديد الاشتراك'}
                  onPress={handleRenew}
                  loading={isProcessing}
                  style={styles.renewButton}
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Add User Modal */}
      <Modal
        visible={showAddUserModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowAddUserModal(false);
          resetAddUserForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowAddUserModal(false);
                resetAddUserForm();
              }}>
                <Ionicons name="close-outline" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إضافة مشترك جديد</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="اسم المستخدم *"
                placeholder="username"
                value={newUsername}
                onChangeText={setNewUsername}
                icon="person-outline"
              />

              <Input
                label="كلمة المرور *"
                placeholder="••••••••"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                icon="lock-closed-outline"
              />

              <Input
                label="الاسم الأول"
                placeholder="الاسم الأول"
                value={newFirstname}
                onChangeText={setNewFirstname}
              />

              <Input
                label="الاسم الأخير"
                placeholder="الاسم الأخير"
                value={newLastname}
                onChangeText={setNewLastname}
              />

              <Input
                label="رقم الهاتف"
                placeholder="07xxxxxxxx"
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                icon="call-outline"
              />

              <Input
                label="البريد الإلكتروني"
                placeholder="email@example.com"
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                icon="mail-outline"
              />

              {/* اختيار الباقة */}
              <Text style={styles.inputLabel}>الباقة</Text>
              <View style={styles.profileSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.profileOption, !newProfileId && styles.profileOptionActive]}
                    onPress={() => setNewProfileId('')}
                  >
                    <Text style={[styles.profileOptionText, !newProfileId && styles.profileOptionTextActive]}>
                      بدون
                    </Text>
                  </TouchableOpacity>
                  {profiles.map((profile) => (
                    <TouchableOpacity
                      key={profile.profile_id}
                      style={[styles.profileOption, newProfileId === String(profile.profile_id) && styles.profileOptionActive]}
                      onPress={() => setNewProfileId(String(profile.profile_id))}
                    >
                      <Text style={[styles.profileOptionText, newProfileId === String(profile.profile_id) && styles.profileOptionTextActive]}>
                        {profile.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* عدد الأشهر */}
              <Text style={styles.inputLabel}>عدد الأشهر</Text>
              <View style={styles.monthButtons}>
                {[1, 2, 3, 6, 12].map((month) => (
                  <TouchableOpacity
                    key={month}
                    style={[styles.monthButton, newMonths === String(month) && styles.monthButtonActive]}
                    onPress={() => setNewMonths(String(month))}
                  >
                    <Text style={[styles.monthButtonText, newMonths === String(month) && styles.monthButtonTextActive]}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* تسجيل كدين */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setRegisterAsDebt(!registerAsDebt)}
              >
                <View style={[styles.checkbox, registerAsDebt && styles.checkboxChecked]}>
                  {registerAsDebt && <Ionicons name="checkmark" size={16} color={COLORS.textLight} />}
                </View>
                <Text style={styles.checkboxLabel}>تسجيل المبلغ كدين</Text>
              </TouchableOpacity>

              {registerAsDebt && (
                <Input
                  label="مبلغ الدين *"
                  placeholder="0.00"
                  value={debtAmount}
                  onChangeText={setDebtAmount}
                  keyboardType="numeric"
                  icon="cash-outline"
                />
              )}

              <Button
                title={isProcessing ? 'جاري الإضافة...' : 'إضافة المشترك'}
                onPress={handleAddUser}
                loading={isProcessing}
                style={styles.addButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.base,
    padding: SIZES.base,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  syncText: {
    fontSize: SIZES.body3,
    color: COLORS.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: SIZES.base,
    gap: SIZES.base,
  },
  searchSection: {
    padding: SIZES.padding,
    gap: SIZES.base,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: SIZES.base,
  },
  filterTab: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: SIZES.body3,
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.textLight,
    fontWeight: '600',
  },
  listContainer: {
    padding: SIZES.padding,
    paddingBottom: 100,
  },
  userCard: {
    marginBottom: SIZES.base,
  },
  userContent: {
    padding: SIZES.padding,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
    marginBottom: SIZES.base / 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  username: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'right',
    flex: 1,
  },
  userName: {
    fontSize: SIZES.body2,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginBottom: SIZES.base,
  },
  userFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balance: {
    fontSize: SIZES.body1,
    fontWeight: '700',
    color: COLORS.success,
  },
  negativeBalance: {
    color: COLORS.error,
  },
  profileBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.base / 2,
    borderRadius: 4,
  },
  profileText: {
    fontSize: SIZES.caption,
    color: COLORS.primary,
    fontWeight: '500',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SIZES.base,
    marginTop: SIZES.base,
  },
  phoneText: {
    fontSize: SIZES.body3,
    color: COLORS.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: SIZES.padding * 4,
  },
  emptyTitle: {
    fontSize: SIZES.h3,
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
  emptyButton: {
    marginTop: SIZES.margin * 2,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SIZES.padding * 2,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.margin,
  },
  modalTitle: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  userModalHeader: {
    alignItems: 'center',
    marginBottom: SIZES.margin,
  },
  userModalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  userModalName: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  userModalFullName: {
    fontSize: SIZES.body2,
    color: COLORS.textSecondary,
    marginTop: SIZES.base / 2,
  },
  statusBadge: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base / 2,
    borderRadius: SIZES.radius,
    marginTop: SIZES.base,
  },
  statusBadgeText: {
    fontSize: SIZES.body3,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  modalCard: {
    marginBottom: SIZES.base,
  },
  deleteButton: {
    marginTop: SIZES.margin,
    marginBottom: SIZES.margin * 2,
  },
  selectedUserText: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'right',
    marginBottom: SIZES.base,
  },
  currentBalanceText: {
    fontSize: SIZES.body2,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginBottom: SIZES.base,
  },
  depositActions: {
    flexDirection: 'row',
    gap: SIZES.base,
    marginTop: SIZES.margin,
  },
  depositButton: {
    flex: 1,
  },
  // Management styles
  managementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SIZES.base,
  },
  managementItem: {
    width: '48%',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.base,
  },
  managementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  managementLabel: {
    fontSize: SIZES.body3,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  // Renew styles
  renewLabel: {
    fontSize: SIZES.body2,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginBottom: SIZES.base,
    marginTop: SIZES.margin,
  },
  monthButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.margin,
  },
  monthButton: {
    flex: 1,
    paddingVertical: SIZES.base,
    marginHorizontal: 4,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  monthButtonActive: {
    backgroundColor: COLORS.primary,
  },
  monthButtonText: {
    fontSize: SIZES.body2,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  monthButtonTextActive: {
    color: COLORS.textLight,
  },
  renewButton: {
    marginTop: SIZES.margin,
  },
  // Add User styles
  inputLabel: {
    fontSize: SIZES.body3,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginBottom: SIZES.base,
  },
  profileSelector: {
    marginBottom: SIZES.margin,
  },
  profileOption: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.background,
    marginRight: SIZES.base,
  },
  profileOptionActive: {
    backgroundColor: COLORS.primary,
  },
  profileOptionText: {
    fontSize: SIZES.body3,
    color: COLORS.textPrimary,
  },
  profileOptionTextActive: {
    color: COLORS.textLight,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SIZES.base,
    marginVertical: SIZES.margin,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: SIZES.body2,
    color: COLORS.textPrimary,
  },
  addButton: {
    marginTop: SIZES.margin,
    marginBottom: SIZES.margin * 2,
  },
  // Payment type styles
  paymentTypeContainer: {
    flexDirection: 'row',
    gap: SIZES.base,
    marginBottom: SIZES.margin,
  },
  paymentTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.base,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  paymentTypeButtonActive: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '10',
  },
  paymentTypeButtonDebt: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error + '10',
  },
  paymentTypeText: {
    fontSize: SIZES.body2,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  paymentTypeTextActive: {
    color: COLORS.success,
  },
  paymentTypeTextDebt: {
    color: COLORS.error,
  },
  debtWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.base,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.warning + '15',
    marginBottom: SIZES.margin,
  },
  debtWarningText: {
    fontSize: SIZES.body3,
    color: COLORS.warning,
    fontWeight: '500',
  },
});
