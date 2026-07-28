import React, { useState } from 'react';
import {
  View, Text, ScrollView, Switch,
  TextInput, StyleSheet, Alert,
} from 'react-native';
import { Allergen, AllergenSeverity } from '../types';
import { SEVERITY_CONFIG } from '../constants';
import PressRing from '../components/PressRing';

const PURPLE = '#6D28D9';
const PURPLE_LIGHT = '#EDE9FE';
const BLACK = '#111827';
const GRAY = '#6B7280';
const MUTED = '#9CA3AF';
const BORDER = '#E5E7EB';

interface Props {
  allergens: Allergen[];
  onToggle: (id: string) => void;
  onAdd: (name: string, severity: AllergenSeverity) => void;
  onRemove: (id: string) => void;
  onLogout: () => void;
  onDeleteAccount: () => Promise<void>;
  isGuest: boolean;
  onSignIn: () => void;
}

export default function SettingsScreen({ allergens, onToggle, onAdd, onRemove, onLogout, onDeleteAccount, isGuest, onSignIn }: Props) {
  const [newName,     setNewName]     = useState('');
  const [newSeverity, setNewSeverity] = useState<AllergenSeverity>('mild');
  const [deleting,    setDeleting]    = useState(false);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), newSeverity);
    setNewName('');
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await onDeleteAccount();
            } catch {
              setDeleting(false);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ],
    );
  };

  const confirmRemove = (a: Allergen) => {
    Alert.alert('Remove Allergen', `Remove ${a.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onRemove(a.id) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isGuest && (
        <PressRing borderRadius={14} onPress={onSignIn} style={styles.guestBanner}>
          <Text style={styles.guestBannerTitle}>You're using EatSurely as a guest</Text>
          <Text style={styles.guestBannerSub}>Sign in to sync your allergen profile across devices →</Text>
        </PressRing>
      )}

      <Text style={styles.heading}>My Allergens</Text>

      {allergens.map(a => {
        const cfg = SEVERITY_CONFIG[a.severity];
        return (
          <View key={a.id} style={styles.row}>
            <Text style={styles.emoji}>{a.emoji}</Text>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{a.name}</Text>
              <View style={[styles.badge, { backgroundColor: cfg.color }]}>
                <Text style={[styles.badgeText, { color: cfg.textColor }]}>{cfg.label}</Text>
              </View>
            </View>
            <Switch value={a.enabled} onValueChange={() => onToggle(a.id)}
              trackColor={{ true: PURPLE }} thumbColor="#fff" />
            <PressRing borderRadius={6} onPress={() => confirmRemove(a)} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>✕</Text>
            </PressRing>
          </View>
        );
      })}

      <View style={styles.addSection}>
        <Text style={styles.addTitle}>Add Allergen</Text>
        <TextInput style={styles.input} placeholder="Allergen name" value={newName}
          onChangeText={setNewName} placeholderTextColor={MUTED} />
        <View style={styles.severityRow}>
          {(['fatal', 'intolerance', 'mild'] as AllergenSeverity[]).map(s => (
            <PressRing key={s} borderRadius={10} containerStyle={styles.flexOne}
              onPress={() => setNewSeverity(s)}
              style={[styles.severityBtn, newSeverity === s && styles.severityBtnActive]}>
              <Text style={[styles.severityBtnText, newSeverity === s && styles.severityBtnTextActive]}>
                {SEVERITY_CONFIG[s].label}
              </Text>
            </PressRing>
          ))}
        </View>
        <PressRing borderRadius={12} onPress={handleAdd} style={styles.addBtn}>
          <Text style={styles.addBtnText}>Add</Text>
        </PressRing>
      </View>

      <PressRing borderRadius={16} onPress={onLogout} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>{isGuest ? 'Sign In / Create Account' : 'Sign Out'}</Text>
      </PressRing>

      {!isGuest && (
        <PressRing borderRadius={16} onPress={confirmDeleteAccount} disabled={deleting} style={styles.deleteAccountBtn}>
          <Text style={styles.deleteAccountText}>
            {deleting ? 'Deleting Account…' : 'Delete Account'}
          </Text>
        </PressRing>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:             { flex: 1, backgroundColor: '#fff' },
  content:               { padding: 20, paddingBottom: 40 },
  heading:               { fontSize: 28, fontWeight: '700', color: BLACK, marginBottom: 16, letterSpacing: -0.4 },
  row:                   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: BORDER },
  emoji:                 { fontSize: 24, marginRight: 12 },
  rowInfo:               { flex: 1 },
  rowName:               { fontSize: 15, fontWeight: '700', color: BLACK },
  badge:                 { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  badgeText:             { fontSize: 11, fontWeight: '600' },
  removeBtn:             { marginLeft: 8, padding: 6 },
  removeBtnText:         { color: MUTED, fontSize: 16 },
  addSection:            { backgroundColor: '#FAFAFA', borderRadius: 16, padding: 16, marginTop: 16, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  addTitle:              { fontSize: 16, fontWeight: '700', color: BLACK, marginBottom: 12 },
  input:                 { borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12, color: BLACK, backgroundColor: '#fff' },
  severityRow:           { flexDirection: 'row', gap: 8, marginBottom: 12 },
  flexOne:               { flex: 1 },
  severityBtn:           { borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  severityBtnActive:     { borderColor: PURPLE, backgroundColor: PURPLE_LIGHT },
  severityBtnText:       { fontSize: 12, fontWeight: '600', color: GRAY },
  severityBtnTextActive: { color: PURPLE },
  addBtn:                { backgroundColor: PURPLE, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  addBtnText:            { color: '#fff', fontWeight: '700', fontSize: 15 },
  guestBanner:           { backgroundColor: PURPLE_LIGHT, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#DDD6FE' },
  guestBannerTitle:      { fontSize: 14, fontWeight: '700', color: '#4C1D95', marginBottom: 4 },
  guestBannerSub:        { fontSize: 13, color: PURPLE },
  logoutBtn:             { borderWidth: 1.5, borderColor: '#fca5a5', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  logoutText:            { color: '#ef4444', fontWeight: '700', fontSize: 15 },
  deleteAccountBtn:      { borderWidth: 1.5, borderColor: '#fca5a5', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 12, backgroundColor: '#fee2e2' },
  deleteAccountText:     { color: '#b91c1c', fontWeight: '700', fontSize: 15 },
});
