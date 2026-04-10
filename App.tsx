import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const navigationRef = createNavigationContainerRef<any>();

function navigate(name: string) {
  if (navigationRef.isReady()) navigationRef.navigate(name);
}

import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import { Allergen, AllergenSeverity, HistoryItem, ScanResult, Profile } from './src/types';
import { DEFAULT_ALLERGENS } from './src/constants';
import { getToken, clearToken, allergensApi, historyApi, authApi } from './src/services/api';

interface AuthUser { name: string; email: string; }

const Tab = createBottomTabNavigator();

export default function App() {
  const [user,            setUser]           = useState<AuthUser | null>(null);
  const [appReady,        setAppReady]       = useState(false);
  const [showOnboarding,  setShowOnboarding] = useState(false);
  const [allergens,       setAllergens]      = useState<Allergen[]>(DEFAULT_ALLERGENS);
  const [history,         setHistory]        = useState<HistoryItem[]>([]);
  const [currentResult,   setCurrentResult]  = useState<ScanResult | null>(null);
  const [currentImageUri, setCurrentImageUri]= useState<string | undefined>(undefined);
  const [scanTab,         setScanTab]        = useState<'scan' | 'result'>('scan');
  const [isOnline,        setIsOnline]       = useState(true);
  const [syncError,       setSyncError]      = useState(false);

  // Pending allergen sync retry ref
  const pendingAllergenSync = useRef<Allergen[] | null>(null);

  // ── Offline detection ────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = !!state.isConnected && !!state.isInternetReachable;
      setIsOnline(online);
      // When coming back online, retry pending allergen sync
      if (online && pendingAllergenSync.current) {
        allergensApi.update(pendingAllergenSync.current)
          .then(() => {
            pendingAllergenSync.current = null;
            setSyncError(false);
          })
          .catch(() => {}); // still offline or failed — keep pending
      }
    });
    return unsubscribe;
  }, []);

  // ── Restore session on launch ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) { setAppReady(true); return; }
      const stored = await AsyncStorage.getItem('as_user');
      if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
      try {
        const [savedAllergens, savedHistory] = await Promise.all([allergensApi.get(), historyApi.get()]);
        if (savedAllergens.length > 0) setAllergens(savedAllergens);
        setHistory(savedHistory);
      } catch {
        await clearToken();
        await AsyncStorage.removeItem('as_user');
        setUser(null);
      } finally {
        setAppReady(true);
      }
    })();
  }, []);

  // ── Sync allergens to server on change ──────────────────────────────────────
  useEffect(() => {
    if (!user || showOnboarding) return;
    allergensApi.update(allergens)
      .then(() => {
        setSyncError(false);
        pendingAllergenSync.current = null;
      })
      .catch(() => {
        // Store for retry when back online
        pendingAllergenSync.current = allergens;
        setSyncError(true);
      });
  }, [allergens]);

  const handleAuth = async (name: string, email: string, hasOnboarded: boolean) => {
    const u = { name, email };
    await AsyncStorage.setItem('as_user', JSON.stringify(u));
    setUser(u);
    if (!hasOnboarded) { setShowOnboarding(true); setAppReady(true); return; }
    try {
      const [savedAllergens, savedHistory] = await Promise.all([allergensApi.get(), historyApi.get()]);
      if (savedAllergens.length > 0) setAllergens(savedAllergens);
      setHistory(savedHistory);
    } catch {}
    setAppReady(true);
  };

  const handleOnboardingComplete = async (profile: Profile) => {
    setAllergens(profile.allergens);
    try {
      await Promise.all([allergensApi.update(profile.allergens), authApi.onboard()]);
    } catch {}
    setShowOnboarding(false);
  };

  const handleLogout = async () => {
    await clearToken();
    await AsyncStorage.removeItem('as_user');
    setUser(null);
    setShowOnboarding(false);
    setAllergens(DEFAULT_ALLERGENS);
    setHistory([]);
    setCurrentResult(null);
    setSyncError(false);
    pendingAllergenSync.current = null;
  };

  const handleToggle = (id: string) =>
    setAllergens(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));

  const handleAdd = (name: string, severity: AllergenSeverity) => {
    if (allergens.some(a => a.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Already exists', `"${name}" is already in your allergen list.`);
      return;
    }
    setAllergens(prev => [...prev, { id: Date.now().toString(), name, enabled: true, severity, emoji: '⚠️' }]);
  };

  const handleRemove = (id: string) => setAllergens(prev => prev.filter(a => a.id !== id));

  const handleResult = (result: ScanResult, imageUri?: string) => {
    const item: HistoryItem = { ...result, id: Date.now().toString(), profileId: 'default', imageUrl: imageUri };
    setHistory(prev => [item, ...prev].slice(0, 50));
    historyApi.add(item).catch(() => {
      // History item saved locally; server sync failed silently — not critical
      console.warn('[AllergenSafe] Failed to sync history item to server');
    });
    setCurrentResult(result);
    setCurrentImageUri(imageUri);
    setScanTab('result');
    navigate('Scan');
  };

  const handleViewHistoryItem = (item: HistoryItem) => {
    setCurrentResult(item);
    setCurrentImageUri(item.imageUrl);
    setScanTab('result');
    navigate('Scan');
  };

  const handleClearHistory = () => {
    setHistory([]);
    historyApi.clear().catch(() => {
      console.warn('[AllergenSafe] Failed to clear history on server');
    });
  };

  if (!appReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!user) return <LoginScreen onAuth={handleAuth} />;
  if (showOnboarding) return <OnboardingScreen onComplete={handleOnboardingComplete} />;

  return (
    <NavigationContainer ref={navigationRef}>
      {/* ── Offline banner ── */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📡  No internet connection — scanning unavailable</Text>
        </View>
      )}

      {/* ── Sync error banner ── */}
      {isOnline && syncError && (
        <View style={styles.syncErrorBanner}>
          <Text style={styles.syncErrorText}>⚠️  Allergen changes not saved to server</Text>
          <TouchableOpacity onPress={() => {
            if (pendingAllergenSync.current) {
              allergensApi.update(pendingAllergenSync.current)
                .then(() => { setSyncError(false); pendingAllergenSync.current = null; })
                .catch(() => Alert.alert('Sync Failed', 'Could not save allergen changes. Check your connection and try again.'));
            }
          }}>
            <Text style={styles.syncRetryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#7c3aed', headerShown: false, tabBarStyle: { paddingBottom: 4 } }}>

        <Tab.Screen name="Home" options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text> }}>
          {() => (
            <HomeScreen
              history={history}
              allergens={allergens}
              userName={user?.name}
              onStartScan={() => { setScanTab('scan'); }}
              onViewResult={handleViewHistoryItem}
              onGoToSettings={() => {}}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="Scan" options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>📷</Text> }}>
          {() =>
            scanTab === 'result' && currentResult
              ? <ResultScreen result={currentResult} allergens={allergens} imageUri={currentImageUri} onScanAgain={() => { setCurrentResult(null); setCurrentImageUri(undefined); setScanTab('scan'); }} />
              : <ScanScreen allergens={allergens} onResult={handleResult} isOnline={isOnline} />
          }
        </Tab.Screen>

        <Tab.Screen name="History" options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🕐</Text> }}>
          {() => (
            <HistoryScreen
              history={history}
              onViewItem={handleViewHistoryItem}
              onClearHistory={handleClearHistory}
              onStartScan={() => { setScanTab('scan'); }}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="Settings" options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text> }}>
          {() => (
            <SettingsScreen allergens={allergens} onToggle={handleToggle}
              onAdd={handleAdd} onRemove={handleRemove} onLogout={handleLogout} />
          )}
        </Tab.Screen>

      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading:          { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e1b4b' },
  offlineBanner:    { backgroundColor: '#1e293b', paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  offlineText:      { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  syncErrorBanner:  { backgroundColor: '#7c2d12', paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  syncErrorText:    { color: '#fed7aa', fontSize: 12, fontWeight: '600', flex: 1 },
  syncRetryText:    { color: '#fff', fontSize: 12, fontWeight: '800', paddingLeft: 12 },
});
