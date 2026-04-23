import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ScanResult, Allergen, DetectedAllergen } from '../types';


function highlightIngredients(ingredients: string[], detected: DetectedAllergen[]) {
  const matchedIngredients = detected.map(d => d.ingredient.toLowerCase().trim());

  const isHighlighted = (ingredient: string) => {
    const ing = ingredient.toLowerCase().trim();
    return matchedIngredients.some(m => ing === m || ing.includes(m) || m.includes(ing));
  };

  return (
    <>
      {ingredients.map((ingredient, i) => {
        const separator = i < ingredients.length - 1 ? ', ' : '';
        return isHighlighted(ingredient)
          ? <Text key={i}><Text style={{ backgroundColor: '#fef08a', color: '#713f12', fontWeight: '700' }}>{ingredient}</Text>{separator}</Text>
          : <Text key={i}>{ingredient}{separator}</Text>;
      })}
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
  safe:    { bg: '#f0fdf4', border: '#86efac', text: '#166534', label: 'No Flagged Ingredients', emoji: '✅' },
  warning: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', label: 'Possible Traces',         emoji: '⚠️' },
  danger:  { bg: '#fff1f2', border: '#fca5a5', text: '#991b1b', label: 'Ingredients Flagged',     emoji: '🚨' },
  unknown: { bg: '#f8fafc', border: '#cbd5e1', text: '#475569', label: 'Ingredients Not Found',   emoji: '🔍' },
};

// Returns true if ingredientText contains allergenName as a whole word / phrase,
// not as part of another word (e.g. "nut" does NOT match "coconut" or "peanut").
function matchesWholeWord(ingredientText: string, allergenName: string): boolean {
  const escaped = allergenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?<![a-zA-Z])${escaped}(?![a-zA-Z])`, 'i');
  return regex.test(ingredientText);
}

export default function ResultScreen({ result, allergens, imageUri, onScanAgain }: Props) {
  const enabledAllergens = allergens.filter(a => a.enabled);
  const enabledNames = enabledAllergens.map(a => a.name.toLowerCase());

  // AI-detected allergens that match enabled list (server already normalised names)
  const filtered = result.detectedAllergens.filter(d =>
    d.matchedAllergens.some(m => enabledNames.includes(m.toLowerCase()))
  );

  // Client-side synonym dictionary — mirrors server, used for fallback detection
  const CLIENT_SYNONYMS: Record<string, string[]> = {
    'peanuts':   ['peanut', 'peanut flour', 'peanut butter', 'peanut oil', 'peanut protein',
                  'groundnut', 'groundnuts', 'ground nut', 'arachis oil', 'monkey nuts', 'mixed nuts'],
    'dairy':     ['milk', 'whey', 'casein', 'caseinate', 'lactose', 'butter', 'cream', 'cheese',
                  'yogurt', 'yoghurt', 'lactalbumin', 'lactoglobulin', 'ghee', 'kefir',
                  'milk protein', 'whey protein', 'milk solids', 'milk powder', 'buttermilk'],
    'gluten':    ['wheat', 'barley', 'rye', 'oats', 'spelt', 'semolina', 'malt', 'triticale',
                  'durum', 'farro', 'kamut', 'seitan', 'bulgur', 'couscous'],
    'eggs':      ['egg', 'albumin', 'albumen', 'mayonnaise', 'meringue', 'ovalbumin', 'lysozyme'],
    'soy':       ['soya', 'soybean', 'soy protein', 'soy flour', 'soy milk', 'tofu', 'tempeh',
                  'miso', 'edamame', 'tamari', 'shoyu', 'soy lecithin', 'tvp'],
    'tree nuts': ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia',
                  'brazil nut', 'pine nut', 'chestnut', 'coconut', 'praline', 'marzipan'],
    'shellfish': ['shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'scampi', 'krill'],
    'fish':      ['cod', 'salmon', 'tuna', 'halibut', 'anchovy', 'sardine', 'mackerel', 'herring',
                  'trout', 'haddock', 'tilapia', 'pollock', 'fish sauce', 'surimi'],
    'sesame':    ['sesame', 'tahini', 'sesame oil', 'sesame seed', 'gingelly', 'til'],
    'mustard':   ['mustard', 'mustard seed', 'mustard powder', 'mustard oil'],
    'celery':    ['celery', 'celeriac', 'celery seed', 'celery salt'],
    'lupin':     ['lupin', 'lupine', 'lupin flour', 'lupin bean'],
    'sulphites': ['sulphur dioxide', 'sulfur dioxide', 'sodium sulphite', 'sodium sulfite',
                  'sodium metabisulphite', 'sodium metabisulfite', 'e220', 'e221', 'e222', 'e223', 'e224'],
    'molluscs':  ['squid', 'octopus', 'clam', 'oyster', 'mussel', 'scallop', 'abalone', 'cuttlefish'],
  };

  // Returns true if ingredient text matches the allergen — checks name, root (de-pluralised), and synonyms
  const ingredientMatchesAllergen = (ingredient: string, allergenName: string): boolean => {
    const key = allergenName.toLowerCase();
    // Direct whole-word match on allergen name
    if (matchesWholeWord(ingredient, key)) return true;
    // De-pluralise: "Peanuts" → "Peanut", "Eggs" → "Egg"
    const root = key.replace(/s$/, '');
    if (root.length >= 3 && matchesWholeWord(ingredient, root)) return true;
    // Synonym match
    const synonyms = CLIENT_SYNONYMS[key] ?? [];
    return synonyms.some(s => matchesWholeWord(ingredient, s));
  };

  // Client-side fallback: catch anything the AI may have missed
  const missedByAi: DetectedAllergen[] = [];
  const alreadyCaught = new Set(filtered.map(d => d.ingredient.toLowerCase()));
  for (const allergen of enabledAllergens) {
    for (const ingredient of result.ingredients) {
      const ingLower = ingredient.toLowerCase();
      if (!alreadyCaught.has(ingLower) && ingredientMatchesAllergen(ingredient, allergen.name)) {
        missedByAi.push({
          ingredient,
          matchedAllergens: [allergen.name],
          explanation: `Contains "${allergen.name}" (detected by ingredient scan)`,
        });
        alreadyCaught.add(ingLower);
      }
    }
  }
  const allDetected = [...filtered, ...missedByAi];

  const filteredTrace = result.traceAllergens.filter(t =>
    t.allergens.some(a => enabledNames.includes(a.toLowerCase()))
  );

  // Severity-aware safety rating:
  // — fatal allergen detected directly     → danger
  // — any allergen detected directly       → danger
  // — fatal allergen in trace/may-contain  → danger (not just warning — too risky)
  // — any allergen in trace/may-contain    → warning
  // — nothing found                        → safe
  function getSeverity(matchedNames: string[]): string {
    for (const m of matchedNames) {
      const allergen = allergens.find(a => a.name.toLowerCase() === m.toLowerCase());
      if (allergen) return allergen.severity;
    }
    return 'mild';
  }

  const hasFatalTrace = filteredTrace.some(t => getSeverity(t.allergens) === 'fatal');

  const rating = result.ingredientsVisible === false
    ? 'unknown'
    : allDetected.length > 0 || hasFatalTrace
      ? 'danger'
      : filteredTrace.length > 0
        ? 'warning'
        : 'safe';
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
        </View>
      )}

      {/* ── Direct allergen matches ── */}
      {allDetected.length > 0 && (
        <View style={[styles.section, styles.dangerSection]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionIcon}>🚨</Text>
            <View>
              <Text style={[styles.sectionTitle, { color: '#991b1b' }]}>Contains Your Allergens</Text>
              <Text style={styles.sectionSubtitle}>These ingredients are directly in this product</Text>
            </View>
          </View>
          {allDetected.map((d, i) => {
            const severity = getSeverity(d.matchedAllergens);
            const severityStyle = severity === 'fatal'
              ? { color: '#b91c1c', label: 'FATAL' }
              : severity === 'intolerance'
              ? { color: '#c2410c', label: 'INTOLERANCE' }
              : { color: '#a16207', label: 'MILD' };
            return (
              <View key={i} style={styles.allergenRow}>
                <View style={styles.allergenHeader}>
                  <Text style={styles.allergenIngredient}>{d.ingredient}</Text>
                  <Text style={[styles.severityTag, { color: severityStyle.color }]}>{severityStyle.label}</Text>
                </View>
                <Text style={styles.allergenMatches}>{d.matchedAllergens.join(', ')}</Text>
                <Text style={styles.allergenExplanation}>{d.explanation}</Text>
              </View>
            );
          })}
          {allDetected.some(d => getSeverity(d.matchedAllergens) === 'fatal') && (
            <View style={styles.fatalNote}>
              <Text style={styles.fatalNoteText}>
                ⚠️ This product contains a life-threatening allergen. Do not consume.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Cross-contamination warnings ── */}
      {filteredTrace.length > 0 && (
        <View style={[styles.section, styles.warningSection]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionIcon}>⚠️</Text>
            <View>
              <Text style={[styles.sectionTitle, { color: '#92400e' }]}>Cross-Contamination Risk</Text>
              <Text style={styles.sectionSubtitle}>Not an ingredient, but produced near your allergens</Text>
            </View>
          </View>
          {filteredTrace.map((t, i) => (
            <View key={i} style={styles.traceRow}>
              <Text style={styles.traceAllergens}>{t.allergens.join(', ')}</Text>
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

      <Text style={styles.footerDisclaimer}>
        Results are based on image analysis and may not be complete. Always check the product label before consuming.
      </Text>
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
  dangerSection:      { backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fca5a5' },
  warningSection:     { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d' },
  sectionHeaderRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  sectionIcon:        { fontSize: 22, marginTop: 1 },
  sectionTitle:       { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  sectionSubtitle:    { fontSize: 12, color: '#64748b' },
  allergenRow:        { borderLeftWidth: 3, borderLeftColor: '#ef4444', paddingLeft: 12, marginBottom: 12 },
  allergenHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  allergenIngredient: { fontSize: 14, fontWeight: '700', color: '#1e293b', flex: 1 },
  severityTag:        { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  allergenMatches:    { fontSize: 12, color: '#ef4444', fontWeight: '600', marginTop: 2 },
  allergenExplanation:{ fontSize: 12, color: '#64748b', marginTop: 2 },
  traceRow:           { borderLeftWidth: 3, borderLeftColor: '#f59e0b', paddingLeft: 12, marginBottom: 8 },
  traceAllergens:     { fontSize: 12, fontWeight: '700', color: '#92400e', marginBottom: 2 },
  traceWarning:       { fontSize: 13, color: '#78350f' },
  ingredients:        { fontSize: 13, color: '#475569', lineHeight: 20 },
  unknownContainer:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 36, backgroundColor: '#f8fafc' },
  unknownEmoji:       { fontSize: 64, marginBottom: 20 },
  unknownTitle:       { fontSize: 22, fontWeight: '800', color: '#1e293b', textAlign: 'center', marginBottom: 12 },
  unknownText:        { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  fatalNote:          { marginTop: 12, backgroundColor: '#fff7ed', borderRadius: 10, padding: 10, borderLeftWidth: 3, borderLeftColor: '#f97316' },
  fatalNoteText:      { fontSize: 12, color: '#9a3412', lineHeight: 17 },
  scanAgainBtn:       { backgroundColor: '#43a047', borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  scanAgainText:      { color: '#fff', fontWeight: '700', fontSize: 16 },
  footerDisclaimer:   { marginTop: 20, fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 16, paddingHorizontal: 8 },
});
