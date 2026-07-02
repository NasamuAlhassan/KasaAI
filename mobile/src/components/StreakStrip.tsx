/**
 * Streak shown as a growing kente strip rather than a borrowed flame (PRD 5.3).
 * Each day the user shows up adds a woven block in alternating kente colours.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

interface Props {
  days: number;
  label: string;
}

const WEAVE = [colors.gold, colors.green, colors.red, colors.goldDark];
const MAX_BLOCKS = 7; // one week visible; longer streaks show 7 + a count

export function StreakStrip({ days, label }: Props) {
  const blocks = Math.min(days, MAX_BLOCKS);
  return (
    <View style={styles.wrap}>
      <View style={styles.strip}>
        {Array.from({ length: MAX_BLOCKS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.block,
              {
                backgroundColor:
                  i < blocks ? WEAVE[i % WEAVE.length] : colors.surfaceAlt,
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.label}>
        {label}
        {days > MAX_BLOCKS ? ` (+${days - MAX_BLOCKS})` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xs },
  strip: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
  },
  block: { width: 20, height: 28, borderRadius: 4 },
  label: { ...typography.caption, color: colors.inkSoft, fontWeight: '700' },
});
