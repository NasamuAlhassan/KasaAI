/**
 * The big microphone (PRD 4.5 step 3). One large, obvious target the user taps
 * to speak. Shows three states: idle, recording, and thinking (while ASR runs).
 */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, typography } from '../theme/tokens';

export type MicState = 'idle' | 'recording' | 'thinking';

interface Props {
  state: MicState;
  label: string;
  onPress: () => void;
}

export function MicButton({ state, label, onPress }: Props) {
  const busy = state === 'thinking';
  const bg =
    state === 'recording'
      ? colors.red
      : state === 'thinking'
        ? colors.inkSoft
        : colors.green;

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ busy, disabled: busy }}
        disabled={busy}
        onPress={onPress}
        style={({ pressed }) => [
          styles.circle,
          { backgroundColor: bg, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        {busy ? (
          <ActivityIndicator color={colors.onColor} size="large" />
        ) : (
          <Text style={styles.icon}>{state === 'recording' ? '⏺' : '🎤'}</Text>
        )}
      </Pressable>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12 },
  circle: {
    width: 128,
    height: 128,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  icon: { fontSize: 56 },
  label: { ...typography.label, color: colors.ink },
});
