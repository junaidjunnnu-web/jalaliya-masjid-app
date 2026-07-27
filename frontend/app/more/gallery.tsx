import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function GalleryScreen() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
        <TouchableOpacity style={styles.uploadButton}>
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
              <TouchableOpacity style={styles.shareButton}>
                <Text style={styles.shareButtonText}>Share to WhatsApp</Text>
              </TouchableOpacity>
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
});
