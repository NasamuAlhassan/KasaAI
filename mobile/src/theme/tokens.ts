/**
 * Kasa design tokens.
 *
 * Two rules from the PRD drive every value here:
 *  - "Big, few, obvious": large tap targets, generous spacing.
 *  - "Local, not generic": a warm, Ghana-inspired palette (kente gold, forest
 *    green, clay red on a warm cream ground) instead of a cold default UI.
 */

export const colors = {
  // Warm ground so the app never feels clinical.
  background: '#FBF3E4',
  surface: '#FFFFFF',
  surfaceAlt: '#F3E7CE',

  // Kente-inspired accents.
  gold: '#E8A317',
  goldDark: '#B87A0E',
  green: '#1E7A46',
  greenDark: '#145733',
  red: '#C1272D',
  clay: '#8A4B2F',

  // Text.
  ink: '#2B2118',
  inkSoft: '#6B5E4E',
  onColor: '#FFFFFF',

  // Feedback cues (never harsh — see PRD 5.2).
  good: '#1E7A46',
  almost: '#E8A317',
  again: '#C97B3C',

  border: '#E4D6BC',
} as const;

export const spacing = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 32,
  xl: 48,
} as const;

export const radius = {
  md: 16,
  lg: 24,
  pill: 999,
} as const;

/** Minimum tap target. Deliberately large for low-literacy, older users. */
export const TAP_MIN = 64;

export const typography = {
  hero: { fontSize: 34, fontWeight: '800' as const, lineHeight: 40 },
  title: { fontSize: 26, fontWeight: '800' as const, lineHeight: 32 },
  body: { fontSize: 20, fontWeight: '500' as const, lineHeight: 28 },
  label: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  caption: { fontSize: 16, fontWeight: '500' as const, lineHeight: 22 },
} as const;
