import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Modal, Linking } from 'react-native';
import { theme } from '../../theme';

export default function SettingsScreen() {
  const [showContactModal, setShowContactModal] = useState(false);

  const handleCallSupport = () => {
    Linking.openURL('tel:8951627414');
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
      onPress: () => setShowContactModal(true),
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

      {/* Contact Support Modal */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Contact Support</Text>
            
            <View style={styles.contactSection}>
              <Text style={styles.greetingText}>
                Assalamu Alaikum! This app was built and is maintained by me for our Masjid community.
              </Text>
              
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Name:</Text>
                <Text style={styles.contactValue}>Mohammad Junaid CR</Text>
              </View>
              
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone:</Text>
                <Text style={styles.contactValue}>8951627414</Text>
              </View>
              
              <Text style={styles.closingText}>
                For any queries, issues, or suggestions regarding this app, please feel free to call me anytime.
              </Text>
            </View>

            <TouchableOpacity style={styles.callButton} onPress={handleCallSupport}>
              <Text style={styles.callButtonText}>Call Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowContactModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Jalaliya Juma Masjid Somwarpet App</Text>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xl,
    width: '100%',
    ...theme.shadow.card,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.display,
  },
  contactSection: {
    marginBottom: theme.spacing.lg,
  },
  greetingText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  contactInfo: {
    marginBottom: theme.spacing.md,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  contactValue: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  closingText: {
    fontSize: 14,
    color: theme.colors.gray[600],
    marginTop: theme.spacing.lg,
    lineHeight: 20,
  },
  callButton: {
    backgroundColor: theme.colors.saveButton,
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadow.button,
  },
  callButtonText: {
    color: theme.colors.saveButtonText,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: theme.colors.gray[600],
    fontSize: 14,
    fontWeight: '600',
  },
});
