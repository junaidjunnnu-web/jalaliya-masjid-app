import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { theme } from '../../theme';
import { api } from '../../lib/api';
import { PrayerTimes, CalculationMethod, Coordinates } from 'adhan';

export default function NamazScreen() {
  const [timings, setTimings] = useState<any>(null);
  const [calculatedTimings, setCalculatedTimings] = useState<any>(null);
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
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadTimings();
  }, []);

  const calculatePrayerTimes = (date: Date) => {
    // Kodagu, Karnataka coordinates: 12.42°N, 75.74°E
    const coordinates = new Coordinates(12.42, 75.74);
    const params = CalculationMethod.MuslimWorldLeague();
    
    const prayerTimes = new PrayerTimes(coordinates, date, params);
    
    return {
      fajrAzan: formatTime(prayerTimes.fajr),
      fajrIqamah: formatTime(prayerTimes.fajr, 20),
      sunrise: formatTime(prayerTimes.sunrise),
      zuhrAzan: formatTime(prayerTimes.dhuhr),
      zuhrIqamah: formatTime(prayerTimes.dhuhr, 15),
      asrAzan: formatTime(prayerTimes.asr),
      asrIqamah: formatTime(prayerTimes.asr, 20),
      maghribAzan: formatTime(prayerTimes.maghrib),
      maghribIqamah: formatTime(prayerTimes.maghrib, 10),
      ishaAzan: formatTime(prayerTimes.isha),
      ishaIqamah: formatTime(prayerTimes.isha, 20),
    };
  };

  const formatTime = (date: Date | null, minutesToAdd: number = 0): string => {
    if (!date) return '';
    const time = new Date(date.getTime() + minutesToAdd * 60000);
    return time.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const loadTimings = async () => {
    try {
      const response = await api.namaz.getTimings();
      if (response.data) {
        setTimings(response.data);
      } else {
        // Fallback to calculated times if no manual override exists
        const calculated = calculatePrayerTimes(new Date());
        setCalculatedTimings(calculated);
      }
    } catch (error) {
      console.error('Error loading timings:', error);
      // Fallback to calculated times on error
      const calculated = calculatePrayerTimes(new Date());
      setCalculatedTimings(calculated);
    }
    
    // Check if current date is during Ramadan
    const today = new Date();
    // Placeholder - will implement actual Hijri date check
    setIsRamadan(false);
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
      const { data, error } = await api.namaz.updateTimings(timings.id, editFormData);
      if (error) {
        Alert.alert('Error', error);
      } else if (data) {
        await loadTimings();
        setShowEditModal(false);
        Alert.alert('Success', 'Prayer times updated');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update prayer times');
    }
    setLoading(false);
  };

  if (!timings && !calculatedTimings) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading prayer times...</Text>
      </View>
    );
  }

  const displayTimings = timings || calculatedTimings;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerTitle}>Prayer Times</Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </SafeAreaView>

      {/* Daily Prayers */}
      <View style={styles.section}>
        {prayers.map((prayer) => (
          <View key={prayer.key} style={styles.prayerRow}>
            <Text style={styles.prayerLabel}>{prayer.label}</Text>
            <View style={styles.prayerTimes}>
              <Text style={styles.prayerTime}>
                {displayTimings[`${prayer.key}Azan`]}
              </Text>
              <Text style={styles.iqamahTime}>
                Iqamah: {displayTimings[`${prayer.key}Iqamah`]}
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
          <Text style={styles.jummaTime}>{displayTimings.jummaKhutbahTime}</Text>
        </View>
      </View>

      {/* Ramadan Section */}
      {isRamadan && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ramadan Timings</Text>
          {displayTimings.sehriTime && (
            <View style={styles.ramadanRow}>
              <Text style={styles.ramadanLabel}>Sehri</Text>
              <Text style={styles.ramadanTime}>{displayTimings.sehriTime}</Text>
            </View>
          )}
          {displayTimings.iftarTime && (
            <View style={styles.ramadanRow}>
              <Text style={styles.ramadanLabel}>Iftar</Text>
              <Text style={styles.ramadanTime}>{displayTimings.iftarTime}</Text>
            </View>
          )}
        </View>
      )}

      {/* Edit Button */}
      <TouchableOpacity style={styles.editButton} onPress={openEditModal} activeOpacity={0.7}>
        <Text style={styles.editButtonText}>Edit Timings</Text>
      </TouchableOpacity>

      {/* Edit Timings Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
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
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={[styles.modalButtonText, styles.cancelModalButtonText]} numberOfLines={1}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveModalButton, loading && styles.modalButtonDisabled]}
                  onPress={handleSaveTimings}
                  disabled={loading}
                >
                  <Text style={[styles.modalButtonText, styles.saveModalButtonText]} numberOfLines={1}>
                    {loading ? 'Saving...' : 'Save Timings'}
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
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    fontFamily: theme.typography.display,
  },
  dateText: {
    fontSize: 14,
    color: theme.colors.gray[500],
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
    color: theme.colors.primary,
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
    backgroundColor: theme.colors.editButton,
    margin: theme.spacing.md,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadow.button,
  },
  editButtonText: {
    color: theme.colors.editButtonText,
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
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
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
    borderColor: theme.colors.primary,
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
