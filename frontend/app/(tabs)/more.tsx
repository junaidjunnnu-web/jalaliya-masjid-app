import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { useAuth } from '../../lib/auth-context';

export default function MoreScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const menuItems = [
    {
      id: 'gallery',
      title: 'Gallery',
      icon: '📷',
      description: 'Photos of events and facilities',
      onPress: () => router.push('/more/gallery'),
    },
    {
      id: 'announcements',
      title: 'Announcements',
      icon: '📢',
      description: 'Latest masjid announcements',
      onPress: () => router.push('/more/announcements'),
    },
    {
      id: 'events',
      title: 'Events',
      icon: '📅',
      description: 'Upcoming and past events',
      onPress: () => router.push('/more/events'),
    },
    {
      id: 'fees',
      title: 'Monthly Fees',
      icon: '💰',
      description: 'View fee status and history',
      onPress: () => router.push('/more/fees'),
    },
    ...(user?.role === 'committee'
      ? [
          {
            id: 'broadcast',
            title: 'Broadcast',
            icon: '📨',
            description: 'Send messages to families',
            onPress: () => router.push('/more/broadcast'),
          },
          {
            id: 'collections',
            title: 'Collections',
            icon: '🕌',
            description: 'Zakat, Sadaqah, and other collections',
            onPress: () => router.push('/more/collections'),
          },
          {
            id: 'expenses',
            title: 'Expenses',
            icon: '📊',
            description: 'Track masjid expenses',
            onPress: () => router.push('/more/expenses'),
          },
        ]
      : []),
    {
      id: 'profile',
      title: 'My Profile',
      icon: '👤',
      description: 'Edit your family information',
      onPress: () => router.push('/more/profile'),
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: '⚙️',
      description: 'App settings and preferences',
      onPress: () => router.push('/more/settings'),
    },
    {
      id: 'debug',
      title: 'Debug Info',
      icon: '🔍',
      description: 'View current user and session info',
      onPress: () => router.push('/more/debug'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <View style={styles.menuList}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuItemText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
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
  menuList: {
    padding: theme.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.card,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.card,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  menuItemText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 12,
    color: theme.colors.gray[500],
  },
  menuArrow: {
    fontSize: 24,
    color: theme.colors.gray[400],
  },
});
