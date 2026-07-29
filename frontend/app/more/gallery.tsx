import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, Image, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { theme } from '../../theme';
import { api } from '../../lib/api';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';

export default function GalleryScreen() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    caption: '',
    category: 'Construction',
    photoBase64: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    setUploadFormData({ caption: '', category: 'Construction', photoBase64: '' });
    setShowUploadModal(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setUploadFormData({ ...uploadFormData, photoBase64: result.assets[0].base64 || '' });
    }
  };

  const handleUpload = async () => {
    const { caption, category, photoBase64 } = uploadFormData;
    if (!caption) {
      Alert.alert('Error', 'Please enter a caption');
      return;
    }
    if (!photoBase64) {
      Alert.alert('Error', 'Please select a photo');
      return;
    }

    setUploading(true);
    try {
      const { data, error } = await api.gallery.upload({
        photoBase64,
        caption,
        category,
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
    setUploading(false);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerTitle}>Gallery</Text>
      </SafeAreaView>

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
            activeOpacity={0.7}
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

      {/* Upload Button */}
      <TouchableOpacity style={styles.uploadButton} onPress={openUploadModal} activeOpacity={0.7}>
        <Text style={styles.uploadButtonText}>+ Upload Photo</Text>
      </TouchableOpacity>

      {/* Photo Grid */}
      <View style={styles.photoGrid}>
        {photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No photos yet</Text>
          </View>
        ) : (
          photos.map((photo) => (
            <View key={photo.id} style={styles.photoCard}>
              {photo.photoUrl ? (
                <Image source={{ uri: photo.photoUrl }} style={styles.photoImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>📷</Text>
                </View>
              )}
              {!!photo.caption && (
                <Text style={styles.photoCaption} numberOfLines={2}>
                  {photo.caption}
                </Text>
              )}
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => handleShareToWhatsApp(photo)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.shareButtonText}>Share to WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(photo)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Upload Photo</Text>

              <TouchableOpacity style={styles.photoPickerButton} onPress={pickImage}>
                {uploadFormData.photoBase64 ? (
                  <Image source={{ uri: `data:image/jpeg;base64,${uploadFormData.photoBase64}` }} style={styles.previewImage} />
                ) : (
                  <View style={styles.photoPickerPlaceholder}>
                    <Text style={styles.photoPickerIcon}>📷</Text>
                    <Text style={styles.photoPickerText}>Tap to select photo</Text>
                  </View>
                )}
              </TouchableOpacity>

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
                    activeOpacity={0.7}
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
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowUploadModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton, uploading && styles.modalButtonDisabled]}
                onPress={handleUpload}
                disabled={uploading}
              >
                <Text style={styles.modalButtonText}>
                  {uploading ? 'Uploading...' : 'Upload Photo'}
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
    paddingTop: 60,
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
    backgroundColor: theme.colors.addButtonColor,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
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
  photoImage: {
    height: 150,
    width: '100%',
    resizeMode: 'cover',
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
    backgroundColor: theme.colors.galleryAccent,
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
  photoPickerButton: {
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.radius.card,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    borderStyle: 'dashed',
  },
  photoPickerPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  photoPickerIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  photoPickerText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
});
