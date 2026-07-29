import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { theme } from '../../theme';

export default function BroadcastScreen() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<string>('all');

  const templates = [
    {
      id: 'jumma',
      title: 'Jumma Reminder',
      message: `Assalamu Alaikum,

Reminder: Jumma prayer today at Jalaliya Juma Masjid.
Khutbah begins at [time]. Please arrive on time.

JazakAllah Khair
Jalaliya Juma Masjid Committee`,
    },
    {
      id: 'eid',
      title: 'Eid Greeting',
      message: `Assalamu Alaikum,

Eid Mubarak! 🌙
May Allah accept your prayers and bless you with happiness and prosperity.

Eid prayer at Jalaliya Juma Masjid: [time]

JazakAllah Khair
Jalaliya Juma Masjid Committee`,
    },
    {
      id: 'urgent',
      title: 'Urgent Notice',
      message: `Assalamu Alaikum,

URGENT NOTICE

[Enter your urgent message here]

JazakAllah Khair
Jalaliya Juma Masjid Committee`,
    },
  ];

  const places = [
    { id: 'all', name: 'All Places' },
    { id: '1', name: 'Ghandinagara' },
    { id: '2', name: 'Alekatte' },
    { id: '3', name: 'MD Block' },
    { id: '4', name: 'Ranger Block' },
    { id: '5', name: 'Near Manasa Hall' },
    { id: '6', name: 'Somwarpet Town' },
    { id: '7', name: 'Other' },
  ];

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setCustomMessage(template.message);
    }
  };

  const handleSendBroadcast = () => {
    // This will open WhatsApp share intent for each family head
    // The actual implementation will fetch family phone numbers and loop through them
    console.log('Sending broadcast:', customMessage, 'to place:', selectedPlace);
  };

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerTitle}>Broadcast</Text>
        <Text style={styles.headerSubtitle}>Send messages to families</Text>
      </SafeAreaView>

      {/* Template Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Template</Text>
        {templates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={[
              styles.templateCard,
              selectedTemplate === template.id && styles.templateCardActive,
            ]}
            onPress={() => handleTemplateSelect(template.id)}
          >
            <Text style={styles.templateTitle}>{template.title}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.templateCard,
            selectedTemplate === 'custom' && styles.templateCardActive,
          ]}
          onPress={() => {
            setSelectedTemplate('custom');
            setCustomMessage('');
          }}
        >
          <Text style={styles.templateTitle}>Custom Message</Text>
        </TouchableOpacity>
      </View>

      {/* Place Filter */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Filter by Place</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {places.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={[
                styles.placeButton,
                selectedPlace === place.id && styles.placeButtonActive,
              ]}
              onPress={() => setSelectedPlace(place.id)}
            >
              <Text
                style={[
                  styles.placeButtonText,
                  selectedPlace === place.id && styles.placeButtonTextActive,
                ]}
              >
                {place.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Message Editor */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Message</Text>
        <View style={styles.messageEditor}>
          <Text style={styles.messageText}>{customMessage}</Text>
        </View>
      </View>

      {/* Send Button */}
      <TouchableOpacity style={styles.sendButton} onPress={handleSendBroadcast}>
        <Text style={styles.sendButtonText}>Send Broadcast</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Note: This will open WhatsApp for each family head. You'll need to tap send 
          for each message (WhatsApp's anti-spam policy).
        </Text>
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
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.gray[500],
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.display,
  },
  templateCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.radius.card,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    ...theme.shadow.card,
  },
  templateCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  placeButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    marginRight: theme.spacing.sm,
  },
  placeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  placeButtonText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    fontWeight: '600',
  },
  placeButtonTextActive: {
    color: theme.colors.white,
  },
  messageEditor: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    minHeight: 150,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  messageText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.md,
    borderRadius: theme.radius.button,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadow.button,
  },
  sendButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: `${theme.colors.primary}20`,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.card,
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
});
