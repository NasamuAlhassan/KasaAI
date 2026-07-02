/**
 * Gentle feedback cue (PRD 5.2). Never a percentage, never a red X. A calm
 * coloured bar plus a short "good / almost / try once more" word, leading with
 * what the user got right.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';
import type { FeedbackBucket, WordResult } from '../services/scoring';

interface Props {
  bucket: FeedbackBucket;
  words: WordResult[];
  message: string;
}

const CUE_COLOR: Record<FeedbackBucket, string> = {
  good: colors.good,
  almost: colors.almost,
  again: colors.again,
};

/** Fraction of the bar to fill, so "almost" still looks like progress. */
const CUE_FILL: Record<FeedbackBucket, number> = {
  good: 1,
  almost: 0.66,
  again: 0.33,
};

export function FeedbackCue({ bucket, words, message }: Props) {
  const color = CUE_COLOR[bucket];
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { backgroundColor: color, flex: CUE_FILL[bucket] },
          ]}
        />
        <View style={{ flex: 1 - CUE_FILL[bucket] }} />
      </View>

      <Text style={[styles.message, { color }]}>{message}</Text>

      {/* Highlight each target word: recognised words in ink, missed in the
          cue colour, so the hint is visual as well as spoken. */}
      <View style={styles.words}>
        {words.map((w, i) => (
          <Text
            key={`${w.word}-${i}`}
            style={[
              styles.word,
              { color: w.ok ? colors.ink : color, fontWeight: w.ok ? '600' : '800' },
            ]}
          >
            {w.word}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, alignItems: 'center' },
  track: {
    flexDirection: 'row',
    width: '100%',
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
  message: { ...typography.title },
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  word: { ...typography.body },
});
