import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../../theme';
import { api } from '../../lib/api';

export default function CollectionsScreen() {
  const [collections, setCollections] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Zakat',
    amount: '',
    donorName: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    const { data } = await api.collections.getAll();
    if (data) {
      setCollections(data);
    }
  };

  const openAddModal = () => {
    setFormData({ type: 'Zakat', amount: '', donorName: '', notes: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    const { type, amount, donorName } = formData;
    if (!amount || !donorName) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.collections.create({
        type: formData.type,
        amount: parseFloat(formData.amount),
        donorName: formData.donorName,
        notes: formData.notes,
      });
      if (error) {
        Alert.alert('Error', error);
      } else {
        await loadCollections();
        setShowModal(false);
        Alert.alert('Success', 'Collection added');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add collection');
    }
    setLoading(false);
  };

  const handleDelete = (collection: any) => {
    Alert.alert(
      'Delete Collection',
      `Delete this collection of ₹${collection.amount}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await api.collections.delete(collection.id);
            if (error) {
              Alert.alert('Error', error);
            } else {
              await loadCollections();
              Alert.alert('Success', 'Collection deleted');
            }
          }
        }
      ]
    );
  };

  const collectionTypes = ['Zakat', 'Sadaqah', 'Fitrah', 'General Fund'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collections</Text>
      </View>

      {/* Add Button */}
      <TouchableOpacity style={styles.createButton} onPress={openAddModal} activeOpacity={0.7}>
        <Text style={styles.createButtonText}>+ Add Collection</Text>
      </TouchableOpacity>

      {/* Collections List */}
      <View style={styles.collectionsList}>
        {collections.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No collections yet</Text>
          </View>
        ) : (
          collections.map((collection) => (
            <View key={collection.id} style={styles.collectionCard}>
              <View style={styles.collectionHeader}>
                <Text style={styles.collectionType}>{collection.type}</Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(collection)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.collectionAmount}>₹{collection.amount}</Text>
              <Text style={styles.collectionDonor}>Donor: {collection.donorName}</Text>
              {collection.notes && (
                <Text style={styles.collectionNotes}>{collection.notes}</Text>
              )}
              <Text style={styles.collectionDate}>
                {new Date(collection.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Add Collection Modal */}
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
                <Text style={styles.modalTitle}>Add Collection</Text>

                <Text style={styles.modalLabel}>Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeContainer}>
                  {collectionTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeButton,
                        formData.type === type && styles.typeButtonActive,
                      ]}
                      onPress={() => setFormData({ ...formData, type })}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          formData.type === type && styles.typeButtonTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.modalLabel}>Amount *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  keyboardType="numeric"
                />

                <Text style={styles.modalLabel}>Donor Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter donor name"
                  value={formData.donorName}
                  onChangeText={(text) => setFormData({ ...formData, donorName: text })}
                />

                <Text style={styles.modalLabel}>Notes</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  placeholder="Enter notes"
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
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
                    {loading ? 'Adding...' : 'Add Collection'}
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
    backgroundColor: theme.colors.feesAccent,
    margin: theme.spacing.md,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadow.button,
  },
  createButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  collectionsList: {
    padding: theme.spacing.md,
  },
  collectionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  collectionType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.display,
  },
  collectionAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  collectionDonor: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginBottom: theme.spacing.xs,
  },
  collectionNotes: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    fontStyle: 'italic',
  },
  collectionDate: {
    fontSize: 12,
    color: theme.colors.gray[400],
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
  emptyState: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.gray[500],
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
    backgroundColor: theme.colors.feesAccent,
    borderWidth: 2,
    borderColor: theme.colors.primary,
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
  typeContainer: {
    marginBottom: theme.spacing.md,
    flexGrow: 0,
  },
  typeButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    marginRight: theme.spacing.sm,
  },
  typeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: theme.colors.white,
  },
  saveButton: {
    backgroundColor: theme.colors.feesAccent,
    borderRadius: theme.radius.button,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
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
