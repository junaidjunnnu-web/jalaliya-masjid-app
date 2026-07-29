import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { api } from '../../lib/api';

export default function MadrasaScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    guardianName: '',
    guardianPhone: '',
    familyId: '',
    classLevel: 'Qaida',
    ustadName: '',
    progressNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [families, setFamilies] = useState<any[]>([]);

  useEffect(() => {
    loadStudents();
    loadFamilies();
  }, [selectedClass]);

  const loadStudents = async () => {
    const params = selectedClass !== 'all' ? `classLevel=${selectedClass}` : '';
    const { data } = await api.madrasa.getStudents(params);
    if (data) {
      setStudents(data);
    }
  };

  const loadFamilies = async () => {
    const { data } = await api.families.getAll();
    if (data && Array.isArray(data)) {
      const allFamilies: any[] = [];
      data.forEach((pg: any) => {
        if (pg.families && Array.isArray(pg.families)) {
          allFamilies.push(...pg.families);
        }
      });
      setFamilies(allFamilies);
    }
  };

  const classLevels = ['all', 'Hifz', 'Qaida', 'Nazra', 'Islamic Studies'];

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      guardianName: '',
      guardianPhone: '',
      familyId: '',
      classLevel: 'Qaida',
      ustadName: '',
      progressNotes: '',
    });
    setShowModal(true);
  };

  const openEditModal = (student: any) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      familyId: student.familyId?.toString() || '',
      classLevel: student.classLevel,
      ustadName: student.ustadName || '',
      progressNotes: student.progressNotes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const { name, guardianName, guardianPhone, classLevel } = formData;
    if (!name || !guardianName || !guardianPhone || !classLevel) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      if (editingStudent) {
        const { data, error } = await api.madrasa.updateStudent(editingStudent.id, {
          name: formData.name,
          guardianName: formData.guardianName,
          guardianPhone: formData.guardianPhone,
          familyId: formData.familyId ? parseInt(formData.familyId) : null,
          classLevel: formData.classLevel,
          ustadName: formData.ustadName,
          progressNotes: formData.progressNotes,
        });
        if (error) {
          Alert.alert('Error', error);
        }
      } else {
        const { data, error } = await api.madrasa.createStudent({
          name: formData.name,
          guardianName: formData.guardianName,
          guardianPhone: formData.guardianPhone,
          familyId: formData.familyId ? parseInt(formData.familyId) : null,
          classLevel: formData.classLevel,
          ustadName: formData.ustadName,
          progressNotes: formData.progressNotes,
        });
        if (error) {
          Alert.alert('Error', error);
        }
      }
      await loadStudents();
      setShowModal(false);
      Alert.alert('Success', editingStudent ? 'Student updated' : 'Student added');
    } catch (error) {
      Alert.alert('Error', 'Failed to save student');
    }
    setLoading(false);
  };

  const handleDelete = (student: any) => {
    Alert.alert(
      'Delete Student',
      `Delete ${student.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await api.madrasa.deleteStudent(student.id);
            if (error) {
              Alert.alert('Error', error);
            } else {
              await loadStudents();
              Alert.alert('Success', 'Student deleted');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerTitle}>Madrasa</Text>
      </SafeAreaView>

      {/* Class Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {classLevels.map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.filterButton,
              selectedClass === level && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedClass(level)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedClass === level && styles.filterButtonTextActive,
              ]}
            >
              {level === 'all' ? 'All' : level}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Students List */}
      <View style={styles.studentsList}>
        {students.map((student) => (
          <View key={student.id} style={styles.studentCard}>
            <TouchableOpacity
              style={styles.studentInfo}
              onPress={() => router.push(`/madrasa/student/${student.id}`)}
            >
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {student.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentClass}>{student.classLevel}</Text>
                <Text style={styles.studentGuardian}>
                  Guardian: {student.guardianName}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.studentActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditModal(student)}
                activeOpacity={0.7}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(student)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Add Student Button */}
      <TouchableOpacity style={styles.addButton} onPress={openAddModal} activeOpacity={0.7}>
        <Text style={styles.addButtonText}>+ Add Student</Text>
      </TouchableOpacity>

      {/* Add/Edit Student Modal */}
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
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>
                  {editingStudent ? 'Edit Student' : 'Add Student'}
                </Text>

                <Text style={styles.modalLabel}>Student Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter student name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />

                <Text style={styles.modalLabel}>Guardian Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter guardian name"
                  value={formData.guardianName}
                  onChangeText={(text) => setFormData({ ...formData, guardianName: text })}
                />

                <Text style={styles.modalLabel}>Guardian Phone *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter phone number"
                  value={formData.guardianPhone}
                  onChangeText={(text) => setFormData({ ...formData, guardianPhone: text })}
                  keyboardType="phone-pad"
                  maxLength={15}
                />

                <Text style={styles.modalLabel}>Family (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.familiesContainer}>
                  <TouchableOpacity
                    style={[
                      styles.familyButton,
                      formData.familyId === '' && styles.familyButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, familyId: '' })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.familyButtonText,
                        formData.familyId === '' && styles.familyButtonTextActive,
                      ]}
                    >
                      None
                    </Text>
                  </TouchableOpacity>
                  {families.map((family) => (
                    <TouchableOpacity
                      key={family.id}
                      style={[
                        styles.familyButton,
                        formData.familyId === family.id.toString() && styles.familyButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, familyId: family.id.toString() })}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.familyButtonText,
                          formData.familyId === family.id.toString() && styles.familyButtonTextActive,
                        ]}
                      >
                        {family.headName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.modalLabel}>Class Level *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classContainer}>
                  {['Hifz', 'Qaida', 'Nazra', 'Islamic Studies'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.classButton,
                        formData.classLevel === level && styles.classButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, classLevel: level })}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.classButtonText,
                          formData.classLevel === level && styles.classButtonTextActive,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.modalLabel}>Ustad Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter ustad name"
                  value={formData.ustadName}
                  onChangeText={(text) => setFormData({ ...formData, ustadName: text })}
                />

                <Text style={styles.modalLabel}>Progress Notes</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  placeholder="Enter progress notes"
                  value={formData.progressNotes}
                  onChangeText={(text) => setFormData({ ...formData, progressNotes: text })}
                  multiline
                  numberOfLines={3}
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
  filterContainer: {
    padding: theme.spacing.md,
    flexGrow: 0,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    marginRight: theme.spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: theme.colors.white,
  },
  studentsList: {
    padding: theme.spacing.md,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.card,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  studentClass: {
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  studentGuardian: {
    fontSize: 12,
    color: theme.colors.gray[500],
  },
  arrow: {
    fontSize: 24,
    color: theme.colors.gray[400],
    marginLeft: theme.spacing.sm,
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
  studentActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  editButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.gray[200],
  },
  editButtonText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  familiesContainer: {
    marginBottom: theme.spacing.md,
    flexGrow: 0,
  },
  familyButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    marginRight: theme.spacing.sm,
  },
  familyButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  familyButtonText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    fontWeight: '600',
  },
  familyButtonTextActive: {
    color: theme.colors.white,
  },
  classContainer: {
    marginBottom: theme.spacing.md,
    flexGrow: 0,
  },
  classButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    marginRight: theme.spacing.sm,
  },
  classButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  classButtonText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    fontWeight: '600',
  },
  classButtonTextActive: {
    color: theme.colors.white,
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
  },
});
