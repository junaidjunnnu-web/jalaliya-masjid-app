import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../theme';
import { api } from '../../lib/api';

export default function FamilyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [family, setFamily] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [memberFormData, setMemberFormData] = useState({
    name: '',
    relation: '',
    phone: '',
    age: '',
    gender: '',
    maritalStatus: '',
    occupation: '',
    isFeeApplicable: true,
  });
  const [loading, setLoading] = useState(false);

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

  const openAddMemberModal = () => {
    setEditingMember(null);
    setMemberFormData({
      name: '',
      relation: '',
      phone: '',
      age: '',
      gender: '',
      maritalStatus: '',
      occupation: '',
      isFeeApplicable: true,
    });
    setShowMemberModal(true);
  };

  const openEditMemberModal = (member: any) => {
    setEditingMember(member);
    setMemberFormData({
      name: member.name,
      relation: member.relation,
      phone: member.phone || '',
      age: member.age?.toString() || '',
      gender: member.gender || '',
      maritalStatus: member.maritalStatus || '',
      occupation: member.occupation || '',
      isFeeApplicable: member.isFeeApplicable ?? true,
    });
    setShowMemberModal(true);
  };

  const handleSaveMember = async () => {
    const { name, relation } = memberFormData;
    if (!name || !relation) {
      Alert.alert('Error', 'Name and relation are required');
      return;
    }

    setLoading(true);
    try {
      if (editingMember) {
        const { data, error } = await api.families.updateMember(
          family.id,
          editingMember.id,
          {
            name: memberFormData.name,
            relation: memberFormData.relation,
            phone: memberFormData.phone || null,
            age: memberFormData.age ? parseInt(memberFormData.age) : null,
            gender: memberFormData.gender || null,
            maritalStatus: memberFormData.maritalStatus || null,
            occupation: memberFormData.occupation || null,
            isFeeApplicable: memberFormData.isFeeApplicable,
          }
        );
        if (error) {
          Alert.alert('Error', String(error));
        }
      } else {
        const { data, error } = await api.families.addMember(family.id, {
          name: memberFormData.name,
          relation: memberFormData.relation,
          phone: memberFormData.phone || null,
          age: memberFormData.age ? parseInt(memberFormData.age) : null,
          gender: memberFormData.gender || null,
          maritalStatus: memberFormData.maritalStatus || null,
          occupation: memberFormData.occupation || null,
          isFeeApplicable: memberFormData.isFeeApplicable,
        });
        if (error) {
          Alert.alert('Error', String(error));
        }
      }
      await loadFamilyData();
      setShowMemberModal(false);
      Alert.alert('Success', editingMember ? 'Member updated' : 'Member added');
    } catch (error) {
      Alert.alert('Error', 'Failed to save member');
    }
    setLoading(false);
  };

  const handleDeleteMember = (member: any) => {
    Alert.alert(
      'Delete Member',
      `Delete ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await api.families.deleteMember(family.id, member.id);
            if (error) {
              Alert.alert('Error', error);
            } else {
              await loadFamilyData();
              Alert.alert('Success', 'Member deleted');
            }
          }
        }
      ]
    );
  };

  if (!family) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
            {true && family.headPhone && (
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

        {true && family.address && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address:</Text>
            <Text style={styles.detailValue}>{family.address}</Text>
          </View>
        )}

        {true && (
          <View style={styles.feeInfo}>
            <Text style={styles.feeLabel}>Monthly Fees:</Text>
            <Text style={styles.feeValue}>
              Married: ₹{family.monthlyFeeMarried} | Unmarried: ₹{family.monthlyFeeUnmarried}
            </Text>
          </View>
        )}

        {family.headPhone && (
          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={[styles.contactButton, styles.callButton]}
              onPress={() => handleCall(family.headPhone)}
              activeOpacity={0.7}
            >
              <Text style={styles.contactButtonText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactButton, styles.whatsappButton]}
              onPress={() => handleWhatsApp(family.headPhone)}
              activeOpacity={0.7}
            >
              <Text style={styles.contactButtonText}>💬 WhatsApp</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Family Members */}
      <View style={styles.membersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Family Members</Text>
          {true && (
            <TouchableOpacity style={styles.addMemberButton} onPress={openAddMemberModal} activeOpacity={0.7}>
              <Text style={styles.addMemberButtonText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>
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
                {member.phone && (
                  <Text style={styles.memberPhone}>{member.phone}</Text>
                )}
                {member.occupation && (
                  <Text style={styles.memberOccupation}>{member.occupation}</Text>
                )}
              </View>
              <View style={styles.memberActions}>
                <TouchableOpacity
                  style={styles.memberActionButton}
                  onPress={() => openEditMemberModal(member)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.memberActionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.memberActionButton, styles.deleteButton]}
                  onPress={() => handleDeleteMember(member)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.memberActionText}>Delete</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.memberDetails}>
                {member.age && <Text style={styles.memberDetail}>Age: {member.age}</Text>}
                {member.gender && <Text style={styles.memberDetail}>{member.gender.charAt(0).toUpperCase() + member.gender.slice(1)}</Text>}
                {member.maritalStatus && (
                  <Text style={styles.memberDetail}>{member.maritalStatus.charAt(0).toUpperCase() + member.maritalStatus.slice(1)}</Text>
                )}
                {member.isFeeApplicable && (
                  <View style={styles.feeApplicableBadge}>
                    <Text style={styles.feeApplicableText}>Fee Applicable</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Committee Actions */}
      {family.status === 'pending' && (
        <TouchableOpacity style={styles.approveButton}>
          <Text style={styles.approveButtonText}>Approve Family</Text>
        </TouchableOpacity>
      )}

      {/* Add/Edit Family Member Modal */}
      <Modal
        visible={showMemberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMemberModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>
                  {editingMember ? 'Edit Family Member' : 'Add Family Member'}
                </Text>

                <Text style={styles.modalLabel}>Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter name"
                  value={memberFormData.name}
                  onChangeText={(text) => setMemberFormData({ ...memberFormData, name: text })}
                />

                <Text style={styles.modalLabel}>Relation *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., Wife, Son, Daughter"
                  value={memberFormData.relation}
                  onChangeText={(text) => setMemberFormData({ ...memberFormData, relation: text })}
                />

                <Text style={styles.modalLabel}>Phone</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter phone number"
                  value={memberFormData.phone}
                  onChangeText={(text) => setMemberFormData({ ...memberFormData, phone: text })}
                  keyboardType="phone-pad"
                  maxLength={15}
                />

                <Text style={styles.modalLabel}>Age</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter age"
                  value={memberFormData.age}
                  onChangeText={(text) => setMemberFormData({ ...memberFormData, age: text })}
                  keyboardType="number-pad"
                />

                <Text style={styles.modalLabel}>Gender</Text>
                <View style={styles.modalOptions}>
                  {['male', 'female'].map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.modalOption,
                        memberFormData.gender === gender && styles.modalOptionActive,
                      ]}
                      onPress={() => setMemberFormData({ ...memberFormData, gender })}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          memberFormData.gender === gender && styles.modalOptionTextActive,
                        ]}
                      >
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.modalLabel}>Marital Status</Text>
                <View style={styles.modalOptions}>
                  {['married', 'unmarried'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.modalOption,
                        memberFormData.maritalStatus === status && styles.modalOptionActive,
                      ]}
                      onPress={() => setMemberFormData({ ...memberFormData, maritalStatus: status })}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          memberFormData.maritalStatus === status && styles.modalOptionTextActive,
                        ]}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.modalLabel}>Occupation</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter occupation"
                  value={memberFormData.occupation}
                  onChangeText={(text) => setMemberFormData({ ...memberFormData, occupation: text })}
                />

                <TouchableOpacity
                  style={styles.modalCheckbox}
                  onPress={() => setMemberFormData({ ...memberFormData, isFeeApplicable: !memberFormData.isFeeApplicable })}
                >
                  <View style={[styles.checkbox, memberFormData.isFeeApplicable && styles.checkboxChecked]}>
                    {memberFormData.isFeeApplicable && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Fee Applicable</Text>
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => setShowMemberModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveModalButton, loading && styles.modalButtonDisabled]}
                  onPress={handleSaveMember}
                  disabled={loading}
                >
                  <Text style={styles.modalButtonText}>
                    {loading ? 'Saving...' : 'Save'}
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
  memberPhone: {
    fontSize: 13,
    color: theme.colors.gray[600],
  },
  memberOccupation: {
    fontSize: 13,
    color: theme.colors.gray[600],
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  addMemberButton: {
    backgroundColor: theme.colors.membersAccent,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  addMemberButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  memberActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  memberActionButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.membersAccent,
  },
  deleteButton: {
    backgroundColor: theme.colors.alert,
  },
  memberActionText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '600',
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
    marginBottom: theme.spacing.md,
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
  modalOptions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  modalOption: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    alignItems: 'center',
  },
  modalOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  modalOptionText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    fontWeight: '600',
  },
  modalOptionTextActive: {
    color: theme.colors.white,
  },
  modalCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: theme.colors.textPrimary,
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
  },
  cancelModalButton: {
    backgroundColor: theme.colors.gray[200],
  },
  saveModalButton: {
    backgroundColor: theme.colors.membersAccent,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
});
