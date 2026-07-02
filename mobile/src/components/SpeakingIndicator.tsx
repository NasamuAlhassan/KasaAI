/**
 * Visible "KasaAI is speaking" cue. Without this, the gap between opening a
 * screen and its voice line actually starting (a real network round-trip)
 * looks identical to the app being frozen — users end up unsure whether to
 * wait or tap. Shown only while `tts` is actively fetching/playing audio.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';
import { useIsSpeaking } from '../hooks/useIsSpeaking';
import type { LanguageCode } from '../types/content';
import { stringsFor } from '../i18n/strings';

export function SpeakingIndicator({ bridge }: { bridge: LanguageCode }) {
  const speaking = useIsSpeaking();
  if (!speaking) return null;
  const s = stringsFor(bridge);
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="small" color={colors.green} />
      <Text style={styles.label}>{s.kasaSpeaking}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  label: { ...typography.caption, color: colors.green, fontWeight: '700' },
});
