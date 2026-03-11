import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, STATUS_COLORS, TYPE_COLORS } from '../utils/theme';
import { createLead, updateLead } from '../services/api';

const TYPES = ['Product', 'Development', 'Resources', 'Other'];
const STATUSES = ['In Progress', 'Converted', 'Lost'];

// Small reusable popup for inline success/error messages.
const Notice = ({ type, message, onClose }) => {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <View style={[s.notice, isError ? s.noticeError : s.noticeInfo]}>
      <Text style={[s.noticeTitle, isError ? s.noticeTitleError : s.noticeTitleInfo]}>
        {isError ? 'Error' : 'Success'}
      </Text>
      <Text style={[s.noticeText, isError ? s.noticeTextError : s.noticeTextInfo]}>{message}</Text>
      <TouchableOpacity onPress={onClose} style={s.noticeBtn}>
        <Text style={s.noticeBtnText}>OK</Text>
      </TouchableOpacity>
    </View>
  );
};

// Generic input field wrapper to keep form markup smaller.
const Field = ({ label, value, placeholder, kb = 'default', required, maxLength, sanitize, onChange }) => (
  <View style={s.fieldGroup}>
    <Text style={s.label}>{label}{required ? ' *' : ''}</Text>
    <TextInput
      style={s.input}
      placeholder={placeholder}
      placeholderTextColor={COLORS.gray}
      keyboardType={kb}
      autoCapitalize={kb === 'email-address' ? 'none' : 'sentences'}
      value={value}
      maxLength={maxLength}
      blurOnSubmit={false}
      onChangeText={(v) => onChange(sanitize ? sanitize(v) : v)}
    />
  </View>
);

const LeadFormScreen = ({ route, navigation }) => {
  const { mode, lead } = route.params || {};
  const isEdit = mode === 'edit';
  // Stores post-notice action (navigate/goBack) to run only after user closes popup.
  const closeActionRef = useRef(null);

  const [form, setForm] = useState({
    company_name: '',
    person_name: '',
    contact_no: '',
    contact_email: '',
    lead_type: 'Product',
    status: 'In Progress',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notice, setNotice] = useState({ type: 'info', message: '' });

  useEffect(() => {
    // Pre-fills form when editing an existing lead.
    if (isEdit && lead) {
      setForm({
        company_name: lead.company_name || '',
        person_name: lead.person_name || '',
        contact_no: lead.contact_no || '',
        contact_email: lead.contact_email || '',
        lead_type: lead.lead_type || 'Product',
        status: lead.status || 'In Progress',
        description: lead.description || '',
      });
    }
    navigation.setOptions({ title: isEdit ? 'Edit Lead' : 'New Lead' });
  }, []);

  // Centralized notice helper keeps feedback and optional follow-up action together.
  const showNotice = (type, message, onClose = null) => {
    closeActionRef.current = onClose;
    setNotice({ type, message });
  };

  const u = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Basic validation catches missing/invalid required fields before submit.
  const validate = () => {
    if (!form.company_name.trim()) {
      showNotice('error', 'Company name is required.');
      return false;
    }
    if (!form.person_name.trim()) {
      showNotice('error', 'Person name is required.');
      return false;
    }
    const digits = form.contact_no.replace(/\D/g, '');
    if (!digits) {
      showNotice('error', 'Contact number is required.');
      return false;
    }
    if (!/^\d{10}$/.test(digits)) {
      showNotice('error', 'Contact number must be exactly 10 digits.');
      return false;
    }
    return true;
  };

  // Final submit writes create/update changes to backend after confirmation.
  const submitLead = async () => {
    setShowConfirm(false);
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form, contact_no: form.contact_no.replace(/\D/g, '') };
      if (isEdit) {
        await updateLead(lead.id, payload);
        showNotice('success', 'Lead updated successfully.', () => navigation.goBack());
      } else {
        await createLead(payload);
        showNotice('success', 'Lead added to your pipeline.', () => navigation.navigate('Leads'));
      }
    } catch (err) {
      showNotice('error', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // Opens confirmation modal only when form is valid.
  const onPressSubmit = () => {
    if (!validate()) return;
    setShowConfirm(true);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            <Field label="Company Name" value={form.company_name} placeholder="e.g. 4everCloud" required onChange={(v) => u('company_name', v)} />
            <Field label="Person Name" value={form.person_name} placeholder="e.g. Pradeep Rajput" required onChange={(v) => u('person_name', v)} />
            <Field
              label="Contact No."
              value={form.contact_no}
              placeholder="10-digit mobile number"
              required
              kb="phone-pad"
              maxLength={10}
              sanitize={(v) => v.replace(/[^0-9]/g, '')}
              onChange={(v) => u('contact_no', v)}
            />
            <Field label="Contact Email" value={form.contact_email} placeholder="email@company.com" kb="email-address" onChange={(v) => u('contact_email', v)} />

            <View style={s.fieldGroup}>
              <Text style={s.label}>Lead Type *</Text>
              <View style={s.chipRow}>
                {TYPES.map((t) => {
                  const tc = TYPE_COLORS[t];
                  const on = form.lead_type === t;
                  return (
                    <TouchableOpacity key={t} style={[s.chip, on && { backgroundColor: tc.bg, borderColor: tc.text }]} onPress={() => u('lead_type', t)}>
                      <Text style={[s.chipText, on && { color: tc.text }]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Status *</Text>
              <View style={s.chipRow}>
                {STATUSES.map((st) => {
                  const sc = STATUS_COLORS[st];
                  const on = form.status === st;
                  return (
                    <TouchableOpacity key={st} style={[s.chip, on && { backgroundColor: sc.bg, borderColor: sc.dot }]} onPress={() => u('status', st)}>
                      {on ? <View style={[s.chipDot, { backgroundColor: sc.dot }]} /> : null}
                      <Text style={[s.chipText, on && { color: sc.text }]}>{st}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Notes / Description</Text>
              <TextInput
                style={[s.input, s.textArea]}
                placeholder="Add notes about this lead..."
                placeholderTextColor={COLORS.gray}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={form.description}
                onChangeText={(v) => u('description', v)}
              />
            </View>
          </View>

          <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={onPressSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>{isEdit ? 'Update Lead' : 'Save Lead'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showConfirm} transparent animationType="fade" onRequestClose={() => setShowConfirm(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{isEdit ? 'Update Lead' : 'Create Lead'}</Text>
            <Text style={s.modalText}>
              {isEdit ? 'Save these changes to the lead?' : 'Create this lead with the entered details?'}
            </Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalBtnSecondary} onPress={() => setShowConfirm(false)}>
                <Text style={s.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalBtnPrimary} onPress={submitLead}>
                <Text style={s.modalBtnPrimaryText}>{isEdit ? 'Update' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Notice
        type={notice.type}
        message={notice.message}
        onClose={() => {
          setNotice({ type: 'info', message: '' });
          if (closeActionRef.current) {
            const fn = closeActionRef.current;
            closeActionRef.current = null;
            fn();
          }
        }}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  input: { borderWidth: 1.5, borderColor: COLORS.grayBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.grayLight },
  textArea: { height: 110, paddingTop: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.grayBorder, backgroundColor: COLORS.grayLight, gap: 5 },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.grayBorder },
  cancelText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },

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

  notice: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 56,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  noticeError: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  noticeInfo: { backgroundColor: '#ECFEFF', borderColor: '#A5F3FC' },
  noticeTitle: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  noticeTitleError: { color: '#B91C1C' },
  noticeTitleInfo: { color: '#155E75' },
  noticeText: { fontSize: 14, fontWeight: '600' },
  noticeTextError: { color: '#7F1D1D' },
  noticeTextInfo: { color: '#0E7490' },
  noticeBtn: { alignSelf: 'flex-end', marginTop: 10, paddingHorizontal: 8, paddingVertical: 6 },
  noticeBtnText: { fontSize: 14, fontWeight: '800', color: '#0E7490' },
});

export default LeadFormScreen;
