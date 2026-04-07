import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ScanResult, Allergen } from '../types';

interface Props {
  result: ScanResult;
  allergens: Allergen[];
  onScanAgain: () => void;
}

const RATING_CONFIG = {
  safe:    { bg: '#f0fdf4', border: '#86efac', text: '#166534', label: 'All Clear',         emoji: '✅' },
  warning: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', label: 'Possible Traces',   emoji: '⚠️' },
  danger:  { bg: '#fff1f2', border: '#fca5a5', text: '#991b1b', label: 'Allergens Detected', emoji: '🚨' },
};

export default function ResultScreen({ result, allergens, onScanAgain }: Props) {
  const enabledNames = allergens.filter(a => a.enabled).map(a => a.name.toLowerCase());

  const filtered = result.detectedAllergens.filter(d =>
    d.matchedAllergens.some(m => enabledNames.includes(m.toLowerCase()))
  );
  const filteredTrace = result.traceAllergens.filter(t =>
    t.allergens.some(a => enabledNames.includes(a.toLowerCase()))
  );

  const rating = filtered.length > 0 ? 'danger' : filteredTrace.length > 0 ? 'warning' : 'safe';
  const cfg = RATING_CONFIG[rating];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.ratingCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
        <Text style={styles.ratingEmoji}>{cfg.emoji}</Text>
        <Text style={[styles.ratingLabel, { color: cfg.text }]}>{cfg.label}</Text>
        {result.productName && <Text style={styles.productName}>{result.productName}</Text>}
      </View>

      {filtered.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergens Found</Text>
          {filtered.map((d, i) => (
            <View key={i} style={styles.allergenRow}>
              <Text style={styles.allergenIngredient}>{d.ingredient}</Text>
              <Text style={styles.allergenMatches}>{d.matchedAllergens.join(', ')}</Text>
              <Text style={styles.allergenExplanation}>{d.explanation}</Text>
            </View>
          ))}
        </View>
      )}

      {filteredTrace.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cross-Contamination Warnings</Text>
          {filteredTrace.map((t, i) => (
            <View key={i} style={styles.traceRow}>
              <Text style={styles.traceWarning}>{t.warning}</Text>
            </View>
          ))}
        </View>
      )}

      {result.ingredients.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <Text style={styles.ingredients}>{result.ingredients.join(', ')}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.scanAgainBtn} onPress={onScanAgain}>
        <Text style={styles.scanAgainText}>Scan Another</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f8fafc' },
  content:            { padding: 20, paddingBottom: 40 },
  ratingCard:         { borderWidth: 2, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 },
  ratingEmoji:        { fontSize: 48, marginBottom: 8 },
  ratingLabel:        { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  productName:        { fontSize: 14, color: '#64748b', fontWeight: '600' },
  section:            { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle:       { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  allergenRow:        { borderLeftWidth: 3, borderLeftColor: '#ef4444', paddingLeft: 12, marginBottom: 12 },
  allergenIngredient: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  allergenMatches:    { fontSize: 12, color: '#ef4444', fontWeight: '600', marginTop: 2 },
  allergenExplanation:{ fontSize: 12, color: '#64748b', marginTop: 2 },
  traceRow:           { borderLeftWidth: 3, borderLeftColor: '#f59e0b', paddingLeft: 12, marginBottom: 8 },
  traceWarning:       { fontSize: 13, color: '#92400e' },
  ingredients:        { fontSize: 13, color: '#475569', lineHeight: 20 },
  scanAgainBtn:       { backgroundColor: '#7c3aed', borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  scanAgainText:      { color: '#fff', fontWeight: '700', fontSize: 16 },
});
