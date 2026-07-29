import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import { api } from '../../lib/api';
import { formatPhoneNumber } from '../../lib/utils';

const COMMITTEE_SESSION_KEY = '@committee_session';

export default function CommitteeScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [pendingDues, setPendingDues] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [committeeSession, setCommitteeSession] = useState<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadCommitteeMembers();
      checkCommitteeSession();
      if (committeeSession) {
        loadPendingDues();
      }
    }, [committeeSession])
  );

  const checkCommitteeSession = async () => {
    try {
      const sessionJson = await AsyncStorage.getItem(COMMITTEE_SESSION_KEY);
      if (sessionJson) {
        setCommitteeSession(JSON.parse(sessionJson));
      }
    } catch (error) {
      console.error('Error checking committee session:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(COMMITTEE_SESSION_KEY);
      setCommitteeSession(null);
      Alert.alert('Success', 'Logged out successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
      console.error('Logout error:', error);
    }
  };

  const loadCommitteeMembers = async () => {
    const { data } = await api.committee.getAll();
    if (data) {
      setMembers(data as any[]);
    }
  };

  const loadPendingDues = async () => {
    const { data } = await api.dues.getPending();
    if (data) {
      setPendingDues(data as any[]);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone: string) => {
    Linking.openURL(`whatsapp://send?phone=${formatPhoneNumber(phone)}`);
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      designation: '',
      phone: '',
    });
    setShowModal(true);
  };

  const openEditModal = (member: any) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      designation: member.designation,
      phone: member.phone,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const { name, designation, phone } = formData;
    if (!name || !designation || !phone) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      if (editingMember) {
        const requestBody = {
          name: formData.name,
          designation: formData.designation,
          phone: formData.phone,
        };
        console.log('[Committee Update] Request body:', JSON.stringify(requestBody, null, 2));

        const { data, error } = await api.committee.update(editingMember.id, requestBody);

        console.log('[Committee Update] Response data:', JSON.stringify(data, null, 2));
        console.log('[Committee Update] Response error:', JSON.stringify(error, null, 2));

        if (error) {
          Alert.alert('Error', String(error));
        } else if (data) {
          await loadCommitteeMembers();
          setShowModal(false);
          Alert.alert('Success', 'Member updated');
        }
      } else {
        const requestBody = {
          name: formData.name,
          designation: formData.designation,
          phone: formData.phone,
        };
        console.log('[Committee Create] Request body:', JSON.stringify(requestBody, null, 2));

        const { data, error } = await api.committee.create(requestBody);

        console.log('[Committee Create] Response data:', JSON.stringify(data, null, 2));
        console.log('[Committee Create] Response error:', JSON.stringify(error, null, 2));

        if (error) {
          Alert.alert('Error', String(error));
        } else if (data) {
          await loadCommitteeMembers();
          setShowModal(false);
          Alert.alert('Success', 'Member added');
        }
      }
    } catch (error) {
      console.log('[Committee Save] Catch error:', JSON.stringify(error, null, 2));
      Alert.alert('Error', 'Failed to save member');
    }
    setLoading(false);
  };

  const handleDelete = (member: any) => {
    Alert.alert(
      'Delete Member',
      `Delete ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await api.committee.delete(member.id);
            if (error) {
              Alert.alert('Error', error);
            } else {
              await loadCommitteeMembers();
              Alert.alert('Success', 'Member deleted');
            }
          }
        }
      ]
    );
  };

  const handleApproveDues = async (entry: any) => {
    const entryType = entry.type === 'balance_edit' ? 'balance edit' : 'payment';
    const entryTypeLabel = entry.type === 'balance_edit' ? 'Balance Edit' : 'Payment';

    Alert.alert(
      `Approve ${entryTypeLabel}`,
      entry.type === 'balance_edit'
        ? `Approve balance change from ₹${entry.oldBalance} to ₹${entry.amount} for ${entry.personName}?`
        : `Approve payment of ₹${entry.amount} from ${entry.personName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setLoading(true);
            try {
              const { data, error } = await api.dues.approve(
                entry.id,
                committeeSession.committeeMemberId
              );

              if (error) {
                Alert.alert('Error', error);
              } else {
                Alert.alert('Success', `${entryTypeLabel} approved`);
                await loadPendingDues();

                // Open WhatsApp with pre-filled message
                let message = '';
                if (entry.type === 'payment') {
                  const paymentDate = new Date(entry.createdAt);
                  const formattedDate = paymentDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  message = `Assalamu Alaikum,\n\nPayment received - Jalaliya Juma Masjid Monthly Fees\n\nAmount: ₹${entry.amount}\nDate: ${formattedDate}\nCurrent Balance: ₹${entry.oldBalance}\n\nJazakAllah Khair for your contribution.\n\nJalaliya Juma Masjid Committee`;
                } else {
                  message = `Balance updated from ₹${entry.oldBalance} to ₹${entry.amount}. Thank you - Jalaliya Juma Masjid`;
                }
                const whatsappUrl = `whatsapp://send?phone=${formatPhoneNumber(entry.phone)}&text=${encodeURIComponent(message)}`;
                Linking.openURL(whatsappUrl).catch(() => {
                  console.log('WhatsApp not available');
                });
              }
            } catch (error) {
              Alert.alert('Error', `Failed to approve ${entryType}`);
              console.error('Approve error:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectDues = async (entry: any) => {
    const entryType = entry.type === 'balance_edit' ? 'balance edit' : 'payment';

    Alert.alert(
      `Reject ${entryType}`,
      `Reject ${entry.type === 'balance_edit' ? 'balance change' : 'payment of ₹' + entry.amount} from ${entry.personName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { data, error } = await api.dues.reject(entry.id);

              if (error) {
                Alert.alert('Error', error);
              } else {
                Alert.alert('Success', `${entryType} rejected`);
                await loadPendingDues();
              }
            } catch (error) {
              Alert.alert('Error', `Failed to reject ${entryType}`);
              console.error('Reject error:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerTitle}>Committee</Text>
      </SafeAreaView>

      {/* About Section */}
      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>About the Committee</Text>
        <Text style={styles.aboutText}>
          The Jalaliya Juma Masjid committee is dedicated to serving the community 
          and maintaining the masjid. Feel free to reach out to any committee member 
          for assistance or inquiries.
        </Text>
      </View>

      {/* Committee Login Section */}
      <View style={styles.loginSection}>
        {committeeSession ? (
          <View style={styles.loggedInCard}>
            <View style={styles.loggedInInfo}>
              <Text style={styles.loggedInLabel}>Logged in as:</Text>
              <Text style={styles.loggedInName}>{committeeSession.name}</Text>
              <Text style={styles.loggedInDesignation}>{committeeSession.designation}</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => router.push('/committee-login')}
            activeOpacity={0.7}
          >
            <Text style={styles.loginButtonText}>Committee Login</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pending Approvals Section - Only shown when logged in */}
      {committeeSession && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Approvals</Text>
          {pendingDues.length === 0 ? (
            <Text style={styles.emptyText}>No pending approvals</Text>
          ) : (
            pendingDues.map((entry) => (
              <View key={entry.id} style={styles.pendingCard}>
                <View style={styles.pendingInfo}>
                  <Text style={styles.pendingPersonName}>{entry.personName}</Text>
                  <Text style={styles.pendingPhone}>{entry.phone}</Text>
                  <Text style={styles.pendingType}>{entry.type === 'balance_edit' ? 'Balance Edit' : 'Payment'}</Text>
                  <View style={styles.pendingAmounts}>
                    <Text style={styles.pendingLabel}>Current Balance: ₹{entry.oldBalance}</Text>
                    <Text style={styles.pendingLabel}>{entry.type === 'balance_edit' ? 'New Balance: ' : 'Payment: '}₹{entry.amount}</Text>
                  </View>
                </View>
                <View style={styles.pendingActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApproveDues(entry)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleRejectDues(entry)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Committee Directory */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Committee Members</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal} activeOpacity={0.7}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {members.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberInfo}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {member.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberDetails}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberDesignation}>{member.designation}</Text>
              </View>
            </View>
            <View style={styles.memberActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => openEditModal(member)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(member)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.callButton]}
                onPress={() => handleCall(member.phone)}
                activeOpacity={0.7}
              >
                <Text style={styles.contactButtonText}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.whatsappButton]}
                onPress={() => handleWhatsApp(member.phone)}
                activeOpacity={0.7}
              >
                <FontAwesome name="whatsapp" size={18} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Add/Edit Committee Member Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingMember ? 'Edit Committee Member' : 'Add Committee Member'}
              </Text>

              <Text style={styles.modalLabel}>Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter full name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.modalLabel}>Designation *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., President, Secretary"
                value={formData.designation}
                onChangeText={(text) => setFormData({ ...formData, designation: text })}
              />

              <Text style={styles.modalLabel}>Phone *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter phone number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton, loading && styles.modalButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
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
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    fontFamily: theme.typography.display,
  },
  aboutSection: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.display,
  },
  aboutText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    lineHeight: 22,
  },
  loginSection: {
    margin: theme.spacing.md,
  },
  loginButton: {
    backgroundColor: theme.colors.addButtonColor,
    borderRadius: theme.radius.button,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadow.button,
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loggedInCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  loggedInInfo: {
    marginBottom: theme.spacing.md,
  },
  loggedInLabel: {
    fontSize: 12,
    color: theme.colors.gray[500],
    marginBottom: theme.spacing.xs,
  },
  loggedInName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  loggedInDesignation: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  logoutButton: {
    backgroundColor: theme.colors.alert,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadow.button,
  },
  logoutButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
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
    marginBottom: theme.spacing.md,
    flexDirection: 'column',
    alignItems: 'flex-start',
    ...theme.shadow.card,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  memberDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  memberDesignation: {
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  memberTenure: {
    fontSize: 12,
    color: theme.colors.gray[500],
  },
  contactButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  contactButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.button,
  },
  callButton: {
    backgroundColor: '#2E6BA8',
  },
  whatsappButton: {
    backgroundColor: theme.colors.whatsapp,
  },
  contactButtonText: {
    fontSize: 20,
    color: theme.colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  addButton: {
    backgroundColor: theme.colors.addButtonColor,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  addButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: theme.colors.gray[200],
  },
  actionButtonText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: theme.colors.alert,
  },
  deleteButtonText: {
    fontSize: 12,
    color: theme.colors.white,
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
    backgroundColor: theme.colors.committeeAccent,
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
  emptyText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    textAlign: 'center',
    padding: theme.spacing.lg,
  },
  pendingCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  pendingInfo: {
    marginBottom: theme.spacing.md,
  },
  pendingPersonName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  pendingPhone: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginBottom: theme.spacing.xs,
  },
  pendingType: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  pendingAmounts: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  pendingLabel: {
    fontSize: 12,
    color: theme.colors.gray[600],
  },
  pendingActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  approveButton: {
    flex: 1,
    backgroundColor: theme.colors.success,
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
  },
  approveButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: theme.colors.alert,
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
