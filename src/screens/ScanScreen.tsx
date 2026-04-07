import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Image, Alert, ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Allergen, ScanResult } from '../types';
import { analyzeApi, historyApi } from '../services/api';

interface Props {
  allergens: Allergen[];
  onResult: (result: ScanResult, imageUri?: string) => void;
}

export default function ScanScreen({ allergens, onResult }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading]           = useState(false);
  const cameraRef = useRef<any>(null);

  const activeNames = allergens.filter(a => a.enabled).map(a => a.name);

  const analyzeImage = async (base64: string, uri?: string) => {
    setLoading(true);
    try {
      const result = await analyzeApi.analyze(base64, activeNames);
      const item = { ...result, id: Date.now().toString(), imageUrl: uri, profileId: 'default' };
      historyApi.add(item).catch(() => {});
      onResult(result, uri);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });
    if (photo.base64) {
      setCameraActive(false);
      analyzeImage(photo.base64, photo.uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].base64) {
      analyzeImage(result.assets[0].base64, result.assets[0].uri);
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) { Alert.alert('Camera permission required'); return; }
    }
    setCameraActive(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Analysing label...</Text>
      </View>
    );
  }

  if (cameraActive) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing={'back' as CameraType}>
          <View style={styles.cameraOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.cameraHint}>Point at an ingredient label</Text>
            <View style={styles.cameraButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCameraActive(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
                <View style={styles.captureBtnInner} />
              </TouchableOpacity>
              <View style={{ width: 80 }} />
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Scan a Label</Text>
      <Text style={styles.subtitle}>Take a photo or upload an image of an ingredient label</Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={openCamera}>
        <Text style={styles.primaryBtnText}>📷  Take Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
        <Text style={styles.secondaryBtnText}>🖼️  Upload from Library</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  title:          { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  subtitle:       { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 40, lineHeight: 20 },
  loadingText:    { marginTop: 16, fontSize: 16, color: '#64748b', fontWeight: '600' },
  primaryBtn:     { width: '100%', backgroundColor: '#7c3aed', borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn:     { width: '100%', backgroundColor: '#fff', borderRadius: 18, paddingVertical: 18, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  secondaryBtnText: { color: '#475569', fontWeight: '700', fontSize: 16 },
  cameraContainer: { flex: 1 },
  camera:          { flex: 1 },
  cameraOverlay:   { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 60 },
  scanFrame:       { width: 260, height: 180, borderWidth: 2, borderColor: '#fff', borderRadius: 12, backgroundColor: 'transparent' },
  cameraHint:      { color: '#fff', fontSize: 14, fontWeight: '600' },
  cameraButtons:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20 },
  captureBtn:      { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  captureBtnInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  cancelBtn:       { width: 80, alignItems: 'center' },
  cancelBtnText:   { color: '#fff', fontWeight: '600', fontSize: 14 },
});
