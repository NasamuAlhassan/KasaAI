/**
 * Text-to-speech (KasaAI's voice — PRD 7.3).
 *
 * When the backend is configured, speaks with the real Ghanaian voices from the
 * `speak` edge function (Khaya for Twi, Abena Ghanaian-English for English). If
 * that call fails, or when there's no backend, it falls back to the device voice
 * so the app always talks. Screens use the same `speak/stop` interface either way.
 *
 * Also broadcasts an `isSpeaking` state (via `subscribe`) so the UI can show a
 * clear "KasaAI is speaking" cue instead of a silent screen while the network
 * round-trip to the voice provider is in flight — without this, users have no
 * way to tell "still loading" apart from "broken, nothing will happen."
 */

import * as Speech from 'expo-speech';
import type { LanguageCode } from '../types/content';
import { isSupabaseConfigured } from '../config/env';
import { remoteSpeak } from './remote';
import { playBase64Audio, stopPlayback } from './audioPlayback';
import { getSpeaking, setSpeaking, subscribeSpeaking } from './speakingState';

export interface TtsProvider {
  speak(text: string, lang: LanguageCode): Promise<void>;
  stop(): void;
  readonly isSpeaking: boolean;
  /** Subscribe to speaking-state changes. Returns an unsubscribe function. */
  subscribe(listener: (speaking: boolean) => void): () => void;
}

/** Best-effort BCP-47 tags for on-device voices (fallback path). */
const LANG_TAG: Record<LanguageCode, string> = {
  en: 'en-GB', // closer to Ghanaian English than en-US
  twi: 'tw', // rarely installed; degrades rather than crashing
};

class DeviceTtsProvider {
  speak(text: string, lang: LanguageCode): Promise<void> {
    return new Promise((resolve) => {
      Speech.stop();
      Speech.speak(text, {
        language: LANG_TAG[lang],
        rate: 0.92,
        pitch: 1.0,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: () => resolve(),
      });
    });
  }

  stop(): void {
    Speech.stop();
  }
}

/** Prefers real voices from the backend; falls back to the device voice. */
class SmartTtsProvider implements TtsProvider {
  private device = new DeviceTtsProvider();

  get isSpeaking(): boolean {
    return getSpeaking();
  }

  subscribe(listener: (speaking: boolean) => void): () => void {
    return subscribeSpeaking(listener);
  }

  async speak(text: string, lang: LanguageCode): Promise<void> {
    setSpeaking(true);
    try {
      if (isSupabaseConfigured) {
        try {
          const { audioBase64, mime } = await remoteSpeak(text, lang);
          await playBase64Audio(audioBase64, mime);
          return;
        } catch (e) {
          console.warn('[kasa] remote TTS failed, using device voice:', e);
        }
      }
      await this.device.speak(text, lang);
    } finally {
      setSpeaking(false);
    }
  }

  stop(): void {
    stopPlayback();
    this.device.stop();
    setSpeaking(false);
  }
}

export const tts: TtsProvider = new SmartTtsProvider();
