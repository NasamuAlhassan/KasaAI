/**
 * Screen 6 — End of lesson (PRD 4). KasaAI congratulates the user, the streak
 * ticks up as a kente strip, and they can practise again or move on.
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme/tokens';
import { BigButton } from '../components/BigButton';
import { StreakStrip } from '../components/StreakStrip';
import { tts } from '../services/tts';
import { stringsFor } from '../i18n/strings';
import { useProgress } from '../state/progress';
import { DIRECTIONS } from '../types/content';
import type { ScreenProps } from '../navigation/types';

export function LessonCompleteScreen({ route, navigation }: ScreenProps<'LessonComplete'>) {
  const { packId } = route.params;
  const { direction, streakDays, completeLesson } = useProgress();
  const bridge = direction ? DIRECTIONS[direction].bridge : 'twi';
  const s = stringsFor(bridge);

  // Record completion exactly once, then celebrate.
  const recorded = useRef(false);
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    completeLesson(packId);
    tts.speak(s.lessonDoneBody, bridge);
    return () => tts.stop();
  }, [completeLesson, packId, s.lessonDoneBody, bridge]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>{s.lessonDoneTitle}</Text>
        <Text style={styles.subtitle}>{s.lessonDoneBody}</Text>
        {streakDays > 0 && (
          <StreakStrip days={streakDays} label={s.streakLabel(streakDays)} />
        )}
      </View>
      <View style={styles.actions}>
        <BigButton
          label={s.practiseAgain}
          speakLang={bridge}
          variant="secondary"
          onPress={() => navigation.replace('Lesson', { packId })}
        />
        <BigButton
          label={s.continueWord}
          speakLang={bridge}
          color={colors.green}
          onPress={() => navigation.replace('Home')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  emoji: { fontSize: 72 },
  title: { ...typography.hero, color: colors.green, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.ink, textAlign: 'center' },
  actions: { gap: spacing.md },
});
