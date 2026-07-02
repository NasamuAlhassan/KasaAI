/**
 * Screen 4 — Choosing a lesson (PRD 4). A simple home of large, illustrated,
 * audio-labelled pack tiles, with the streak shown as a kente strip on top.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme/tokens';
import { PackTile } from '../components/PackTile';
import { StreakStrip } from '../components/StreakStrip';
import { stringsFor } from '../i18n/strings';
import { useProgress } from '../state/progress';
import { DIRECTIONS } from '../types/content';
import { packsForDirection } from '../content';
import type { ScreenProps } from '../navigation/types';

export function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const { direction, streakDays } = useProgress();
  const dir = direction ?? 'learn-en';
  const bridge = DIRECTIONS[dir].bridge;
  const s = stringsFor(bridge);
  const packs = packsForDirection(dir);

  // Two-column grid.
  const rows: (typeof packs)[] = [];
  for (let i = 0; i < packs.length; i += 2) rows.push(packs.slice(i, i + 2));

  return (
    <SafeAreaView style={styles.container}>
      {streakDays > 0 && (
        <View style={styles.streak}>
          <StreakStrip days={streakDays} label={s.streakLabel(streakDays)} />
        </View>
      )}
      <Text style={styles.title}>{s.homeTitle}</Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {rows.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((pack) => (
              <PackTile
                key={pack.id}
                pack={pack}
                bridge={bridge}
                onPress={() => navigation.navigate('Lesson', { packId: pack.id })}
              />
            ))}
            {row.length === 1 && <View style={styles.spacer} />}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  streak: { alignItems: 'center', marginBottom: spacing.sm },
  title: {
    ...typography.title,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  grid: { paddingBottom: spacing.xl },
  row: { flexDirection: 'row' },
  spacer: { flex: 1, margin: spacing.xs },
});
