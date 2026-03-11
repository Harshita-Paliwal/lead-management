import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { COLORS } from '../utils/theme';
import { sendLoginOTP, verifyLoginOTP } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation, route }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const autoOtpTriggered = useRef(false);

  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);

  // Step 1: request OTP after validating email format.
  const handleSendOTP = async (emailOverride) => {
    const useEmail = (emailOverride ?? email).trim().toLowerCase();
    if (!validateEmail(useEmail)) {
      Alert.alert('Error', 'Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await sendLoginOTP(useEmail);
      setEmail(useEmail);
      setStep('otp');
      setResendSeconds(90);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify OTP and save authenticated session.
  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyLoginOTP(email.trim().toLowerCase(), otp);
      await login(res.data.user, res.data.token);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Supports signup-to-login flow by prefilling email and auto-sending OTP once.
    const prefillEmail = route?.params?.prefillEmail;
    const autoSendOtp = route?.params?.autoSendOtp;
    if (prefillEmail && validateEmail(prefillEmail)) {
      setEmail(prefillEmail.toLowerCase());
      if (autoSendOtp && !autoOtpTriggered.current) {
        autoOtpTriggered.current = true;
        handleSendOTP(prefillEmail.toLowerCase());
      }
    }
  }, [route?.params?.prefillEmail, route?.params?.autoSendOtp]);

  useEffect(() => {
    // Countdown disables resend button for a short cooldown period.
    if (step !== 'otp' || resendSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, resendSeconds]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
            <Text style={s.tagline}>Track  Convert  Grow</Text>
          </View>

          <View style={s.card}>
            <Text style={s.title}>Welcome Back</Text>
            <Text style={s.subtitle}>Login with your email address</Text>

            {step === 'email' ? (
              <>
                <Text style={s.label}>Email Address</Text>
                <TextInput
                  style={s.input}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <TouchableOpacity style={[s.btn, loading && s.btnOff]} onPress={() => handleSendOTP()} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Send OTP</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={s.sentNote}>
                  <Text style={s.sentNoteText}>OTP sent to {email}</Text>
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
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verify and Login</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={s.link} onPress={() => { setStep('email'); setOtp(''); }}>
                  <Text style={s.linkText}>Change email</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.link}
                  onPress={() => handleSendOTP()}
                  disabled={loading || resendSeconds > 0}
                >
                  <Text style={[s.linkText, (loading || resendSeconds > 0) && s.linkTextDisabled]}>
                    {resendSeconds > 0 ? `Resend OTP in ${formatTime(resendSeconds)}` : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {step === 'email' ? (
            <View style={s.bottomRow}>
              <Text style={s.bottomText}>Do not have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={s.bottomLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          ) : null}
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
  appName: { fontSize: 30, fontWeight: '900', color: '#D7FAFF', lineHeight: 48 },
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
  title: { fontSize: 26, fontWeight: '900', color: COLORS.text, marginBottom: 4, lineHeight: 40 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 22 },
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
    marginBottom: 18,
  },
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
  linkTextDisabled: { color: '#7AA6B1' },

  bottomRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  bottomText: { color: '#A4DAE5', fontSize: 16 },
  bottomLink: { color: '#D8FBFF', fontSize: 16, fontWeight: '900' },
});

export default LoginScreen;
