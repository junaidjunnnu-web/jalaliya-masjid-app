import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    pin: '',
    confirmPin: '',
    headName: '',
    placeId: '',
    address: '',
  });

  const handleRegister = async () => {
    const { phone, pin, confirmPin, headName, placeId, address } = formData;

    if (!phone || !pin || !headName || !placeId) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    if (pin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits');
      return;
    }

    setLoading(true);
    const success = await register({ phone, pin, headName, placeId: parseInt(placeId), address });
    setLoading(false);

    if (success) {
      Alert.alert(
        'Registration Successful',
        'Your family registration is pending approval from the committee.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } else {
      Alert.alert('Error', 'Registration failed. Phone number may already be registered.');
    }
  };

  const places = [
    { id: 1, name: 'Ghandinagara' },
    { id: 2, name: 'Alekatte' },
    { id: 3, name: 'MD Block' },
    { id: 4, name: 'Ranger Block' },
    { id: 5, name: 'Near Manasa Hall' },
    { id: 6, name: 'Somwarpet Town' },
    { id: 7, name: 'Other' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Register Family</Text>
        <Text style={styles.headerSubtitle}>Join Jalaliya Juma Masjid Community</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Family Head Name *"
          placeholderTextColor={theme.colors.gray[400]}
          value={formData.headName}
          onChangeText={(text) => setFormData({ ...formData, headName: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Phone Number *"
          placeholderTextColor={theme.colors.gray[400]}
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
          maxLength={15}
        />

        <TextInput
          style={styles.input}
          placeholder="PIN (4-6 digits) *"
          placeholderTextColor={theme.colors.gray[400]}
          value={formData.pin}
          onChangeText={(text) => setFormData({ ...formData, pin: text })}
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm PIN *"
          placeholderTextColor={theme.colors.gray[400]}
          value={formData.confirmPin}
          onChangeText={(text) => setFormData({ ...formData, confirmPin: text })}
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
        />

        <Text style={styles.label}>Place *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.placesContainer}>
          {places.map((place) => (
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
          ))}
        </ScrollView>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Address"
          placeholderTextColor={theme.colors.gray[400]}
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Registering...' : 'Register'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
          <Text style={styles.loginText}>Already registered? Login</Text>
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
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    fontFamily: theme.typography.display,
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.accent,
  },
  form: {
    padding: theme.spacing.xl,
    marginTop: theme.spacing.lg,
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
  label: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
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
  loginLink: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  loginText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
