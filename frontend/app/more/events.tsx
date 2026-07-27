import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const { data } = await api.events.getAll();
    if (data) {
      setEvents(data);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
      </View>

      {/* Create Button - Committee Only */}
      {user?.role === 'committee' && (
        <TouchableOpacity style={styles.createButton}>
          <Text style={styles.createButtonText}>+ New Event</Text>
        </TouchableOpacity>
      )}

      {/* Events List */}
      <View style={styles.eventsList}>
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No events yet</Text>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={styles.eventMeta}>
                <Text style={styles.eventDate}>
                  📅 {new Date(event.eventDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.eventTime}>🕐 {event.eventTime}</Text>
              </View>
              {!!event.location && (
                <Text style={styles.eventLocation}>📍 {event.location}</Text>
              )}
              {!!event.description && (
                <Text style={styles.eventDescription}>{event.description}</Text>
              )}
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
  createButton: {
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.md,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.accent,
    ...theme.shadow.button,
  },
  createButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  eventsList: {
    padding: theme.spacing.md,
  },
  eventCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.display,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  eventDate: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  eventTime: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  eventLocation: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginBottom: theme.spacing.sm,
  },
  eventDescription: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  emptyState: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.gray[500],
  },
});
