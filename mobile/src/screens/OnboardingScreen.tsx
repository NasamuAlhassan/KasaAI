/**
 * Screen 3 — Onboarding (PRD 4). Short and spoken: what the app is for and how a
 * lesson works, in the user's bridge language. The goal is to reach the first
 * real lesson while the user is still curious.
 */
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/tokens';
import { BigButton } from '../components/BigButton';
import { SpeakingIndicator } from '../components/SpeakingIndicator';
import { tts } from '../services/tts';
import { speakStatic, STATIC_AUDIO } from '../services/staticVoice';
import { stringsFor } from '../i18n/strings';
import { useProgress } from '../state/progress';
import { DIRECTIONS } from '../types/content';
import type { ScreenProps } from '../navigation/types';

export function OnboardingScreen({ navigation }: ScreenProps<'Onboarding'>) {
  const { direction } = useProgress();
  const bridge = direction ? DIRECTIONS[direction].bridge : 'twi';
  const s = stringsFor(bridge);

  useEffect(() => {
    const asset =
      bridge === 'twi' ? STATIC_AUDIO.onboardingBodyTwi : STATIC_AUDIO.onboardingBodyEn;
    speakStatic(asset, s.onboardingBody, bridge);
    return () => tts.stop();
  }, [s.onboardingBody, bridge]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>{s.onboardingTitle}</Text>
        <View style={styles.card}>
          <Ionicons name="chatbubbles-outline" size={28} color={colors.green} />
          <Text style={styles.step}>{s.onboardingBody}</Text>
        </View>
        <SpeakingIndicator bridge={bridge} />
      </View>
      <BigButton
        label={s.onboardingStart}
        speakLang={bridge}
        color={colors.green}
        onPress={() => {
          tts.stop();
          navigation.replace('Consent');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  body: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  title: { ...typography.hero, color: colors.ink, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  step: { ...typography.body, color: colors.ink },
});
