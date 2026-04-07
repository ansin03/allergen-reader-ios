import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Allergen, ScanResult } from '../types';
import { analyzeApi } from '../services/api';

interface Props {
  allergens: Allergen[];
  onResult: (result: ScanResult, imageUri?: string) => void;
}

export default function ScanScreen({ allergens, onResult }: Props) {
  const [loading, setLoading] = useState(false);

  const activeNames = allergens.filter(a => a.enabled).map(a => a.name);

  const analyzeImage = async (uri: string) => {
    setLoading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const result = await analyzeApi.analyze(base64, activeNames);
      onResult(result, uri);
    } catch (err) {
      Alert.alert('Analysis Error', err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) { Alert.alert('Camera permission required'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false });
    if (!result.canceled && result.assets[0]?.uri) {
      analyzeImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]?.uri) {
      analyzeImage(result.assets[0].uri);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Analysing label...</Text>
      </View>
    );
  }

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  title:            { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  subtitle:         { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 40, lineHeight: 20 },
  loadingText:      { marginTop: 16, fontSize: 16, color: '#64748b', fontWeight: '600' },
  primaryBtn:       { width: '100%', backgroundColor: '#7c3aed', borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  primaryBtnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn:     { width: '100%', backgroundColor: '#fff', borderRadius: 18, paddingVertical: 18, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  secondaryBtnText: { color: '#475569', fontWeight: '700', fontSize: 16 },
});
