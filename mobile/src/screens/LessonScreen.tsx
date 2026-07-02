/**
 * Screen 5 — The lesson, the core loop (PRD 4.5). One turn:
 *   1. Set the situation, in the bridge language (auto-spoken).
 *   2. Give the target phrase: shown as text + spoken slowly. Replayable; every
 *      word is tappable to hear it alone.
 *   3. The user taps the mic and speaks.
 *   4. Gentle feedback — encouragement first (KasaAI voices it), a soft cue, and
 *      a per-word hint. Never a harsh score.
 *   5. Move on, or repeat.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { MicButton, MicState } from '../components/MicButton';
import { FeedbackCue } from '../components/FeedbackCue';
import { BigButton } from '../components/BigButton';
import { tts } from '../services/tts';
import { asr } from '../services/asr';
import { brain } from '../services/brain';
import { scorePhrase, ScoreResult } from '../services/scoring';
import { playUri } from '../services/audioPlayback';
import { ensureAudioCached, downloadPack } from '../services/packAudio';
import { useRecorder } from '../hooks/useRecorder';
import { stringsFor } from '../i18n/strings';
import { useProgress } from '../state/progress';
import { usePacks } from '../state/packs';
import { DIRECTIONS } from '../types/content';
import type { ScreenProps } from '../navigation/types';

export function LessonScreen({ route, navigation }: ScreenProps<'Lesson'>) {
  const { packId } = route.params;
  const { direction } = useProgress();
  const { packById } = usePacks();
  const pack = packById(packId);
  const dir = direction ?? pack?.direction ?? 'learn-en';
  const { bridge, target: targetLang } = DIRECTIONS[dir];
  const s = stringsFor(bridge);

  const [index, setIndex] = useState(0);
  const [micState, setMicState] = useState<MicState>('idle');
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [brainMsg, setBrainMsg] = useState<string | null>(null);

  const recorder = useRecorder();
  const mounted = useRef(true);
  useEffect(() => () => {
    mounted.current = false;
    tts.stop();
  }, []);

  const phrase = pack?.phrases[index];

  // Cache the whole pack's audio for offline use on first open (no-op if the
  // pack has no pre-generated audio yet).
  useEffect(() => {
    if (pack) downloadPack(pack).catch(() => {});
  }, [pack?.id]);

  // Play a prompt: prefer pre-generated/cached audio, fall back to live/device TTS.
  const playPart = useCallback(
    async (kind: 'situation' | 'target') => {
      if (!pack || !phrase) return;
      const text = kind === 'situation' ? phrase.situation : phrase.target;
      const lang = kind === 'situation' ? bridge : targetLang;
      const remote = kind === 'situation' ? phrase.situationAudio : phrase.targetAudio;
      const uri = await ensureAudioCached(pack.id, phrase.id, kind, remote);
      if (uri) {
        await playUri(uri);
        return;
      }
      await tts.speak(text, lang);
    },
    [pack, phrase, bridge, targetLang],
  );

  // Intro each phrase: play the situation, then the target phrase, slowly.
  useEffect(() => {
    if (!phrase) return;
    setResult(null);
    setBrainMsg(null);
    setMicState('idle');
    (async () => {
      await playPart('situation');
      if (mounted.current) await playPart('target');
    })();
    return () => tts.stop();
  }, [phrase, playPart]);

  const replayTarget = useCallback(() => {
    void playPart('target');
  }, [playPart]);

  const onMic = useCallback(async () => {
    if (!phrase) return;
    if (micState === 'idle') {
      tts.stop();
      const ok = await recorder.start();
      if (ok && mounted.current) setMicState('recording');
      return;
    }
    if (micState === 'recording') {
      setMicState('thinking');
      const uri = await recorder.stop();
      const heard = await asr.transcribe(uri ?? '', targetLang, {
        expected: phrase.target,
      });
      const res = scorePhrase(phrase.target, heard);
      const msg = await brain.respond({
        bridge,
        bucket: res.bucket,
        firstMiss: res.firstMiss,
        target: phrase.target,
        heard,
      });
      if (!mounted.current) return;
      setResult(res);
      setBrainMsg(msg);
      setMicState('idle');
      tts.speak(msg, bridge);
    }
  }, [phrase, micState, recorder, targetLang, bridge]);

  const goNext = useCallback(() => {
    tts.stop();
    if (pack && index < pack.phrases.length - 1) {
      setIndex((i) => i + 1);
    } else {
      navigation.replace('LessonComplete', { packId });
    }
  }, [pack, index, navigation, packId]);

  const tryAgain = useCallback(() => {
    setResult(null);
    setBrainMsg(null);
    replayTarget();
  }, [replayTarget]);

  if (!pack || !phrase) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>—</Text>
      </SafeAreaView>
    );
  }

  const micLabel =
    micState === 'recording'
      ? s.lessonListening
      : micState === 'thinking'
        ? s.lessonListening
        : s.lessonTapToSpeak;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {index + 1} / {pack.phrases.length}
        </Text>
        {!asr.isReal && (
          <Text style={styles.demoTag}>demo feedback</Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 1. Situation, bridge language */}
        <Pressable
          style={styles.situationCard}
          accessibilityRole="button"
          accessibilityLabel={phrase.situation}
          accessibilityHint="Plays the situation aloud"
          onPress={() => tts.speak(phrase.situation, bridge)}
        >
          <Ionicons name="volume-high" size={22} color={colors.inkSoft} />
          <Text style={styles.situationText}>{phrase.situation}</Text>
        </Pressable>

        {/* 2. Target phrase: tappable words + replay */}
        <View style={styles.targetBlock}>
          <View style={styles.words}>
            {phrase.target.split(/\s+/).map((w, i) => (
              <Pressable
                key={`${w}-${i}`}
                accessibilityRole="button"
                accessibilityLabel={w}
                accessibilityHint="Plays this word"
                onPress={() => tts.speak(w, targetLang)}
              >
                <Text style={styles.targetWord}>{w}</Text>
              </Pressable>
            ))}
          </View>
          {phrase.gloss && <Text style={styles.gloss}>{phrase.gloss}</Text>}
          <BigButton
            label={s.lessonReplay}
            icon="volume-high"
            speakLang={bridge}
            variant="secondary"
            onPress={replayTarget}
            style={styles.replayBtn}
          />
        </View>

        {/* 4. Feedback */}
        {result && brainMsg && (
          <FeedbackCue bucket={result.bucket} words={result.words} message={brainMsg} />
        )}
      </ScrollView>

      {/* 3. Mic + next actions */}
      <View style={styles.footer}>
        {!result ? (
          <MicButton state={micState} label={micLabel} onPress={onMic} />
        ) : (
          <View style={styles.actions}>
            <BigButton
              label={s.lessonTryAgain}
              speakLang={bridge}
              variant="secondary"
              onPress={tryAgain}
              style={styles.actionBtn}
            />
            <BigButton
              label={s.lessonNext}
              speakLang={bridge}
              color={colors.green}
              onPress={goNext}
              style={styles.actionBtn}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  title: { ...typography.title, textAlign: 'center' },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  progressText: { ...typography.label, color: colors.inkSoft },
  demoTag: {
    ...typography.caption,
    color: colors.clay,
    fontWeight: '700',
  },
  scroll: { gap: spacing.lg, paddingVertical: spacing.md },
  situationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  situationText: { ...typography.body, color: colors.ink, flex: 1 },
  targetBlock: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  targetWord: {
    ...typography.title,
    color: colors.ink,
    textDecorationLine: 'underline',
    textDecorationColor: colors.gold,
  },
  gloss: { ...typography.body, color: colors.inkSoft, fontStyle: 'italic' },
  replayBtn: { alignSelf: 'stretch' },
  footer: { paddingTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1 },
});
