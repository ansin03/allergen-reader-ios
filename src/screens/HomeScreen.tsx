import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Allergen, HistoryItem } from '../types';
import { SEVERITY_CONFIG } from '../constants';

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
  unknown: { label: '🔍 Unknown', bg: '#f1f5f9', color: '#475569' },
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
            <Text style={styles.modalTitle}>About EatSurely AI</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowAbout(false)}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalLogoBox}>
              <Text style={{ fontSize: 40 }}>🛡️</Text>
            </View>
            <Text style={styles.modalAppName}>EatSurely AI</Text>
            <Text style={styles.modalVersion}>Version 1.0.0 · Food Allergen Scanner</Text>

            <View style={styles.modalSection}>
              <Text style={styles.modalHeading}>HOW IT WORKS</Text>
              <Text style={styles.modalText}>
                EatSurely AI uses AI image recognition to scan product labels and flag ingredients that match your allergen profile.
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
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.headline}>{userName ? userName : 'Welcome'}</Text>
        </View>
        <TouchableOpacity style={styles.shieldBadge} onPress={() => setShowAbout(true)} activeOpacity={0.7}>
          <Text style={styles.shieldEmoji}>🛡️</Text>
        </TouchableOpacity>
      </View>


      {/* Hero Scan Button */}
      <TouchableOpacity
        style={styles.heroCta}
        onPress={() => { onStartScan(); navigation.navigate('Scan'); }}
        activeOpacity={0.92}
      >
        <View style={styles.heroContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroEyebrow}>AI-POWERED</Text>
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
      </TouchableOpacity>

      {/* Your Allergen List */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Your Allergen List</Text>
            <Text style={styles.cardSubtitle}>
              {active.length === 0
                ? 'No allergens configured'
                : `${active.length} active alert${active.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {active.length === 0 ? (
          <TouchableOpacity style={styles.emptyState} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.emptyStateIcon}>➕</Text>
            <Text style={styles.emptyStateText}>Add your first allergen</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.chipGrid}>
            {active.map(a => (
              <View key={a.id} style={[styles.chip, { backgroundColor: SEVERITY_CONFIG[a.severity].color }]}>
                <Text style={styles.chipEmoji}>{a.emoji}</Text>
                <Text style={[styles.chipText, { color: SEVERITY_CONFIG[a.severity].textColor }]}>{a.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Last Scan */}
      {recent && (
        <View style={styles.card}>
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
          <TouchableOpacity style={styles.recentRow} onPress={() => onViewResult(recent)}>
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
          </TouchableOpacity>
        </View>
      )}

      {/* Tip */}
      <View style={styles.tip}>
        <Text style={styles.tipEmoji}>💡</Text>
        <Text style={styles.tipText}>
          The app flags ingredients commonly associated with your allergens — including scientific names like "casein" and "whey" for Dairy.
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: '#f1f5f9' },
  content:                { padding: 20, paddingTop: 56, paddingBottom: 40 },

  header:                 { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting:               { fontSize: 13, fontWeight: '500', color: '#94a3b8', marginBottom: 2 },
  headline:               { fontSize: 26, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  shieldBadge:            { width: 46, height: 46, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  shieldEmoji:            { fontSize: 24 },

  summaryPill:            { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 16, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  summaryText:            { fontSize: 13, fontWeight: '600', color: '#475569' },
  summaryDivider:         { width: 1, height: 14, backgroundColor: '#e2e8f0' },

  heroCta:                { borderRadius: 22, padding: 22, marginBottom: 14, backgroundColor: '#2e7d32' },
  heroContent:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  heroEyebrow:            { fontSize: 10, fontWeight: '800', color: '#81c784', letterSpacing: 1.5, marginBottom: 6 },
  heroTitle:              { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 4 },
  heroSubtitle:           { fontSize: 13, color: '#a5d6a7', lineHeight: 18 },
  heroIconCircle:         { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroIcon:               { fontSize: 28 },
  heroPillBtn:            { alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  heroPillText:           { color: '#2e7d32', fontWeight: '700', fontSize: 14 },

  card:                   { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardHeader:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cardTitle:              { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  cardSubtitle:           { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  editBtn:                { backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText:            { fontSize: 12, fontWeight: '700', color: '#43a047' },

  emptyState:             { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#e2e8f0', borderRadius: 14, padding: 16, justifyContent: 'center' },
  emptyStateIcon:         { fontSize: 18 },
  emptyStateText:         { fontSize: 14, fontWeight: '600', color: '#94a3b8' },

  chipGrid:               { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:                   { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 22, paddingHorizontal: 12, paddingVertical: 7 },
  chipEmoji:              { fontSize: 14 },
  chipText:               { fontSize: 13, fontWeight: '700' },

  ratingPill:             { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  ratingPillText:         { fontSize: 12, fontWeight: '700' },
  recentRow:              { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentImage:            { width: 56, height: 56, borderRadius: 14 },
  recentImagePlaceholder: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  recentInfo:             { flex: 1 },
  recentName:             { fontSize: 14, fontWeight: '700', color: '#0f172a', lineHeight: 20 },
  recentAllergens:        { fontSize: 12, color: '#ef4444', fontWeight: '600', marginTop: 3 },
  chevron:                { fontSize: 22, color: '#cbd5e1' },

  tip:                    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderLeftWidth: 3, borderLeftColor: '#43a047' },
  tipEmoji:               { fontSize: 16, marginTop: 1 },
  tipText:                { flex: 1, fontSize: 13, color: '#475569', lineHeight: 20 },

  // About modal
  modalContainer:         { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff' },
  modalTitle:             { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  modalCloseBtn:          { backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  modalCloseText:         { fontSize: 14, fontWeight: '700', color: '#43a047' },
  modalContent:           { padding: 24, paddingBottom: 48 },
  modalLogoBox:           { width: 72, height: 72, borderRadius: 22, backgroundColor: '#43a047', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  modalAppName:           { fontSize: 22, fontWeight: '900', color: '#0f172a', textAlign: 'center', marginBottom: 4 },
  modalVersion:           { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 24 },
  modalSection:           { marginBottom: 4 },
  modalHeading:           { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  modalText:              { fontSize: 14, color: '#475569', lineHeight: 22 },
  modalDivider:           { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },
});
