import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ScanResult, Allergen, DetectedAllergen } from '../types';


function highlightIngredients(ingredients: string[], detected: DetectedAllergen[]) {
  const allergenIngredients = detected.map(d => d.ingredient.toLowerCase());
  const fullText = ingredients.join(', ');
  const parts: { text: string; highlight: boolean }[] = [];
  let remaining = fullText;

  while (remaining.length > 0) {
    let earliestIndex = -1;
    let earliestWord = '';
    for (const word of allergenIngredients) {
      const idx = remaining.toLowerCase().indexOf(word);
      if (idx !== -1 && (earliestIndex === -1 || idx < earliestIndex)) {
        earliestIndex = idx;
        earliestWord = word;
      }
    }
    if (earliestIndex === -1) {
      parts.push({ text: remaining, highlight: false });
      break;
    }
    if (earliestIndex > 0) parts.push({ text: remaining.slice(0, earliestIndex), highlight: false });
    parts.push({ text: remaining.slice(earliestIndex, earliestIndex + earliestWord.length), highlight: true });
    remaining = remaining.slice(earliestIndex + earliestWord.length);
  }

  return (
    <>
      {parts.map((p, i) =>
        p.highlight
          ? <Text key={i} style={{ backgroundColor: '#fef08a', color: '#713f12', fontWeight: '700' }}>{p.text}</Text>
          : <Text key={i}>{p.text}</Text>
      )}
    </>
  );
}

interface Props {
  result: ScanResult;
  allergens: Allergen[];
  imageUri?: string;
  onScanAgain: () => void;
}

const RATING_CONFIG = {
  safe:    { bg: '#f0fdf4', border: '#86efac', text: '#166534', label: 'All Clear',            emoji: '✅' },
  warning: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', label: 'Possible Traces',      emoji: '⚠️' },
  danger:  { bg: '#fff1f2', border: '#fca5a5', text: '#991b1b', label: 'Allergens Detected',   emoji: '🚨' },
  unknown: { bg: '#f8fafc', border: '#cbd5e1', text: '#475569', label: 'Ingredients Not Found', emoji: '🔍' },
};

export default function ResultScreen({ result, allergens, imageUri, onScanAgain }: Props) {
  const enabledNames = allergens.filter(a => a.enabled).map(a => a.name.toLowerCase());

  // AI-detected allergens that match enabled list
  const filtered = result.detectedAllergens.filter(d =>
    d.matchedAllergens.some(m => enabledNames.includes(m.toLowerCase()))
  );

  // Client-side fallback: scan ingredients for any enabled allergen the AI may have missed
  const missedByAi: DetectedAllergen[] = [];
  const alreadyCaught = new Set(filtered.map(d => d.ingredient.toLowerCase()));
  for (const allergenName of enabledNames) {
    for (const ingredient of result.ingredients) {
      if (ingredient.toLowerCase().includes(allergenName) && !alreadyCaught.has(ingredient.toLowerCase())) {
        missedByAi.push({
          ingredient,
          matchedAllergens: [allergens.find(a => a.name.toLowerCase() === allergenName)?.name ?? allergenName],
          explanation: `Contains "${allergenName}" (detected by ingredient scan)`,
        });
        alreadyCaught.add(ingredient.toLowerCase());
      }
    }
  }
  const allDetected = [...filtered, ...missedByAi];

  const filteredTrace = result.traceAllergens.filter(t =>
    t.allergens.some(a => enabledNames.includes(a.toLowerCase()))
  );

  const rating = result.ingredientsVisible === false
    ? 'unknown'
    : allDetected.length > 0 ? 'danger' : filteredTrace.length > 0 ? 'warning' : 'safe';
  const cfg = RATING_CONFIG[rating];

  if (rating === 'unknown') {
    const unknownConfig = {
      blurry:     { emoji: '📷', title: 'Photo Too Blurry', text: 'The image is not clear enough to safely read the ingredient list. Please retake a sharp, in-focus photo.' },
      incomplete: { emoji: '✂️', title: 'Ingredient List Cut Off', text: 'The ingredient list appears to be cut off or partially visible. Please retake to capture the full list.' },
      not_found:  { emoji: '🔍', title: 'No Ingredient List Found', text: 'The photo doesn\'t show an ingredient list. Please scan the back or side of the packaging where ingredients are listed.' },
    };
    const issue = result.imageIssue ?? 'not_found';
    const uc = unknownConfig[issue] ?? unknownConfig['not_found'];
    return (
      <View style={styles.unknownContainer}>
        <Text style={styles.unknownEmoji}>{uc.emoji}</Text>
        <Text style={styles.unknownTitle}>{uc.title}</Text>
        <Text style={styles.unknownText}>{uc.text}</Text>
        <TouchableOpacity style={styles.scanAgainBtn} onPress={onScanAgain}>
          <Text style={styles.scanAgainText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {rating !== 'unknown' && (
        <View style={[styles.ratingCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          {imageUri && <Image source={{ uri: imageUri }} style={styles.scannedImage} />}
          <Text style={styles.ratingEmoji}>{cfg.emoji}</Text>
          <Text style={[styles.ratingLabel, { color: cfg.text }]}>{cfg.label}</Text>
          {result.productName && <Text style={styles.productName}>{result.productName}</Text>}
        </View>
      )}

      {allDetected.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergens Found</Text>
          {allDetected.map((d, i) => (
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
          <Text style={styles.ingredients}>
            {highlightIngredients(result.ingredients, allDetected)}
          </Text>
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
  ratingCard:         { borderWidth: 2, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  scannedImage:       { width: '100%', height: 160, borderRadius: 12, marginBottom: 16, resizeMode: 'cover' },
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
  unknownContainer:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 36, backgroundColor: '#f8fafc' },
  unknownEmoji:       { fontSize: 64, marginBottom: 20 },
  unknownTitle:       { fontSize: 22, fontWeight: '800', color: '#1e293b', textAlign: 'center', marginBottom: 12 },
  unknownText:        { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  scanAgainBtn:       { backgroundColor: '#7c3aed', borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  scanAgainText:      { color: '#fff', fontWeight: '700', fontSize: 16 },
});
