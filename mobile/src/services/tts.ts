/**
 * Text-to-speech (KasaAI's voice — PRD 7.3).
 *
 * When the backend is configured, speaks with the real Ghanaian voices from the
 * `speak` edge function (Khaya for Twi, Abena Ghanaian-English for English). If
 * that call fails, or when there's no backend, it falls back to the device voice
 * so the app always talks. Screens use the same `speak/stop` interface either way.
 */

import * as Speech from 'expo-speech';
import type { LanguageCode } from '../types/content';
import { isSupabaseConfigured } from '../config/env';
import { remoteSpeak } from './remote';
import { playBase64Audio, stopPlayback } from './audioPlayback';

export interface TtsProvider {
  speak(text: string, lang: LanguageCode): Promise<void>;
  stop(): void;
}

/** Best-effort BCP-47 tags for on-device voices (fallback path). */
const LANG_TAG: Record<LanguageCode, string> = {
  en: 'en-GB', // closer to Ghanaian English than en-US
  twi: 'tw', // rarely installed; degrades rather than crashing
};

class DeviceTtsProvider implements TtsProvider {
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

  async speak(text: string, lang: LanguageCode): Promise<void> {
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
  }

  stop(): void {
    stopPlayback();
    this.device.stop();
  }
}

export const tts: TtsProvider = new SmartTtsProvider();
