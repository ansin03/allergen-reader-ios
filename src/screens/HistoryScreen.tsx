import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HistoryItem } from '../types';
import PressRing from '../components/PressRing';
import FadeIn from '../components/FadeIn';

const PURPLE = '#6D28D9';
const BLACK = '#111827';
const GRAY = '#6B7280';
const MUTED = '#9CA3AF';
const BORDER = '#E5E7EB';

interface Props {
  history: HistoryItem[];
  onViewItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
  onStartScan: () => void;
}

type FilterType = 'all' | 'safe' | 'warning' | 'danger';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all',     label: 'All' },
  { id: 'safe',    label: 'Safe' },
  { id: 'warning', label: 'Caution' },
  { id: 'danger',  label: 'Danger' },
];

const FILTER_COLORS: Record<FilterType, string> = {
  all:     PURPLE,
  safe:    '#059669',
  warning: '#d97706',
  danger:  '#dc2626',
};

const RATING_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  safe:    { label: '✓ Safe',    bg: '#d1fae5', color: '#065f46' },
  warning: { label: '⚡ Caution', bg: '#fef3c7', color: '#92400e' },
  danger:  { label: '⚠ Danger',  bg: '#fee2e2', color: '#991b1b' },
  unknown: { label: '🔍 Unknown', bg: '#F9FAFB', color: GRAY },
};

function formatDate(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())
    return `Today, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  if (d.toDateString() === yesterday.toDateString())
    return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function HistoryScreen({ history, onViewItem, onClearHistory, onStartScan }: Props) {
  const navigation = useNavigation<any>();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filtered = activeFilter === 'all' ? history : history.filter(h => h.safetyRating === activeFilter);

  const confirmClear = () => {
    Alert.alert('Clear History', 'This will delete all scan history. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: onClearHistory },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.count}>{history.length} scan{history.length !== 1 ? 's' : ''}</Text>
        {history.length > 0 && (
          <PressRing borderRadius={10} onPress={confirmClear} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear All</Text>
          </PressRing>
        )}
      </View>

      {history.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
          {FILTERS.map(f => (
            <PressRing key={f.id} borderRadius={12}
              onPress={() => setActiveFilter(f.id)}
              style={[styles.filterBtn, activeFilter === f.id && { backgroundColor: FILTER_COLORS[f.id] }]}>
              <Text style={[styles.filterText, activeFilter === f.id && styles.filterTextActive]}>
                {f.label}
                {f.id !== 'all' && ` (${history.filter(h => h.safetyRating === f.id).length})`}
              </Text>
            </PressRing>
          ))}
        </ScrollView>
      )}

      {history.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🕐</Text>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptySubtitle}>Your scan history will appear here after your first scan.</Text>
          <PressRing borderRadius={16} onPress={() => { onStartScan(); navigation.navigate('Scan'); }} style={styles.startScanBtn}>
            <Text style={styles.startScanText}>Start your first scan</Text>
          </PressRing>
        </View>
      )}

      {history.length > 0 && filtered.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No {activeFilter} scans yet</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map((item, i) => {
          const safetyRating = item.safetyRating in RATING_BADGE ? item.safetyRating : 'unknown';
          const badge = RATING_BADGE[safetyRating];
          const detectedAllergens = Array.isArray(item.detectedAllergens) ? item.detectedAllergens : [];
          const count = detectedAllergens.length;
          return (
            // Cascade the rows in, but cap the delay so long histories aren't slow to appear.
            <FadeIn key={item.id} delay={Math.min(i * 45, 400)}>
              <PressRing borderRadius={16} onPress={() => onViewItem(item)} style={styles.item}>
                {item.imageUrl
                  ? <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                  : <View style={styles.itemImagePlaceholder}><Text style={{ fontSize: 24 }}>🏷️</Text></View>
                }
                <View style={styles.itemInfo}>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.productName || (count > 0 ? `${count} allergen${count !== 1 ? 's' : ''} found` : 'No allergens detected')}
                  </Text>
                  <Text style={styles.itemDate}>{formatDate(item.timestamp ?? Date.now())}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </PressRing>
            </FadeIn>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#fff' },
  header:               { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  count:                { fontSize: 13, fontWeight: '700', color: MUTED },
  clearBtn:             { backgroundColor: '#fff1f2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  clearBtnText:         { fontSize: 12, fontWeight: '700', color: '#ef4444' },
  filters:              { maxHeight: 48 },
  filtersContent:       { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  filterBtn:            { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER },
  filterText:           { fontSize: 12, fontWeight: '700', color: GRAY },
  filterTextActive:     { color: '#fff' },
  emptyState:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyIcon:            { fontSize: 56 },
  emptyTitle:           { fontSize: 20, fontWeight: '800', color: GRAY },
  emptySubtitle:        { fontSize: 14, color: MUTED, textAlign: 'center' },
  startScanBtn:         { backgroundColor: PURPLE, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14 },
  startScanText:        { color: '#fff', fontWeight: '700', fontSize: 15 },
  list:                 { padding: 16, gap: 10 },
  item:                 { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: BORDER },
  itemImage:            { width: 52, height: 52, borderRadius: 12 },
  itemImagePlaceholder: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
  itemInfo:             { flex: 1 },
  badge:                { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  badgeText:            { fontSize: 11, fontWeight: '700' },
  itemName:             { fontSize: 14, fontWeight: '700', color: BLACK },
  itemDate:             { fontSize: 12, color: MUTED, marginTop: 2 },
  chevron:              { fontSize: 22, color: BORDER },
});
