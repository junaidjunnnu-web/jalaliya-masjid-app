import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { api } from '../../lib/api';
import { PrayerTimes, CalculationMethod, Coordinates } from 'adhan';

export default function HomeScreen() {
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [nextPrayer, setNextPrayer] = useState<any>(null);

  useEffect(() => {
    loadHomeData();
    const interval = setInterval(() => {
      updateNextPrayer();
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const loadHomeData = async () => {
    // Load latest announcement
    const { data: announcements } = await api.announcements.getAll();
    if (announcements && announcements.length > 0) {
      setAnnouncement(announcements[0]);
    }

    // Load upcoming event
    const { data: events } = await api.events.getAll('upcoming=true');
    if (events && events.length > 0) {
      setEvent(events[0]);
    }

    updateNextPrayer();
  };

  const updateNextPrayer = async () => {
    // Try to get manual timings first
    const { data: timings } = await api.namaz.getTimings();
    
    if (timings) {
      setNextPrayer(calculateNextPrayerFromTimings(timings));
    } else {
      // Fallback to calculated times
      const calculated = calculatePrayerTimes(new Date());
      setNextPrayer(calculateNextPrayerFromTimings(calculated));
    }
  };

  const calculatePrayerTimes = (date: Date) => {
    // Kodagu, Karnataka coordinates: 12.42°N, 75.74°E
    const coordinates = new Coordinates(12.42, 75.74);
    const params = CalculationMethod.MuslimWorldLeague();
    
    const prayerTimes = new PrayerTimes(coordinates, date, params);
    
    const formatTime = (d: Date | null, minutesToAdd: number = 0): string => {
      if (!d) return '';
      const time = new Date(d.getTime() + minutesToAdd * 60000);
      return time.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    };
    
    return {
      fajrAzan: formatTime(prayerTimes.fajr),
      fajrIqamah: formatTime(prayerTimes.fajr, 20),
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

  const calculateNextPrayerFromTimings = (timings: any) => {
    const now = new Date();
    const prayers = [
      { name: 'Fajr', azan: timings.fajrAzan, iqamah: timings.fajrIqamah },
      { name: 'Zuhr', azan: timings.zuhrAzan, iqamah: timings.zuhrIqamah },
      { name: 'Asr', azan: timings.asrAzan, iqamah: timings.asrIqamah },
      { name: 'Maghrib', azan: timings.maghribAzan, iqamah: timings.maghriIqamah },
      { name: 'Isha', azan: timings.ishaAzan, iqamah: timings.ishaIqamah },
    ];

    const parseTime = (timeStr: string): Date | null => {
      if (!timeStr) return null;
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':');
      let h = parseInt(hours);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      const date = new Date();
      date.setHours(h, parseInt(minutes), 0, 0);
      return date;
    };

    let nextPrayer = null;
    for (const prayer of prayers) {
      const iqamahTime = parseTime(prayer.iqamah);
      if (iqamahTime && iqamahTime > now) {
        const diff = iqamahTime.getTime() - now.getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        return {
          name: prayer.name,
          time: prayer.iqamah,
          countdown: `${hours}h ${minutes}m`,
        };
      }
    }

    // If no prayer today, show Fajr tomorrow
    const fajrIqamah = parseTime(prayers[0].iqamah);
    if (fajrIqamah) {
      const tomorrow = new Date(fajrIqamah);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      return {
        name: 'Fajr',
        time: prayers[0].iqamah,
        countdown: `${hours}h ${minutes}m`,
      };
    }

    return null;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerTitle}>Jalaliya Juma Masjid</Text>
      </SafeAreaView>

      {/* Photo Banner Carousel */}
      <View style={styles.bannerContainer}>
        <View style={styles.bannerPlaceholder}>
          <Text style={styles.bannerText}>🕌</Text>
        </View>
      </View>

      {/* Next Prayer Countdown */}
      <View style={styles.prayerCard}>
        <View style={styles.prayerHeader}>
          <Text style={styles.prayerLabel}>Next Prayer</Text>
          <Text style={styles.prayerName}>{nextPrayer?.name || 'Loading...'}</Text>
        </View>
        <View style={styles.prayerTime}>
          <Text style={styles.prayerCountdown}>{nextPrayer?.countdown || '--:--'}</Text>
          <Text style={styles.prayerIqamah}>Iqamah: {nextPrayer?.time || '--:--'}</Text>
        </View>
        {/* Crescent Arc Progress Indicator - Placeholder */}
        <View style={styles.arcPlaceholder} />
      </View>

      {/* Latest Announcement */}
      {announcement && (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/more/announcements')}
          activeOpacity={0.7}
        >
          <Text style={styles.cardLabel}>Announcement</Text>
          <Text style={styles.cardTitle}>{announcement.title}</Text>
          <Text style={styles.cardPreview} numberOfLines={2}>
            {announcement.message}
          </Text>
        </TouchableOpacity>
      )}

      {/* Upcoming Event */}
      {event && (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/more/events')}
          activeOpacity={0.7}
        >
          <Text style={styles.cardLabel}>Upcoming Event</Text>
          <Text style={styles.cardTitle}>{event.title}</Text>
          <Text style={styles.cardDate}>
            {new Date(event.eventDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })} at {event.eventTime}
          </Text>
          {event.location && <Text style={styles.cardLocation}>📍 {event.location}</Text>}
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/more/broadcast')}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>📢 Broadcast</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/more/fees')}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>💰 Manage Fees</Text>
            </TouchableOpacity>
        </View>
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
    backgroundColor: theme.colors.membersAccent,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    fontFamily: theme.typography.display,
  },
  bannerContainer: {
    margin: theme.spacing.md,
  },
  bannerPlaceholder: {
    height: 180,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.card,
  },
  bannerText: {
    fontSize: 64,
  },
  prayerCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  prayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  prayerLabel: {
    fontSize: 14,
    color: theme.colors.gray[500],
    textTransform: 'uppercase',
  },
  prayerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontFamily: theme.typography.display,
  },
  prayerTime: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  prayerCountdown: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'] as any,
  },
  prayerIqamah: {
    fontSize: 16,
    color: theme.colors.gray[500],
    marginTop: theme.spacing.xs,
  },
  arcPlaceholder: {
    height: 8,
    backgroundColor: theme.colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  card: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  cardLabel: {
    fontSize: 12,
    color: theme.colors.gray[500],
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.display,
  },
  cardPreview: {
    fontSize: 14,
    color: theme.colors.gray[500],
    lineHeight: 20,
  },
  cardDate: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
    fontWeight: '600',
  },
  cardLocation: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginTop: theme.spacing.xs,
  },
  quickActions: {
    margin: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.display,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.membersAccent,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadow.button,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
