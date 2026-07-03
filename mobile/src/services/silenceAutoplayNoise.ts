/**
 * Browsers reject `<audio>.play()` with a NotAllowedError before the page has
 * had a genuine user gesture (autoplay policy). expo-audio's web player calls
 * `this.media.play()` without awaiting or catching that promise, so the
 * rejection becomes an unhandled promise rejection that Metro's dev overlay
 * surfaces as a scary "Web ERROR" — even though it's expected, benign, and
 * already handled functionally (see audioPlayback.ts's start-check + the
 * static/live/device fallback chain in staticVoice.ts and tts.ts).
 *
 * This narrowly suppresses *only* that specific, known pattern so real errors
 * still show up normally. Import once, for its side effect.
 */
import { Platform } from 'react-native';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const isAutoplayBlock =
      reason?.name === 'NotAllowedError' ||
      /NotAllowedError/.test(String(reason?.message ?? reason));
    if (isAutoplayBlock) {
      event.preventDefault();
    }
  });
}
