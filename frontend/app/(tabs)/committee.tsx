import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { api } from '../../lib/api';

export default function CommitteeScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    loadCommitteeMembers();
  }, []);

  const loadCommitteeMembers = async () => {
    const { data } = await api.committee.getAll();
    if (data) {
      setMembers(data);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone: string) => {
    Linking.openURL(`whatsapp://send?phone=${phone}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Committee</Text>
      </View>

      {/* About Section */}
      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>About the Committee</Text>
        <Text style={styles.aboutText}>
          The Jalaliya Juma Masjid committee is dedicated to serving the community 
          and maintaining the masjid. Feel free to reach out to any committee member 
          for assistance or inquiries.
        </Text>
      </View>

      {/* Committee Directory */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Committee Members</Text>
        {members.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberInfo}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {member.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberDetails}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberDesignation}>{member.designation}</Text>
                <Text style={styles.memberTenure}>
                  {new Date(member.tenureStart).getFullYear()} - Present
                </Text>
              </View>
            </View>
            <View style={styles.contactButtons}>
              <TouchableOpacity
                style={[styles.contactButton, styles.callButton]}
                onPress={() => handleCall(member.phone)}
              >
                <Text style={styles.contactButtonText}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactButton, styles.whatsappButton]}
                onPress={() => handleWhatsApp(member.phone)}
              >
                <Text style={styles.contactButtonText}>💬</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  aboutSection: {
    backgroundColor: theme.colors.white,
    margin: theme.spacing.md,
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.display,
  },
  aboutText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    lineHeight: 22,
  },
  section: {
    margin: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.display,
  },
  memberCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  memberInfo: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  memberDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  memberDesignation: {
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  memberTenure: {
    fontSize: 12,
    color: theme.colors.gray[500],
  },
  contactButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  contactButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.button,
  },
  callButton: {
    backgroundColor: theme.colors.primary,
  },
  whatsappButton: {
    backgroundColor: theme.colors.whatsapp,
  },
  contactButtonText: {
    fontSize: 20,
  },
});
