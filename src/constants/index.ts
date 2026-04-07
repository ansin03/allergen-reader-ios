import { Allergen } from '../types';

export const API_URL = 'https://api.3.238.135.237.nip.io/api';

export const DEFAULT_ALLERGENS: Allergen[] = [
  { id: '1',  name: 'Peanuts',   enabled: true,  severity: 'fatal',       emoji: '🥜' },
  { id: '2',  name: 'Dairy',     enabled: true,  severity: 'intolerance', emoji: '🥛' },
  { id: '3',  name: 'Gluten',    enabled: true,  severity: 'mild',        emoji: '🌾' },
  { id: '4',  name: 'Eggs',      enabled: false, severity: 'intolerance', emoji: '🥚' },
  { id: '5',  name: 'Soy',       enabled: false, severity: 'mild',        emoji: '🫘' },
  { id: '6',  name: 'Tree Nuts', enabled: false, severity: 'fatal',       emoji: '🌰' },
  { id: '7',  name: 'Shellfish', enabled: false, severity: 'fatal',       emoji: '🦐' },
  { id: '8',  name: 'Fish',      enabled: false, severity: 'intolerance', emoji: '🐟' },
  { id: '9',  name: 'Sesame',    enabled: false, severity: 'mild',        emoji: '⚫' },
  { id: '10', name: 'Mustard',   enabled: false, severity: 'mild',        emoji: '🌼' },
  { id: '11', name: 'Celery',    enabled: false, severity: 'mild',        emoji: '🥬' },
  { id: '12', name: 'Lupin',     enabled: false, severity: 'mild',        emoji: '🌸' },
  { id: '13', name: 'Sulphites', enabled: false, severity: 'mild',        emoji: '🍷' },
  { id: '14', name: 'Molluscs',  enabled: false, severity: 'intolerance', emoji: '🦑' },
];

export const SEVERITY_CONFIG = {
  fatal:       { label: 'Fatal',       color: '#fee2e2', textColor: '#b91c1c', dot: '#ef4444' },
  intolerance: { label: 'Intolerance', color: '#ffedd5', textColor: '#c2410c', dot: '#f97316' },
  mild:        { label: 'Mild',        color: '#fef9c3', textColor: '#a16207', dot: '#eab308' },
} as const;
