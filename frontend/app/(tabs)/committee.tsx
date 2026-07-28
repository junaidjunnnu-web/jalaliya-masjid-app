import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, TextInput, Alert, Modal, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../theme';
import { api } from '../../lib/api';

export default function CommitteeScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

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

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      designation: '',
      phone: '',
    });
    setShowModal(true);
  };

  const openEditModal = (member: any) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      designation: member.designation,
      phone: member.phone,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const { name, designation, phone } = formData;
    if (!name || !designation || !phone) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      if (editingMember) {
        const requestBody = {
          name: formData.name,
          designation: formData.designation,
          phone: formData.phone,
        };
        console.log('[Committee Update] Request body:', JSON.stringify(requestBody, null, 2));

        const { data, error } = await api.committee.update(editingMember.id, requestBody);

        console.log('[Committee Update] Response data:', JSON.stringify(data, null, 2));
        console.log('[Committee Update] Response error:', JSON.stringify(error, null, 2));

        if (error) {
          Alert.alert('Error', String(error));
        } else if (data) {
          await loadCommitteeMembers();
          setShowModal(false);
          Alert.alert('Success', 'Member updated');
        }
      } else {
        const requestBody = {
          name: formData.name,
          designation: formData.designation,
          phone: formData.phone,
        };
        console.log('[Committee Create] Request body:', JSON.stringify(requestBody, null, 2));

        const { data, error } = await api.committee.create(requestBody);

        console.log('[Committee Create] Response data:', JSON.stringify(data, null, 2));
        console.log('[Committee Create] Response error:', JSON.stringify(error, null, 2));

        if (error) {
          Alert.alert('Error', String(error));
        } else if (data) {
          await loadCommitteeMembers();
          setShowModal(false);
          Alert.alert('Success', 'Member added');
        }
      }
    } catch (error) {
      console.log('[Committee Save] Catch error:', JSON.stringify(error, null, 2));
      Alert.alert('Error', 'Failed to save member');
    }
    setLoading(false);
  };

  const handleDelete = (member: any) => {
    Alert.alert(
      'Delete Member',
      `Delete ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await api.committee.delete(member.id);
            if (error) {
              Alert.alert('Error', error);
            } else {
              await loadCommitteeMembers();
              Alert.alert('Success', 'Member deleted');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <SafeAreaView style={styles.header}>
        <Text style={styles.headerTitle}>Committee</Text>
      </SafeAreaView>

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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Committee Members</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal} activeOpacity={0.7}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
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
              </View>
            </View>
            <View style={styles.memberActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditModal(member)}
                activeOpacity={0.7}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(member)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactButton, styles.callButton]}
                onPress={() => handleCall(member.phone)}
                activeOpacity={0.7}
              >
                <Text style={styles.contactButtonText}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactButton, styles.whatsappButton]}
                onPress={() => handleWhatsApp(member.phone)}
                activeOpacity={0.7}
              >
                <Text style={styles.contactButtonText}>💬</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Add/Edit Committee Member Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingMember ? 'Edit Committee Member' : 'Add Committee Member'}
              </Text>

              <Text style={styles.modalLabel}>Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter full name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.modalLabel}>Designation *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., President, Secretary"
                value={formData.designation}
                onChangeText={(text) => setFormData({ ...formData, designation: text })}
              />

              <Text style={styles.modalLabel}>Phone *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter phone number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton, loading && styles.modalButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    color: theme.colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  addButton: {
    backgroundColor: theme.colors.addButtonColor,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  addButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  memberActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  editButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.gray[200],
  },
  editButtonText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.alert,
  },
  deleteButtonText: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xl,
    width: '100%',
    maxHeight: '90%',
    ...theme.shadow.card,
  },
  modalScrollView: {
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.display,
  },
  modalLabel: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.button,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: theme.colors.gray[200],
  },
  saveModalButton: {
    backgroundColor: theme.colors.committeeAccent,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
});
