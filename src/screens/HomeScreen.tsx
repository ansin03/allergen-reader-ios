import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Allergen, HistoryItem } from '../types';
import { SEVERITY_CONFIG } from '../constants';

interface Props {
  history: HistoryItem[];
  allergens: Allergen[];
  onStartScan: () => void;
  onViewResult: (item: HistoryItem) => void;
  onGoToSettings: () => void;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const RATING_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  safe:    { label: '✓ Safe',    bg: '#d1fae5', color: '#065f46' },
  warning: { label: '⚡ Caution', bg: '#fef3c7', color: '#92400e' },
  danger:  { label: '⚠ Danger',  bg: '#fee2e2', color: '#991b1b' },
};

export default function HomeScreen({ history, allergens, onStartScan, onViewResult, onGoToSettings }: Props) {
  const active  = allergens.filter(a => a.enabled);
  const safe    = history.filter(h => h.safetyRating === 'safe').length;
  const warning = history.filter(h => h.safetyRating === 'warning').length;
  const danger  = history.filter(h => h.safetyRating === 'danger').length;
  const recent  = history[0];

  const stats = [
    { label: 'Total Scans', value: history.length, bg: '#ede9fe', color: '#5b21b6', icon: '📊' },
    { label: 'Safe',        value: safe,            bg: '#d1fae5', color: '#065f46', icon: '✅' },
    { label: 'Cautions',    value: warning,         bg: '#fef3c7', color: '#92400e', icon: '⚠️' },
    { label: 'Dangers',     value: danger,          bg: '#fee2e2', color: '#991b1b', icon: '🚨' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Greeting */}
      <Text style={styles.greeting}>{greeting()} 👋</Text>
      <Text style={styles.headline}>
        {active.length === 0
          ? 'Set up your allergen profile'
          : `Tracking ${active.length} allergen${active.length !== 1 ? 's' : ''}`}
      </Text>

      {/* Hero CTA */}
      <TouchableOpacity style={styles.heroCta} onPress={onStartScan}>
        <Text style={styles.heroLabel}>AI-POWERED SCANNER</Text>
        <Text style={styles.heroTitle}>Scan an Ingredient Label</Text>
        <Text style={styles.heroSubtitle}>Take a photo or upload any food image</Text>
        <View style={styles.heroBtn}>
          <Text style={styles.heroBtnText}>📷  Open Scanner</Text>
        </View>
      </TouchableOpacity>

      {/* Stats */}
      <View style={styles.statsGrid}>
        {stats.map(s => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Active Allergens */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>ACTIVE ALERTS</Text>
          <TouchableOpacity onPress={onGoToSettings}>
            <Text style={styles.cardAction}>Edit →</Text>
          </TouchableOpacity>
        </View>
        {active.length === 0 ? (
          <TouchableOpacity style={styles.emptyAllergens} onPress={onGoToSettings}>
            <Text style={styles.emptyAllergensText}>+ Add allergen alerts</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.allergenChips}>
            {active.map(a => (
              <View key={a.id} style={[styles.chip, { backgroundColor: SEVERITY_CONFIG[a.severity].color }]}>
                <Text style={[styles.chipText, { color: SEVERITY_CONFIG[a.severity].textColor }]}>
                  {a.emoji} {a.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Recent Scan */}
      {recent && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>LAST SCAN</Text>
          <TouchableOpacity style={styles.recentRow} onPress={() => onViewResult(recent)}>
            {recent.imageUrl
              ? <Image source={{ uri: recent.imageUrl }} style={styles.recentImage} />
              : <View style={styles.recentImagePlaceholder}><Text style={styles.recentImageEmoji}>🏷️</Text></View>
            }
            <View style={styles.recentInfo}>
              <View style={[styles.badge, { backgroundColor: RATING_BADGE[recent.safetyRating].bg }]}>
                <Text style={[styles.badgeText, { color: RATING_BADGE[recent.safetyRating].color }]}>
                  {RATING_BADGE[recent.safetyRating].label}
                </Text>
              </View>
              <Text style={styles.recentName} numberOfLines={1}>
                {recent.productName || (recent.detectedAllergens.length > 0
                  ? `${recent.detectedAllergens.length} allergen${recent.detectedAllergens.length !== 1 ? 's' : ''} detected`
                  : 'No allergens found')}
              </Text>
              <Text style={styles.recentDate}>
                {new Date(recent.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tip */}
      <View style={styles.tip}>
        <Text style={styles.tipLabel}>⚡ PRO TIP</Text>
        <Text style={styles.tipText}>
          Our AI recognises scientific names — "casein", "lactalbumin" and "whey" all trigger Dairy alerts.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: '#f8fafc' },
  content:                { padding: 20, paddingBottom: 40 },
  greeting:               { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 2 },
  headline:               { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  heroCta:                { borderRadius: 24, padding: 20, marginBottom: 16, backgroundColor: '#4338ca', overflow: 'hidden' },
  heroLabel:              { fontSize: 10, fontWeight: '800', color: '#a5b4fc', letterSpacing: 1.5, marginBottom: 6 },
  heroTitle:              { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSubtitle:           { fontSize: 13, color: '#c7d2fe', marginBottom: 14 },
  heroBtn:                { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  heroBtnText:            { color: '#fff', fontWeight: '700', fontSize: 14 },
  statsGrid:              { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard:               { width: '47%', borderRadius: 18, padding: 16 },
  statIcon:               { fontSize: 22, marginBottom: 8 },
  statValue:              { fontSize: 28, fontWeight: '900' },
  statLabel:              { fontSize: 11, fontWeight: '700', marginTop: 2, opacity: 0.7 },
  card:                   { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle:              { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
  cardAction:             { fontSize: 12, fontWeight: '700', color: '#7c3aed' },
  emptyAllergens:         { borderWidth: 2, borderStyle: 'dashed', borderColor: '#e2e8f0', borderRadius: 12, padding: 16, alignItems: 'center' },
  emptyAllergensText:     { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  allergenChips:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:                   { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipText:               { fontSize: 12, fontWeight: '700' },
  recentRow:              { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentImage:            { width: 52, height: 52, borderRadius: 12 },
  recentImagePlaceholder: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  recentImageEmoji:       { fontSize: 24 },
  recentInfo:             { flex: 1 },
  badge:                  { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  badgeText:              { fontSize: 11, fontWeight: '700' },
  recentName:             { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  recentDate:             { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  chevron:                { fontSize: 22, color: '#cbd5e1' },
  tip:                    { backgroundColor: '#f0fdf4', borderRadius: 16, padding: 16 },
  tipLabel:               { fontSize: 10, fontWeight: '800', color: '#059669', letterSpacing: 1, marginBottom: 6 },
  tipText:                { fontSize: 13, color: '#166534', lineHeight: 20 },
});
