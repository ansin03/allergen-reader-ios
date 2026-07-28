// Single source of truth for the app's visual language.
// Screens should pull from here rather than redeclaring hex codes locally.

export const COLORS = {
  purple:      '#6D28D9',
  purpleDeep:  '#4C1D95',
  purpleDark:  '#2E1065',
  purpleBright:'#8B5CF6',
  purpleLight: '#EDE9FE',
  purpleEdge:  '#DDD6FE',

  black:   '#111827',
  gray:    '#6B7280',
  muted:   '#9CA3AF',
  border:  '#E5E7EB',
  surface: '#F9FAFB',
  white:   '#FFFFFF',

  danger:      '#DC2626',
  dangerDeep:  '#991B1B',
  dangerLight: '#FEE2E2',
  warning:     '#D97706',
  warningDeep: '#92400E',
  warningLight:'#FEF3C7',
  safe:        '#059669',
  safeDeep:    '#065F46',
  safeLight:   '#D1FAE5',
} as const;

// Gradients are [from, to] pairs consumed by expo-linear-gradient.
export const GRADIENTS = {
  purple:  ['#7C3AED', '#5B21B6'],
  hero:    ['#8B5CF6', '#5B21B6'],
  night:   ['#2E1065', '#1E1B4B'],
  danger:  ['#EF4444', '#991B1B'],
  warning: ['#F59E0B', '#B45309'],
  safe:    ['#10B981', '#047857'],
  neutral: ['#9CA3AF', '#4B5563'],
} as const;

export type GradientName = keyof typeof GRADIENTS;

// Coloured shadow — the "glow" under primary surfaces.
export const glow = (color: string, opacity = 0.35, radius = 18) => ({
  shadowColor: color,
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
});

export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;

export const RADIUS = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 } as const;
