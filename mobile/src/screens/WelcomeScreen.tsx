/**
 * Screen 1 — Open (PRD 4). KasaAI speaks immediately in Twi (the app is
 * Twi-first), a friendly identity appears, and any tap moves on. No wall of text.
 */
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme/tokens';
import { tts } from '../services/tts';
import { stringsFor } from '../i18n/strings';
import type { ScreenProps } from '../navigation/types';

export function WelcomeScreen({ navigation }: ScreenProps<'Welcome'>) {
  // The opening greeting is always Twi — the primary audience is Twi-first.
  const s = stringsFor('twi');

  useEffect(() => {
    tts.speak(s.welcomeGreeting, 'twi');
    return () => tts.stop();
  }, [s.welcomeGreeting]);

  return (
    <Pressable style={styles.flex} onPress={() => navigation.replace('LanguageSelect')}>
      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.mark}>Kasa</Text>
          <View style={styles.avatar}>
            <Ionicons name="chatbubbles" size={60} color={colors.onColor} />
          </View>
          <Text style={styles.greeting}>{s.welcomeGreeting}</Text>
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
