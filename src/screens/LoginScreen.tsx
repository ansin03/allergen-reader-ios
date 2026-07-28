import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { authApi, setToken } from '../services/api';
import PressRing from '../components/PressRing';

const PURPLE = '#6D28D9';
const PURPLE_DARK = '#2E1065';
const BLACK = '#111827';
const GRAY = '#6B7280';
const MUTED = '#9CA3AF';
const BORDER = '#E5E7EB';

interface Props {
  onAuth: (name: string, email: string, hasOnboarded: boolean) => void;
  onGuest: () => void;
}

type Screen = 'auth' | 'forgot' | 'reset';

export default function LoginScreen({ onAuth, onGuest }: Props) {
  const [mode,           setMode]           = useState<'login' | 'signup'>('login');
  const [screen,         setScreen]         = useState<Screen>('auth');
  const [name,           setName]           = useState('');
  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [otp,            setOtp]            = useState('');
  const [newPassword,    setNewPassword]    = useState('');
  const [error,          setError]          = useState('');
  const [info,           setInfo]           = useState('');
  const [loading,        setLoading]        = useState(false);

  const handleSubmit = async () => {
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    if (mode === 'signup' && password !== retypePassword) {
      setError('Passwords do not match.'); return;
    }
    setError(''); setLoading(true);
    try {
      const res = mode === 'signup'
        ? await authApi.signup(name.trim(), email.trim(), password)
        : await authApi.login(email.trim(), password);
      await setToken(res.token);
      onAuth(res.user.name, res.user.email, res.user.hasOnboarded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) { setError('Enter your email address first.'); return; }
    setError(''); setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setInfo(`A 6-digit code was sent to ${email.trim()}`);
      setScreen('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError(''); setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), otp.trim(), newPassword);
      setInfo('');
      setOtp(''); setNewPassword('');
      setScreen('auth');
      setError('');
      setInfo('Password updated! Please sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (screen === 'reset') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.inner}>
          <View style={styles.logoBox}><Text style={styles.logoEmoji}>🔑</Text></View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter the code sent to your email</Text>
          <View style={styles.card}>
            {!!info && <Text style={styles.infoMsg}>{info}</Text>}
            <TextInput style={styles.input} placeholder="6-digit code" value={otp}
              onChangeText={setOtp} keyboardType="number-pad" maxLength={6} placeholderTextColor={MUTED} />
            <TextInput style={styles.input} placeholder="New password (min 6 chars)" value={newPassword}
              onChangeText={setNewPassword} secureTextEntry placeholderTextColor={MUTED} />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <PressRing borderRadius={16} onPress={handleReset} disabled={loading} style={styles.button}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Set New Password</Text>}
            </PressRing>
            <PressRing borderRadius={8} onPress={() => { setScreen('forgot'); setError(''); setInfo(''); }} style={styles.linkRow}>
              <Text style={styles.link}>Resend code</Text>
            </PressRing>
            <PressRing borderRadius={8} onPress={() => { setScreen('auth'); setError(''); setInfo(''); }} style={styles.linkRow}>
              <Text style={styles.link}>Back to sign in</Text>
            </PressRing>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (screen === 'forgot') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.inner}>
          <View style={styles.logoBox}><Text style={styles.logoEmoji}>📧</Text></View>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>We'll send a reset code to your email</Text>
          <View style={styles.card}>
            <TextInput style={styles.input} placeholder="Email address" value={email}
              onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoFocus
              placeholderTextColor={MUTED} />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <PressRing borderRadius={16} onPress={handleForgot} disabled={loading} style={styles.button}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Reset Code</Text>}
            </PressRing>
            <PressRing borderRadius={8} onPress={() => { setScreen('auth'); setError(''); }} style={styles.linkRow}>
              <Text style={styles.link}>Back to sign in</Text>
            </PressRing>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🛡️</Text>
        </View>
        <Text style={styles.title}>EatSurely</Text>
        <Text style={styles.subtitle}>Food Allergen Scanner</Text>

        <View style={styles.card}>
          <View style={styles.tabs}>
            {(['login', 'signup'] as const).map(m => (
              <PressRing key={m} borderRadius={12} containerStyle={styles.tabWrap}
                onPress={() => { setMode(m); setError(''); setInfo(''); setRetypePassword(''); }}
                style={[styles.tab, mode === m && styles.tabActive]}>
                <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              </PressRing>
            ))}
          </View>

          {!!info && <Text style={styles.infoMsg}>{info}</Text>}

          {mode === 'signup' && (
            <TextInput style={styles.input} placeholder="Your name" value={name}
              onChangeText={setName} autoCapitalize="words" placeholderTextColor={MUTED} />
          )}
          <TextInput style={styles.input} placeholder="Email address" value={email}
            onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
            placeholderTextColor={MUTED} />
          <TextInput style={styles.input} placeholder="Password" value={password}
            onChangeText={setPassword} secureTextEntry placeholderTextColor={MUTED} />
          {mode === 'signup' && (
            <TextInput style={styles.input} placeholder="Retype Password" value={retypePassword}
              onChangeText={setRetypePassword} secureTextEntry placeholderTextColor={MUTED} />
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <PressRing borderRadius={16} onPress={handleSubmit} disabled={loading} style={styles.button}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
            }
          </PressRing>

          {mode === 'login' && (
            <PressRing borderRadius={8} onPress={() => { setScreen('forgot'); setError(''); setInfo(''); }} style={styles.linkRow}>
              <Text style={styles.link}>Forgot password?</Text>
            </PressRing>
          )}
        </View>

        <PressRing borderRadius={12} onPress={onGuest} style={styles.guestBtn}>
          <Text style={styles.guestText}>Continue without an account</Text>
        </PressRing>
        <Text style={styles.guestNote}>Scan labels instantly — sign up later to sync your profile across devices</Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: PURPLE_DARK },
  inner:         { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  logoBox:       { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoEmoji:     { fontSize: 40 },
  title:         { fontSize: 34, fontWeight: '700', color: '#fff', marginBottom: 4, letterSpacing: -0.5 },
  subtitle:      { fontSize: 15, fontWeight: '400', color: 'rgba(255,255,255,0.6)', marginBottom: 32, letterSpacing: 0 },
  card:          { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 20 },
  tabs:          { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 16, padding: 4, marginBottom: 20, gap: 4 },
  tabWrap:       { flex: 1 },
  tab:           { paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  tabActive:     { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText:       { fontSize: 14, fontWeight: '600', color: GRAY },
  tabTextActive: { color: BLACK },
  input:         { borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontWeight: '400', marginBottom: 12, backgroundColor: '#FAFAFA', color: BLACK },
  error:         { color: '#f43f5e', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  infoMsg:       { color: '#059669', fontSize: 12, fontWeight: '600', marginBottom: 12, backgroundColor: '#d1fae5', borderRadius: 10, padding: 10 },
  button:        { backgroundColor: PURPLE, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  buttonText:    { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkRow:       { alignItems: 'center', marginTop: 16, paddingVertical: 4 },
  link:          { color: PURPLE, fontWeight: '700', fontSize: 14 },
  guestBtn:      { marginTop: 24, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24 },
  guestText:     { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 15, textDecorationLine: 'underline' },
  guestNote:     { color: 'rgba(255,255,255,0.45)', fontSize: 12, textAlign: 'center', marginTop: 6, paddingHorizontal: 32 },
});
