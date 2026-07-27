import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function MadrasaScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');

  useEffect(() => {
    loadStudents();
  }, [selectedClass]);

  const loadStudents = async () => {
    const params = selectedClass !== 'all' ? `classLevel=${selectedClass}` : '';
    const { data } = await api.madrasa.getStudents(params);
    if (data) {
      setStudents(data);
    }
  };

  const classLevels = ['all', 'Hifz', 'Qaida', 'Nazra', 'Islamic Studies'];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Madrasa</Text>
      </View>

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
          <TouchableOpacity
            key={student.id}
            style={styles.studentCard}
            onPress={() => router.push(`/madrasa/student/${student.id}`)}
          >
            <View style={styles.studentInfo}>
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
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Student Button - Committee/Ustad Only */}
      {(user?.role === 'committee' || user?.committeeMemberId) && (
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Student</Text>
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
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.md,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.accent,
    ...theme.shadow.button,
  },
  addButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
