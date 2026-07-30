import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { api } from '../../lib/api';

const STANDARDS = [
  '1st Standard', '2nd Standard', '3rd Standard', '4th Standard', '5th Standard',
  '6th Standard', '7th Standard', '8th Standard', '9th Standard', '10th Standard'
];

export default function MadrasaScreen() {
  const router = useRouter();
  const [ustads, setUstads] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showUstadEditModal, setShowUstadEditModal] = useState(false);
  const [showUstadAddModal, setShowUstadAddModal] = useState(false);
  const [showUstadDeleteModal, setShowUstadDeleteModal] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<string | null>(null);
  const [verifiedUstad, setVerifiedUstad] = useState<any>(null);
  const [selectedUstad, setSelectedUstad] = useState<any>(null);
  const [ustadToDelete, setUstadToDelete] = useState<any>(null);
  const [deletePin, setDeletePin] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    standard: '1st Standard',
    fatherName: '',
    fatherPhone: '',
  });
  const [ustadFormData, setUstadFormData] = useState({
    name: '',
    phone: '',
    pin: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUstads();
  }, []);

  const loadUstads = async () => {
    try {
      const response = await api.madrasa.getUstads();
      if (response.data) {
        setUstads(response.data);
      } else if (response.error) {
        console.error('Failed to load ustads:', response.error);
      }
    } catch (error) {
      console.error('Error loading ustads:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const response = await api.madrasa.searchStudents(query);
        if (response.data) {
          setSearchResults(response.data);
        } else if (response.error) {
          console.error('Failed to search students:', response.error);
        }
      } catch (error) {
        console.error('Error searching students:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const openStandard = (standard: string) => {
    setSelectedStandard(standard);
    router.push(`/madrasa/standard/${encodeURIComponent(standard)}`);
  };

  const openAddStudentModal = () => {
    setFormData({
      name: '',
      standard: '1st Standard',
      fatherName: '',
      fatherPhone: '',
    });
    setShowAddStudentModal(true);
  };

  const handleAddStudent = async () => {
    const { name, standard, fatherName, fatherPhone } = formData;
    if (!name || !standard || !fatherName || !fatherPhone) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.madrasa.createStudent({
        name,
        standard,
        fatherName,
        fatherPhone,
      });
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Student added successfully');
        setShowAddStudentModal(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add student');
    }
    setLoading(false);
  };

  const handlePinSubmit = async (pin: string) => {
    const { data } = await api.madrasa.verifyPin(pin);
    if (data && data.valid) {
      setVerifiedUstad({ id: data.ustadId, name: data.ustadName });
      setShowPinModal(false);
      Alert.alert('Success', `Verified as ${data.ustadName}`);
    } else {
      Alert.alert('Error', 'Invalid PIN');
    }
  };

  const openUstadEditModal = (ustad: any) => {
    setSelectedUstad(ustad);
    setUstadFormData({
      name: ustad.name,
      phone: ustad.phone || '',
      pin: '',
    });
    setShowUstadEditModal(true);
  };

  const openUstadAddModal = () => {
    setUstadFormData({
      name: '',
      phone: '',
      pin: '',
    });
    setShowUstadAddModal(true);
  };

  const handleUstadAdd = async () => {
    const { name, phone, pin } = ustadFormData;
    if (!name) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!pin) {
      Alert.alert('Error', 'PIN is required');
      return;
    }
    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.madrasa.createUstad({
        name,
        phone,
        pin,
      });
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Ustad added successfully');
        setShowUstadAddModal(false);
        await loadUstads();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add ustad');
    }
    setLoading(false);
  };

  const handleUstadEdit = async () => {
    const { name, phone, pin } = ustadFormData;
    if (!name) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!pin) {
      Alert.alert('Error', 'PIN is required for verification');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.madrasa.updateUstad(selectedUstad.id, {
        name,
        phone,
        pin,
      });
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Ustad updated successfully');
        setShowUstadEditModal(false);
        await loadUstads();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update ustad');
    }
    setLoading(false);
  };

  const handleDeleteUstad = (ustad: any) => {
    setUstadToDelete(ustad);
    setShowUstadDeleteModal(true);
  };

  const handleConfirmDeleteUstad = async () => {
    if (!ustadToDelete) return;

    if (deletePin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }

    setLoading(true);
    try {
      const { error } = await api.madrasa.deleteUstad(ustadToDelete.id, deletePin);
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Ustad deleted successfully');
        await loadUstads();
        setShowUstadDeleteModal(false);
        setDeletePin('');
        setUstadToDelete(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete ustad');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerTitle}>Madrasa</Text>
      </SafeAreaView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search students by name..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={theme.colors.gray[500]}
        />
      </View>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          {searchResults.map((student) => (
            <TouchableOpacity
              key={student.id}
              style={styles.studentCard}
              onPress={() => router.push(`/madrasa/student/${student.id}`)}
            >
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{student.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentStandard}>{student.standard}</Text>
                <Text style={styles.studentFather}>Father: {student.fatherName}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Ustad Cards */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ustads</Text>
          <TouchableOpacity style={styles.addUstadButton} onPress={openUstadAddModal}>
            <Text style={styles.addUstadButtonText}>+ Add Ustad</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ustadsContainer}>
          {ustads.map((ustad) => (
            <View key={ustad.id} style={styles.ustadCardWrapper}>
              <TouchableOpacity
                style={styles.ustadCard}
                onPress={() => openUstadEditModal(ustad)}
              >
                <View style={styles.ustadAvatar}>
                  <Text style={styles.ustadAvatarText}>{ustad.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.ustadName}>{ustad.name}</Text>
                {ustad.phone && <Text style={styles.ustadPhone}>{ustad.phone}</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ustadDeleteButton}
                onPress={() => handleDeleteUstad(ustad)}
              >
                <Text style={styles.ustadDeleteButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Standards List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Standards</Text>
        {STANDARDS.map((standard) => (
          <TouchableOpacity
            key={standard}
            style={styles.standardCard}
            onPress={() => openStandard(standard)}
          >
            <Text style={styles.standardText}>{standard}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Student Button */}
      <TouchableOpacity style={styles.addButton} onPress={openAddStudentModal}>
        <Text style={styles.addButtonText}>+ Add Student</Text>
      </TouchableOpacity>

      {/* Add Student Modal */}
      <Modal
        visible={showAddStudentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddStudentModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Add Student</Text>

                <Text style={styles.modalLabel}>Student Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter student name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />

                <Text style={styles.modalLabel}>Standard *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.standardContainer}>
                  {STANDARDS.map((std) => (
                    <TouchableOpacity
                      key={std}
                      style={[
                        styles.standardButton,
                        formData.standard === std && styles.standardButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, standard: std })}
                    >
                      <Text
                        style={[
                          styles.standardButtonText,
                          formData.standard === std && styles.standardButtonTextActive,
                        ]}
                      >
                        {std}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.modalLabel}>Father's Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter father's name"
                  value={formData.fatherName}
                  onChangeText={(text) => setFormData({ ...formData, fatherName: text })}
                />

                <Text style={styles.modalLabel}>Father's Phone *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter phone number"
                  value={formData.fatherPhone}
                  onChangeText={(text) => setFormData({ ...formData, fatherPhone: text })}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => setShowAddStudentModal(false)}
                >
                  <Text style={[styles.modalButtonText, styles.cancelModalButtonText]} numberOfLines={1}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveModalButton, loading && styles.modalButtonDisabled]}
                  onPress={handleAddStudent}
                  disabled={loading}
                >
                  <Text style={[styles.modalButtonText, styles.saveModalButtonText]} numberOfLines={1}>
                    {loading ? 'Adding...' : 'Add Student'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Ustad Edit Modal */}
      <Modal
        visible={showUstadEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUstadEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Edit Ustad</Text>

                <Text style={styles.modalLabel}>Ustad Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter ustad name"
                  value={ustadFormData.name}
                  onChangeText={(text) => setUstadFormData({ ...ustadFormData, name: text })}
                />

                <Text style={styles.modalLabel}>Phone Number</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter phone number"
                  value={ustadFormData.phone}
                  onChangeText={(text) => setUstadFormData({ ...ustadFormData, phone: text })}
                  keyboardType="phone-pad"
                  maxLength={15}
                />

                <Text style={styles.modalLabel}>PIN (for verification) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter 4-digit PIN"
                  value={ustadFormData.pin}
                  onChangeText={(text) => setUstadFormData({ ...ustadFormData, pin: text })}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => setShowUstadEditModal(false)}
                >
                  <Text style={[styles.modalButtonText, styles.cancelModalButtonText]} numberOfLines={1}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveModalButton, loading && styles.modalButtonDisabled]}
                  onPress={handleUstadEdit}
                  disabled={loading}
                >
                  <Text style={[styles.modalButtonText, styles.saveModalButtonText]} numberOfLines={1}>
                    {loading ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Ustad Modal */}
      <Modal
        visible={showUstadAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUstadAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Ustad</Text>

              <ScrollView style={styles.modalScrollView}>
                <Text style={styles.modalLabel}>Ustad Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter ustad name"
                  value={ustadFormData.name}
                  onChangeText={(text) => setUstadFormData({ ...ustadFormData, name: text })}
                />

                <Text style={styles.modalLabel}>Phone Number</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter phone number"
                  value={ustadFormData.phone}
                  onChangeText={(text) => setUstadFormData({ ...ustadFormData, phone: text })}
                  keyboardType="phone-pad"
                  maxLength={15}
                />

                <Text style={styles.modalLabel}>PIN (4 digits) *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter 4-digit PIN"
                  value={ustadFormData.pin}
                  onChangeText={(text) => setUstadFormData({ ...ustadFormData, pin: text })}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => setShowUstadAddModal(false)}
                >
                  <Text style={[styles.modalButtonText, styles.cancelModalButtonText]} numberOfLines={1}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveModalButton, loading && styles.modalButtonDisabled]}
                  onPress={handleUstadAdd}
                  disabled={loading}
                >
                  <Text style={[styles.modalButtonText, styles.saveModalButtonText]} numberOfLines={1}>
                    {loading ? 'Adding...' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Ustad Delete Confirmation Modal */}
      <Modal
        visible={showUstadDeleteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUstadDeleteModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Ustad</Text>
              {ustadToDelete && (
                <Text style={styles.deleteConfirmText}>
                  Are you sure you want to delete {ustadToDelete.name}?
                </Text>
              )}
              <Text style={styles.modalLabel}>Enter PIN to confirm:</Text>
              <TextInput
                style={styles.modalInput}
                value={deletePin}
                onChangeText={setDeletePin}
                placeholder="Enter 4-digit PIN"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => {
                    setShowUstadDeleteModal(false);
                    setDeletePin('');
                    setUstadToDelete(null);
                  }}
                >
                  <Text style={[styles.modalButtonText, styles.cancelModalButtonText]} numberOfLines={1}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteModalButton, loading && styles.modalButtonDisabled]}
                  onPress={handleConfirmDeleteUstad}
                  disabled={loading}
                >
                  <Text style={[styles.modalButtonText, styles.deleteModalButtonText]} numberOfLines={1}>
                    {loading ? 'Deleting...' : 'Delete'}
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
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    fontFamily: theme.typography.display,
  },
  searchContainer: {
    padding: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.display,
  },
  addUstadButton: {
    backgroundColor: theme.colors.saveButton,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.button,
    ...theme.shadow.button,
  },
  addUstadButtonText: {
    color: theme.colors.saveButtonText,
    fontSize: 14,
    fontWeight: '600',
  },
  ustadsContainer: {
    flexDirection: 'row',
  },
  ustadCard: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  ustadCardWrapper: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  ustadDeleteButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: theme.colors.cancelButton,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
    ...theme.shadow.button,
  },
  ustadDeleteButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  ustadAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  ustadAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  ustadName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  ustadPhone: {
    fontSize: 12,
    color: theme.colors.gray[500],
    marginTop: 2,
  },
  standardCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.card,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.card,
  },
  standardText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.card,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.card,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  studentStandard: {
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  studentFather: {
    fontSize: 12,
    color: theme.colors.gray[500],
  },
  addButton: {
    backgroundColor: theme.colors.addButtonColor,
    margin: theme.spacing.md,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadow.button,
  },
  addButtonText: {
    color: theme.colors.white,
    fontSize: 16,
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
  deleteConfirmText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
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
  standardContainer: {
    marginBottom: theme.spacing.md,
    flexGrow: 0,
  },
  standardButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    marginRight: theme.spacing.sm,
  },
  standardButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  standardButtonText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    fontWeight: '600',
  },
  standardButtonTextActive: {
    color: theme.colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    minHeight: 48,
    minWidth: 100,
  },
  cancelModalButton: {
    backgroundColor: theme.colors.cancelButton,
  },
  saveModalButton: {
    backgroundColor: theme.colors.saveButton,
    borderWidth: 2,
    borderColor: theme.colors.saveButton,
  },
  deleteModalButton: {
    backgroundColor: theme.colors.cancelButton,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flexShrink: 0,
  },
  saveModalButtonText: {
    color: theme.colors.saveButtonText,
  },
  cancelModalButtonText: {
    color: theme.colors.cancelButtonText,
  },
  deleteModalButtonText: {
    color: theme.colors.cancelButtonText,
  },
});
