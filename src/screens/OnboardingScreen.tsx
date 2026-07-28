import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, Switch,
} from 'react-native';
import { Allergen, AllergenSeverity, Profile } from '../types';
import { DEFAULT_ALLERGENS, SEVERITY_CONFIG } from '../constants';
import PressRing from '../components/PressRing';
import GradientButton from '../components/GradientButton';
import Pop from '../components/Pop';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, glow } from '../theme';

const PURPLE = '#6D28D9';
const PURPLE_LIGHT = '#EDE9FE';
const BLACK = '#111827';
const GRAY = '#6B7280';
const MUTED = '#9CA3AF';
const BORDER = '#E5E7EB';

interface Props {
  onComplete: (profile: Profile) => void;
}

const STEPS = ['Welcome', 'Your Profile', 'Allergen Alerts', 'All Done!'];

const FEATURES = [
  ['📷', 'Scan labels with camera or photo upload'],
  ['🔬', 'AI detects allergens in seconds'],
  ['⚠️', 'Cross-contamination warnings'],
  ['📋', 'Full scan history'],
];

export default function OnboardingScreen({ onComplete }: Props) {
  const [step,               setStep]              = useState(0);
  const [profileName,        setProfileName]        = useState('');
  const [allergens,          setAllergens]          = useState<Allergen[]>(DEFAULT_ALLERGENS);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const toggle = (id: string) =>
    setAllergens(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));

  const setSeverity = (id: string, s: AllergenSeverity) =>
    setAllergens(prev => prev.map(a => a.id === id ? { ...a, severity: s } : a));

  const activeCount = allergens.filter(a => a.enabled).length;
  const canNext = step !== 1 || profileName.trim().length > 0;

  const complete = () => onComplete({
    id: Date.now().toString(),
    name: profileName.trim() || 'My Profile',
    emoji: '👤',
    allergens,
    createdAt: Date.now(),
  });

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.progressStep, i <= step && styles.progressStepActive]} />
        ))}
      </View>
      <Text style={styles.stepLabel}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</Text>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>

        {step === 0 && (
          <View style={styles.section}>
            <LinearGradient colors={GRADIENTS.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoBox}>
              <Text style={styles.logoEmoji}>🛡️</Text>
            </LinearGradient>
            <Text style={styles.mainTitle}>EatSurely</Text>
            <Text style={styles.mainSubtitle}>Food Allergen Scanner — scan any label and know instantly if it contains your allergens.</Text>
            {FEATURES.map(([icon, text], i) => (
              <Pop key={String(text)} delay={140 + i * 90} from={0.9}>
                <View style={styles.featureRow}>
                  <Text style={styles.featureIcon}>{icon}</Text>
                  <Text style={styles.featureText}>{text}</Text>
                </View>
              </Pop>
            ))}
          </View>
        )}

        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Create Your Profile</Text>
            <Text style={styles.sectionSubtitle}>You can update this any time in Settings.</Text>
            <Text style={styles.label}>Your name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. My Profile, Sarah, Dad…"
              value={profileName}
              onChangeText={setProfileName}
              autoFocus
              placeholderTextColor={MUTED}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allergen Alerts</Text>
            <Text style={styles.sectionSubtitle}>Toggle what you're allergic to and how severe.</Text>
            {allergens.map(a => {
              const cfg = SEVERITY_CONFIG[a.severity];
              return (
                <View key={a.id} style={[styles.allergenCard, a.enabled && styles.allergenCardActive]}>
                  <View style={styles.allergenRow}>
                    <Text style={styles.allergenEmoji}>{a.emoji}</Text>
                    <Text style={[styles.allergenName, !a.enabled && styles.allergenNameDisabled]}>{a.name}</Text>
                    <Switch value={a.enabled} onValueChange={() => toggle(a.id)}
                      trackColor={{ true: PURPLE }} thumbColor="#fff" />
                  </View>
                  {a.enabled && (
                    <View style={styles.severityRow}>
                      {(['fatal', 'intolerance', 'mild'] as AllergenSeverity[]).map(s => (
                        <PressRing key={s} borderRadius={10} containerStyle={styles.flexOne}
                          onPress={() => setSeverity(a.id, s)}
                          style={[styles.severityBtn, a.severity === s && { backgroundColor: SEVERITY_CONFIG[s].color, borderColor: SEVERITY_CONFIG[s].textColor }]}>
                          <Text style={[styles.severityBtnText, a.severity === s && { color: SEVERITY_CONFIG[s].textColor }]}>
                            {SEVERITY_CONFIG[s].label}
                          </Text>
                        </PressRing>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {step === 3 && (
          <View style={[styles.section, { alignItems: 'center' }]}>
            <Text style={styles.doneEmoji}>✅</Text>
            <Text style={styles.doneTitle}>You're all set!</Text>
            <Text style={styles.doneSubtitle}>
              Welcome, {profileName || 'there'}!{' '}
              {activeCount > 0 ? `${activeCount} allergen alert${activeCount !== 1 ? 's' : ''} enabled.` : 'No alerts enabled yet.'}
            </Text>
            <View style={styles.activeAlertsBox}>
              <Text style={styles.activeAlertsLabel}>ACTIVE ALERTS</Text>
              {activeCount === 0
                ? <Text style={styles.noAlerts}>None — add them in Settings any time.</Text>
                : <Text style={styles.alertsList}>{allergens.filter(a => a.enabled).map(a => `${a.emoji} ${a.name}`).join('  •  ')}</Text>
              }
            </View>
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerTitle}>⚠️  Important — Please Read</Text>
              <Text style={styles.disclaimerText}>
                EatSurely analyses product labels using image recognition to help identify potential allergens based on your profile.
                {'\n\n'}
                Results are provided for <Text style={styles.disclaimerBold}>informational purposes only</Text> and may not be complete or accurate due to image quality, labelling variations, or data limitations.
                {'\n\n'}
                <Text style={styles.disclaimerBold}>Always read product packaging carefully and verify ingredients before consuming.</Text>
                {'\n\n'}
                If you have <Text style={styles.disclaimerBold}>severe or life-threatening allergies</Text>, do not rely solely on this app. This app does not provide medical or dietary advice. Consult a qualified healthcare professional for personalised guidance.
              </Text>
              <PressRing borderRadius={8} onPress={() => setDisclaimerAccepted(v => !v)} style={styles.checkboxRow}>
                <View style={[styles.checkbox, disclaimerAccepted && styles.checkboxChecked]}>
                  {disclaimerAccepted && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>I understand and accept these limitations</Text>
              </PressRing>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.nav}>
        {step > 0 && step < 3 && (
          <PressRing borderRadius={16} onPress={() => setStep(s => s - 1)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Back</Text>
          </PressRing>
        )}
        {step < 3 && (
          <GradientButton
            containerStyle={styles.flexOne}
            label={step === 2 ? 'Finish Setup  →' : 'Next  →'}
            disabled={!canNext}
            onPress={() => canNext && setStep(s => s + 1)}
          />
        )}
        {step === 3 && (
          <GradientButton
            containerStyle={styles.flexOne}
            label="Start Scanning"
            disabled={!disclaimerAccepted}
            onPress={() => disclaimerAccepted && complete()}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#fff' },
  progressBar:          { flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 4 },
  progressStep:         { flex: 1, height: 4, borderRadius: 2, backgroundColor: BORDER },
  progressStepActive:   { backgroundColor: PURPLE },
  stepLabel:            { fontSize: 11, fontWeight: '700', color: MUTED, paddingHorizontal: 20, marginBottom: 8 },
  content:              { flex: 1 },
  contentInner:         { padding: 20, paddingBottom: 8 },
  section:              { gap: 12 },
  logoBox:              { width: 88, height: 88, borderRadius: 28, ...glow(COLORS.purpleDeep, 0.45), alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  logoEmoji:            { fontSize: 40 },
  mainTitle:            { fontSize: 34, fontWeight: '700', color: BLACK, textAlign: 'center', letterSpacing: -0.5 },
  mainSubtitle:         { fontSize: 15, fontWeight: '400', color: GRAY, textAlign: 'center', lineHeight: 22 },
  featureRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FAFAFA', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER },
  featureIcon:          { fontSize: 22 },
  featureText:          { fontSize: 14, fontWeight: '600', color: GRAY, flex: 1 },
  sectionTitle:         { fontSize: 28, fontWeight: '700', color: BLACK, letterSpacing: -0.4 },
  sectionSubtitle:      { fontSize: 15, fontWeight: '400', color: GRAY, lineHeight: 22 },
  label:                { fontSize: 13, fontWeight: '700', color: GRAY },
  input:                { borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontWeight: '500', backgroundColor: '#FAFAFA', color: BLACK },
  allergenCard:         { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: BORDER },
  allergenCardActive:   { borderColor: '#DDD6FE' },
  allergenRow:          { flexDirection: 'row', alignItems: 'center' },
  allergenEmoji:        { fontSize: 22, marginRight: 12 },
  allergenName:         { flex: 1, fontSize: 15, fontWeight: '700', color: BLACK },
  allergenNameDisabled: { color: MUTED },
  severityRow:          { flexDirection: 'row', gap: 6, marginTop: 10 },
  flexOne:              { flex: 1 },
  severityBtn:          { borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, paddingVertical: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA' },
  severityBtnText:      { fontSize: 11, fontWeight: '700', color: MUTED },
  doneEmoji:            { fontSize: 72, marginBottom: 8 },
  doneTitle:            { fontSize: 28, fontWeight: '900', color: BLACK },
  doneSubtitle:         { fontSize: 14, color: GRAY, textAlign: 'center' },
  activeAlertsBox:      { backgroundColor: '#FAFAFA', borderRadius: 16, padding: 16, width: '100%', borderWidth: 1, borderColor: BORDER },
  activeAlertsLabel:    { fontSize: 10, fontWeight: '800', color: MUTED, letterSpacing: 1, marginBottom: 8 },
  noAlerts:             { fontSize: 13, color: MUTED },
  alertsList:           { fontSize: 13, color: GRAY, lineHeight: 22 },
  disclaimerBox:        { width: '100%', backgroundColor: '#fff7ed', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#fed7aa', gap: 12 },
  disclaimerTitle:      { fontSize: 13, fontWeight: '800', color: '#9a3412' },
  disclaimerText:       { fontSize: 12, color: '#7c2d12', lineHeight: 18 },
  disclaimerBold:       { fontWeight: '800' },
  checkboxRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, paddingVertical: 4 },
  checkbox:             { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: PURPLE, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxChecked:      { backgroundColor: PURPLE, borderColor: PURPLE },
  checkboxTick:         { color: '#fff', fontSize: 14, fontWeight: '900' },
  checkboxLabel:        { flex: 1, fontSize: 13, fontWeight: '700', color: '#7c2d12', lineHeight: 18 },
  nav:                  { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 40 },
  backBtn:              { paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER },
  backBtnText:          { fontWeight: '700', color: GRAY, fontSize: 15 },
  nextBtn:              { backgroundColor: PURPLE, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  nextBtnDisabled:      { opacity: 0.35 },
  nextBtnText:          { color: '#fff', fontWeight: '700', fontSize: 15 },
  startBtn:             { backgroundColor: PURPLE, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
});
