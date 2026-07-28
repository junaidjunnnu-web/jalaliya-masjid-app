import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../../theme';
import { api } from '../../lib/api';

export default function EventsScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    eventDate: '',
    eventTime: '',
    location: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const { data } = await api.events.getAll();
    if (data) {
      setEvents(data);
    }
  };

  const openAddModal = () => {
    setEditingEvent(null);
    setFormData({ title: '', eventDate: '', eventTime: '', location: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      eventDate: event.eventDate,
      eventTime: event.eventTime,
      location: event.location || '',
      description: event.description || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const { title, eventDate, eventTime } = formData;
    if (!title || !eventDate || !eventTime) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      if (editingEvent) {
        const { data, error } = await api.events.update(editingEvent.id, {
          title: formData.title,
          eventDate: formData.eventDate,
          eventTime: formData.eventTime,
          location: formData.location,
          description: formData.description,
        });
        if (error) {
          Alert.alert('Error', error);
        }
      } else {
        const { data, error } = await api.events.create({
          title: formData.title,
          eventDate: formData.eventDate,
          eventTime: formData.eventTime,
          location: formData.location,
          description: formData.description,
        });
        if (error) {
          Alert.alert('Error', error);
        }
      }
      await loadEvents();
      setShowModal(false);
      Alert.alert('Success', editingEvent ? 'Event updated' : 'Event created');
    } catch (error) {
      Alert.alert('Error', 'Failed to save event');
    }
    setLoading(false);
  };

  const handleDelete = (event: any) => {
    Alert.alert(
      'Delete Event',
      `Delete ${event.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await api.events.delete(event.id);
            if (error) {
              Alert.alert('Error', error);
            } else {
              await loadEvents();
              Alert.alert('Success', 'Event deleted');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
      </View>

      {/* Create Button */}
      <TouchableOpacity style={styles.createButton} onPress={openAddModal} activeOpacity={0.7}>
        <Text style={styles.createButtonText}>+ New Event</Text>
      </TouchableOpacity>

      {/* Events List */}
      <View style={styles.eventsList}>
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No events yet</Text>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.eventActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(event)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(event)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
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

      {/* Add/Edit Event Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingEvent ? 'Edit Event' : 'New Event'}
              </Text>

              <Text style={styles.modalLabel}>Title *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter event title"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />

              <Text style={styles.modalLabel}>Date *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="YYYY-MM-DD"
                value={formData.eventDate}
                onChangeText={(text) => setFormData({ ...formData, eventDate: text })}
              />

              <Text style={styles.modalLabel}>Time *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., 14:30"
                value={formData.eventTime}
                onChangeText={(text) => setFormData({ ...formData, eventTime: text })}
              />

              <Text style={styles.modalLabel}>Location</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter location"
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
              />

              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="Enter event description"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton, loading && styles.modalButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Saving...' : 'Save Event'}
                </Text>
              </TouchableOpacity>
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  eventActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  editButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.gray[200],
  },
  editButtonText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.alert,
  },
  deleteButtonText: {
    fontSize: 12,
    color: theme.colors.white,
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
    flex: 1,
    marginBottom: theme.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    ...theme.shadow.button,
  },
  cancelModalButton: {
    backgroundColor: theme.colors.gray[300],
  },
  saveModalButton: {
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.display,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
