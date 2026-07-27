import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function NamazScreen() {
  const { user } = useAuth();
  const [timings, setTimings] = useState<any>(null);
  const [isRamadan, setIsRamadan] = useState(false);

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

      {/* Edit Button for Committee */}
      {user?.role === 'committee' && (
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Timings</Text>
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
});
