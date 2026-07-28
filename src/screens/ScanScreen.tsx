import React, { useState } from 'react';
import {
  View, Text, StyleSheet,
  Alert, ScrollView, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { Allergen, ScanResult } from '../types';
import { analyzeApi } from '../services/api';
import PressRing from '../components/PressRing';
import FadeIn from '../components/FadeIn';
import GradientButton from '../components/GradientButton';
import ScanningIndicator from '../components/ScanningIndicator';

const PURPLE = '#6D28D9';
const PURPLE_LIGHT = '#EDE9FE';
const BLACK = '#111827';
const GRAY = '#6B7280';
const MUTED = '#9CA3AF';
const BORDER = '#E5E7EB';

interface Props {
  allergens: Allergen[];
  onResult: (result: ScanResult, imageUri?: string) => void;
  isOnline?: boolean;
}

export default function ScanScreen({ allergens, onResult, isOnline = true }: Props) {
  const [loading,    setLoading]    = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const activeNames = allergens.filter(a => a.enabled).map(a => a.name);

  const compressImage = async (uri: string): Promise<string> => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1500 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
    );
    return result.uri;
  };

  const analyzeImage = async (uri: string) => {
    setPreviewUri(null);
    setLoading(true);
    try {
      const extension = uri.split('?')[0].split('.').pop()?.toLowerCase();
      if (!extension || !['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp'].includes(extension)) {
        Alert.alert('Unsupported File', 'Please use a JPG, PNG, or HEIC image.');
        return;
      }
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const MAX_BYTES = 15 * 1024 * 1024;
      if (fileInfo.exists && (fileInfo as any).size > MAX_BYTES) {
        Alert.alert('Image Too Large', 'The image is over 15MB. Please take a new photo at normal camera settings.');
        return;
      }
      const compressedUri = await compressImage(uri);
      const base64 = await FileSystem.readAsStringAsync(compressedUri, { encoding: 'base64' as any });
      const result = await analyzeApi.analyze(base64, activeNames);
      if (result.ingredientsVisible === false) {
        const messages: Record<string, string> = {
          blurry:     'The image is too blurry to read safely. Please retake a clearer, in-focus photo of the ingredient list.',
          incomplete: 'The ingredient list appears cut off. Please retake to capture the full list.',
          not_found:  'No ingredient list found. Please photograph the back or side of the packaging where ingredients are listed.',
        };
        const msg = messages[result.imageIssue ?? 'not_found'] ?? messages['not_found'];
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Cannot Read Label', msg, [{ text: 'Retake', onPress: () => {} }]);
        return;
      }
      onResult(result, uri);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

  const MIN_DIMENSION = 640;

  const takePhoto = async () => {
    if (!isOnline) { Alert.alert('No Connection', 'An internet connection is required to analyse labels.'); return; }
    if (!await warnIfNoAllergens()) return;
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) { Alert.alert('Camera permission required'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: false });
    if (!result.canceled && result.assets[0]?.uri) {
      const { width, height } = result.assets[0];
      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        Alert.alert('Image Too Small', `The image is ${width}×${height}px. Please move closer to the label and retake.`);
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPreviewUri(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    if (!isOnline) { Alert.alert('No Connection', 'An internet connection is required to analyse labels.'); return; }
    if (!await warnIfNoAllergens()) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled && result.assets[0]?.uri) {
      const { width, height } = result.assets[0];
      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        const proceed = await new Promise<boolean>(resolve =>
          Alert.alert(
            'Low Resolution Image',
            `This image is ${width}×${height}px which may be too small to read accurately. Results might be incomplete.`,
            [{ text: 'Choose Different', style: 'cancel', onPress: () => resolve(false) },
             { text: 'Use Anyway', onPress: () => resolve(true) }],
          )
        );
        if (!proceed) return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPreviewUri(result.assets[0].uri);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ScanningIndicator />
      </View>
    );
  }

  if (previewUri) {
    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Check Your Photo</Text>
        <Text style={styles.previewSubtitle}>Make sure the full ingredient list is visible and in focus</Text>
        <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
        <GradientButton
          label="Looks Good — Analyse"
          onPress={() => analyzeImage(previewUri)}
          disabled={loading}
          containerStyle={styles.confirmBtn}
        />
        <PressRing borderRadius={16} onPress={() => setPreviewUri(null)} style={styles.retakeBtn}>
          <Text style={styles.retakeBtnText}>Retake Photo</Text>
        </PressRing>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <FadeIn>
        <Text style={styles.title}>Scan a Label</Text>
      </FadeIn>
      <FadeIn delay={70}>
        <Text style={styles.subtitle}>Take a photo or upload an image of an ingredient label</Text>
      </FadeIn>
      <FadeIn delay={140} style={styles.actions}>
        <GradientButton label="Take Photo" onPress={takePhoto} disabled={loading} />
        <PressRing borderRadius={18} onPress={pickImage} disabled={loading} style={[styles.secondaryBtn, loading && { opacity: 0.5 }]}>
          <Text style={styles.secondaryBtnText}>Upload from Library</Text>
        </PressRing>
      </FadeIn>
      <FadeIn delay={220} style={styles.hints}>
        <Text style={styles.hintsTitle}>For best results:</Text>
        <Text style={styles.hintItem}>• Photograph the full ingredient list</Text>
        <Text style={styles.hintItem}>• Hold steady for a sharp, clear image</Text>
        <Text style={styles.hintItem}>• Ensure good lighting — avoid shadows</Text>
        <Text style={styles.hintItem}>• Capture the entire list, not just part of it</Text>
      </FadeIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title:            { fontSize: 28, fontWeight: '700', color: BLACK, marginBottom: 8, letterSpacing: -0.4 },
  subtitle:         { fontSize: 15, fontWeight: '400', color: GRAY, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  actions:          { width: '100%', gap: 14, marginBottom: 28 },
  secondaryBtn:     { width: '100%', backgroundColor: '#fff', borderRadius: 20, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: BORDER },
  secondaryBtnText: { color: BLACK, fontWeight: '700', fontSize: 17 },
  hints:            { width: '100%', backgroundColor: PURPLE_LIGHT, borderRadius: 16, padding: 16, borderLeftWidth: 3, borderLeftColor: PURPLE },
  hintsTitle:       { fontSize: 13, fontWeight: '700', color: '#4C1D95', marginBottom: 8 },
  hintItem:         { fontSize: 13, color: '#5B21B6', lineHeight: 22 },
  previewContainer: { flex: 1, backgroundColor: '#0A0A0A', padding: 20, paddingTop: 52 },
  previewTitle:     { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 6 },
  previewSubtitle:  { fontSize: 13, color: MUTED, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  previewImage:     { width: '100%', flex: 1, borderRadius: 16, marginBottom: 16 },
  confirmBtn:       { marginBottom: 10 },
  retakeBtn:        { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  retakeBtnText:    { color: MUTED, fontWeight: '700', fontSize: 16 },
});
