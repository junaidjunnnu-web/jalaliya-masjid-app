import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import { api } from '../lib/api';

const COMMITTEE_SESSION_KEY = '@committee_session';

export default function CommitteeLoginScreen() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'phone' | 'login' | 'create-pin'>('phone');
  const [loading, setLoading] = useState(false);
  const [committeeMember, setCommitteeMember] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const sessionJson = await AsyncStorage.getItem(COMMITTEE_SESSION_KEY);
      if (sessionJson) {
        const session = JSON.parse(sessionJson);
        setSessionData(session);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.committee.getByPhone(phone);
      if (data && data.length > 0) {
        const member = data[0];
        setCommitteeMember(member);
        
        if (member.pinHash) {
          setStep('login');
        } else {
          setStep('create-pin');
        }
      } else {
        Alert.alert('Not Found', 'No committee member found with this phone number');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify phone number');
      console.error('Phone verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!pin || pin.length < 4) {
      Alert.alert('Error', 'Please enter your PIN');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.committee.login(phone, pin);
      if (data) {
        const session = {
          committeeMemberId: data.committeeMemberId,
          phone: data.phone,
          name: data.name,
          designation: data.designation,
        };
        await AsyncStorage.setItem(COMMITTEE_SESSION_KEY, JSON.stringify(session));
        setSessionData(session);
        setIsLoggedIn(true);
        Alert.alert('Success', 'Logged in successfully');
        setPin('');
      } else {
        Alert.alert('Error', error || 'Invalid PIN');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePin = async () => {
    if (!newPin || newPin.length < 4 || newPin.length > 6) {
      Alert.alert('Error', 'PIN must be 4-6 digits');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await api.committee.setPin(phone, newPin);
      if (data) {
        Alert.alert('Success', 'PIN created successfully. Please login with your new PIN.');
        setStep('login');
        setNewPin('');
        setConfirmPin('');
      } else {
        Alert.alert('Error', error || 'Failed to create PIN');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create PIN');
      console.error('Create PIN error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(COMMITTEE_SESSION_KEY);
      setSessionData(null);
      setIsLoggedIn(false);
      setStep('phone');
      setPhone('');
      setPin('');
      Alert.alert('Success', 'Logged out successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
      console.error('Logout error:', error);
    }
  };

  if (isLoggedIn && sessionData) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Committee Portal</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {sessionData.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.memberName}>{sessionData.name}</Text>
          <Text style={styles.memberDesignation}>{sessionData.designation}</Text>
          <Text style={styles.memberPhone}>{sessionData.phone}</Text>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Committee Login</Text>
        </View>

        <View style={styles.card}>
          {step === 'phone' && (
            <>
              <Text style={styles.instructionText}>
                Enter your registered phone number to continue
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={theme.colors.gray[400]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={15}
                autoFocus
              />
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handlePhoneSubmit}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Verifying...' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'login' && (
            <>
              <Text style={styles.instructionText}>
                Enter your PIN to login
              </Text>
              <TextInput
                style={styles.input}
                placeholder="PIN"
                placeholderTextColor={theme.colors.gray[400]}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                autoFocus
              />
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Logging in...' : 'Login'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setStep('phone');
                  setPin('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'create-pin' && (
            <>
              <Text style={styles.instructionText}>
                Create a 4-6 digit PIN for secure login
              </Text>
              <TextInput
                style={styles.input}
                placeholder="New PIN (4-6 digits)"
                placeholderTextColor={theme.colors.gray[400]}
                value={newPin}
                onChangeText={setNewPin}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                autoFocus
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm PIN"
                placeholderTextColor={theme.colors.gray[400]}
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
              />
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCreatePin}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Creating PIN...' : 'Create PIN'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setStep('phone');
                  setNewPin('');
                  setConfirmPin('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  header: {
    backgroundColor: theme.colors.committeeAccent,
    padding: theme.spacing.lg,
    paddingTop: 60,
    borderRadius: theme.radius.card,
    marginBottom: theme.spacing.lg,
    ...theme.shadow.card,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    fontFamily: theme.typography.display,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  instructionText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    fontSize: 16,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  primaryButton: {
    backgroundColor: theme.colors.addButtonColor,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadow.button,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  welcomeText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  memberName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  memberDesignation: {
    fontSize: 16,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  memberPhone: {
    fontSize: 14,
    color: theme.colors.gray[500],
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoutButton: {
    backgroundColor: theme.colors.alert,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadow.button,
  },
  logoutButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
