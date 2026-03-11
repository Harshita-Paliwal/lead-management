import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, RefreshControl, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../utils/theme';
import { getStats } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Tappable stat card is reused for each dashboard metric.
const StatCard = ({ label, value, color, onPress }) => (
  <TouchableOpacity style={[s.statCard, { borderColor: `${color}66` }]} onPress={onPress} activeOpacity={0.84}>
    <Text style={s.statLabel}>{label}</Text>
    <View style={s.statCountWrap}>
      <Text style={[s.statValue, { color }]}>{value ?? 0}</Text>
      <View style={[s.statUnderline, { backgroundColor: `${color}70` }]} />
    </View>
  </TouchableOpacity>
);

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Loads summary counts used in dashboard cards.
  const fetchStats = async () => {
    try {
      const res = await getStats();
      setStats(res.data.data);
    } catch {
      Alert.alert('Error', 'Could not load stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refetches data whenever screen comes back into focus.
  useFocusEffect(useCallback(() => {
    fetchStats();
  }, []));

  // Optional status filter lets cards open a pre-filtered lead list.
  const goLeads = (filterStatus = null) => navigation.navigate('Leads', { filterStatus });

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchStats();
            }}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={s.bgOrbTopRight} />
        <View style={s.bgOrbLeft} />
        <View style={s.bgWave} />
        <View style={s.bgOrbBottom} />

        <View style={s.header}>
          <View style={s.headerGlow} />
          <View>
            <Text style={s.greeting}>Welcome back</Text>
            <Text style={s.username}>{user?.username || 'User'}</Text>
            <Text style={s.userEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowLogoutModal(true)} activeOpacity={0.7}>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={s.statsSection}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
          ) : (
            <View style={s.grid}>
              <StatCard label="Total Leads" value={stats?.total} color={COLORS.primary} onPress={() => goLeads(null)} />
              <StatCard label="In Progress" value={stats?.in_progress} color={COLORS.warning} onPress={() => goLeads('In Progress')} />
              <StatCard label="Converted" value={stats?.converted} color={COLORS.success} onPress={() => goLeads('Converted')} />
              <StatCard label="Lost" value={stats?.lost} color={COLORS.danger} onPress={() => goLeads('Lost')} />
            </View>
          )}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      <TouchableOpacity
        style={s.fab}
        onPress={() => navigation.navigate('LeadForm', { mode: 'create' })}
        activeOpacity={0.85}
      >
        <View style={s.fabPlusWrap}>
          <Text style={s.fabPlus}>+</Text>
        </View>
        <Text style={s.fabLabel}>New Lead</Text>
      </TouchableOpacity>

      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Confirm Logout</Text>
            <Text style={s.modalText}>Are you sure you want to logout?</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalBtnSecondary} onPress={() => setShowLogoutModal(false)}>
                <Text style={s.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalBtnPrimary}
                onPress={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
              >
                <Text style={s.modalBtnPrimaryText}>Logout</Text>
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
  bgOrbTopRight: {
    position: 'absolute',
    right: -120,
    top: 110,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#8EEAF226',
  },
  bgOrbLeft: {
    position: 'absolute',
    left: -90,
    top: 290,
    width: 210,
    height: 210,
    borderRadius: 110,
    backgroundColor: '#B9F5FB30',
  },
  bgWave: {
    position: 'absolute',
    left: -70,
    right: -70,
    top: 250,
    height: 120,
    borderRadius: 80,
    backgroundColor: '#0E9CB51C',
    transform: [{ rotate: '-7deg' }],
  },
  bgOrbBottom: {
    position: 'absolute',
    right: -100,
    bottom: -140,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#80E4EF1F',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    right: -80,
    top: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#6EE7F033',
  },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  username: { fontSize: 34, fontWeight: '900', color: '#fff', marginTop: 2, lineHeight: 38 },
  userEmail: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3 },
  logoutText: { color: '#DDF8FB', fontSize: 15, fontWeight: '800', marginTop: 4 },

  statsSection: { padding: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: '47.5%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    minHeight: 130,
    justifyContent: 'space-between',
    shadowColor: '#073042',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  statLabel: { fontSize: 17, color: COLORS.text, fontWeight: '700', lineHeight: 22 },
  statCountWrap: { alignItems: 'flex-start', marginTop: 10 },
  statValue: { fontSize: 44, fontWeight: '900', lineHeight: 48 },
  statUnderline: { width: 42, height: 3, borderRadius: 2, marginTop: 2 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 30,
    gap: 10,
    borderWidth: 1,
    borderColor: '#52D5E5',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  fabPlusWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabPlus: { fontSize: 20, color: '#fff', fontWeight: '900', lineHeight: 22 },
  fabLabel: { fontSize: 15, color: '#fff', fontWeight: '700' },

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
  modalBtnPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  modalBtnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

export default DashboardScreen;
