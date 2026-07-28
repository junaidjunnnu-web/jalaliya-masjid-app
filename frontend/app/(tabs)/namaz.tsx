import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { theme } from '../../theme';
import { api } from '../../lib/api';

export default function NamazScreen() {
  const [timings, setTimings] = useState<any>(null);
  const [isRamadan, setIsRamadan] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fajrAzan: '',
    fajrIqamah: '',
    zuhrAzan: '',
    zuhrIqamah: '',
    asrAzan: '',
    asrIqamah: '',
    maghribAzan: '',
    maghribIqamah: '',
    ishaAzan: '',
    ishaIqamah: '',
    jummaKhutbahTime: '',
    sehriTime: '',
    iftarTime: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTimings();
  }, []);

  const loadTimings = async () => {
    const { data } = await api.namaz.getTimings();
    if (data) {
      setTimings(data);
      // Check if current date is during Ramadan
      const today = new Date();
      // Placeholder - will implement actual Hijri date check
      setIsRamadan(false);
    }
  };

  const prayers = [
    { key: 'fajr', label: 'Fajr' },
    { key: 'zuhr', label: 'Zuhr' },
    { key: 'asr', label: 'Asr' },
    { key: 'maghrib', label: 'Maghrib' },
    { key: 'isha', label: 'Isha' },
  ];

  const openEditModal = () => {
    if (!timings) return;
    setEditFormData({
      fajrAzan: timings.fajrAzan || '',
      fajrIqamah: timings.fajrIqamah || '',
      zuhrAzan: timings.zuhrAzan || '',
      zuhrIqamah: timings.zuhrIqamah || '',
      asrAzan: timings.asrAzan || '',
      asrIqamah: timings.asrIqamah || '',
      maghribAzan: timings.maghribAzan || '',
      maghribIqamah: timings.maghribIqamah || '',
      ishaAzan: timings.ishaAzan || '',
      ishaIqamah: timings.ishaIqamah || '',
      jummaKhutbahTime: timings.jummaKhutbahTime || '',
      sehriTime: timings.sehriTime || '',
      iftarTime: timings.iftarTime || '',
    });
    setShowEditModal(true);
  };

  const handleSaveTimings = async () => {
    setLoading(true);
    try {
      const effectiveFrom = Date.now();
      const { data, error } = await api.namaz.updateTimings(effectiveFrom, editFormData);
      if (error) {
        Alert.alert('Error', error);
      } else {
        await loadTimings();
        setShowEditModal(false);
        Alert.alert('Success', 'Prayer times updated');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update prayer times');
    }
    setLoading(false);
  };

  if (!timings) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading prayer times...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Prayer Times</Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Daily Prayers */}
      <View style={styles.section}>
        {prayers.map((prayer) => (
          <View key={prayer.key} style={styles.prayerRow}>
            <Text style={styles.prayerLabel}>{prayer.label}</Text>
            <View style={styles.prayerTimes}>
              <Text style={styles.prayerTime}>
                {timings[`${prayer.key}Azan`]}
              </Text>
              <Text style={styles.iqamahTime}>
                Iqamah: {timings[`${prayer.key}Iqamah`]}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Jumma */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Jumma Prayer</Text>
        <View style={styles.jummaRow}>
          <Text style={styles.jummaLabel}>Khutbah Time</Text>
          <Text style={styles.jummaTime}>{timings.jummaKhutbahTime}</Text>
        </View>
      </View>

      {/* Ramadan Section */}
      {isRamadan && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ramadan Timings</Text>
          {timings.sehriTime && (
            <View style={styles.ramadanRow}>
              <Text style={styles.ramadanLabel}>Sehri</Text>
              <Text style={styles.ramadanTime}>{timings.sehriTime}</Text>
            </View>
          )}
          {timings.iftarTime && (
            <View style={styles.ramadanRow}>
              <Text style={styles.ramadanLabel}>Iftar</Text>
              <Text style={styles.ramadanTime}>{timings.iftarTime}</Text>
            </View>
          )}
        </View>
      )}

      {/* Edit Button */}
      <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
        <Text style={styles.editButtonText}>Edit Timings</Text>
      </TouchableOpacity>

      {/* Edit Timings Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <ScrollView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Prayer Times</Text>

            {prayers.map((prayer) => (
              <View key={prayer.key} style={styles.prayerEditRow}>
                <Text style={styles.prayerEditLabel}>{prayer.label}</Text>
                <View style={styles.timeInputs}>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="Azan"
                    value={editFormData[`${prayer.key}Azan` as keyof typeof editFormData]}
                    onChangeText={(text) => setEditFormData({ ...editFormData, [`${prayer.key}Azan`]: text })}
                  />
                  <TextInput
                    style={styles.timeInput}
                    placeholder="Iqamah"
                    value={editFormData[`${prayer.key}Iqamah` as keyof typeof editFormData]}
                    onChangeText={(text) => setEditFormData({ ...editFormData, [`${prayer.key}Iqamah`]: text })}
                  />
                </View>
              </View>
            ))}

            <Text style={styles.modalLabel}>Jumma Khutbah Time</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., 13:30"
              value={editFormData.jummaKhutbahTime}
              onChangeText={(text) => setEditFormData({ ...editFormData, jummaKhutbahTime: text })}
            />

            <Text style={styles.modalLabel}>Sehri Time (Ramadan)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., 04:30"
              value={editFormData.sehriTime}
              onChangeText={(text) => setEditFormData({ ...editFormData, sehriTime: text })}
            />

            <Text style={styles.modalLabel}>Iftar Time (Ramadan)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., 18:45"
              value={editFormData.iftarTime}
              onChangeText={(text) => setEditFormData({ ...editFormData, iftarTime: text })}
            />

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSaveTimings}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Timings'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
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
  dateText: {
    fontSize: 14,
    color: theme.colors.accent,
    marginTop: theme.spacing.xs,
  },
  section: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.display,
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  prayerLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    width: 80,
  },
  prayerTimes: {
    alignItems: 'flex-end',
  },
  prayerTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontVariant: ['tabular-nums'] as any,
  },
  iqamahTime: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginTop: 2,
  },
  jummaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jummaLabel: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  jummaTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.accent,
    fontVariant: ['tabular-nums'] as any,
  },
  ramadanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  ramadanLabel: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  ramadanTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.alert,
    fontVariant: ['tabular-nums'] as any,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.md,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadow.button,
  },
  editButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.xl,
    marginTop: theme.spacing.xl * 2,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xl,
    ...theme.shadow.card,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.display,
  },
  prayerEditRow: {
    marginBottom: theme.spacing.md,
  },
  prayerEditLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  timeInputs: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  timeInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
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
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    ...theme.shadow.button,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.gray[500],
    fontSize: 14,
    fontWeight: '600',
  },
});
