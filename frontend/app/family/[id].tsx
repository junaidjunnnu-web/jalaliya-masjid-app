import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../theme';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function FamilyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [family, setFamily] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    loadFamilyData();
  }, [id]);

  const loadFamilyData = async () => {
    const { data } = await api.families.getById(parseInt(id as string));
    if (data) {
      setFamily(data.family);
      setMembers(data.members);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone: string) => {
    Linking.openURL(`whatsapp://send?phone=${phone}`);
  };

  if (!family) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const canViewFullDetails = user?.role === 'committee' || user?.familyId === family.id;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Family Details</Text>
      </View>

      {/* Family Card */}
      <View style={styles.familyCard}>
        <View style={styles.familyHeader}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {family.headName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.familyInfo}>
            <Text style={styles.familyHead}>{family.headName}</Text>
            {canViewFullDetails && family.headPhone && (
              <Text style={styles.familyPhone}>{family.headPhone}</Text>
            )}
            <Text style={styles.familyPlace}>{family.placeName}</Text>
            {family.status === 'pending' && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>Pending Approval</Text>
              </View>
            )}
          </View>
        </View>

        {canViewFullDetails && family.address && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address:</Text>
            <Text style={styles.detailValue}>{family.address}</Text>
          </View>
        )}

        {canViewFullDetails && (
          <View style={styles.feeInfo}>
            <Text style={styles.feeLabel}>Monthly Fees:</Text>
            <Text style={styles.feeValue}>
              Married: ₹{family.monthlyFeeMarried} | Unmarried: ₹{family.monthlyFeeUnmarried}
            </Text>
          </View>
        )}

        {user?.role === 'committee' && family.headPhone && (
          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={[styles.contactButton, styles.callButton]}
              onPress={() => handleCall(family.headPhone)}
            >
              <Text style={styles.contactButtonText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactButton, styles.whatsappButton]}
              onPress={() => handleWhatsApp(family.headPhone)}
            >
              <Text style={styles.contactButtonText}>💬 WhatsApp</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Family Members */}
      <View style={styles.membersSection}>
        <Text style={styles.sectionTitle}>Family Members</Text>
        {members.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No family members added</Text>
          </View>
        ) : (
          members.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRelation}>{member.relation}</Text>
              </View>
              {canViewFullDetails && (
                <View style={styles.memberDetails}>
                  {member.age && <Text style={styles.memberDetail}>Age: {member.age}</Text>}
                  {member.gender && <Text style={styles.memberDetail}>{member.gender}</Text>}
                  {member.maritalStatus && (
                    <Text style={styles.memberDetail}>{member.maritalStatus}</Text>
                  )}
                  {member.isFeeApplicable && (
                    <View style={styles.feeApplicableBadge}>
                      <Text style={styles.feeApplicableText}>Fee Applicable</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Committee Actions */}
      {user?.role === 'committee' && family.status === 'pending' && (
        <TouchableOpacity style={styles.approveButton}>
          <Text style={styles.approveButtonText}>Approve Family</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  familyCard: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  familyHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  familyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  familyHead: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  familyPhone: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginBottom: 2,
  },
  familyPlace: {
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  pendingBadge: {
    backgroundColor: theme.colors.alert,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    alignSelf: 'flex-start',
  },
  pendingText: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.gray[500],
    width: 80,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  feeInfo: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.radius.button,
  },
  feeLabel: {
    fontSize: 12,
    color: theme.colors.gray[500],
    marginBottom: 2,
  },
  feeValue: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  contactButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    ...theme.shadow.button,
  },
  callButton: {
    backgroundColor: theme.colors.primary,
  },
  whatsappButton: {
    backgroundColor: theme.colors.whatsapp,
  },
  contactButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  membersSection: {
    margin: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.display,
  },
  memberCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.card,
  },
  memberInfo: {
    marginBottom: theme.spacing.sm,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  memberRelation: {
    fontSize: 14,
    color: theme.colors.gray[500],
  },
  memberDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  memberDetail: {
    fontSize: 12,
    color: theme.colors.gray[500],
    backgroundColor: theme.colors.gray[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  feeApplicableBadge: {
    backgroundColor: `${theme.colors.success}20`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  feeApplicableText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.gray[500],
  },
  approveButton: {
    backgroundColor: theme.colors.success,
    margin: theme.spacing.md,
    borderRadius: theme.radius.button,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadow.button,
  },
  approveButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
