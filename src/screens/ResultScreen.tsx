import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ScanResult, Allergen, DetectedAllergen } from '../types';
import PressRing from '../components/PressRing';
import FadeIn from '../components/FadeIn';
import CountUp from '../components/CountUp';
import { GRADIENTS, RADIUS, glow } from '../theme';

const PURPLE = '#6D28D9';
const BLACK = '#111827';
const GRAY = '#6B7280';
const MUTED = '#9CA3AF';
const BORDER = '#E5E7EB';

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
  safe:    { bg: '#f0fdf4', border: '#86efac', text: '#166534', label: 'No Flagged Ingredients', emoji: '✅', gradient: 'safe'    as const, caption: 'Nothing in this product matches your allergen profile.' },
  warning: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', label: 'Possible Traces',         emoji: '⚠️', gradient: 'warning' as const, caption: 'Not an ingredient, but cross-contamination is possible.' },
  danger:  { bg: '#fff1f2', border: '#fca5a5', text: '#991b1b', label: 'Ingredients Flagged',     emoji: '🚨', gradient: 'danger'  as const, caption: 'This product contains ingredients you react to.' },
  unknown: { bg: '#F9FAFB', border: BORDER,    text: GRAY,      label: 'Ingredients Not Found',   emoji: '🔍', gradient: 'neutral' as const, caption: 'The ingredient list could not be read from this photo.' },
};

function matchesWholeWord(ingredientText: string, allergenName: string): boolean {
  const escaped = allergenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?<![a-zA-Z])${escaped}(?![a-zA-Z])`, 'i');
  return regex.test(ingredientText);
}

export default function ResultScreen({ result, allergens, imageUri, onScanAgain }: Props) {
  const enabledAllergens = allergens.filter(a => a.enabled);
  const enabledNames = enabledAllergens.map(a => a.name.toLowerCase());

  const filtered = result.detectedAllergens.filter(d =>
    d.matchedAllergens.some(m => enabledNames.includes(m.toLowerCase()))
  );

  const CLIENT_SYNONYMS: Record<string, string[]> = {
    'peanuts':   ['peanut', 'peanut flour', 'peanut butter', 'peanut oil', 'peanut protein', 'groundnut', 'groundnuts', 'ground nut', 'arachis oil', 'monkey nuts', 'mixed nuts'],
    'dairy':     ['milk', 'whey', 'casein', 'caseinate', 'lactose', 'butter', 'cream', 'cheese', 'yogurt', 'yoghurt', 'lactalbumin', 'lactoglobulin', 'ghee', 'kefir', 'milk protein', 'whey protein', 'milk solids', 'milk powder', 'buttermilk'],
    'gluten':    ['wheat', 'barley', 'rye', 'oats', 'spelt', 'semolina', 'malt', 'triticale', 'durum', 'farro', 'kamut', 'seitan', 'bulgur', 'couscous'],
    'eggs':      ['egg', 'albumin', 'albumen', 'mayonnaise', 'meringue', 'ovalbumin', 'lysozyme'],
    'soy':       ['soya', 'soybean', 'soy protein', 'soy flour', 'soy milk', 'tofu', 'tempeh', 'miso', 'edamame', 'tamari', 'shoyu', 'soy lecithin', 'tvp'],
    'tree nuts': ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut', 'pine nut', 'chestnut', 'coconut', 'praline', 'marzipan'],
    'shellfish': ['shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'scampi', 'krill'],
    'fish':      ['cod', 'salmon', 'tuna', 'halibut', 'anchovy', 'sardine', 'mackerel', 'herring', 'trout', 'haddock', 'tilapia', 'pollock', 'fish sauce', 'surimi'],
    'sesame':    ['sesame', 'tahini', 'sesame oil', 'sesame seed', 'gingelly', 'til'],
    'mustard':   ['mustard', 'mustard seed', 'mustard powder', 'mustard oil'],
    'celery':    ['celery', 'celeriac', 'celery seed', 'celery salt'],
    'lupin':     ['lupin', 'lupine', 'lupin flour', 'lupin bean'],
    'sulphites': ['sulphur dioxide', 'sulfur dioxide', 'sodium sulphite', 'sodium sulfite', 'sodium metabisulphite', 'sodium metabisulfite', 'e220', 'e221', 'e222', 'e223', 'e224'],
    'molluscs':  ['squid', 'octopus', 'clam', 'oyster', 'mussel', 'scallop', 'abalone', 'cuttlefish'],
  };

  const ingredientMatchesAllergen = (ingredient: string, allergenName: string): boolean => {
    const key = allergenName.toLowerCase();
    if (matchesWholeWord(ingredient, key)) return true;
    const root = key.replace(/s$/, '');
    if (root.length >= 3 && matchesWholeWord(ingredient, root)) return true;
    const synonyms = CLIENT_SYNONYMS[key] ?? [];
    return synonyms.some(s => matchesWholeWord(ingredient, s));
  };

  const missedByAi: DetectedAllergen[] = [];
  const alreadyCaught = new Set(filtered.map(d => d.ingredient.toLowerCase()));
  for (const allergen of enabledAllergens) {
    for (const ingredient of result.ingredients) {
      const ingLower = ingredient.toLowerCase();
      if (!alreadyCaught.has(ingLower) && ingredientMatchesAllergen(ingredient, allergen.name)) {
        missedByAi.push({ ingredient, matchedAllergens: [allergen.name], explanation: `Contains "${allergen.name}" (detected by ingredient scan)` });
        alreadyCaught.add(ingLower);
      }
    }
  }
  const allDetected = [...filtered, ...missedByAi];

  const filteredTrace = result.traceAllergens.filter(t =>
    t.allergens.some(a => enabledNames.includes(a.toLowerCase()))
  );

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
    : allDetected.length > 0 || hasFatalTrace ? 'danger'
    : filteredTrace.length > 0 ? 'warning'
    : 'safe';
  const cfg = RATING_CONFIG[rating];

  // Spring the verdict card in. Declared before the early return below so the
  // hook order stays stable across renders.
  const intro = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(intro, { toValue: 1, speed: 12, bounciness: 8, useNativeDriver: true }).start();
  }, [intro]);

  // Let the verdict land physically, before the user has read a word of it.
  useEffect(() => {
    if (rating === 'unknown') return; // ScanScreen already signalled this case
    Haptics.notificationAsync(
      rating === 'danger'  ? Haptics.NotificationFeedbackType.Error
      : rating === 'warning' ? Haptics.NotificationFeedbackType.Warning
      : Haptics.NotificationFeedbackType.Success,
    );
  }, [rating]);

  const cardScale   = intro.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
  const cardOpacity = intro.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });

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
        <PressRing borderRadius={18} onPress={onScanAgain} style={styles.scanAgainBtn}>
          <Text style={styles.scanAgainText}>Try Again</Text>
        </PressRing>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Animated.View
        style={[
          styles.verdictWrap,
          glow(GRADIENTS[cfg.gradient][1], 0.4, 22),
          { opacity: cardOpacity, transform: [{ scale: cardScale }] },
        ]}
      >
        <LinearGradient
          colors={GRADIENTS[cfg.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.verdictCard}
        >
          <View style={styles.verdictBlob} pointerEvents="none" />

          {imageUri && <Image source={{ uri: imageUri }} style={styles.scannedImage} />}

          <Text style={styles.verdictEmoji}>{cfg.emoji}</Text>
          <Text style={styles.verdictLabel}>{cfg.label}</Text>
          <Text style={styles.verdictCaption}>{cfg.caption}</Text>

          {/* Counts of what was actually found — no invented "safety score". */}
          <View style={styles.verdictStats}>
            <View style={styles.verdictStat}>
              <CountUp value={allDetected.length} style={styles.verdictStatNum} delay={280} />
              <Text style={styles.verdictStatLabel}>Flagged</Text>
            </View>
            <View style={styles.verdictStatDivider} />
            <View style={styles.verdictStat}>
              <CountUp value={filteredTrace.length} style={styles.verdictStatNum} delay={380} />
              <Text style={styles.verdictStatLabel}>Trace risks</Text>
            </View>
            <View style={styles.verdictStatDivider} />
            <View style={styles.verdictStat}>
              <CountUp value={result.ingredients.length} style={styles.verdictStatNum} delay={480} />
              <Text style={styles.verdictStatLabel}>Ingredients</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {allDetected.length > 0 && (
        <FadeIn delay={120} style={[styles.section, styles.dangerSection]}>
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
              <Text style={styles.fatalNoteText}>⚠️ This product contains a life-threatening allergen. Do not consume.</Text>
            </View>
          )}
        </FadeIn>
      )}

      {filteredTrace.length > 0 && (
        <FadeIn delay={190} style={[styles.section, styles.warningSection]}>
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
        </FadeIn>
      )}

      {result.ingredients.length > 0 && (
        <FadeIn delay={260} style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <Text style={styles.ingredients}>
            {highlightIngredients(result.ingredients, allDetected)}
          </Text>
        </FadeIn>
      )}

      <FadeIn delay={330}>
        <PressRing borderRadius={18} onPress={onScanAgain} style={styles.scanAgainBtn}>
          <Text style={styles.scanAgainText}>Scan Another</Text>
        </PressRing>

        <Text style={styles.footerDisclaimer}>
          Results are based on image analysis and may not be complete. Always check the product label before consuming.
        </Text>
      </FadeIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#fff' },
  content:            { padding: 20, paddingBottom: 40 },
  verdictWrap:        { borderRadius: RADIUS.xl, marginBottom: 20 },
  verdictCard:        { borderRadius: RADIUS.xl, padding: 24, alignItems: 'center', overflow: 'hidden' },
  verdictBlob:        { position: 'absolute', top: -70, right: -50, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(255,255,255,0.12)' },
  scannedImage:       { width: '100%', height: 150, borderRadius: RADIUS.md, marginBottom: 18, resizeMode: 'cover' },
  verdictEmoji:       { fontSize: 52, marginBottom: 10 },
  verdictLabel:       { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5 },
  verdictCaption:     { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 6, lineHeight: 19, paddingHorizontal: 8 },
  verdictStats:       { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginTop: 20, paddingTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)' },
  verdictStat:        { flex: 1, alignItems: 'center' },
  verdictStatNum:     { fontSize: 24, fontWeight: '800', color: '#fff' },
  verdictStatLabel:   { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  verdictStatDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.25)' },
  section:            { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  dangerSection:      { backgroundColor: '#fff1f2', borderColor: '#fca5a5' },
  warningSection:     { backgroundColor: '#fffbeb', borderColor: '#fcd34d' },
  sectionHeaderRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  sectionIcon:        { fontSize: 22, marginTop: 1 },
  sectionTitle:       { fontSize: 15, fontWeight: '700', color: BLACK, marginBottom: 2 },
  sectionSubtitle:    { fontSize: 12, color: GRAY },
  allergenRow:        { borderLeftWidth: 3, borderLeftColor: '#ef4444', paddingLeft: 12, marginBottom: 12 },
  allergenHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  allergenIngredient: { fontSize: 14, fontWeight: '700', color: BLACK, flex: 1 },
  severityTag:        { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  allergenMatches:    { fontSize: 12, color: '#ef4444', fontWeight: '600', marginTop: 2 },
  allergenExplanation:{ fontSize: 12, color: GRAY, marginTop: 2 },
  traceRow:           { borderLeftWidth: 3, borderLeftColor: '#f59e0b', paddingLeft: 12, marginBottom: 8 },
  traceAllergens:     { fontSize: 12, fontWeight: '700', color: '#92400e', marginBottom: 2 },
  traceWarning:       { fontSize: 13, color: '#78350f' },
  ingredients:        { fontSize: 13, color: GRAY, lineHeight: 20 },
  unknownContainer:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 36, backgroundColor: '#fff' },
  unknownEmoji:       { fontSize: 64, marginBottom: 20 },
  unknownTitle:       { fontSize: 22, fontWeight: '800', color: BLACK, textAlign: 'center', marginBottom: 12 },
  unknownText:        { fontSize: 15, color: GRAY, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  fatalNote:          { marginTop: 12, backgroundColor: '#fff7ed', borderRadius: 10, padding: 10, borderLeftWidth: 3, borderLeftColor: '#f97316' },
  fatalNoteText:      { fontSize: 12, color: '#9a3412', lineHeight: 17 },
  scanAgainBtn:       { backgroundColor: PURPLE, borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  scanAgainText:      { color: '#fff', fontWeight: '700', fontSize: 16 },
  footerDisclaimer:   { marginTop: 20, fontSize: 11, color: MUTED, textAlign: 'center', lineHeight: 16, paddingHorizontal: 8 },
});
