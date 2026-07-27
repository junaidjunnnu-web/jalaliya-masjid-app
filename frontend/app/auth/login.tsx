import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { useAuth } from '../../lib/auth-context';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !pin) {
      Alert.alert('Error', 'Please enter phone number and PIN');
      return;
    }

    setLoading(true);
    const success = await login(phone, pin);
    setLoading(false);

    if (success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Error', 'Invalid phone number or PIN');
    }
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jalaliya Juma Masjid</Text>
        <Text style={styles.headerSubtitle}>Community Management App</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Login</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor={theme.colors.gray[400]}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={15}
        />

        <TextInput
          style={styles.input}
          placeholder="PIN"
          placeholderTextColor={theme.colors.gray[400]}
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerLink} onPress={handleRegister}>
          <Text style={styles.registerText}>
            New family? Register here
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    alignItems: 'center',
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
    marginTop: theme.spacing.xl,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xl,
    fontFamily: theme.typography.display,
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
  registerLink: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  registerText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
