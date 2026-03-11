import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { COLORS } from '../utils/theme';
import { signup, verifySignup } from '../services/api';

const SignupScreen = ({ navigation }) => {
  const [form, setForm] = useState({ username: '', email: '', mobile: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('details');
  const [loading, setLoading] = useState(false);
  // Small updater avoids repeated object spread logic for form fields.
  const u = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);

  // Client-side checks prevent unnecessary API calls for basic invalid input.
  const validateDetails = () => {
    if (!form.username.trim()) {
      Alert.alert('Error', 'Full name is required.');
      return false;
    }
    if (!validateEmail(form.email.trim())) {
      Alert.alert('Error', 'A valid email address is required.');
      return false;
    }
    if (!/^\d{10}$/.test(form.mobile.trim())) {
      Alert.alert('Error', 'Enter a valid 10-digit mobile number.');
      return false;
    }
    return true;
  };

  // Step 1: create/update pending signup and send OTP email.
  const handleSignup = async () => {
    if (!validateDetails()) return;
    setLoading(true);
    try {
      await signup(form.username.trim(), form.email.trim().toLowerCase(), form.mobile.trim());
      setStep('otp');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Signup failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify OTP, then move user to login flow.
  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      await verifySignup(form.email.trim().toLowerCase(), otp);
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Login',
            params: { prefillEmail: form.email.trim().toLowerCase(), autoSendOtp: true },
          },
        ],
      });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <View style={s.heroGlow} />
          <View style={s.bgOrbOne} />
          <View style={s.bgOrbTwo} />
          <View style={s.bgBand} />
          <View style={s.bgHalo} />

          <View style={s.logoArea}>
      
            <Text style={s.appName}>LeadManager</Text>
            <Text style={s.tagline}>Create your account</Text>
          </View>

          <View style={s.card}>
            {step === 'details' ? (
              <>
                <Text style={s.title}>Your Details</Text>

                <Text style={s.label}>Full Name *</Text>
                <TextInput
                  style={s.input}
                  placeholder="Enter your name"
                  placeholderTextColor={COLORS.gray}
                  value={form.username}
                  onChangeText={(v) => u('username', v)}
                />

                <Text style={s.label}>Email Address *</Text>
                <TextInput
                  style={s.input}
                  placeholder="email@example.com"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.email}
                  onChangeText={(v) => u('email', v)}
                />

                <Text style={s.label}>Mobile Number *</Text>
                <View style={s.phoneRow}>
                  <View style={s.codeBox}><Text style={s.codeText}>+91</Text></View>
                  <TextInput
                    style={s.phoneInput}
                    placeholder="10-digit number"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={form.mobile}
                    onChangeText={(v) => u('mobile', v.replace(/[^0-9]/g, ''))}
                  />
                </View>

                <TouchableOpacity style={[s.btn, loading && s.btnOff]} onPress={handleSignup} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Send OTP</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.title}>Verify OTP</Text>
                <View style={s.sentNote}>
                  <Text style={s.sentNoteText}>OTP sent to {form.email.trim().toLowerCase()}</Text>
                </View>

                <Text style={s.label}>Enter OTP</Text>
                <TextInput
                  style={s.otpInput}
                  placeholder="      "
                  placeholderTextColor={COLORS.gray}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />

                <TouchableOpacity style={[s.btn, loading && s.btnOff]} onPress={handleVerify} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verify and Continue</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={s.link} onPress={() => { setStep('details'); setOtp(''); }}>
                  <Text style={s.linkText}>Edit details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.link} onPress={handleSignup}>
                  <Text style={s.linkText}>Resend OTP</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={s.bottomRow}>
            <Text style={s.bottomText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.bottomLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryDark },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 28 },
  heroGlow: {
    position: 'absolute',
    top: -140,
    left: -40,
    right: -40,
    height: 420,
    borderRadius: 220,
    backgroundColor: '#119fbf55',
  },
  bgOrbOne: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 200,
    right: -120,
    top: 120,
    backgroundColor: '#0FB3C333',
  },
  bgOrbTwo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 140,
    left: -90,
    bottom: 120,
    backgroundColor: '#2CE3F022',
  },
  bgBand: {
    position: 'absolute',
    left: -60,
    right: -60,
    top: 200,
    height: 140,
    borderRadius: 120,
    backgroundColor: '#0D6C8129',
    transform: [{ rotate: '-8deg' }],
  },
  bgHalo: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 220,
    left: -60,
    bottom: -220,
    backgroundColor: '#0CA4BD1A',
  },

  logoArea: { alignItems: 'center', marginBottom: 18, marginTop: -8 },
  emblem: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#3AE4F31F',
    borderWidth: 1,
    borderColor: '#8CEAF466',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emblemText: { fontSize: 30, fontWeight: '900', color: '#D5F8FF' },
  appName: { fontSize: 28, fontWeight: '900', color: '#D7FAFF', lineHeight: 40 },
  tagline: { fontSize: 14, color: '#A6DBE6', marginTop: 2, letterSpacing: 0.4 },

  card: {
    backgroundColor: '#F9FEFF',
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: '#CFEFF5',
    shadowColor: '#051F2C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.26,
    shadowRadius: 20,
    elevation: 10,
  },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 16, lineHeight: 36 },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.7,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1.6,
    borderColor: COLORS.grayBorder,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.grayLight,
    marginBottom: 16,
  },
  phoneRow: {
    flexDirection: 'row',
    borderWidth: 1.6,
    borderColor: COLORS.grayBorder,
    borderRadius: 13,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: COLORS.grayLight,
  },
  codeBox: { paddingHorizontal: 14, paddingVertical: 13, borderRightWidth: 1, borderRightColor: COLORS.grayBorder },
  codeText: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  phoneInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: COLORS.text },

  sentNote: { backgroundColor: COLORS.primaryLight, borderRadius: 10, padding: 12, marginBottom: 16 },
  sentNoteText: { fontSize: 14, color: COLORS.primaryDark, fontWeight: '700' },
  otpInput: {
    borderWidth: 1.6,
    borderColor: COLORS.grayBorder,
    borderRadius: 13,
    paddingVertical: 14,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 10,
    color: COLORS.text,
    backgroundColor: COLORS.grayLight,
    marginBottom: 18,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 13,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  btnOff: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  link: { alignItems: 'center', marginTop: 12 },
  linkText: { color: COLORS.primaryDark, fontSize: 15, fontWeight: '700' },

  bottomRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  bottomText: { color: '#A4DAE5', fontSize: 16 },
  bottomLink: { color: '#D8FBFF', fontSize: 16, fontWeight: '900' },
});

export default SignupScreen;
