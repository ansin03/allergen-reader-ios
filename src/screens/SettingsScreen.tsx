import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  TextInput, StyleSheet, Alert,
} from 'react-native';
import { Allergen, AllergenSeverity } from '../types';
import { SEVERITY_CONFIG } from '../constants';

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
        <TouchableOpacity style={styles.guestBanner} onPress={onSignIn}>
          <Text style={styles.guestBannerTitle}>You're using EatSurely as a guest</Text>
          <Text style={styles.guestBannerSub}>Sign in to sync your allergen profile across devices →</Text>
        </TouchableOpacity>
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
              trackColor={{ true: '#43a047' }} />
            <TouchableOpacity onPress={() => confirmRemove(a)} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={styles.addSection}>
        <Text style={styles.addTitle}>Add Allergen</Text>
        <TextInput style={styles.input} placeholder="Allergen name" value={newName}
          onChangeText={setNewName} />
        <View style={styles.severityRow}>
          {(['fatal', 'intolerance', 'mild'] as AllergenSeverity[]).map(s => (
            <TouchableOpacity key={s} style={[styles.severityBtn, newSeverity === s && styles.severityBtnActive]}
              onPress={() => setNewSeverity(s)}>
              <Text style={[styles.severityBtnText, newSeverity === s && styles.severityBtnTextActive]}>
                {SEVERITY_CONFIG[s].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>{isGuest ? 'Sign In / Create Account' : 'Sign Out'}</Text>
      </TouchableOpacity>

      {!isGuest && (
        <TouchableOpacity
          style={styles.deleteAccountBtn}
          onPress={confirmDeleteAccount}
          disabled={deleting}
        >
          <Text style={styles.deleteAccountText}>
            {deleting ? 'Deleting Account…' : 'Delete Account'}
          </Text>
        </TouchableOpacity>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#f8fafc' },
  content:             { padding: 20, paddingBottom: 40 },
  heading:             { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  row:                 { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  emoji:               { fontSize: 24, marginRight: 12 },
  rowInfo:             { flex: 1 },
  rowName:             { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  badge:               { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  badgeText:           { fontSize: 11, fontWeight: '600' },
  removeBtn:           { marginLeft: 8, padding: 4 },
  removeBtnText:       { color: '#94a3b8', fontSize: 16 },
  addSection:          { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16, marginBottom: 16 },
  addTitle:            { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  input:               { borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12 },
  severityRow:         { flexDirection: 'row', gap: 8, marginBottom: 12 },
  severityBtn:         { flex: 1, borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  severityBtnActive:   { borderColor: '#43a047', backgroundColor: '#e8f5e9' },
  severityBtnText:     { fontSize: 12, fontWeight: '600', color: '#64748b' },
  severityBtnTextActive: { color: '#43a047' },
  addBtn:              { backgroundColor: '#43a047', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  addBtnText:          { color: '#fff', fontWeight: '700', fontSize: 15 },
  guestBanner:         { backgroundColor: '#e8f5e9', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#c8e6c9' },
  guestBannerTitle:    { fontSize: 14, fontWeight: '700', color: '#1b5e20', marginBottom: 4 },
  guestBannerSub:      { fontSize: 13, color: '#2e7d32' },
  logoutBtn:           { borderWidth: 2, borderColor: '#fca5a5', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  logoutText:          { color: '#ef4444', fontWeight: '700', fontSize: 15 },
  deleteAccountBtn:    { borderWidth: 2, borderColor: '#fca5a5', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 12, backgroundColor: '#fee2e2' },
  deleteAccountText:   { color: '#b91c1c', fontWeight: '700', fontSize: 15 },
});
