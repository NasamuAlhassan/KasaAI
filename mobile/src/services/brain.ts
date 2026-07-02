/**
 * KasaAI's spoken reactions (PRD 5.5, 7.4 step 7).
 *
 * KasaAI is a patient older sibling: encouragement first, correction second,
 * never a harsh score. The response is text in the *bridge* language, which the
 * caller then voices with the TTS provider.
 *
 *  - now:   deterministic, warm templates (no network, works offline).
 *  - later: Gemini free tier via the orchestration layer for richer, varied
 *           phrasing. Same interface, so screens don't change.
 */

import type { LanguageCode } from '../types/content';
import type { FeedbackBucket } from './scoring';
import { stringsFor } from '../i18n/strings';

export interface BrainInput {
  bridge: LanguageCode;
  bucket: FeedbackBucket;
  /** First target word the user missed, for a targeted, gentle nudge. */
  firstMiss?: string;
}

export interface BrainProvider {
  respond(input: BrainInput): Promise<string>;
}

class TemplateBrain implements BrainProvider {
  async respond({ bridge, bucket, firstMiss }: BrainInput): Promise<string> {
    const s = stringsFor(bridge);
    if (bucket === 'good') return s.feedbackGood;

    // "Almost": praise, then a specific, kind nudge on the missed word.
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

export const brain: BrainProvider = new TemplateBrain();
