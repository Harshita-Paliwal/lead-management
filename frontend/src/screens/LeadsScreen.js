import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  FlatList, TextInput, RefreshControl, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, STATUS_COLORS } from '../utils/theme';
import { getLeads, deleteLead } from '../services/api';

// Compact list card for each lead row.
const LeadCard = ({ lead, onPress }) => {
  const ss = STATUS_COLORS[lead.status] || {};
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      <View style={s.cardTop}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={s.company}>{lead.company_name}</Text>
          <Text style={s.person}>👤 {lead.person_name}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: ss.bg }]}>
          <View style={[s.dot, { backgroundColor: ss.dot }]} />
          <Text style={[s.statusText, { color: ss.text }]}>{lead.status}</Text>
        </View>
      </View>
      <View style={s.meta}>
        <Text style={s.metaText}>📞 {lead.contact_no}</Text>
        {lead.contact_email ? <Text style={s.metaText}>✉️ {lead.contact_email}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

const LeadsScreen = ({ navigation, route }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState(route.params?.filterStatus || 'All');
  const [deleteId, setDeleteId] = useState(null);

  // Keeps list filter synced when dashboard opens this screen with a status.
  useEffect(() => {
    if (route.params?.filterStatus !== undefined) {
      setActiveStatus(route.params.filterStatus || 'All');
    }
  }, [route.params?.filterStatus]);

  // Fetches leads with optional status filter from current tab state.
  const fetchLeads = async () => {
    try {
      const params = {};
      if (activeStatus !== 'All') params.status = activeStatus;
      const res = await getLeads(params);
      setLeads(res.data.data);
    } catch {
      Alert.alert('Error', 'Could not load leads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refetches leads when screen focus returns or filter changes.
  useFocusEffect(useCallback(() => {
    fetchLeads();
  }, [activeStatus]));

  // Client-side search avoids extra API calls while typing.
  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((lead) => {
      const company = String(lead.company_name || '').toLowerCase();
      const person = String(lead.person_name || '').toLowerCase();
      const phone = String(lead.contact_no || '').toLowerCase();
      const email = String(lead.contact_email || '').toLowerCase();
      return company.includes(q) || person.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [leads, search]);

  // Deletes selected lead and updates list immediately.
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteLead(deleteId);
      setLeads((prev) => prev.filter((l) => l.id !== deleteId));
    } catch {
      Alert.alert('Error', 'Could not delete lead');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <TextInput
            style={s.searchInput}
            placeholder="Search company, person, contact..."
            placeholderTextColor={COLORS.gray}
            value={search}
            onChangeText={(text) => setSearch(text)}
            autoCorrect={false}
            autoCapitalize="none"
            blurOnSubmit={false}
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: COLORS.gray, fontSize: 16, paddingHorizontal: 6 }}>X</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={s.countRow}>
        <Text style={s.countText}>
          {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
          {activeStatus !== 'All' ? `  .  ${activeStatus}` : ''}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredLeads}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              onPress={() => navigation.navigate('LeadDetail', { leadId: item.id })}
            />
          )}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchLeads();
              }}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={(
            <View style={s.empty}>
              <Text style={s.emptyTitle}>No leads found</Text>
              <Text style={s.emptySub}>Try a different search or add a new lead</Text>
            </View>
          )}
        />
      )}

      <Modal visible={!!deleteId} transparent animationType="fade" onRequestClose={() => setDeleteId(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Delete Lead</Text>
            <Text style={s.modalText}>This action cannot be undone. Continue?</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalBtnSecondary} onPress={() => setDeleteId(null)}>
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
  searchWrap: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.grayLight, borderRadius: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: COLORS.text },

  countRow: { paddingHorizontal: 16, paddingVertical: 8 },
  countText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  listContent: { paddingHorizontal: 14, paddingBottom: 40, paddingTop: 4 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CFE7ED',
    shadowColor: '#083545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  company: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  person: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  meta: { gap: 3 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },

  empty: { alignItems: 'center', paddingTop: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 },

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

export default LeadsScreen;
