/**
 * Large, obvious, voice-first button (PRD 6.1, 6.3).
 * - Big tap target.
 * - Long-press speaks the label aloud, so a user who cannot read still knows
 *   what the button does ("Each button plays its own label on tap-and-hold").
 */
import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing, TAP_MIN, typography } from '../theme/tokens';
import { tts } from '../services/tts';
import type { LanguageCode } from '../types/content';

interface Props {
  label: string;
  onPress: () => void;
  /** Language to voice the label in on long-press. */
  speakLang: LanguageCode;
  variant?: 'primary' | 'secondary' | 'plain';
  color?: string;
  style?: ViewStyle;
}

export function BigButton({
  label,
  onPress,
  speakLang,
  variant = 'primary',
  color,
  style,
}: Props) {
  const bg =
    variant === 'primary'
      ? color ?? colors.green
      : variant === 'secondary'
        ? colors.surface
        : 'transparent';
  const fg = variant === 'primary' ? colors.onColor : colors.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={() => tts.speak(label, speakLang)}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor: variant === 'secondary' ? colors.border : 'transparent',
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: TAP_MIN,
    borderRadius: radius.lg,
    borderWidth: 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.label, textAlign: 'center' },
});
