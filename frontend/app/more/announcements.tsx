import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../../theme';
import { api } from '../../lib/api';

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    const { data } = await api.announcements.getAll();
    if (data) {
      setAnnouncements(data);
    }
  };

  const openAddModal = () => {
    setFormData({ title: '', message: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    const { title, message } = formData;
    if (!title || !message) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.announcements.create({
        title: formData.title,
        message: formData.message,
      });
      if (error) {
        Alert.alert('Error', error);
      } else {
        await loadAnnouncements();
        setShowModal(false);
        Alert.alert('Success', 'Announcement created');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create announcement');
    }
    setLoading(false);
  };

  const handleDelete = (announcement: any) => {
    Alert.alert(
      'Delete Announcement',
      'Delete this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await api.announcements.delete(announcement.id);
            if (error) {
              Alert.alert('Error', error);
            } else {
              await loadAnnouncements();
              Alert.alert('Success', 'Announcement deleted');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Announcements</Text>
      </View>

      {/* Create Button */}
      <TouchableOpacity style={styles.createButton} onPress={openAddModal} activeOpacity={0.7}>
        <Text style={styles.createButtonText}>+ New Announcement</Text>
      </TouchableOpacity>

      {/* Announcements List */}
      <View style={styles.announcementsList}>
        {announcements.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No announcements yet</Text>
          </View>
        ) : (
          announcements.map((announcement) => (
            <View key={announcement.id} style={styles.announcementCard}>
              <View style={styles.announcementHeader}>
                <Text style={styles.announcementTitle}>{announcement.title}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(announcement)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.announcementDate}>
                {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Text style={styles.announcementMessage}>{announcement.message}</Text>
              {announcement.committeeMemberName && (
                <Text style={styles.announcementPostedBy}>
                  Posted by: {announcement.committeeMemberName}
                </Text>
              )}
            </View>
          ))
        )}
      </View>

      {/* Create Announcement Modal */}
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
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>New Announcement</Text>

                <Text style={styles.modalLabel}>Title *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter announcement title"
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                />

                <Text style={styles.modalLabel}>Message *</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  placeholder="Enter announcement message"
                  value={formData.message}
                  onChangeText={(text) => setFormData({ ...formData, message: text })}
                  multiline
                  numberOfLines={4}
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
                    {loading ? 'Creating...' : 'Create Announcement'}
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
  announcementsList: {
    padding: theme.spacing.md,
  },
  announcementCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.display,
  },
  announcementDate: {
    fontSize: 12,
    color: theme.colors.gray[500],
    marginBottom: theme.spacing.sm,
  },
  announcementMessage: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  announcementPostedBy: {
    fontSize: 12,
    color: theme.colors.gray[500],
    fontStyle: 'italic',
  },
  emptyState: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.gray[500],
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xl,
    width: '100%',
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
    height: 100,
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
