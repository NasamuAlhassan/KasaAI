/**
 * Screen 1 — Open (PRD 4). KasaAI speaks immediately in Twi (the app is
 * Twi-first), a friendly identity appears, and any tap moves on. No wall of text.
 */
import React, { useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/tokens';
import { tts } from '../services/tts';
import { speakStatic, STATIC_AUDIO } from '../services/staticVoice';
import { stringsFor } from '../i18n/strings';
import { SpeakingIndicator } from '../components/SpeakingIndicator';
import type { ScreenProps } from '../navigation/types';

export function WelcomeScreen({ navigation }: ScreenProps<'Welcome'>) {
  // The opening greeting is always Twi — the primary audience is Twi-first.
  const s = stringsFor('twi');
  // Browsers block any audio before the page has had a genuine user gesture
  // (click/tap) — so on web, the automatic attempt below almost always fails
  // silently on first load. Track whether it actually succeeded so the first
  // tap (a real gesture) can give it one proper shot instead of leaving the
  // user with silence. Native has no such restriction, so this stays unused
  // there and behavior is unchanged.
  const succeededRef = useRef(false);

  useEffect(() => {
    speakStatic(STATIC_AUDIO.welcomeGreetingTwi, s.welcomeGreeting, 'twi')
      .then(() => {
        succeededRef.current = true;
      })
      .catch(() => {});
    return () => tts.stop();
  }, [s.welcomeGreeting]);

  const handlePress = async () => {
    if (Platform.OS === 'web' && !succeededRef.current) {
      succeededRef.current = true; // don't retry again on a second tap
      await speakStatic(STATIC_AUDIO.welcomeGreetingTwi, s.welcomeGreeting, 'twi').catch(
        () => {},
      );
      return;
    }
    tts.stop();
    navigation.replace('LanguageSelect');
  };

  return (
    <Pressable style={styles.flex} onPress={handlePress}>
      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.mark}>Kasa</Text>
          <View style={styles.avatar}>
            <Ionicons name="chatbubbles" size={60} color={colors.onColor} />
          </View>
          <Text style={styles.greeting}>{s.welcomeGreeting}</Text>
          <SpeakingIndicator bridge="twi" />
        </View>
        <Text style={styles.hint}>{s.welcomeTapToStart}</Text>
      </SafeAreaView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  mark: { ...typography.hero, color: colors.green, letterSpacing: 1 },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    ...typography.title,
    color: colors.ink,
    textAlign: 'center',
  },
  hint: { ...typography.body, color: colors.inkSoft, textAlign: 'center' },
});
