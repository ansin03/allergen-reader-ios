import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, ScrollView, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Allergen, ScanResult } from '../types';
import { analyzeApi } from '../services/api';

interface Props {
  allergens: Allergen[];
  onResult: (result: ScanResult, imageUri?: string) => void;
}

export default function ScanScreen({ allergens, onResult }: Props) {
  const [loading,     setLoading]     = useState(false);
  const [previewUri,  setPreviewUri]  = useState<string | null>(null);

  const activeNames = allergens.filter(a => a.enabled).map(a => a.name);

  const analyzeImage = async (uri: string) => {
    setPreviewUri(null);
    setLoading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
      const result = await analyzeApi.analyze(base64, activeNames);

      if (result.ingredientsVisible === false) {
        const messages: Record<string, string> = {
          blurry:     'The image is too blurry to read safely. Please retake a clearer, in-focus photo of the ingredient list.',
          incomplete: 'The ingredient list appears cut off. Please retake to capture the full list.',
          not_found:  'No ingredient list found. Please photograph the back or side of the packaging where ingredients are listed.',
        };
        const msg = messages[result.imageIssue ?? 'not_found'] ?? messages['not_found'];
        Alert.alert('Cannot Read Label', msg, [
          { text: 'Retake', onPress: () => {} },
        ]);
        return;
      }

      onResult(result, uri);
    } catch (err) {
      Alert.alert('Analysis Error', `${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const warnIfNoAllergens = () =>
    activeNames.length === 0
      ? new Promise<boolean>(resolve =>
          Alert.alert(
            'No allergens enabled',
            'You have no allergens turned on. Results may not flag anything. Continue anyway?',
            [{ text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
             { text: 'Continue', onPress: () => resolve(true) }],
          ))
      : Promise.resolve(true);

  const takePhoto = async () => {
    if (!await warnIfNoAllergens()) return;
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) { Alert.alert('Camera permission required'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false });
    if (!result.canceled && result.assets[0]?.uri) {
      setPreviewUri(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    if (!await warnIfNoAllergens()) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]?.uri) {
      setPreviewUri(result.assets[0].uri);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Analysing label...</Text>
        <Text style={styles.loadingSubtext}>This usually takes a few seconds</Text>
      </View>
    );
  }

  // ── Image preview / confirmation ───────────────────────────────────────────
  if (previewUri) {
    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Check Your Photo</Text>
        <Text style={styles.previewSubtitle}>
          Make sure the full ingredient list is visible and in focus
        </Text>
        <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
        <View style={styles.previewTips}>
          <Text style={styles.tipItem}>✓ Full ingredient list visible</Text>
          <Text style={styles.tipItem}>✓ Text is sharp and readable</Text>
          <Text style={styles.tipItem}>✓ Nothing is cut off at the edges</Text>
        </View>
        <TouchableOpacity style={styles.confirmBtn} onPress={() => analyzeImage(previewUri)}>
          <Text style={styles.confirmBtnText}>✓  Looks Good — Analyse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.retakeBtn} onPress={() => setPreviewUri(null)}>
          <Text style={styles.retakeBtnText}>↩  Retake Photo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Scan options ───────────────────────────────────────────────────────────
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Scan a Label</Text>
      <Text style={styles.subtitle}>Take a photo or upload an image of an ingredient label</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto}>
        <Text style={styles.primaryBtnText}>📷  Take Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
        <Text style={styles.secondaryBtnText}>🖼️  Upload from Library</Text>
      </TouchableOpacity>
      <View style={styles.hints}>
        <Text style={styles.hintsTitle}>For best results:</Text>
        <Text style={styles.hintItem}>• Photograph the full ingredient list</Text>
        <Text style={styles.hintItem}>• Hold steady for a sharp, clear image</Text>
        <Text style={styles.hintItem}>• Ensure good lighting — avoid shadows</Text>
        <Text style={styles.hintItem}>• Capture the entire list, not just part of it</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  title:            { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  subtitle:         { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  loadingText:      { marginTop: 16, fontSize: 16, color: '#64748b', fontWeight: '600' },
  loadingSubtext:   { marginTop: 6, fontSize: 13, color: '#94a3b8' },
  primaryBtn:       { width: '100%', backgroundColor: '#7c3aed', borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  primaryBtnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn:     { width: '100%', backgroundColor: '#fff', borderRadius: 18, paddingVertical: 18, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0', marginBottom: 28 },
  secondaryBtnText: { color: '#475569', fontWeight: '700', fontSize: 16 },
  hints:            { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderLeftWidth: 3, borderLeftColor: '#7c3aed' },
  hintsTitle:       { fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  hintItem:         { fontSize: 13, color: '#475569', lineHeight: 22 },

  // Preview
  previewContainer: { flex: 1, backgroundColor: '#0f172a', padding: 20, paddingTop: 52 },
  previewTitle:     { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 6 },
  previewSubtitle:  { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  previewImage:     { width: '100%', flex: 1, borderRadius: 16, marginBottom: 16 },
  previewTips:      { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 14, marginBottom: 16, gap: 6 },
  tipItem:          { fontSize: 13, color: '#86efac', fontWeight: '600' },
  confirmBtn:       { backgroundColor: '#7c3aed', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  confirmBtnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  retakeBtn:        { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  retakeBtnText:    { color: '#cbd5e1', fontWeight: '700', fontSize: 16 },
});
