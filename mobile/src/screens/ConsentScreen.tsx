/**
 * Voice consent (PRD 8). Before any recording, KasaAI explains — aloud, in plain
 * language — that the app listens to the user's voice to give feedback, that
 * recordings aren't kept, and offers a clear, opt-in (default OFF) switch to
 * contribute recordings toward improving Ghanaian-language models.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/tokens';
import { BigButton } from '../components/BigButton';
import { SpeakingIndicator } from '../components/SpeakingIndicator';
import { tts } from '../services/tts';
import { stringsFor } from '../i18n/strings';
import { useProgress } from '../state/progress';
import { DIRECTIONS } from '../types/content';
import type { ScreenProps } from '../navigation/types';

export function ConsentScreen({ navigation }: ScreenProps<'Consent'>) {
  const { direction, giveConsent } = useProgress();
  const bridge = direction ? DIRECTIONS[direction].bridge : 'twi';
  const s = stringsFor(bridge);
  const [improve, setImprove] = useState(false);

  useEffect(() => {
    tts.speak(s.consentBody, bridge);
    return () => tts.stop();
  }, [s.consentBody, bridge]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Ionicons name="shield-checkmark" size={56} color={colors.green} />
        <Text style={styles.title}>{s.consentTitle}</Text>
        <View style={styles.card}>
          <Text style={styles.text}>{s.consentBody}</Text>
        </View>
        <SpeakingIndicator bridge={bridge} />

        <View
          style={styles.toggleRow}
          accessible
          accessibilityRole="switch"
          accessibilityLabel={s.consentImproveLabel}
          accessibilityState={{ checked: improve }}
        >
          <Text style={styles.toggleLabel}>{s.consentImproveLabel}</Text>
          <Switch
            value={improve}
            onValueChange={setImprove}
            trackColor={{ true: colors.green, false: colors.border }}
            thumbColor={colors.surface}
          />
        </View>
      </View>

      <BigButton
        label={s.consentUnderstand}
        speakLang={bridge}
        color={colors.green}
        onPress={() => {
          tts.stop();
          giveConsent(improve);
          navigation.replace('Home');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  title: { ...typography.hero, color: colors.ink, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  text: { ...typography.body, color: colors.ink },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: spacing.md,
    width: '100%',
  },
  toggleLabel: { ...typography.body, color: colors.ink, flex: 1 },
});
