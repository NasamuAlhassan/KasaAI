/**
 * Pre-generated audio for the handful of UI strings that never change
 * (welcome greeting, language prompt, onboarding/consent copy). These are
 * spoken on every single app open, so waiting on a live network call for
 * text that's identical every time is pure wasted latency — these clips were
 * generated once via the real `speak` function (same Abena voices) and are
 * bundled with the app, so they play with zero network round-trip.
 *
 * Regenerate by re-running the same call against the deployed `speak`
 * function if this copy ever changes (see i18n/strings.ts for the source text).
 */
import type { LanguageCode } from '../types/content';
import { playAsset } from './audioPlayback';
import { tts } from './tts';
import { setSpeaking } from './speakingState';

export const STATIC_AUDIO = {
  welcomeGreetingTwi: require('../../assets/audio/welcome_greeting_twi.wav'),
  chooseLanguageTwi: require('../../assets/audio/choose_language_twi.wav'),
  onboardingBodyTwi: require('../../assets/audio/onboarding_body_twi.wav'),
  onboardingBodyEn: require('../../assets/audio/onboarding_body_en.wav'),
  consentBodyTwi: require('../../assets/audio/consent_body_twi.wav'),
  consentBodyEn: require('../../assets/audio/consent_body_en.wav'),
} as const;

/**
 * Play a bundled clip instantly; if that fails for any reason, fall back to
 * live TTS of the same text so the app never goes silent.
 */
export async function speakStatic(
  asset: number,
  fallbackText: string,
  fallbackLang: LanguageCode,
): Promise<void> {
  setSpeaking(true);
  try {
    await playAsset(asset);
  } catch (e) {
    console.warn('[kasa] static audio failed, falling back to live TTS:', e);
    setSpeaking(false); // tts.speak() sets its own bracket
    await tts.speak(fallbackText, fallbackLang);
    return;
  }
  setSpeaking(false);
}
