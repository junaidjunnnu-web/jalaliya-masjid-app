import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function FeesScreen() {
  const { user, family } = useAuth();
  const [fees, setFees] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    if (user?.role === 'committee') {
      loadCommitteeView();
    } else if (family?.id) {
      loadFamilyFees();
    }
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {user?.role === 'committee' ? 'Fee Collection' : 'My Fees'}
        </Text>
      </View>

      {/* Committee Summary Header */}
      {user?.role === 'committee' && summary && (
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

      {/* Generate Fees Button - Committee Only */}
      {user?.role === 'committee' && (
        <TouchableOpacity style={styles.generateButton}>
          <Text style={styles.generateButtonText}>Generate This Month's Fees</Text>
        </TouchableOpacity>
      )}

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
              
              {!!(user?.role === 'committee' && fee.familyHeadName) && (
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
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Update Payment</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.shareButton]}>
                    <Text style={styles.actionButtonText}>Share Statement</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
});
