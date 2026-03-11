import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { COLORS, STATUS_COLORS, TYPE_COLORS } from '../utils/theme';
import { getLead, deleteLead } from '../services/api';

const LeadDetailScreen = ({ route, navigation }) => {
  const { leadId } = route.params;
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Reload details when a different lead id is opened.
  useEffect(() => {
    fetchLead();
  }, [leadId]);

  // Gets one lead record for detail view.
  const fetchLead = async () => {
    try {
      const res = await getLead(leadId);
      setLead(res.data.data);
    } catch {
      Alert.alert('Error', 'Could not load lead');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Deletes lead from detail page and returns to previous list screen.
  const confirmDelete = async () => {
    try {
      await deleteLead(leadId);
      setShowDeleteModal(false);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not delete');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }
  if (!lead) return null;

  const ss = STATUS_COLORS[lead.status] || {};
  const ts = TYPE_COLORS[lead.lead_type] || {};
  const date = new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <View style={s.badges}>
            <View style={[s.badge, { backgroundColor: ts.bg }]}>
              <Text style={[s.badgeText, { color: ts.text }]}>{lead.lead_type}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: ss.bg, flexDirection: 'row', alignItems: 'center', gap: 5 }]}>
              <View style={[s.dot, { backgroundColor: ss.dot }]} />
              <Text style={[s.badgeText, { color: ss.text }]}>{lead.status}</Text>
            </View>
          </View>
          <Text style={s.company}>{lead.company_name}</Text>
          <Text style={s.person}>{lead.person_name}</Text>
          <Text style={s.owner}>Lead by: {lead.owner_name || 'Unknown'}</Text>
          <Text style={s.date}>Added on {date}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>CONTACT INFORMATION</Text>
          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Phone</Text>
              <Text style={s.infoValue}>{lead.contact_no}</Text>
            </View>
            {lead.contact_email ? (
              <>
                <View style={s.divider} />
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Email</Text>
                  <Text style={s.infoValue}>{lead.contact_email}</Text>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {lead.description ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>NOTES AND DESCRIPTION</Text>
            <View style={s.infoCard}>
              <Text style={s.descText}>{lead.description}</Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity style={s.editBtn} onPress={() => navigation.navigate('LeadForm', { mode: 'edit', lead })}>
          <Text style={s.editBtnText}>Edit Lead</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.deleteBtn} onPress={() => setShowDeleteModal(true)}>
          <Text style={s.deleteBtnText}>Delete Lead</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Delete Lead</Text>
            <Text style={s.modalText}>This action cannot be undone. Continue?</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalBtnSecondary} onPress={() => setShowDeleteModal(false)}>
                <Text style={s.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalBtnPrimaryDanger} onPress={confirmDelete}>
                <Text style={s.modalBtnPrimaryText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, paddingBottom: 40 },

  hero: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  company: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 6 },
  person: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  owner: { fontSize: 13, color: COLORS.primaryDark, fontWeight: '700', marginBottom: 4 },
  date: { fontSize: 12, color: COLORS.gray },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 1, marginBottom: 10 },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: { gap: 2, paddingVertical: 4 },
  infoLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.grayBorder, marginVertical: 12 },
  descText: { fontSize: 14, color: COLORS.text, lineHeight: 22 },

  editBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  editBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtn: { backgroundColor: '#FEE2E2', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  deleteBtnText: { color: COLORS.danger, fontSize: 16, fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 23, 31, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#F9FEFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B7E9F2',
    padding: 18,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0A4E63', marginBottom: 6 },
  modalText: { fontSize: 14, color: '#305969', marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtnSecondary: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E4F5F8',
  },
  modalBtnSecondaryText: { color: '#2A6778', fontWeight: '700', fontSize: 14 },
  modalBtnPrimaryDanger: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
  },
  modalBtnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

export default LeadDetailScreen;
