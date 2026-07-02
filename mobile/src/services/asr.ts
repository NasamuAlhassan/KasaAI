/**
 * Speech recognition (PRD 7.3, 7.4).
 *
 *  - English (primary direction): Whisper via the `transcribe` edge function.
 *  - Twi (reverse direction): Khaya / Abena via the same function.
 *
 * When the backend is configured, `asr` reads the recording and sends it up for
 * real transcription. With no backend it uses a MOCK so the whole lesson loop
 * still runs; `isReal` drives the "demo feedback" tag in the UI.
 */

import type { LanguageCode } from '../types/content';
import { isSupabaseConfigured } from '../config/env';
import { remoteTranscribe } from './remote';
import { readAudioUri } from './audioBytes';

export interface TranscribeOptions {
  /** Simulation hint for the mock only. Real ASR providers ignore this. */
  expected?: string;
}

export interface AsrProvider {
  transcribe(
    uri: string,
    lang: LanguageCode,
    opts?: TranscribeOptions,
  ): Promise<string>;
  /** True once a real backend is connected; UI shows honest feedback state. */
  readonly isReal: boolean;
}

/**
 * MockAsrProvider — pretends to hear the user so the loop is buildable before/
 * without a backend. Usually returns the expected phrase, sometimes drops or
 * garbles a word so the feedback cue varies.
 */
class MockAsrProvider implements AsrProvider {
  readonly isReal = false;

  async transcribe(
    _uri: string,
    _lang: LanguageCode,
    opts?: TranscribeOptions,
  ): Promise<string> {
    await new Promise((r) => setTimeout(r, 700));
    const expected = opts?.expected ?? '';
    const words = expected.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';

    const roll = Math.random();
    if (roll < 0.6) return expected;
    if (roll < 0.85) {
      const drop = Math.floor(Math.random() * words.length);
      return words.filter((_, i) => i !== drop).join(' ');
    }
    const idx = Math.floor(Math.random() * words.length);
    words[idx] = words[idx].slice(0, Math.max(1, words[idx].length - 2));
    return words.join(' ');
  }
}

/** Real ASR via the backend; falls back to the mock on any failure. */
class RemoteAsrProvider implements AsrProvider {
  readonly isReal = true;
  private fallback = new MockAsrProvider();

  async transcribe(
    uri: string,
    lang: LanguageCode,
    opts?: TranscribeOptions,
  ): Promise<string> {
    try {
      if (!uri) throw new Error('no recording uri');
      const { base64, mime } = await readAudioUri(uri);
      return await remoteTranscribe(base64, mime, lang);
    } catch (e) {
      console.warn('[kasa] remote ASR failed, using mock:', e);
      return this.fallback.transcribe(uri, lang, opts);
    }
  }
}

export const asr: AsrProvider = isSupabaseConfigured
  ? new RemoteAsrProvider()
  : new MockAsrProvider();
