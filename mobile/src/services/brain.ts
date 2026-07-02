/**
 * KasaAI's spoken reactions (PRD 5.5, 7.4 step 7).
 *
 * KasaAI is a patient older sibling: encouragement first, correction second,
 * never a harsh score. The response is text in the *bridge* language, which the
 * caller then voices with the TTS provider.
 *
 *  - backend configured: Gemini via the `respond` edge function (varied phrasing).
 *  - otherwise / on failure: warm deterministic templates (offline-safe).
 */

import type { LanguageCode } from '../types/content';
import type { FeedbackBucket } from './scoring';
import { stringsFor } from '../i18n/strings';
import { isSupabaseConfigured } from '../config/env';
import { remoteRespond } from './remote';

export interface BrainInput {
  bridge: LanguageCode;
  bucket: FeedbackBucket;
  /** First target word the user missed, for a targeted, gentle nudge. */
  firstMiss?: string;
  /** The phrase being practised (helps the model react specifically). */
  target?: string;
  /** What ASR heard the user say. */
  heard?: string;
}

export interface BrainProvider {
  respond(input: BrainInput): Promise<string>;
}

class TemplateBrain implements BrainProvider {
  async respond({ bridge, bucket, firstMiss }: BrainInput): Promise<string> {
    const s = stringsFor(bridge);
    if (bucket === 'good') return s.feedbackGood;

    if (bucket === 'almost') {
      if (firstMiss) {
        return bridge === 'twi'
          ? `${s.feedbackAlmost} Ka “${firstMiss}” bio ka me ho.`
          : `${s.feedbackAlmost} Say “${firstMiss}” once more with me.`;
      }
      return s.feedbackAlmost;
    }

    return s.feedbackAgain;
  }
}

/** Gemini-backed brain; falls back to templates on any failure. */
class RemoteBrain implements BrainProvider {
  private fallback = new TemplateBrain();

  async respond(input: BrainInput): Promise<string> {
    try {
      return await remoteRespond(input);
    } catch (e) {
      console.warn('[kasa] remote brain failed, using templates:', e);
      return this.fallback.respond(input);
    }
  }
}

export const brain: BrainProvider = isSupabaseConfigured
  ? new RemoteBrain()
  : new TemplateBrain();
