import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../../theme';
import { api } from '../../lib/api';
import * as Linking from 'expo-linking';

export default function FeesScreen() {
  const [family, setFamily] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCommitteeView();
  }, [selectedMonth]);

  const loadCommitteeView = async () => {
    const { data: monthFees } = await api.fees.getByMonth(selectedMonth);
    const { data: monthSummary } = await api.fees.getSummary(selectedMonth);
    if (monthFees) setFees(monthFees);
    if (monthSummary) setSummary(monthSummary);
  };

  const loadFamilyFees = async () => {
    const { data } = await api.fees.getByFamily(family.id);
    if (data) setFees(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return theme.colors.success;
      case 'partial':
        return theme.colors.accent;
      case 'unpaid':
        return theme.colors.alert;
      default:
        return theme.colors.gray[500];
    }
  };

  const formatWhatsAppMessage = (fee: any) => {
    return `Assalamu Alaikum ${fee.familyHeadName},
Jalaliya Juma Masjid — Fee Statement — ${fee.month}
This month's fee: ₹${fee.calculatedFee}
Previous balance: ₹${fee.openingBalance}
Total due: ₹${fee.totalDue}
Paid: ₹${fee.amountPaid}
Balance: ₹${fee.closingBalance}
JazakAllah Khair`;
  };

  const handleGenerateFees = async () => {
    Alert.alert(
      'Generate Fees',
      `Generate fees for ${selectedMonth}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { data, error } = await api.fees.generate(selectedMonth);
              if (error) {
                Alert.alert('Error', error);
              } else {
                await loadCommitteeView();
                Alert.alert('Success', 'Fees generated successfully');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to generate fees');
            }
            setLoading(false);
          }
        }
      ]
    );
  };

  const openPaymentModal = (fee: any) => {
    setSelectedFee(fee);
    setPaymentAmount('');
    setShowPaymentModal(true);
  };

  const handleUpdatePayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.fees.updatePayment(selectedFee.id, {
        amountPaid: amount,
      });
      if (error) {
        Alert.alert('Error', error);
      } else {
        await loadCommitteeView();
        setShowPaymentModal(false);
        Alert.alert('Success', 'Payment updated');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update payment');
    }
    setLoading(false);
  };

  const handleShareStatement = (fee: any) => {
    const message = formatWhatsAppMessage(fee);
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'WhatsApp not installed');
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fee Collection</Text>
      </View>

      {/* Committee Summary Header */}
      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Collection Summary - {selectedMonth}</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.paidFamilies}/{summary.totalFamilies}</Text>
              <Text style={styles.statLabel}>Families Paid</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹{summary.totalCollected}</Text>
              <Text style={styles.statLabel}>Collected</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹{summary.totalPending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
          {/* Crescent Arc Progress Placeholder */}
          <View style={styles.arcPlaceholder} />
        </View>
      )}

      {/* Generate Fees Button */}
      <TouchableOpacity style={styles.generateButton} onPress={handleGenerateFees} activeOpacity={0.7}>
        <Text style={styles.generateButtonText}>Generate This Month's Fees</Text>
      </TouchableOpacity>

      {/* Fees List */}
      <View style={styles.feesList}>
        {fees.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No fee records found</Text>
          </View>
        ) : (
          fees.map((fee) => (
            <View key={fee.id} style={styles.feeCard}>
              <View style={styles.feeHeader}>
                <Text style={styles.feeMonth}>{fee.month}</Text>
                <View style={[styles.statusPill, { backgroundColor: getStatusColor(fee.status) }]}>
                  <Text style={styles.statusText}>{fee.status.toUpperCase()}</Text>
                </View>
              </View>
              
              {!!fee.familyHeadName && (
                <Text style={styles.familyName}>{fee.familyHeadName}</Text>
              )}

              <View style={styles.feeDetails}>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Calculated Fee:</Text>
                  <Text style={styles.feeValue}>₹{fee.calculatedFee}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Opening Balance:</Text>
                  <Text style={styles.feeValue}>₹{fee.openingBalance}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Total Due:</Text>
                  <Text style={[styles.feeValue, styles.feeValueBold]}>₹{fee.totalDue}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Amount Paid:</Text>
                  <Text style={styles.feeValue}>₹{fee.amountPaid}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Balance:</Text>
                  <Text style={[styles.feeValue, styles.feeValueBold, { color: fee.closingBalance > 0 ? theme.colors.alert : theme.colors.success }]}>
                    ₹{fee.closingBalance}
                  </Text>
                </View>
              </View>

              {user?.role === 'committee' && (
                <View style={styles.feeActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openPaymentModal(fee)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionButtonText}>Update Payment</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.shareButton]}
                    onPress={() => handleShareStatement(fee)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionButtonText}>Share Statement</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Update Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Update Payment</Text>
                {selectedFee && (
                  <>
                    <Text style={styles.modalLabel}>Family: {selectedFee.familyHeadName}</Text>
                    <Text style={styles.modalLabel}>Balance Due: ₹{selectedFee.closingBalance}</Text>
                    <Text style={styles.modalLabel}>Payment Amount *</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Enter amount"
                      value={paymentAmount}
                      onChangeText={setPaymentAmount}
                      keyboardType="numeric"
                    />
                  </>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveModalButton, loading && styles.modalButtonDisabled]}
                  onPress={handleUpdatePayment}
                  disabled={loading}
                >
                  <Text style={styles.modalButtonText}>
                    {loading ? 'Updating...' : 'Update Payment'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    fontFamily: theme.typography.display,
  },
  summaryCard: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.display,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontVariant: ['tabular-nums'] as any,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.gray[500],
    marginTop: 2,
  },
  arcPlaceholder: {
    height: 8,
    backgroundColor: theme.colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  generateButton: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.accent,
    ...theme.shadow.button,
  },
  generateButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  feesList: {
    padding: theme.spacing.md,
  },
  feeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  feeMonth: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: '600',
  },
  familyName: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginBottom: theme.spacing.md,
  },
  feeDetails: {
    marginBottom: theme.spacing.md,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
  feeLabel: {
    fontSize: 14,
    color: theme.colors.gray[500],
  },
  feeValue: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'] as any,
  },
  feeValueBold: {
    fontWeight: 'bold',
  },
  feeActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    padding: theme.spacing.sm,
    alignItems: 'center',
    ...theme.shadow.button,
  },
  shareButton: {
    backgroundColor: theme.colors.whatsapp,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.gray[500],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xl,
    width: '100%',
    maxHeight: '90%',
    ...theme.shadow.card,
  },
  modalScrollView: {
    flex: 1,
    marginBottom: theme.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    ...theme.shadow.button,
  },
  cancelModalButton: {
    backgroundColor: theme.colors.gray[300],
  },
  saveModalButton: {
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.display,
  },
  modalLabel: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    ...theme.shadow.button,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.gray[500],
    fontSize: 14,
    fontWeight: '600',
  },
});
