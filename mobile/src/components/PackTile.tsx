/**
 * Home-screen scenario tile (PRD 4.4): large, illustrated, with an audio label
 * so packs are recognisable without reading. Emoji stands in for the real
 * Ghanaian illustrations to come. Tapping opens the pack; long-press speaks its
 * name in the bridge language.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { tts } from '../services/tts';
import type { LanguageCode, ScenarioPack } from '../types/content';

interface Props {
  pack: ScenarioPack;
  bridge: LanguageCode;
  onPress: () => void;
}

export function PackTile({ pack, bridge, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={pack.title}
      onPress={onPress}
      onLongPress={() => tts.speak(pack.title, bridge)}
      style={({ pressed }) => [
        styles.tile,
        { borderColor: pack.color, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: pack.color }]}>
        <Text style={styles.emoji}>{pack.emoji}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {pack.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 160,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 3,
    padding: spacing.md,
    margin: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 40 },
  title: { ...typography.body, fontWeight: '700', textAlign: 'center' },
});
