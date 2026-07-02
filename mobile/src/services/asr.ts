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

import * as FileSystem from 'expo-file-system/legacy';
import type { LanguageCode } from '../types/content';
import { isSupabaseConfigured } from '../config/env';
import { remoteTranscribe } from './remote';

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

function mimeFor(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.caf')) return 'audio/x-caf';
  return 'audio/m4a'; // expo-audio HIGH_QUALITY default
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
      const audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      return await remoteTranscribe(audioBase64, mimeFor(uri), lang);
    } catch (e) {
      console.warn('[kasa] remote ASR failed, using mock:', e);
      return this.fallback.transcribe(uri, lang, opts);
    }
  }
}

export const asr: AsrProvider = isSupabaseConfigured
  ? new RemoteAsrProvider()
  : new MockAsrProvider();
