/**
 * Screen 2 — Language selection (PRD 4). KasaAI asks in Twi which language the
 * user wants, then two large audio-labelled buttons. Each button long-presses to
 * speak its own label, so the choice is never guesswork for a non-reader.
 */
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/tokens';
import { BigButton } from '../components/BigButton';
import { SpeakingIndicator } from '../components/SpeakingIndicator';
import { tts } from '../services/tts';
import { stringsFor } from '../i18n/strings';
import { useProgress } from '../state/progress';
import type { DirectionId } from '../types/content';
import type { ScreenProps } from '../navigation/types';

export function LanguageSelectScreen({ navigation }: ScreenProps<'LanguageSelect'>) {
  const s = stringsFor('twi'); // prompt spoken in Twi (primary audience)
  const { chooseDirection } = useProgress();

  useEffect(() => {
    tts.speak(s.chooseLanguagePrompt, 'twi');
    return () => tts.stop();
  }, [s.chooseLanguagePrompt]);

  const pick = (d: DirectionId) => {
    tts.stop();
    chooseDirection(d);
    navigation.replace('Onboarding');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.prompt}>{s.chooseLanguagePrompt}</Text>
      <SpeakingIndicator bridge="twi" />
      <View style={styles.buttons}>
        <BigButton
          label={s.learnEnglish}
          speakLang="twi"
          color={colors.green}
          onPress={() => pick('learn-en')}
        />
        <BigButton
          label={s.learnTwi}
          speakLang="en"
          color={colors.red}
          onPress={() => pick('learn-twi')}
        />
      </View>
      <View style={styles.hintRow}>
        <Ionicons name="volume-high" size={18} color={colors.inkSoft} />
        <Text style={styles.hint}>Mia so kyɛ na tie</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center', gap: spacing.xl },
  prompt: { ...typography.title, color: colors.ink, textAlign: 'center' },
  buttons: { gap: spacing.md },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  hint: { ...typography.caption, color: colors.inkSoft, textAlign: 'center' },
});
