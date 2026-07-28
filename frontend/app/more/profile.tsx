import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView } from 'react-native';
import { theme } from '../../theme';
import { api } from '../../lib/api';

export default function ProfileScreen() {
  const [family, setFamily] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    headName: '',
    headPhone: '',
    address: '',
  });

  useEffect(() => {
    if (family) {
      setFormData({
        headName: family.headName || '',
        headPhone: family.headPhone || '',
        address: family.address || '',
      });
    }
  }, [family]);

  const handleSave = async () => {
    if (!family?.id) return;

    const { data, error } = await api.families.update(family.id, formData);
    if (data) {
      Alert.alert(
        'Success',
        'Your family information has been updated and is pending approval.',
        [{ text: 'OK', onPress: () => { setEditing(false); } }]
      );
    } else {
      Alert.alert('Error', error || 'Failed to update family information');
    }
  };


  if (!family) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
        </SafeAreaView>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </SafeAreaView>

      {/* Status Badge */}
      {family.status === 'pending' && (
        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerText}>
            ⚠️ Your family registration is pending committee approval
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Family Information</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Family Head Name"
              value={formData.headName}
              onChangeText={(text) => setFormData({ ...formData, headName: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={formData.headPhone}
              onChangeText={(text) => setFormData({ ...formData, headPhone: text })}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              multiline
              numberOfLines={3}
            />
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setEditing(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.info}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Family Head:</Text>
              <Text style={styles.infoValue}>{family.headName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{family.headPhone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Place:</Text>
              <Text style={styles.infoValue}>{family.placeName || 'N/A'}</Text>
            </View>
            {!!family.address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoValue}>{family.address}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: family.status === 'approved' ? theme.colors.success : theme.colors.alert }
              ]}>
                <Text style={styles.statusText}>{family.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Family Members Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Family Members</Text>
        <TouchableOpacity style={styles.addMemberButton}>
          <Text style={styles.addMemberButtonText}>+ Add Family Member</Text>
        </TouchableOpacity>
        {/* Family members list would go here */}
        <View style={styles.emptyMembers}>
          <Text style={styles.emptyText}>No family members added yet</Text>
        </View>
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
  statusBanner: {
    backgroundColor: `${theme.colors.alert}20`,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.card,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.alert,
  },
  statusBannerText: {
    fontSize: 14,
    color: theme.colors.alert,
  },
  section: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.display,
  },
  editButton: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    marginTop: theme.spacing.sm,
  },
  input: {
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
  formActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.gray[200],
  },
  cancelButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  info: {
    marginTop: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.gray[500],
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: '600',
  },
  addMemberButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadow.button,
  },
  addMemberButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyMembers: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.gray[500],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
