import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../theme';
import { api } from '../../lib/api';
import { formatPhoneNumber } from '../../lib/utils';

const COMMITTEE_SESSION_KEY = '@committee_session';

interface Person {
  personName: string;
  phone: string;
  currentBalance: number;
  lastUpdated: string;
}

interface PendingEntry {
  id: number;
  personName: string;
  phone: string;
  type: string;
  amount: number;
  oldBalance: number;
  newBalance: number;
  status: string;
  createdAt: string;
}

interface PaymentHistoryEntry {
  id: number;
  personName: string;
  phone: string;
  amount: number;
  oldBalance: number;
  newBalance: number;
  approvedAt: string;
}

export default function DuesScreen() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [pendingEntries, setPendingEntries] = useState<PendingEntry[]>([]);
  const [committeeSession, setCommitteeSession] = useState<any>(null);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBalanceEditModal, setShowBalanceEditModal] = useState(false);
  const [showPersonDetailModal, setShowPersonDetailModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonPhone, setNewPersonPhone] = useState('');
  const [newPersonBalance, setNewPersonBalance] = useState('');

  const [paymentAmount, setPaymentAmount] = useState('');
  const [newBalanceAmount, setNewBalanceAmount] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadData();
      checkCommitteeSession();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [peopleRes, pendingRes] = await Promise.all([
        api.dues.getAll(),
        api.dues.getPending(),
      ]);

      if (peopleRes.data) {
        setPeople(peopleRes.data as Person[]);
        setFilteredPeople(peopleRes.data as Person[]);
      }
      if (pendingRes.data) {
        setPendingEntries(pendingRes.data as PendingEntry[]);
      }
    } catch (error) {
      console.error('Error loading dues data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPeople(people);
    } else {
      const filtered = people.filter(person =>
        person.personName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPeople(filtered);
    }
  }, [searchQuery, people]);

  const handleSearchResultPress = (person: Person) => {
    setSelectedPerson(person);
    setSearchQuery('');
    setShowPaymentModal(true);
  };

  const handleDeletePerson = (person: Person) => {
    Alert.alert(
      'Delete Person',
      `Are you sure you want to delete this entry for ${person.personName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await api.dues.deletePerson(person.personName, person.phone);
              if (error) {
                Alert.alert('Error', error);
              } else {
                Alert.alert('Success', 'Person deleted successfully');
                await loadData();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete person');
              console.error('Delete error:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

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

  const handleAddPerson = async () => {
    if (!newPersonName) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    const balance = parseInt(newPersonBalance) || 0;

    setLoading(true);
    try {
      const { data, error } = await api.dues.addPerson({
        personName: newPersonName,
        phone: newPersonPhone,
        startingBalance: balance,
      });

      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Person added successfully');
        setShowAddPersonModal(false);
        setNewPersonName('');
        setNewPersonPhone('');
        setNewPersonBalance('');
        await loadData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add person');
      console.error('Add person error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (person: Person) => {
    setSelectedPerson(person);
    setPaymentAmount('');
    setShowPaymentModal(true);
  };

  const handleOpenBalanceEdit = (person: Person) => {
    setSelectedPerson(person);
    setNewBalanceAmount(person.currentBalance.toString());
    setShowBalanceEditModal(true);
  };

  const handleOpenPersonDetail = async (person: Person) => {
    setSelectedPerson(person);
    setLoading(true);
    try {
      const { data, error } = await api.dues.getHistory(person.personName);
      if (data) {
        setPaymentHistory(data as PaymentHistoryEntry[]);
      }
      setShowPersonDetailModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load payment history');
      console.error('Load history error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedPerson || !paymentAmount) {
      Alert.alert('Error', 'Please enter a payment amount');
      return;
    }

    const amount = parseInt(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.dues.submitPayment({
        personName: selectedPerson.personName,
        phone: selectedPerson.phone,
        amount: amount,
      });

      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Payment submitted for approval');
        setShowPaymentModal(false);
        setPaymentAmount('');
        setSelectedPerson(null);
        await loadData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit payment');
      console.error('Submit payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBalanceEdit = async () => {
    if (!selectedPerson || newBalanceAmount === '') {
      Alert.alert('Error', 'Please enter a new balance amount');
      return;
    }

    const amount = parseInt(newBalanceAmount);
    if (isNaN(amount)) {
      Alert.alert('Error', 'Please enter a valid balance amount');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.dues.submitBalanceEdit({
        personName: selectedPerson.personName,
        phone: selectedPerson.phone,
        amount: amount,
      });

      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Balance edit submitted for approval');
        setShowBalanceEditModal(false);
        setNewBalanceAmount('');
        setSelectedPerson(null);
        await loadData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit balance edit');
      console.error('Submit balance edit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (entry: PendingEntry) => {
    if (!committeeSession) {
      Alert.alert(
        'Committee Login Required',
        'You must be logged in as a committee member to approve payments.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Login', onPress: () => router.push('/committee-login') },
        ]
      );
      return;
    }

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
                await loadData();

                // Open WhatsApp with pre-filled message
                let message = '';
                if (entry.type === 'payment') {
                  const paymentDate = new Date(entry.createdAt);
                  const formattedDate = paymentDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  message = `Assalamu Alaikum ${entry.personName},\n\nPayment received - Monthly Fees - Jalaliya Juma Masjid Somwarpet\n\nAmount: ₹${entry.amount}\nDate: ${formattedDate}\nCurrent Balance: ₹${entry.oldBalance}\n\nJazakAllah Khair for your contribution.\n\nJalaliya Juma Masjid Committee`;
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

  const handleReject = async (entry: PendingEntry) => {
    if (!committeeSession) {
      Alert.alert(
        'Committee Login Required',
        'You must be logged in as a committee member to reject payments.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Login', onPress: () => router.push('/committee-login') },
        ]
      );
      return;
    }

    Alert.alert(
      'Reject Payment',
      `Reject payment of ₹${entry.amount} from ${entry.personName}?`,
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
                Alert.alert('Success', 'Payment rejected');
                await loadData();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to reject payment');
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Monthly Fees</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddPersonModal(true)} activeOpacity={0.7}>
          <Text style={styles.addButtonText}>+ Add Person</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search person..."
          placeholderTextColor={theme.colors.gray[500]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Search Results */}
      {searchQuery.trim() !== '' && filteredPeople.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          {filteredPeople.map((person) => (
            <TouchableOpacity
              key={`${person.personName}-${person.phone}`}
              style={styles.personCard}
              onPress={() => handleSearchResultPress(person)}
              activeOpacity={0.7}
            >
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{person.personName}</Text>
                <Text style={styles.personPhone}>{person.phone}</Text>
                <Text style={styles.personBalance}>Balance: ₹{person.currentBalance}</Text>
              </View>
              <Text style={styles.searchArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Pending Approvals Section */}
      {pendingEntries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Approvals</Text>
          {pendingEntries.map((entry) => (
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
                {committeeSession ? (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApprove(entry)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleReject(entry)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.loginRequiredButton}
                    onPress={() => router.push('/committee-login')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.loginRequiredButtonText}>Login to Approve</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* All People Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All People</Text>
        {people.length === 0 ? (
          <Text style={styles.emptyText}>No people added yet</Text>
        ) : (
          people.map((person, index) => (
            <View
              key={`${person.personName}-${person.phone}-${index}`}
              style={styles.personCard}
            >
              <TouchableOpacity
                style={styles.personCardContent}
                onPress={() => handleOpenPersonDetail(person)}
                activeOpacity={0.7}
              >
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{person.personName}</Text>
                  <Text style={styles.personPhone}>{person.phone}</Text>
                </View>
                <View style={styles.balanceContainer}>
                  <Text style={styles.balanceLabel}>Balance</Text>
                  <Text style={styles.balanceAmount}>₹{person.currentBalance}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePerson(person)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Add Person Modal */}
      <Modal
        visible={showAddPersonModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddPersonModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Person</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={newPersonName}
              onChangeText={setNewPersonName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone (optional)"
              value={newPersonPhone}
              onChangeText={setNewPersonPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Starting Balance"
              value={newPersonBalance}
              onChangeText={setNewPersonBalance}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddPersonModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddPerson}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Payment Modal */}
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Payment</Text>
            {selectedPerson && (
              <>
                <Text style={styles.paymentPersonName}>{selectedPerson.personName}</Text>
                <Text style={styles.paymentCurrentBalance}>Current Balance: ₹{selectedPerson.currentBalance}</Text>
              </>
            )}
            <TextInput
              style={styles.input}
              placeholder="Payment Amount"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPaymentModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSubmitPayment}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Balance Edit Modal */}
      <Modal
        visible={showBalanceEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBalanceEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Balance</Text>
            {selectedPerson && (
              <>
                <Text style={styles.paymentPersonName}>{selectedPerson.personName}</Text>
                <Text style={styles.paymentCurrentBalance}>Current Balance: ₹{selectedPerson.currentBalance}</Text>
              </>
            )}
            <TextInput
              style={styles.input}
              placeholder="New Balance"
              value={newBalanceAmount}
              onChangeText={setNewBalanceAmount}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowBalanceEditModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSubmitBalanceEdit}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Person Detail Modal */}
      <Modal
        visible={showPersonDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPersonDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedPerson?.personName}</Text>
            {selectedPerson && (
              <>
                <Text style={styles.detailPhone}>{selectedPerson.phone}</Text>
                <View style={styles.detailBalanceRow}>
                  <Text style={styles.detailBalanceLabel}>Current Balance:</Text>
                  <Text style={styles.detailBalanceAmount}>₹{selectedPerson.currentBalance}</Text>
                </View>

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={[styles.detailActionButton, styles.paymentButton]}
                    onPress={() => {
                      setShowPersonDetailModal(false);
                      handleOpenPayment(selectedPerson);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.detailActionButtonText}>Add Payment</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.detailActionButton, styles.balanceEditButton]}
                    onPress={() => {
                      setShowPersonDetailModal(false);
                      handleOpenBalanceEdit(selectedPerson);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.detailActionButtonText}>Edit Balance</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.historyTitle}>Payment History</Text>
                <ScrollView style={styles.historyList}>
                  {paymentHistory.length === 0 ? (
                    <Text style={styles.emptyHistoryText}>No payment history</Text>
                  ) : (
                    paymentHistory.map((entry) => (
                      <View key={entry.id} style={styles.historyItem}>
                        <Text style={styles.historyDate}>
                          {new Date(entry.approvedAt).toLocaleDateString()}
                        </Text>
                        <Text style={styles.historyAmount}>₹{entry.amount}</Text>
                        <Text style={styles.historyBalance}>Balance: ₹{entry.newBalance}</Text>
                      </View>
                    ))
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={[styles.modalButton, styles.closeButton]}
                  onPress={() => setShowPersonDetailModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    fontFamily: theme.typography.display,
  },
  addButton: {
    backgroundColor: theme.colors.addButtonColor,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  addButtonText: {
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
  pendingCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
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
    marginBottom: theme.spacing.sm,
  },
  pendingAmounts: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  pendingLabel: {
    fontSize: 12,
    color: theme.colors.gray[600],
  },
  pendingType: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    ...theme.shadow.button,
  },
  approveButton: {
    backgroundColor: theme.colors.success,
  },
  approveButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: theme.colors.alert,
  },
  rejectButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  loginRequiredButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    backgroundColor: theme.colors.gray[200],
    ...theme.shadow.button,
  },
  loginRequiredButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  personCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadow.card,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  personPhone: {
    fontSize: 14,
    color: theme.colors.gray[500],
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 12,
    color: theme.colors.gray[500],
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    textAlign: 'center',
    padding: theme.spacing.lg,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.display,
  },
  paymentPersonName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  paymentCurrentBalance: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginBottom: theme.spacing.lg,
  },
  input: {
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    ...theme.shadow.button,
  },
  cancelButton: {
    backgroundColor: theme.colors.gray[200],
  },
  cancelButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.colors.addButtonColor,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  detailPhone: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginBottom: theme.spacing.md,
  },
  detailBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  detailBalanceLabel: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  detailBalanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  detailActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  detailActionButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    ...theme.shadow.button,
  },
  paymentButton: {
    backgroundColor: theme.colors.addButtonColor,
  },
  balanceEditButton: {
    backgroundColor: theme.colors.primary,
  },
  detailActionButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.display,
  },
  historyList: {
    maxHeight: 200,
    marginBottom: theme.spacing.lg,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    textAlign: 'center',
    padding: theme.spacing.lg,
  },
  historyItem: {
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  historyDate: {
    fontSize: 12,
    color: theme.colors.gray[500],
    marginBottom: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  historyBalance: {
    fontSize: 12,
    color: theme.colors.gray[600],
  },
  closeButton: {
    backgroundColor: theme.colors.gray[200],
  },
  closeButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  personCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personBalance: {
    fontSize: 14,
    color: theme.colors.gray[500],
  },
  deleteButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 20,
  },
  searchContainer: {
    margin: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    fontSize: 16,
    ...theme.shadow.card,
  },
  searchArrow: {
    fontSize: 24,
    color: theme.colors.gray[400],
    marginLeft: theme.spacing.md,
  },
});
