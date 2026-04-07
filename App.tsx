import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen from './src/screens/LoginScreen';
import ScanScreen from './src/screens/ScanScreen';
import ResultScreen from './src/screens/ResultScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import { Allergen, AllergenSeverity, ScanResult } from './src/types';
import { DEFAULT_ALLERGENS } from './src/constants';
import { getToken, clearToken, allergensApi, historyApi } from './src/services/api';

interface AuthUser { name: string; email: string; }

const Tab = createBottomTabNavigator();

export default function App() {
  const [user,          setUser]          = useState<AuthUser | null>(null);
  const [appReady,      setAppReady]      = useState(false);
  const [allergens,     setAllergens]     = useState<Allergen[]>(DEFAULT_ALLERGENS);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) { setAppReady(true); return; }
      const stored = await AsyncStorage.getItem('as_user');
      if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
      try {
        const savedAllergens = await allergensApi.get();
        if (savedAllergens.length > 0) setAllergens(savedAllergens);
      } catch {
        await clearToken();
        await AsyncStorage.removeItem('as_user');
        setUser(null);
      } finally {
        setAppReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    allergensApi.update(allergens).catch(() => {});
  }, [allergens]);

  const handleAuth = async (name: string, email: string, _hasOnboarded: boolean) => {
    const u = { name, email };
    await AsyncStorage.setItem('as_user', JSON.stringify(u));
    setUser(u);
    try {
      const savedAllergens = await allergensApi.get();
      if (savedAllergens.length > 0) setAllergens(savedAllergens);
    } catch {}
  };

  const handleLogout = async () => {
    await clearToken();
    await AsyncStorage.removeItem('as_user');
    setUser(null);
    setAllergens(DEFAULT_ALLERGENS);
    setCurrentResult(null);
  };

  const handleToggle = (id: string) =>
    setAllergens(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));

  const handleAdd = (name: string, severity: AllergenSeverity) => {
    if (allergens.some(a => a.name.toLowerCase() === name.toLowerCase())) return;
    setAllergens(prev => [...prev, { id: Date.now().toString(), name, enabled: true, severity, emoji: '⚠️' }]);
  };

  const handleRemove = (id: string) =>
    setAllergens(prev => prev.filter(a => a.id !== id));

  if (!appReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen onAuth={handleAuth} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#7c3aed', headerShown: false }}>
        <Tab.Screen name="Scan" options={{ tabBarIcon: () => <Text>📷</Text> }}>
          {() =>
            currentResult
              ? <ResultScreen result={currentResult} allergens={allergens} onScanAgain={() => setCurrentResult(null)} />
              : <ScanScreen allergens={allergens} onResult={(r) => setCurrentResult(r)} />
          }
        </Tab.Screen>
        <Tab.Screen name="Settings" options={{ tabBarIcon: () => <Text>⚙️</Text> }}>
          {() =>
            <SettingsScreen allergens={allergens} onToggle={handleToggle}
              onAdd={handleAdd} onRemove={handleRemove} onLogout={handleLogout} />
          }
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e1b4b' },
});
