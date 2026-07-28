import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { theme } from '../../theme';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'expo-router';

export default function DebugScreen() {
  const { user, family, committeeMember } = useAuth();
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerTitle}>Debug Info</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current User</Text>
        {user ? (
          <>
            <Text style={styles.label}>ID: <Text style={styles.value}>{user.id}</Text></Text>
            <Text style={styles.label}>Phone: <Text style={styles.value}>{user.phone}</Text></Text>
            <Text style={styles.label}>Role: <Text style={styles.value}>{user.role}</Text></Text>
            <Text style={styles.label}>Family ID: <Text style={styles.value}>{user.familyId || 'N/A'}</Text></Text>
            <Text style={styles.label}>Committee Member ID: <Text style={styles.value}>{user.committeeMemberId || 'N/A'}</Text></Text>
          </>
        ) : (
          <Text style={styles.value}>No user logged in</Text>
        )}
      </View>

      {family && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family</Text>
          <Text style={styles.label}>ID: <Text style={styles.value}>{family.id}</Text></Text>
          <Text style={styles.label}>Head Name: <Text style={styles.value}>{family.headName}</Text></Text>
          <Text style={styles.label}>Head Phone: <Text style={styles.value}>{family.headPhone}</Text></Text>
          <Text style={styles.label}>Place: <Text style={styles.value}>{family.placeName || 'N/A'}</Text></Text>
          <Text style={styles.label}>Status: <Text style={styles.value}>{family.status}</Text></Text>
        </View>
      )}

      {committeeMember && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Committee Member</Text>
          <Text style={styles.label}>ID: <Text style={styles.value}>{committeeMember.id}</Text></Text>
          <Text style={styles.label}>Name: <Text style={styles.value}>{committeeMember.name}</Text></Text>
          <Text style={styles.label}>Position: <Text style={styles.value}>{committeeMember.position}</Text></Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructions}>
          1. Check console logs for detailed auth flow debugging
          {'\n'}2. Use this screen to verify current logged-in user
          {'\n'}3. Test multi-user: Register A (9111111111), login, logout, then Register B (9222222222), login
          {'\n'}4. Verify no session bleed between users
        </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    fontFamily: theme.typography.display,
  },
  backButton: {
    fontSize: 16,
    color: theme.colors.white,
    fontWeight: '600',
  },
  section: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.display,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: theme.colors.gray[600],
    fontWeight: '400',
  },
  instructions: {
    fontSize: 14,
    color: theme.colors.gray[600],
    lineHeight: 20,
  },
});
