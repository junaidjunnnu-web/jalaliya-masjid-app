import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../../theme';
import { api } from '../../../lib/api';

export default function StudentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [student, setStudent] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudent();
  }, [id]);

  const loadStudent = async () => {
    setLoading(true);
    const { data } = await api.madrasa.getStudent(Number(id));
    if (data && typeof data === 'object') {
      setStudent((data as any).student);
      setAttendance((data as any).attendance);
      setAttendanceSummary((data as any).attendanceSummary);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student not found</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Details</Text>
      </SafeAreaView>

      {/* Student Info Card */}
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{student.name.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.studentName}>{student.name}</Text>
        <Text style={styles.studentStandard}>{student.standard}</Text>
      </View>

      {/* Father Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Father's Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{student.fatherName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{student.fatherPhone}</Text>
        </View>
      </View>

      {/* Attendance Summary */}
      {attendanceSummary && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Attendance Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Month:</Text>
            <Text style={styles.summaryValue}>{attendanceSummary.month}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Present:</Text>
            <Text style={styles.summaryValue}>{attendanceSummary.present} days</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total:</Text>
            <Text style={styles.summaryValue}>{attendanceSummary.total} days</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Percentage:</Text>
            <Text style={styles.summaryValue}>
              {attendanceSummary.total > 0 
                ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100) 
                : 0}%
            </Text>
          </View>
        </View>
      )}

      {/* Attendance History */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Attendance History</Text>
        {attendance.length === 0 ? (
          <Text style={styles.noData}>No attendance records</Text>
        ) : (
          attendance.map((record) => (
            <View key={record.id} style={styles.attendanceRecord}>
              <Text style={styles.attendanceDate}>{record.date}</Text>
              <View style={[
                styles.statusBadge,
                record.status === 'present' ? styles.presentBadge : styles.absentBadge
              ]}>
                <Text style={[
                  styles.statusText,
                  record.status === 'present' ? styles.presentText : styles.absentText
                ]}>
                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </Text>
              </View>
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
  card: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.card,
    ...theme.shadow.card,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.display,
  },
  studentStandard: {
    fontSize: 16,
    color: theme.colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.display,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.gray[500],
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  summaryLabel: {
    fontSize: 16,
    color: theme.colors.gray[500],
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  noData: {
    fontSize: 14,
    color: theme.colors.gray[500],
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
  },
  attendanceRecord: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  attendanceDate: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
  },
  presentBadge: {
    backgroundColor: theme.colors.success,
  },
  absentBadge: {
    backgroundColor: theme.colors.alert,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  presentText: {
    color: theme.colors.white,
  },
  absentText: {
    color: theme.colors.white,
  },
});
