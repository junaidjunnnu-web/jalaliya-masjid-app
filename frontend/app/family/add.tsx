import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function AddFamilyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    headName: '',
    headPhone: '',
    placeId: '',
    address: '',
    monthlyFeeMarried: '300',
    monthlyFeeUnmarried: '200',
  });

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    const { data } = await api.families.getAll();
    if (data && data.length > 0) {
      setPlaces(data.map((pg: any) => ({ id: pg.placeId, name: pg.place })));
    }
  };

  const handleSave = async () => {
    const { headName, headPhone, placeId, monthlyFeeMarried, monthlyFeeUnmarried } = formData;

    if (!headName || !headPhone || !placeId) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (headPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    const { data, error } = await api.families.create({
      head_name: headName,
      head_phone: headPhone,
      place_id: parseInt(placeId),
      address: formData.address,
      monthly_fee_married: parseInt(monthlyFeeMarried),
      monthly_fee_unmarried: parseInt(monthlyFeeUnmarried),
    });
    setLoading(false);

    if (data) {
      Alert.alert('Success', 'Family added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('Error', error || 'Failed to add family');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Family</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Family Head Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter full name"
          value={formData.headName}
          onChangeText={(text) => setFormData({ ...formData, headName: text })}
        />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          value={formData.headPhone}
          onChangeText={(text) => setFormData({ ...formData, headPhone: text })}
          keyboardType="phone-pad"
          maxLength={15}
        />

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

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Save Family'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
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
  form: {
    padding: theme.spacing.xl,
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
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.accent,
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
