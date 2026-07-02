/**
 * Text-to-speech (KasaAI's voice — PRD 7.3).
 *
 * Interface-first so providers swap without touching the UI:
 *  - now:   device TTS via expo-speech (real English voice immediately; Twi is
 *           best-effort and will sound wrong on most devices).
 *  - later: Khaya (GhanaNLP) / Abena Ghanaian-English via the orchestration
 *           layer, with results pre-generated and cached for offline packs.
 */

import * as Speech from 'expo-speech';
import type { LanguageCode } from '../types/content';

export interface TtsProvider {
  speak(text: string, lang: LanguageCode): Promise<void>;
  stop(): void;
}

/** Best-effort BCP-47 tags for on-device voices. */
const LANG_TAG: Record<LanguageCode, string> = {
  // Ghanaian English has no device voice; en-GB is a closer proxy than en-US.
  en: 'en-GB',
  // Twi ('ak'/'tw') is rarely installed; kept so we degrade rather than crash.
  twi: 'tw',
};

class DeviceTtsProvider implements TtsProvider {
  speak(text: string, lang: LanguageCode): Promise<void> {
    return new Promise((resolve) => {
      Speech.stop();
      Speech.speak(text, {
        language: LANG_TAG[lang],
        rate: 0.92, // a touch slow, so learners can follow (PRD 4.5)
        pitch: 1.0,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: () => resolve(), // never block the UI on a TTS failure
      });
    });
  }

  stop(): void {
    Speech.stop();
  }
}

export const tts: TtsProvider = new DeviceTtsProvider();
