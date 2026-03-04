import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import {
  DebtRecord,
  PaymentRecord,
  getDebtRecords,
  updateDebtRecord,
  deleteDebtRecord,
  addPaymentRecord,
  getPaymentRecords,
} from '../../src/database';
import { COLORS, SIZES } from '../../src/utils/theme';

type DebtStatus = 'pending' | 'partial' | 'paid';

const STATUS_COLORS = {
  pending: '#ef4444',
  partial: '#f59e0b',
  paid: '#22c55e',
};

const STATUS_LABELS = {
  pending: 'غير مدفوع',
  partial: 'مدفوع جزئياً',
  paid: 'مدفوع بالكامل',
};

export default function DebtsScreen() {
  const { debts: contextDebts, refreshDebts } = useApp();
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DebtStatus | 'all'>('all');
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const loadDebts = useCallback(async () => {
    setLoading(true);
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const data = await getDebtRecords(undefined, status);
      setDebts(data);
    } catch (error) {
      console.error('Error loading debts:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  // تحديث عند تغيير الديون من الـ context
  useEffect(() => {
    if (contextDebts.length > 0) {
      loadDebts();
    }
  }, [contextDebts]);

  const loadPayments = async (debtId: number) => {
    const data = await getPaymentRecords(debtId);
    setPayments(data);
  };

  const handleDebtPress = async (debt: DebtRecord) => {
    setSelectedDebt(debt);
    await loadPayments(debt.id!);
  };

  const handleAddPayment = async () => {
    if (!selectedDebt) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }

    if (amount > selectedDebt.remaining_amount) {
      Alert.alert('خطأ', 'المبلغ أكبر من المتبقي');
      return;
    }

    try {
      await addPaymentRecord({
        debt_id: selectedDebt.id!,
        user_id: selectedDebt.user_id,
        username: selectedDebt.username,
        amount,
        notes: paymentNotes,
      });

      // Refresh data
      await loadDebts();
      await refreshDebts();
      await loadPayments(selectedDebt.id!);
      
      // Update selected debt
      const updatedDebts = await getDebtRecords(selectedDebt.user_id);
      const updated = updatedDebts.find(d => d.id === selectedDebt.id);
      if (updated) setSelectedDebt(updated);

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNotes('');
      Alert.alert('نجاح', 'تم تسجيل الدفعة بنجاح');
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('خطأ', 'فشل تسجيل الدفعة');
    }
  };

  const handleDeleteDebt = async (debt: DebtRecord) => {
    const isPaid = debt.status === 'paid';
    const warningMessage = isPaid 
      ? 'هل أنت متأكد من حذف هذا الدين المدفوع؟'
      : `تحذير: هذا الدين غير مدفوع!
المتبقي: ${formatCurrency(debt.remaining_amount)}

هل أنت متأكد من حذفه؟ سيتم إلغاء المبلغ المتبقي.`;

    Alert.alert(
      'تأكيد الحذف',
      warningMessage,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDebtRecord(debt.id!);
              await loadDebts();
              await refreshDebts();
              setSelectedDebt(null);
              Alert.alert('نجاح', 'تم حذف الدين');
            } catch (error) {
              console.error('Error deleting debt:', error);
              Alert.alert('خطأ', 'فشل حذف الدين');
            }
          },
        },
      ]
    );
  };

  const filteredDebts = debts.filter(d =>
    d.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDebt = debts
    .filter(d => d.status !== 'paid')
    .reduce((sum, d) => sum + d.remaining_amount, 0);

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} د.ع`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-IQ');
  };

  return (
    <View style={styles.container}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>إجمالي الديون</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalDebt)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>عدد الديون</Text>
          <Text style={styles.summaryValue}>{debts.filter(d => d.status !== 'paid').length}</Text>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="بحث..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>
        <View style={styles.statusFilters}>
          {(['all', 'pending', 'partial', 'paid'] as const).map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusFilter,
                statusFilter === status && styles.statusFilterActive,
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  statusFilter === status && styles.statusFilterTextActive,
                ]}
              >
                {status === 'all' ? 'الكل' : STATUS_LABELS[status]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Debts List */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredDebts}
          keyExtractor={item => item.id!.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.debtCard}
              onPress={() => handleDebtPress(item)}
            >
              <View style={styles.debtHeader}>
                <Text style={styles.debtUsername}>{item.username}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: STATUS_COLORS[item.status] + '20' },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}
                  >
                    {STATUS_LABELS[item.status]}
                  </Text>
                </View>
              </View>
              <View style={styles.debtDetails}>
                <View style={styles.debtInfo}>
                  <Text style={styles.debtLabel}>المبلغ الأصلي</Text>
                  <Text style={styles.debtAmount}>{formatCurrency(item.amount)}</Text>
                </View>
                <View style={styles.debtInfo}>
                  <Text style={styles.debtLabel}>المتبقي</Text>
                  <Text style={[styles.debtAmount, { color: COLORS.error }]}>
                    {formatCurrency(item.remaining_amount)}
                  </Text>
                </View>
              </View>
              {item.description && (
                <Text style={styles.debtDescription}>{item.description}</Text>
              )}
              <Text style={styles.debtDate}>{formatDate(item.created_at)}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>لا توجد ديون</Text>
            </View>
          }
        />
      )}

      {/* Debt Detail Modal */}
      <Modal
        visible={selectedDebt !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedDebt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDebt && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedDebt.username}</Text>
                  <TouchableOpacity onPress={() => setSelectedDebt(null)}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.debtDetailCard}>
                  <View style={styles.debtDetailRow}>
                    <Text style={styles.debtDetailLabel}>المبلغ الأصلي</Text>
                    <Text style={styles.debtDetailValue}>
                      {formatCurrency(selectedDebt.amount)}
                    </Text>
                  </View>
                  <View style={styles.debtDetailRow}>
                    <Text style={styles.debtDetailLabel}>المبلغ المدفوع</Text>
                    <Text style={[styles.debtDetailValue, { color: COLORS.success }]}>
                      {formatCurrency(selectedDebt.amount - selectedDebt.remaining_amount)}
                    </Text>
                  </View>
                  <View style={styles.debtDetailRow}>
                    <Text style={styles.debtDetailLabel}>المتبقي</Text>
                    <Text style={[styles.debtDetailValue, { color: COLORS.error }]}>
                      {formatCurrency(selectedDebt.remaining_amount)}
                    </Text>
                  </View>
                  {selectedDebt.description && (
                    <View style={styles.debtDetailRow}>
                      <Text style={styles.debtDetailLabel}>الوصف</Text>
                      <Text style={styles.debtDetailValue}>
                        {selectedDebt.description}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Payments List */}
                <Text style={styles.paymentsTitle}>سجل المدفوعات</Text>
                {payments.length > 0 ? (
                  <FlatList
                    data={payments}
                    keyExtractor={item => item.id!.toString()}
                    style={styles.paymentsList}
                    renderItem={({ item }) => (
                      <View style={styles.paymentItem}>
                        <View>
                          <Text style={styles.paymentAmount}>
                            {formatCurrency(item.amount)}
                          </Text>
                          <Text style={styles.paymentDate}>
                            {formatDate(item.created_at)}
                          </Text>
                        </View>
                        {item.notes && (
                          <Text style={styles.paymentNotes}>{item.notes}</Text>
                        )}
                      </View>
                    )}
                  />
                ) : (
                  <Text style={styles.noPayments}>لا توجد مدفوعات</Text>
                )}

                {/* Actions */}
                <View style={styles.modalActions}>
                  {selectedDebt.status !== 'paid' && (
                    <TouchableOpacity
                      style={styles.paymentButton}
                      onPress={() => setShowPaymentModal(true)}
                    >
                      <Ionicons name="cash" size={20} color="#fff" />
                      <Text style={styles.paymentButtonText}>تسجيل دفعة</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      selectedDebt.status !== 'paid' && styles.deleteButtonDisabled,
                    ]}
                    onPress={() => handleDeleteDebt(selectedDebt)}
                    disabled={selectedDebt.status !== 'paid'}
                  >
                    <Ionicons name="trash" size={20} color="#fff" />
                    <Text style={styles.deleteButtonText}>حذف</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalContent}>
            <Text style={styles.modalTitle}>تسجيل دفعة</Text>
            
            {selectedDebt && (
              <Text style={styles.remainingText}>
                المتبقي: {formatCurrency(selectedDebt.remaining_amount)}
              </Text>
            )}

            <TextInput
              style={styles.input}
              placeholder="المبلغ"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textTertiary}
            />

            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="ملاحظات (اختياري)"
              value={paymentNotes}
              onChangeText={setPaymentNotes}
              multiline
              placeholderTextColor={COLORS.textTertiary}
            />

            <View style={styles.paymentModalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount('');
                  setPaymentNotes('');
                }}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleAddPayment}>
                <Text style={styles.confirmButtonText}>تأكيد</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textTertiary,
    marginTop: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'right',
  },
  statusFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  statusFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  statusFilterActive: {
    backgroundColor: COLORS.primary,
  },
  statusFilterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusFilterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  debtCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  debtUsername: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  debtDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  debtInfo: {
    alignItems: 'center',
  },
  debtLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  debtAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  debtDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: 'right',
  },
  debtDate: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'left',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  debtDetailCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  debtDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  debtDetailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  debtDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  paymentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  paymentsList: {
    maxHeight: 200,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
  },
  paymentDate: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  paymentNotes: {
    fontSize: 12,
    color: COLORS.textSecondary,
    maxWidth: '50%',
  },
  noPayments: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  paymentButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  paymentModalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  remainingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 12,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  paymentModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
