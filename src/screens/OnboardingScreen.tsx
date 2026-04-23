import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Switch,
} from 'react-native';
import { Allergen, AllergenSeverity, Profile } from '../types';
import { DEFAULT_ALLERGENS, SEVERITY_CONFIG } from '../constants';

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
  const [step,                setStep]               = useState(0);
  const [profileName,         setProfileName]         = useState('');
  const [allergens,           setAllergens]           = useState<Allergen[]>(DEFAULT_ALLERGENS);
  const [disclaimerAccepted,  setDisclaimerAccepted]  = useState(false);

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
      {/* Progress */}
      <View style={styles.progressBar}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.progressStep, i <= step && styles.progressStepActive]} />
        ))}
      </View>
      <Text style={styles.stepLabel}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</Text>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>

        {step === 0 && (
          <View style={styles.section}>
            <View style={styles.logoBox}><Text style={styles.logoEmoji}>🛡️</Text></View>
            <Text style={styles.mainTitle}>EatSurely AI</Text>
            <Text style={styles.mainSubtitle}>Food Allergen Scanner — scan any label and know instantly if it contains your allergens.</Text>
            {FEATURES.map(([icon, text]) => (
              <View key={String(text)} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{icon}</Text>
                <Text style={styles.featureText}>{text}</Text>
              </View>
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
                      trackColor={{ true: '#43a047' }} />
                  </View>
                  {a.enabled && (
                    <View style={styles.severityRow}>
                      {(['fatal', 'intolerance', 'mild'] as AllergenSeverity[]).map(s => (
                        <TouchableOpacity key={s}
                          style={[styles.severityBtn, a.severity === s && { backgroundColor: SEVERITY_CONFIG[s].color, borderColor: SEVERITY_CONFIG[s].textColor }]}
                          onPress={() => setSeverity(a.id, s)}>
                          <Text style={[styles.severityBtnText, a.severity === s && { color: SEVERITY_CONFIG[s].textColor }]}>
                            {SEVERITY_CONFIG[s].label}
                          </Text>
                        </TouchableOpacity>
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

            {/* Disclaimer */}
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
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setDisclaimerAccepted(v => !v)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, disclaimerAccepted && styles.checkboxChecked]}>
                  {disclaimerAccepted && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  I understand and accept these limitations
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.nav}>
        {step > 0 && step < 3 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        {step < 3 && (
          <TouchableOpacity style={[styles.nextBtn, !canNext && styles.nextBtnDisabled]}
            onPress={() => canNext && setStep(s => s + 1)}>
            <Text style={styles.nextBtnText}>{step === 2 ? 'Finish Setup' : 'Next'} →</Text>
          </TouchableOpacity>
        )}
        {step === 3 && (
          <TouchableOpacity
            style={[styles.startBtn, !disclaimerAccepted && styles.nextBtnDisabled]}
            onPress={() => disclaimerAccepted && complete()}
          >
            <Text style={styles.nextBtnText}>Start Scanning!</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#f1f8f1' },
  progressBar:          { flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 4 },
  progressStep:         { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#e2e8f0' },
  progressStepActive:   { backgroundColor: '#43a047' },
  stepLabel:            { fontSize: 11, fontWeight: '700', color: '#94a3b8', paddingHorizontal: 20, marginBottom: 8 },
  content:              { flex: 1 },
  contentInner:         { padding: 20, paddingBottom: 8 },
  section:              { gap: 12 },
  logoBox:              { width: 80, height: 80, borderRadius: 24, backgroundColor: '#43a047', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  logoEmoji:            { fontSize: 40 },
  mainTitle:            { fontSize: 28, fontWeight: '900', color: '#1e293b', textAlign: 'center' },
  mainSubtitle:         { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  featureRow:           { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  featureIcon:          { fontSize: 22 },
  featureText:          { fontSize: 14, fontWeight: '600', color: '#475569', flex: 1 },
  sectionTitle:         { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  sectionSubtitle:      { fontSize: 14, color: '#64748b' },
  label:                { fontSize: 13, fontWeight: '700', color: '#475569' },
  input:                { borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontWeight: '600', backgroundColor: '#fff' },
  allergenCard:         { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 2, borderColor: '#f1f5f9' },
  allergenCardActive:   { borderColor: '#c8e6c9' },
  allergenRow:          { flexDirection: 'row', alignItems: 'center' },
  allergenEmoji:        { fontSize: 22, marginRight: 12 },
  allergenName:         { flex: 1, fontSize: 15, fontWeight: '700', color: '#1e293b' },
  allergenNameDisabled: { color: '#94a3b8' },
  severityRow:          { flexDirection: 'row', gap: 6, marginTop: 10 },
  severityBtn:          { flex: 1, borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 10, paddingVertical: 6, alignItems: 'center', backgroundColor: '#f8fafc' },
  severityBtnText:      { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  doneEmoji:            { fontSize: 72, marginBottom: 8 },
  doneTitle:            { fontSize: 28, fontWeight: '900', color: '#1e293b' },
  doneSubtitle:         { fontSize: 14, color: '#64748b', textAlign: 'center' },
  activeAlertsBox:      { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '100%' },
  activeAlertsLabel:    { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  noAlerts:             { fontSize: 13, color: '#94a3b8' },
  alertsList:           { fontSize: 13, color: '#475569', lineHeight: 22 },
  disclaimerBox:        { width: '100%', backgroundColor: '#fff7ed', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#fed7aa', gap: 12 },
  disclaimerTitle:      { fontSize: 13, fontWeight: '800', color: '#9a3412' },
  disclaimerText:       { fontSize: 12, color: '#7c2d12', lineHeight: 18 },
  disclaimerBold:       { fontWeight: '800' },
  checkboxRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  checkbox:             { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#f97316', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  checkboxChecked:      { backgroundColor: '#f97316', borderColor: '#f97316' },
  checkboxTick:         { color: '#fff', fontSize: 14, fontWeight: '900' },
  checkboxLabel:        { flex: 1, fontSize: 13, fontWeight: '700', color: '#7c2d12', lineHeight: 18 },

  nav:                  { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 40 },
  backBtn:              { paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  backBtnText:          { fontWeight: '700', color: '#475569', fontSize: 15 },
  nextBtn:              { flex: 1, backgroundColor: '#43a047', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  nextBtnDisabled:      { opacity: 0.4 },
  nextBtnText:          { color: '#fff', fontWeight: '700', fontSize: 15 },
  startBtn:             { flex: 1, backgroundColor: '#10b981', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
});
