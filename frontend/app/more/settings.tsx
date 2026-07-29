import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { theme } from '../../theme';
import { useAuth } from '../../lib/auth-context';

export default function SettingsScreen() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const settingsItems = [
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage push notifications',
      onPress: () => console.log('Notifications'),
    },
    {
      id: 'language',
      title: 'Language',
      description: 'English',
      onPress: () => console.log('Language'),
    },
    {
      id: 'about',
      title: 'About',
      description: 'App version 1.0.0',
      onPress: () => console.log('About'),
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      description: 'View privacy policy',
      onPress: () => console.log('Privacy'),
    },
    {
      id: 'contact',
      title: 'Contact Support',
      description: 'Get help with the app',
      onPress: () => console.log('Contact'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </SafeAreaView>

      <View style={styles.settingsList}>
        {settingsItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.settingItem}
            onPress={item.onPress}
          >
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingTitle}>{item.title}</Text>
              <Text style={styles.settingDescription}>{item.description}</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Jalaliya Juma Masjid App</Text>
        <Text style={styles.footerVersion}>Version 1.0.0</Text>
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
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    fontFamily: theme.typography.display,
  },
  settingsList: {
    margin: theme.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.card,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.card,
  },
  settingItemLeft: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: theme.colors.gray[500],
  },
  settingArrow: {
    fontSize: 24,
    color: theme.colors.gray[400],
  },
  logoutButton: {
    backgroundColor: theme.colors.alert,
    margin: theme.spacing.md,
    borderRadius: theme.radius.button,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadow.button,
  },
  logoutButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginBottom: theme.spacing.xs,
  },
  footerVersion: {
    fontSize: 12,
    color: theme.colors.gray[400],
  },
});
