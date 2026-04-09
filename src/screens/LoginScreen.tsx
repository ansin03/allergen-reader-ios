import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { authApi, setToken } from '../services/api';

interface Props {
  onAuth: (name: string, email: string, hasOnboarded: boolean) => void;
}

type Screen = 'auth' | 'forgot' | 'reset';

export default function LoginScreen({ onAuth }: Props) {
  const [mode,        setMode]        = useState<'login' | 'signup'>('login');
  const [screen,      setScreen]      = useState<Screen>('auth');
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [otp,         setOtp]         = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error,       setError]       = useState('');
  const [info,        setInfo]        = useState('');
  const [loading,     setLoading]     = useState(false);

  const handleSubmit = async () => {
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
      // Show success by setting a one-time info on login screen
      setInfo('Password updated! Please sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset password step 2 ───────────────────────────────────────────────────
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
              onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
            <TextInput style={styles.input} placeholder="New password (min 6 chars)" value={newPassword}
              onChangeText={setNewPassword} secureTextEntry />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Set New Password</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow} onPress={() => { setScreen('forgot'); setError(''); setInfo(''); }}>
              <Text style={styles.link}>Resend code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow} onPress={() => { setScreen('auth'); setError(''); setInfo(''); }}>
              <Text style={styles.link}>Back to sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Forgot password step 1 ──────────────────────────────────────────────────
  if (screen === 'forgot') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.inner}>
          <View style={styles.logoBox}><Text style={styles.logoEmoji}>📧</Text></View>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>We'll send a reset code to your email</Text>

          <View style={styles.card}>
            <TextInput style={styles.input} placeholder="Email address" value={email}
              onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoFocus />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <TouchableOpacity style={styles.button} onPress={handleForgot} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>Send Reset Code</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow} onPress={() => { setScreen('auth'); setError(''); }}>
              <Text style={styles.link}>Back to sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Login / Signup ──────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🛡️</Text>
        </View>
        <Text style={styles.title}>AllergenSafe</Text>
        <Text style={styles.subtitle}>Your AI food guardian</Text>

        <View style={styles.card}>
          <View style={styles.tabs}>
            {(['login', 'signup'] as const).map(m => (
              <TouchableOpacity key={m} style={[styles.tab, mode === m && styles.tabActive]}
                onPress={() => { setMode(m); setError(''); setInfo(''); }}>
                <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {!!info && <Text style={styles.infoMsg}>{info}</Text>}

          {mode === 'signup' && (
            <TextInput style={styles.input} placeholder="Your name" value={name}
              onChangeText={setName} autoCapitalize="words" />
          )}
          <TextInput style={styles.input} placeholder="Email address" value={email}
            onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Password" value={password}
            onChangeText={setPassword} secureTextEntry />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
            }
          </TouchableOpacity>

          {mode === 'login' && (
            <TouchableOpacity style={styles.linkRow}
              onPress={() => { setScreen('forgot'); setError(''); setInfo(''); }}>
              <Text style={styles.link}>Forgot password?</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#1e1b4b' },
  inner:         { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  logoBox:       { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoEmoji:     { fontSize: 40 },
  title:         { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 4 },
  subtitle:      { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 32 },
  card:          { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 20 },
  tabs:          { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 16, padding: 4, marginBottom: 20 },
  tab:           { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabActive:     { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText:       { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  tabTextActive: { color: '#1e293b' },
  input:         { borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, fontWeight: '600', marginBottom: 12, backgroundColor: '#f8fafc' },
  error:         { color: '#f43f5e', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  infoMsg:       { color: '#059669', fontSize: 12, fontWeight: '600', marginBottom: 12, backgroundColor: '#d1fae5', borderRadius: 10, padding: 10 },
  button:        { backgroundColor: '#7c3aed', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  buttonText:    { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkRow:       { alignItems: 'center', marginTop: 16 },
  link:          { color: '#7c3aed', fontWeight: '700', fontSize: 14 },
});
