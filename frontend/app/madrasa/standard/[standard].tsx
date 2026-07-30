import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../../theme';
import { api } from '../../../lib/api';

export default function StandardScreen() {
  const router = useRouter();
  const { standard } = useLocalSearchParams();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pin, setPin] = useState('');
  const [verifiedUstad, setVerifiedUstad] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);

  useEffect(() => {
    loadStudents();
  }, [standard]);

  const loadStudents = async () => {
    const { data } = await api.madrasa.getStudents(`standard=${encodeURIComponent(standard as string)}`);
    if (data && Array.isArray(data)) {
      setStudents(data);
    }
  };

  const handleMarkAttendance = async (studentId: number, status: 'present' | 'absent') => {
    if (!verifiedUstad) {
      setShowPinModal(true);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.madrasa.markAttendance({
        studentId,
        date: selectedDate,
        status,
        ustadId: verifiedUstad.id,
      });
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', `Marked as ${status}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to mark attendance');
    }
    setLoading(false);
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }

    const { data } = await api.madrasa.verifyPin(pin);
    if (data && typeof data === 'object' && (data as any).valid) {
      setVerifiedUstad({ id: (data as any).ustadId, name: (data as any).ustadName });
      setShowPinModal(false);
      setPin('');
      Alert.alert('Success', `Verified as ${(data as any).ustadName}`);
    } else {
      Alert.alert('Error', 'Invalid PIN');
    }
  };

  const handleDeleteStudent = (student: any) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;

    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }

    setLoading(true);
    try {
      const { error } = await api.madrasa.deleteStudent(studentToDelete.id, pin);
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Student deleted');
        await loadStudents();
        setShowDeleteModal(false);
        setPin('');
        setStudentToDelete(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete student');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText} numberOfLines={1}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{standard}</Text>
      </SafeAreaView>

      {/* Date Picker */}
      <View style={styles.dateContainer}>
        <Text style={styles.dateLabel}>Select Date:</Text>
        <TextInput
          style={styles.dateInput}
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="YYYY-MM-DD"
        />
      </View>

      {/* Verified Ustad Status */}
      {verifiedUstad && (
        <View style={styles.verifiedBanner}>
          <Text style={styles.verifiedText}>Verified as: {verifiedUstad.name}</Text>
        </View>
      )}

      {/* Students List */}
      <View style={styles.studentsList}>
        {students.map((student) => (
          <View key={student.id} style={styles.studentCard}>
            <TouchableOpacity
              style={styles.studentInfo}
              onPress={() => router.push(`/madrasa/student/${student.id}`)}
            >
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{student.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentFather}>Father: {student.fatherName}</Text>
                <Text style={styles.studentPhone}>{student.fatherPhone}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.attendanceActions}>
              <TouchableOpacity
                style={[styles.attendanceButton, styles.presentButton]}
                onPress={() => handleMarkAttendance(student.id, 'present')}
                disabled={loading}
              >
                <Text style={styles.attendanceButtonText} numberOfLines={1}>Present</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.attendanceButton, styles.absentButton]}
                onPress={() => handleMarkAttendance(student.id, 'absent')}
                disabled={loading}
              >
                <Text style={styles.attendanceButtonText} numberOfLines={1}>Absent</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.attendanceButton, styles.deleteButton]}
                onPress={() => handleDeleteStudent(student)}
                disabled={loading}
              >
                <Text style={styles.attendanceButtonText} numberOfLines={1}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* PIN Modal */}
      <Modal
        visible={showPinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPinModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enter Ustad PIN</Text>
              <TextInput
                style={styles.pinInput}
                value={pin}
                onChangeText={setPin}
                placeholder="Enter 4-digit PIN"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => {
                    setShowPinModal(false);
                    setPin('');
                  }}
                >
                  <Text style={[styles.modalButtonText, styles.cancelModalButtonText]} numberOfLines={1}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveModalButton]}
                  onPress={handlePinSubmit}
                >
                  <Text style={[styles.modalButtonText, styles.saveModalButtonText]} numberOfLines={1}>Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Student</Text>
              {studentToDelete && (
                <Text style={styles.deleteConfirmText}>
                  Are you sure you want to delete {studentToDelete.name}?
                </Text>
              )}
              <Text style={styles.modalLabel}>Enter PIN to confirm:</Text>
              <TextInput
                style={styles.pinInput}
                value={pin}
                onChangeText={setPin}
                placeholder="Enter 4-digit PIN"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => {
                    setShowDeleteModal(false);
                    setPin('');
                    setStudentToDelete(null);
                  }}
                >
                  <Text style={[styles.modalButtonText, styles.cancelModalButtonText]} numberOfLines={1}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteModalButton, loading && styles.modalButtonDisabled]}
                  onPress={handleConfirmDelete}
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.white,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    fontFamily: theme.typography.display,
  },
  dateContainer: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    borderRadius: theme.radius.card,
    ...theme.shadow.card,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginRight: theme.spacing.md,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  verifiedBanner: {
    backgroundColor: theme.colors.success,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.card,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '600',
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
  studentFather: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginBottom: 2,
  },
  studentPhone: {
    fontSize: 12,
    color: theme.colors.gray[400],
  },
  attendanceActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  attendanceButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    minWidth: 70,
    alignItems: 'center',
  },
  presentButton: {
    backgroundColor: theme.colors.success,
  },
  absentButton: {
    backgroundColor: theme.colors.alert,
  },
  deleteButton: {
    backgroundColor: theme.colors.cancelButton,
  },
  attendanceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.white,
    flexShrink: 0,
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
    ...theme.shadow.card,
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
  pinInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    fontSize: 20,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    textAlign: 'center',
    letterSpacing: 8,
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
    minWidth: 80,
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
