import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../src/context/AppContext';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Buttons';
import { Card } from '../../src/components/Card';
import { COLORS, SIZES, SHADOWS } from '../../src/utils/theme';
import { Server } from '../../src/database/index';

export default function ServersScreen() {
  const {
    servers,
    currentServer,
    addServer,
    updateServer,
    deleteServer,
    selectServer,
    testConnection,
    isConnected,
    isSyncing,
    syncData,
    syncStatus,
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setName('');
    setUrl('');
    setUsername('');
    setPassword('');
    setIsDefault(false);
    setEditingServer(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (server: Server) => {
    setEditingServer(server);
    setName(server.name);
    setUrl(server.url);
    setUsername(server.username);
    setPassword(server.password);
    setIsDefault(server.is_default === 1);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !url.trim() || !username.trim() || !password.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsLoading(true);
    try {
      if (editingServer?.id) {
        await updateServer(editingServer.id, {
          name: name.trim(),
          url: url.trim(),
          username: username.trim(),
          password,
          is_default: isDefault ? 1 : 0,
        });
        Alert.alert('نجاح', 'تم تحديث السيرفر بنجاح');
      } else {
        await addServer({
          name: name.trim(),
          url: url.trim(),
          username: username.trim(),
          password,
          is_default: isDefault ? 1 : 0,
        });
        Alert.alert('نجاح', 'تم إضافة السيرفر بنجاح');
      }
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (server: Server) => {
    Alert.alert(
      'حذف السيرفر',
      `هل أنت متأكد من حذف "${server.name}"؟\nسيتم حذف جميع البيانات المخزنة لهذا السيرفر.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteServer(server.id!);
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ أثناء الحذف');
            }
          },
        },
      ]
    );
  };

  const handleConnect = async (server: Server) => {
    setIsLoading(true);
    try {
      const success = await selectServer(server);
      if (success) {
        Alert.alert('نجاح', 'تم الاتصال بالسيرفر بنجاح');
      } else {
        Alert.alert('خطأ', 'فشل الاتصال بالسيرفر');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (server: Server) => {
    setIsLoading(true);
    try {
      const result = await testConnection(server);
      Alert.alert(
        result.success ? 'نجاح' : 'خطأ',
        result.message
      );
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء اختبار الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      const result = await syncData();
      if (result.success) {
        Alert.alert('نجاح', `تمت المزامنة بنجاح\nالمشتركين: ${result.usersCount || 0}`);
      } else {
        Alert.alert('خطأ', result.error || 'فشلت المزامنة');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء المزامنة');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={28} color={COLORS.textLight} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>السيرفرات</Text>
            <Text style={styles.headerSubtitle}>
              {servers.length} سيرفر{servers.length !== 1 ? 'ات' : ''}
            </Text>
          </View>
        </View>

        {/* Current Server Status */}
        {currentServer && (
          <View style={styles.statusBar}>
            <View style={styles.statusInfo}>
              <Ionicons
                name={isConnected ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={isConnected ? COLORS.success : COLORS.error}
              />
              <Text style={styles.statusText}>
                {currentServer.name} - {isConnected ? 'متصل' : 'غير متصل'}
              </Text>
            </View>
            {isConnected && (
              <TouchableOpacity onPress={handleSync} disabled={isSyncing}>
                {isSyncing ? (
                  <ActivityIndicator size="small" color={COLORS.textLight} />
                ) : (
                  <Ionicons name="sync-outline" size={20} color={COLORS.textLight} />
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </LinearGradient>

      {/* Sync Status */}
      {isSyncing && (
        <View style={styles.syncBar}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.syncText}>{syncStatus}</Text>
        </View>
      )}

      {/* Servers List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {servers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="server-outline" size={80} color={COLORS.border} />
            <Text style={styles.emptyTitle}>لا توجد سيرفرات</Text>
            <Text style={styles.emptySubtitle}>
              أضف سيرفر SAS جديد للبدء
            </Text>
            <Button
              title="إضافة سيرفر"
              onPress={openAddModal}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          servers.map((server) => (
            <Card key={server.id} style={styles.serverCard}>
              <TouchableOpacity
                style={styles.serverContent}
                onPress={() => handleConnect(server)}
              >
                <View style={styles.serverHeader}>
                  <View style={styles.serverActions}>
                    <TouchableOpacity
                      onPress={() => handleTestConnection(server)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="pulse-outline" size={20} color={COLORS.info} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => openEditModal(server)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="create-outline" size={20} color={COLORS.warning} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(server)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.serverNameRow}>
                    {server.is_default === 1 && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>افتراضي</Text>
                      </View>
                    )}
                    <Text style={styles.serverName}>{server.name}</Text>
                  </View>
                </View>

                <View style={styles.serverDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailValue}>{server.url}</Text>
                    <Ionicons name="link-outline" size={16} color={COLORS.textTertiary} />
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailValue}>{server.username}</Text>
                    <Ionicons name="person-outline" size={16} color={COLORS.textTertiary} />
                  </View>
                  {server.last_sync && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailValue}>{server.last_sync}</Text>
                      <Ionicons name="sync-outline" size={16} color={COLORS.textTertiary} />
                    </View>
                  )}
                </View>

                {currentServer?.id === server.id && isConnected && (
                  <View style={styles.connectedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                    <Text style={styles.connectedText}>متصّل</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Card>
          ))
        )}

        {/* Instructions */}
        <Card title="تعليمات" style={styles.instructionsCard}>
          <Text style={styles.instructionText}>
            1. أضف سيرفر SAS جديد باستخدام زر + أعلاه{'\n'}
            2. أدخل عنوان URL (مثال: http://demo.sasradius.com){'\n'}
            3. أدخل بيانات المدير{'\n'}
            4. اضغط على السيرفر للاتصال{'\n'}
            5. استخدم زر المزامنة لتحديث البيانات
          </Text>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add/Edit Server Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close-outline" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingServer ? 'تعديل السيرفر' : 'إضافة سيرفر جديد'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="اسم السيرفر *"
                placeholder="مثال: السيرفر الرئيسي"
                value={name}
                onChangeText={setName}
                icon="server-outline"
              />

              <Input
                label="عنوان URL *"
                placeholder="http://example.com"
                value={url}
                onChangeText={setUrl}
                icon="link-outline"
              />

              <Input
                label="اسم المستخدم *"
                placeholder="admin"
                value={username}
                onChangeText={setUsername}
                icon="person-outline"
              />

              <Input
                label="كلمة المرور *"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon="lock-closed-outline"
              />

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsDefault(!isDefault)}
              >
                <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
                  {isDefault && <Ionicons name="checkmark" size={16} color={COLORS.textLight} />}
                </View>
                <Text style={styles.checkboxLabel}>تعيين كـ سيرفر افتراضي</Text>
              </TouchableOpacity>

              <Button
                title={isLoading ? 'جاري الحفظ...' : 'حفظ'}
                onPress={handleSave}
                loading={isLoading}
                style={styles.saveButton}
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
  headerContent: {
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  statusText: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
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
  content: {
    flex: 1,
    padding: SIZES.padding,
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
  serverCard: {
    marginBottom: SIZES.base,
    overflow: 'hidden',
  },
  serverContent: {
    padding: SIZES.padding,
  },
  serverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.base,
  },
  serverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.base,
  },
  serverName: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  defaultBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SIZES.base,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: SIZES.caption,
    color: COLORS.primary,
    fontWeight: '500',
  },
  serverActions: {
    flexDirection: 'row',
    gap: SIZES.base,
  },
  actionButton: {
    padding: SIZES.base,
  },
  serverDetails: {
    gap: SIZES.base / 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SIZES.base,
  },
  detailValue: {
    fontSize: SIZES.body3,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.base / 2,
    marginTop: SIZES.base,
    paddingTop: SIZES.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  connectedText: {
    fontSize: SIZES.body3,
    color: COLORS.success,
    fontWeight: '500',
  },
  instructionsCard: {
    marginTop: SIZES.margin,
  },
  instructionText: {
    fontSize: SIZES.body3,
    color: COLORS.textSecondary,
    textAlign: 'right',
    lineHeight: 24,
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
  saveButton: {
    marginTop: SIZES.margin,
  },
});
