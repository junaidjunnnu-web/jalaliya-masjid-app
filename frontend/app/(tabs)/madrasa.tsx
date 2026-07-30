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
  const [selectedStandard, setSelectedStandard] = useState<string | null>(null);
  const [verifiedUstad, setVerifiedUstad] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    standard: '1st Standard',
    fatherName: '',
    fatherPhone: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUstads();
  }, []);

  const loadUstads = async () => {
    const { data } = await api.madrasa.getUstads();
    if (data) {
      setUstads(data);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const { data } = await api.madrasa.searchStudents(query);
      if (data) {
        setSearchResults(data);
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
        <Text style={styles.sectionTitle}>Ustads</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ustadsContainer}>
          {ustads.map((ustad) => (
            <View key={ustad.id} style={styles.ustadCard}>
              <View style={styles.ustadAvatar}>
                <Text style={styles.ustadAvatarText}>{ustad.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.ustadName}>{ustad.name}</Text>
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
                  <Text style={styles.modalButtonText} numberOfLines={1}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveModalButton, loading && styles.modalButtonDisabled]}
                  onPress={handleAddStudent}
                  disabled={loading}
                >
                  <Text style={styles.modalButtonText} numberOfLines={1}>
                    {loading ? 'Adding...' : 'Add Student'}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.display,
  },
  ustadsContainer: {
    flexDirection: 'row',
  },
  ustadCard: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
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
  },
  cancelModalButton: {
    backgroundColor: theme.colors.gray[200],
  },
  saveModalButton: {
    backgroundColor: theme.colors.primary,
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
    flexShrink: 0,
  },
});
