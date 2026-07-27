import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [nextPrayer, setNextPrayer] = useState<any>(null);

  useEffect(() => {
    loadHomeData();
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

    // Load namaz timings for next prayer
    const { data: timings } = await api.namaz.getTimings();
    if (timings) {
      setNextPrayer(calculateNextPrayer(timings));
    }
  };

  const calculateNextPrayer = (timings: any) => {
    // Placeholder logic - will implement actual prayer time calculation
    return {
      name: 'Maghrib',
      time: timings.maghribIqamah,
      countdown: '2h 15m',
    };
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jalaliya Juma Masjid</Text>
      </View>

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

      {/* Quick Actions for Committee */}
      {user?.role === 'committee' && (
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/more/broadcast')}
          >
            <Text style={styles.actionButtonText}>📢 Broadcast</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/more/fees')}
          >
            <Text style={styles.actionButtonText}>💰 Manage Fees</Text>
          </TouchableOpacity>
        </View>
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
  actionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.accent,
    ...theme.shadow.button,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
