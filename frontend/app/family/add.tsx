import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { api } from '../../lib/api';

interface Member {
  id: number;
  name: string;
  relation: string;
  phone: string;
  age: string;
  gender: string;
  maritalStatus: string;
  occupation: string;
  isFeeApplicable: boolean;
}

export default function AddFamilyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    placeId: '',
    address: '',
    monthlyFeeMarried: '300',
    monthlyFeeUnmarried: '200',
  });
  const [members, setMembers] = useState<Member[]>([
    {
      id: Date.now(),
      name: '',
      relation: '',
      phone: '',
      age: '',
      gender: '',
      maritalStatus: '',
      occupation: '',
      isFeeApplicable: true,
    }
  ]);

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    const { data } = await api.families.getPlaces();
    if (data && data.length > 0) {
      setPlaces(data);
    }
  };

  const addMember = () => {
    setMembers([
      ...members,
      {
        id: Date.now(),
        name: '',
        relation: '',
        phone: '',
        age: '',
        gender: '',
        maritalStatus: '',
        occupation: '',
        isFeeApplicable: true,
      }
    ]);
  };

  const removeMember = (id: number) => {
    if (members.length > 1) {
      setMembers(members.filter(m => m.id !== id));
    } else {
      Alert.alert('Error', 'At least one member is required');
    }
  };

  const updateMember = (id: number, field: keyof Member, value: any) => {
    setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSave = async () => {
    const { placeId, address, monthlyFeeMarried, monthlyFeeUnmarried } = formData;

    if (!placeId) {
      Alert.alert('Error', 'Please select a place');
      return;
    }

    // Validate at least one member with name and relation
    const validMembers = members.filter(m => m.name.trim() && m.relation.trim());
    if (validMembers.length === 0) {
      Alert.alert('Error', 'Please add at least one member with name and relation');
      return;
    }

    // Validate phone numbers for members who have them
    for (const member of members) {
      if (member.phone && member.phone.length < 10) {
        Alert.alert('Error', `Please enter a valid phone number for ${member.name || 'member'}`);
        return;
      }
    }

    const requestBody = {
      placeId: parseInt(placeId),
      address: formData.address,
      monthlyFeeMarried: parseInt(monthlyFeeMarried),
      monthlyFeeUnmarried: parseInt(monthlyFeeUnmarried),
      status: 'approved',
      members: validMembers.map(m => ({
        name: m.name,
        relation: m.relation,
        phone: m.phone || null,
        age: m.age ? parseInt(m.age) : null,
        gender: m.gender || null,
        maritalStatus: m.maritalStatus || null,
        occupation: m.occupation || null,
        isFeeApplicable: m.isFeeApplicable,
      })),
    };

    console.log('[Add Family] Request body:', JSON.stringify(requestBody, null, 2));
    console.log('[Add Family] About to call API with:', { placeId, address, monthlyFeeMarried, monthlyFeeUnmarried, membersCount: validMembers.length });

    setLoading(true);
    const { data, error } = await api.families.create(requestBody);
    setLoading(false);

    console.log('[Add Family] Response data:', JSON.stringify(data, null, 2));
    console.log('[Add Family] Response error:', JSON.stringify(error, null, 2));
    console.log('[Add Family] Full response object:', { data, error });

    if (error) {
      Alert.alert('Error', String(error));
    } else if (data) {
      Alert.alert('Success', 'Family added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerTitle}>Add Family</Text>
      </SafeAreaView>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Home Details</Text>

        <Text style={styles.label}>Place *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.placesContainer}>
          {places.length > 0 ? places.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={[
                styles.placeButton,
                formData.placeId === place.id.toString() && styles.placeButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, placeId: place.id.toString() })}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.placeButtonText,
                  formData.placeId === place.id.toString() && styles.placeButtonTextActive,
                ]}
              >
                {place.name}
              </Text>
            </TouchableOpacity>
          )) : (
            <Text style={styles.noPlaces}>No places available</Text>
          )}
        </ScrollView>

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter address"
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Monthly Fee (Married) *</Text>
        <TextInput
          style={styles.input}
          placeholder="300"
          value={formData.monthlyFeeMarried}
          onChangeText={(text) => setFormData({ ...formData, monthlyFeeMarried: text })}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Monthly Fee (Unmarried) *</Text>
        <TextInput
          style={styles.input}
          placeholder="200"
          value={formData.monthlyFeeUnmarried}
          onChangeText={(text) => setFormData({ ...formData, monthlyFeeUnmarried: text })}
          keyboardType="number-pad"
        />

        <Text style={styles.sectionTitle}>Members</Text>

        {members.map((member, index) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberHeader}>
              <Text style={styles.memberTitle}>Member {index + 1}</Text>
              {members.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeMember(member.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter name"
              value={member.name}
              onChangeText={(text) => updateMember(member.id, 'name', text)}
            />

            <Text style={styles.label}>Relation *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Father, Mother, Son, Daughter, Grandfather"
              value={member.relation}
              onChangeText={(text) => updateMember(member.id, 'relation', text)}
            />

            <Text style={styles.label}>Phone (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              value={member.phone}
              onChangeText={(text) => updateMember(member.id, 'phone', text)}
              keyboardType="phone-pad"
              maxLength={15}
            />

            <Text style={styles.label}>Age (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter age"
              value={member.age}
              onChangeText={(text) => updateMember(member.id, 'age', text)}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Gender (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
              {['male', 'female'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.optionButton,
                    member.gender === gender && styles.optionButtonActive,
                  ]}
                  onPress={() => updateMember(member.id, 'gender', gender)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      member.gender === gender && styles.optionButtonTextActive,
                    ]}
                  >
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Marital Status (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
              {['married', 'unmarried'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.optionButton,
                    member.maritalStatus === status && styles.optionButtonActive,
                  ]}
                  onPress={() => updateMember(member.id, 'maritalStatus', status)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      member.maritalStatus === status && styles.optionButtonTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Occupation (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter occupation"
              value={member.occupation}
              onChangeText={(text) => updateMember(member.id, 'occupation', text)}
            />

            <TouchableOpacity
              style={styles.feeToggle}
              onPress={() => updateMember(member.id, 'isFeeApplicable', !member.isFeeApplicable)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, member.isFeeApplicable && styles.checkboxChecked]} />
              <Text style={styles.feeToggleText}>Fee applicable</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addMemberButton} onPress={addMember} activeOpacity={0.7}>
          <Text style={styles.addMemberButtonText}>+ Add Another Member</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Save Family'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: theme.colors.membersAccent,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    fontFamily: theme.typography.display,
  },
  form: {
    padding: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  input: {
    backgroundColor: theme.colors.white,
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
  placesContainer: {
    marginBottom: theme.spacing.md,
    flexGrow: 0,
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
  noPlaces: {
    fontSize: 14,
    color: theme.colors.gray[500],
    padding: theme.spacing.md,
  },
  memberCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    ...theme.shadow.card,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  memberTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  removeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.error,
    borderRadius: theme.radius.button,
  },
  removeButtonText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  optionsContainer: {
    marginBottom: theme.spacing.md,
    flexGrow: 0,
  },
  optionButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    marginRight: theme.spacing.sm,
  },
  optionButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionButtonText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    fontWeight: '600',
  },
  optionButtonTextActive: {
    color: theme.colors.white,
  },
  feeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    marginRight: theme.spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  feeToggleText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  addMemberButton: {
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.radius.button,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  addMemberButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: theme.colors.membersAccent,
    borderRadius: theme.radius.button,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadow.button,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.gray[500],
    fontSize: 14,
    fontWeight: '600',
  },
});
