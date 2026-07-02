/**
 * Speech recognition (PRD 7.3, 7.4).
 *
 *  - English (primary direction): Whisper, self-hosted, via the orchestration
 *    layer — chosen for tolerance of accented English.
 *  - Twi (reverse direction): Khaya / Abena ASR.
 *
 * Neither is wired yet (keys/hosting pending), so the app ships with a MOCK that
 * lets the whole lesson loop run end to end. The mock simulates a plausible
 * transcription so feedback varies; real providers ignore the `expected` hint.
 */

import type { LanguageCode } from '../types/content';

export interface TranscribeOptions {
  /** Simulation hint for the mock only. Real ASR providers must ignore this. */
  expected?: string;
}

export interface AsrProvider {
  transcribe(
    uri: string,
    lang: LanguageCode,
    opts?: TranscribeOptions,
  ): Promise<string>;
  /** True once a real backend is connected; UI can show honest feedback state. */
  readonly isReal: boolean;
}

/**
 * MockAsrProvider — pretends to hear the user. It usually returns the expected
 * phrase, sometimes drops or garbles a word, so the feedback cue isn't always
 * "perfect". Purely for building the loop before Whisper/Khaya are connected.
 */
class MockAsrProvider implements AsrProvider {
  readonly isReal = false;

  async transcribe(
    _uri: string,
    _lang: LanguageCode,
    opts?: TranscribeOptions,
  ): Promise<string> {
    // Simulate network/processing latency so the UI's "listening" state is real.
    await new Promise((r) => setTimeout(r, 700));

    const expected = opts?.expected ?? '';
    const words = expected.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';

    const roll = Math.random();
    if (roll < 0.6) return expected; // mostly "good"
    if (roll < 0.85) {
      // drop one word -> "almost"
      const drop = Math.floor(Math.random() * words.length);
      return words.filter((_, i) => i !== drop).join(' ');
    }
    // garble a word -> "try again"
    const idx = Math.floor(Math.random() * words.length);
    words[idx] = words[idx].slice(0, Math.max(1, words[idx].length - 2));
    return words.join(' ');
  }
}

export const asr: AsrProvider = new MockAsrProvider();
