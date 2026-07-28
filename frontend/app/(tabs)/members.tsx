import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { api } from '../../lib/api';

export default function MembersScreen() {
  const router = useRouter();
  const [familiesByPlace, setFamiliesByPlace] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPlaces, setExpandedPlaces] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFamilies();
  }, [searchQuery]);

  const loadFamilies = async () => {
    const params = searchQuery ? `search=${searchQuery}` : '';
    const { data } = await api.families.getAll(params);
    if (data) {
      setFamiliesByPlace(data);
    }
  };

  const togglePlace = (placeName: string) => {
    const newExpanded = new Set(expandedPlaces);
    if (newExpanded.has(placeName)) {
      newExpanded.delete(placeName);
    } else {
      newExpanded.add(placeName);
    }
    setExpandedPlaces(newExpanded);
  };

  const handleFamilyPress = (familyId: number) => {
    router.push(`/family/${familyId}`);
  };

  const handleApproveFamily = async (familyId: number, familyName: string) => {
    Alert.alert(
      'Approve Family',
      `Approve ${familyName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            const { data, error } = await api.families.approve(familyId);
            if (data) {
              Alert.alert('Success', 'Family approved successfully');
              loadFamilies();
            } else {
              Alert.alert('Error', error || 'Failed to approve family');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Members</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.gray[400]}
        />
      </View>

      {/* Add Family Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/family/add')}
      >
        <Text style={styles.addButtonText}>+ Add Family</Text>
      </TouchableOpacity>

      {/* Families Grouped by Place */}
      {familiesByPlace.map((placeGroup) => (
        <View key={placeGroup.place} style={styles.placeSection}>
          <TouchableOpacity
            style={styles.placeHeader}
            onPress={() => togglePlace(placeGroup.place)}
          >
            <Text style={styles.placeName}>{placeGroup.place}</Text>
            <Text style={styles.placeCount}>({placeGroup.count})</Text>
            <Text style={styles.expandIcon}>
              {expandedPlaces.has(placeGroup.place) ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>

          {expandedPlaces.has(placeGroup.place) && (
            <View style={styles.familiesList}>
              {placeGroup.families.map((family: any) => (
                <View key={family.id} style={styles.familyCard}>
                  <TouchableOpacity
                    style={styles.familyInfo}
                    onPress={() => handleFamilyPress(family.id)}
                  >
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {family.headName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.familyDetails}>
                      <Text style={styles.familyHead}>{family.headName}</Text>
                      {family.headPhone && (
                        <Text style={styles.familyPhone}>{family.headPhone}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  {family.status === 'pending' && (
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApproveFamily(family.id, family.headName)}
                    >
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
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
  searchContainer: {
    margin: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  addButton: {
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
  addButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  placeSection: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.radius.card,
    ...theme.shadow.card,
  },
  placeName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontFamily: theme.typography.display,
  },
  placeCount: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginRight: theme.spacing.sm,
  },
  expandIcon: {
    fontSize: 12,
    color: theme.colors.gray[500],
  },
  familiesList: {
    marginTop: theme.spacing.sm,
  },
  familyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.radius.card,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.card,
  },
  familyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.gray[500],
  },
  familyDetails: {
    flex: 1,
  },
  familyHead: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  familyPhone: {
    fontSize: 14,
    color: theme.colors.gray[500],
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: theme.colors.alert,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
  },
  pendingText: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
  },
  approveButtonText: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: '600',
  },
});
