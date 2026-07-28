import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, Image } from 'react-native';
import { theme } from '../../theme';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import * as Linking from 'expo-linking';

export default function GalleryScreen() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    caption: '',
    category: 'Construction',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, [selectedCategory]);

  const loadPhotos = async () => {
    const params = selectedCategory !== 'all' ? `category=${selectedCategory}` : '';
    const { data } = await api.gallery.getAll(params);
    if (data) {
      setPhotos(data);
    }
  };

  const openUploadModal = () => {
    setUploadFormData({ caption: '', category: 'Construction' });
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    const { caption, category } = uploadFormData;
    if (!caption) {
      Alert.alert('Error', 'Please enter a caption');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.gallery.upload({
        caption: uploadFormData.caption,
        category: uploadFormData.category,
      });
      if (error) {
        Alert.alert('Error', error);
      } else {
        await loadPhotos();
        setShowUploadModal(false);
        Alert.alert('Success', 'Photo uploaded');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
    }
    setLoading(false);
  };

  const handleDelete = (photo: any) => {
    Alert.alert(
      'Delete Photo',
      'Delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await api.gallery.delete(photo.id);
            if (error) {
              Alert.alert('Error', error);
            } else {
              await loadPhotos();
              Alert.alert('Success', 'Photo deleted');
            }
          }
        }
      ]
    );
  };

  const handleShareToWhatsApp = (photo: any) => {
    const message = `Check out this photo from Jalaliya Madrasa: ${photo.caption}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'WhatsApp not installed');
    });
  };

  const categories = ['all', 'Construction', 'Events', 'Facilities'];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gallery</Text>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterButton,
              selectedCategory === category && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedCategory === category && styles.filterButtonTextActive,
              ]}
            >
              {category === 'all' ? 'All' : category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Upload Button - Committee Only */}
      {user?.role === 'committee' && (
        <TouchableOpacity style={styles.uploadButton} onPress={openUploadModal}>
          <Text style={styles.uploadButtonText}>+ Upload Photo</Text>
        </TouchableOpacity>
      )}

      {/* Photo Grid */}
      <View style={styles.photoGrid}>
        {photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No photos yet</Text>
          </View>
        ) : (
          photos.map((photo) => (
            <View key={photo.id} style={styles.photoCard}>
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>📷</Text>
              </View>
              {!!photo.caption && (
                <Text style={styles.photoCaption} numberOfLines={2}>
                  {photo.caption}
                </Text>
              )}
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => handleShareToWhatsApp(photo)}
                >
                  <Text style={styles.shareButtonText}>Share to WhatsApp</Text>
                </TouchableOpacity>
                {user?.role === 'committee' && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(photo)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Upload Photo Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Photo</Text>

            <Text style={styles.modalLabel}>Caption *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter photo caption"
              value={uploadFormData.caption}
              onChangeText={(text) => setUploadFormData({ ...uploadFormData, caption: text })}
            />

            <Text style={styles.modalLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
              {['Construction', 'Events', 'Facilities'].map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    uploadFormData.category === category && styles.categoryButtonActive,
                  ]}
                  onPress={() => setUploadFormData({ ...uploadFormData, category })}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      uploadFormData.category === category && styles.categoryButtonTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleUpload}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Uploading...' : 'Upload Photo'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowUploadModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  filterContainer: {
    padding: theme.spacing.md,
    flexGrow: 0,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    marginRight: theme.spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: theme.colors.white,
  },
  uploadButton: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.accent,
    ...theme.shadow.button,
  },
  uploadButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  photoGrid: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoCard: {
    width: '48%',
    margin: '1%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  photoPlaceholder: {
    height: 150,
    backgroundColor: theme.colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 40,
  },
  photoCaption: {
    padding: theme.spacing.sm,
    fontSize: 12,
    color: theme.colors.textPrimary,
  },
  shareButton: {
    backgroundColor: theme.colors.whatsapp,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  shareButtonText: {
    color: theme.colors.white,
    fontSize: 12,
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
  photoActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: theme.colors.alert,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.radius.button,
  },
  deleteButtonText: {
    color: theme.colors.white,
    fontSize: 12,
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
  categoryContainer: {
    marginBottom: theme.spacing.md,
    flexGrow: 0,
  },
  categoryButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    marginRight: theme.spacing.sm,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: theme.colors.white,
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
