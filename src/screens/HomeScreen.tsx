import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Allergen, HistoryItem } from '../types';
import { SEVERITY_CONFIG } from '../constants';
import PressRing from '../components/PressRing';
import FadeIn from '../components/FadeIn';
import Pop from '../components/Pop';
import CountUp from '../components/CountUp';
import { COLORS, GRADIENTS, RADIUS, SHADOW, glow } from '../theme';

const PURPLE = COLORS.purple;
const PURPLE_LIGHT = COLORS.purpleLight;
const BLACK = COLORS.black;
const GRAY = COLORS.gray;
const MUTED = COLORS.muted;
const BORDER = COLORS.border;
const SURFACE = COLORS.surface;

interface Props {
  history: HistoryItem[];
  allergens: Allergen[];
  userName?: string;
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
  safe:    { label: '✓ Safe',    bg: '#dcfce7', color: '#166534' },
  warning: { label: '⚡ Caution', bg: '#fef9c3', color: '#854d0e' },
  danger:  { label: '⚠ Danger',  bg: '#fee2e2', color: '#991b1b' },
  unknown: { label: '🔍 Unknown', bg: SURFACE,   color: GRAY },
};

export default function HomeScreen({ history, allergens, userName, onStartScan, onViewResult, onGoToSettings }: Props) {
  const navigation = useNavigation<any>();
  const active = allergens.filter(a => a.enabled);
  const recent = history[0];
  const [showAbout, setShowAbout] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* About Modal */}
      <Modal visible={showAbout} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAbout(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>About EatSurely</Text>
            <PressRing borderRadius={10} onPress={() => setShowAbout(false)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>Done</Text>
            </PressRing>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalLogoBox}>
              <Text style={{ fontSize: 40 }}>🛡️</Text>
            </View>
            <Text style={styles.modalAppName}>EatSurely</Text>
            <Text style={styles.modalVersion}>Version 1.0.0 · Food Allergen Scanner</Text>

            <View style={styles.modalSection}>
              <Text style={styles.modalHeading}>HOW IT WORKS</Text>
              <Text style={styles.modalText}>
                EatSurely uses AI image recognition to scan product labels and flag ingredients that match your allergen profile.
              </Text>
            </View>

            <View style={styles.modalDivider} />

            <View style={styles.modalSection}>
              <Text style={styles.modalHeading}>IMPORTANT LIMITATIONS</Text>
              <Text style={styles.modalText}>
                Results are for informational purposes only and may not be complete or accurate due to image quality, labelling variations, or data limitations.{'\n\n'}
                Always read product packaging carefully and verify ingredients before consuming.{'\n\n'}
                If you have severe or life-threatening allergies, do not rely solely on this app. Consult a qualified healthcare professional for personalised guidance.{'\n\n'}
                This app does not provide medical or dietary advice.
              </Text>
            </View>

            <View style={styles.modalDivider} />

            <View style={styles.modalSection}>
              <Text style={styles.modalHeading}>MANUFACTURING & CROSS-CONTAMINATION</Text>
              <Text style={styles.modalText}>
                Manufacturing processes may change. Cross-contamination risks may not always be clearly identified on packaging. The "may contain" warnings shown in this app are based on what is printed on the label at the time of scanning.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Header */}
      <FadeIn style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.headline}>{userName ? userName : 'Welcome'}</Text>
        </View>
        <PressRing borderRadius={14} onPress={() => setShowAbout(true)} style={styles.shieldBadge}>
          <Text style={styles.shieldEmoji}>🛡️</Text>
        </PressRing>
      </FadeIn>


      {/* Stat strip */}
      <FadeIn delay={60} style={styles.statRow}>
        <View style={styles.stat}>
          <CountUp value={active.length} style={styles.statNumber} delay={220} />
          <Text style={styles.statLabel}>Active alerts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <CountUp value={history.length} style={styles.statNumber} delay={320} />
          <Text style={styles.statLabel}>Scans</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <CountUp
            value={history.filter(h => h.safetyRating === 'danger').length}
            style={[styles.statNumber, { color: COLORS.danger }]}
            delay={420}
          />
          <Text style={styles.statLabel}>Flagged</Text>
        </View>
      </FadeIn>

      {/* Hero Scan Button */}
      <FadeIn delay={120}>
        <PressRing
          borderRadius={RADIUS.xl}
          containerStyle={glow(COLORS.purpleDeep, 0.45, 22)}
          onPress={() => { onStartScan(); navigation.navigate('Scan'); }}
          style={styles.heroCta}
        >
          <LinearGradient
            colors={GRADIENTS.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Decorative light blooms */}
            <View style={styles.heroBlobA} pointerEvents="none" />
            <View style={styles.heroBlobB} pointerEvents="none" />

            <View style={styles.heroContent}>
              <View style={{ flex: 1 }}>
                <View style={styles.heroEyebrowPill}>
                  <Text style={styles.heroEyebrow}>AI-POWERED</Text>
                </View>
                <Text style={styles.heroTitle}>Scan a Label</Text>
                <Text style={styles.heroSubtitle}>Photo or upload — results in seconds</Text>
              </View>
              <View style={styles.heroIconCircle}>
                <Text style={styles.heroIcon}>📷</Text>
              </View>
            </View>
            <View style={styles.heroPillBtn}>
              <Text style={styles.heroPillText}>Open Scanner →</Text>
            </View>
          </LinearGradient>
        </PressRing>
      </FadeIn>

      {/* Your Allergen List */}
      <FadeIn delay={160} style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Your Allergen List</Text>
            <Text style={styles.cardSubtitle}>
              {active.length === 0
                ? 'No allergens configured'
                : `${active.length} active alert${active.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
          <PressRing borderRadius={10} onPress={() => navigation.navigate('Settings')} style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit</Text>
          </PressRing>
        </View>

        {active.length === 0 ? (
          <PressRing borderRadius={14} onPress={() => navigation.navigate('Settings')} style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Add your first allergen</Text>
          </PressRing>
        ) : (
          <View style={styles.chipGrid}>
            {active.map((a, i) => (
              // Cap the stagger so a long allergen list still fills in briskly.
              <Pop key={a.id} delay={260 + Math.min(i * 55, 500)}>
                <View style={[styles.chip, { backgroundColor: SEVERITY_CONFIG[a.severity].color }]}>
                  <Text style={styles.chipEmoji}>{a.emoji}</Text>
                  <Text style={[styles.chipText, { color: SEVERITY_CONFIG[a.severity].textColor }]}>{a.name}</Text>
                </View>
              </Pop>
            ))}
          </View>
        )}
      </FadeIn>

      {/* Last Scan */}
      {recent && (
        <FadeIn delay={230} style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Last Scan</Text>
              <Text style={styles.cardSubtitle}>
                {new Date(recent.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <View style={[styles.ratingPill, { backgroundColor: RATING_BADGE[recent.safetyRating].bg }]}>
              <Text style={[styles.ratingPillText, { color: RATING_BADGE[recent.safetyRating].color }]}>
                {RATING_BADGE[recent.safetyRating].label}
              </Text>
            </View>
          </View>
          <PressRing borderRadius={14} onPress={() => onViewResult(recent)} style={styles.recentRow}>
            {recent.imageUrl
              ? <Image source={{ uri: recent.imageUrl }} style={styles.recentImage} />
              : <View style={styles.recentImagePlaceholder}><Text style={{ fontSize: 28 }}>🏷️</Text></View>
            }
            <View style={styles.recentInfo}>
              {(() => {
                const detected = Array.isArray(recent.detectedAllergens) ? recent.detectedAllergens : [];
                return (
                  <>
                    <Text style={styles.recentName} numberOfLines={2}>
                      {recent.productName || (detected.length > 0
                        ? `${detected.length} allergen${detected.length !== 1 ? 's' : ''} detected`
                        : 'No allergens found')}
                    </Text>
                    {detected.length > 0 && (
                      <Text style={styles.recentAllergens} numberOfLines={1}>
                        {detected.map(d => Array.isArray(d.matchedAllergens) ? d.matchedAllergens : []).flat().join(', ')}
                      </Text>
                    )}
                  </>
                );
              })()}
            </View>
            <Text style={styles.chevron}>›</Text>
          </PressRing>
        </FadeIn>
      )}

      {/* Tip */}
      <FadeIn delay={300} style={styles.tip}>
        <Text style={styles.tipEmoji}>💡</Text>
        <Text style={styles.tipText}>
          The app flags ingredients commonly associated with your allergens — including scientific names like "casein" and "whey" for Dairy.
        </Text>
      </FadeIn>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: SURFACE },
  content:                { padding: 20, paddingTop: 56, paddingBottom: 40 },

  header:                 { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  greeting:               { fontSize: 13, fontWeight: '600', color: MUTED, marginBottom: 2, letterSpacing: 0.3, textTransform: 'uppercase' },
  headline:               { fontSize: 32, fontWeight: '800', color: BLACK, letterSpacing: -0.8 },
  shieldBadge:            { width: 46, height: 46, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...SHADOW.card },
  shieldEmoji:            { fontSize: 24 },

  statRow:                { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.lg, paddingVertical: 16, marginBottom: 16, ...SHADOW.card },
  stat:                   { flex: 1, alignItems: 'center' },
  statNumber:             { fontSize: 26, fontWeight: '800', color: PURPLE, letterSpacing: -0.5 },
  statLabel:              { fontSize: 11, fontWeight: '600', color: MUTED, marginTop: 2, letterSpacing: 0.3 },
  statDivider:            { width: 1, height: 28, backgroundColor: BORDER },

  heroCta:                { borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: 16 },
  heroGradient:           { padding: 22, overflow: 'hidden' },
  heroBlobA:              { position: 'absolute', top: -50, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.13)' },
  heroBlobB:              { position: 'absolute', bottom: -60, left: -40, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroContent:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  heroEyebrowPill:        { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.pill, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  heroEyebrow:            { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 1.2 },
  heroTitle:              { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.6, marginBottom: 4 },
  heroSubtitle:           { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
  heroIconCircle:         { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  heroIcon:               { fontSize: 30 },
  heroPillBtn:            { alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: RADIUS.md, paddingHorizontal: 18, paddingVertical: 11 },
  heroPillText:           { color: COLORS.purpleDeep, fontWeight: '800', fontSize: 14 },

  card:                   { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: 18, marginBottom: 12, ...SHADOW.card },
  cardHeader:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cardTitle:              { fontSize: 15, fontWeight: '700', color: BLACK },
  cardSubtitle:           { fontSize: 12, color: GRAY, marginTop: 2 },
  editBtn:                { backgroundColor: PURPLE_LIGHT, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText:            { fontSize: 12, fontWeight: '700', color: PURPLE },

  emptyState:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: BORDER, borderRadius: 14, padding: 16 },
  emptyStateText:         { fontSize: 14, fontWeight: '600', color: GRAY },

  chipGrid:               { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:                   { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 22, paddingHorizontal: 12, paddingVertical: 7 },
  chipEmoji:              { fontSize: 14 },
  chipText:               { fontSize: 13, fontWeight: '700' },

  ratingPill:             { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  ratingPillText:         { fontSize: 12, fontWeight: '700' },
  recentRow:              { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentImage:            { width: 56, height: 56, borderRadius: 14 },
  recentImagePlaceholder: { width: 56, height: 56, borderRadius: 14, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  recentInfo:             { flex: 1 },
  recentName:             { fontSize: 14, fontWeight: '700', color: BLACK, lineHeight: 20 },
  recentAllergens:        { fontSize: 12, color: '#ef4444', fontWeight: '600', marginTop: 3 },
  chevron:                { fontSize: 22, color: BORDER },

  tip:                    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: PURPLE_LIGHT, borderRadius: 16, padding: 16, borderLeftWidth: 3, borderLeftColor: PURPLE },
  tipEmoji:               { fontSize: 16, marginTop: 1 },
  tipText:                { flex: 1, fontSize: 13, color: '#4C1D95', lineHeight: 20 },

  // About modal
  modalContainer:         { flex: 1, backgroundColor: '#fff' },
  modalHeader:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  modalTitle:             { fontSize: 17, fontWeight: '800', color: BLACK },
  modalCloseBtn:          { backgroundColor: PURPLE_LIGHT, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  modalCloseText:         { fontSize: 14, fontWeight: '700', color: PURPLE },
  modalContent:           { padding: 24, paddingBottom: 48 },
  modalLogoBox:           { width: 72, height: 72, borderRadius: 22, backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  modalAppName:           { fontSize: 22, fontWeight: '900', color: BLACK, textAlign: 'center', marginBottom: 4 },
  modalVersion:           { fontSize: 12, color: MUTED, textAlign: 'center', marginBottom: 24 },
  modalSection:           { marginBottom: 4 },
  modalHeading:           { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 1, marginBottom: 8 },
  modalText:              { fontSize: 14, color: GRAY, lineHeight: 22 },
  modalDivider:           { height: 1, backgroundColor: BORDER, marginVertical: 20 },
});
