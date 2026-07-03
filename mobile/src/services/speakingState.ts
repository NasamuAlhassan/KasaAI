/**
 * Shared "is KasaAI currently speaking" state, used by both live TTS
 * (tts.ts) and bundled static-audio playback (staticVoice.ts) so the UI's
 * speaking indicator works the same regardless of which one is talking.
 */
type Listener = (speaking: boolean) => void;

const listeners = new Set<Listener>();
let speaking = false;

export function getSpeaking(): boolean {
  return speaking;
}

export function subscribeSpeaking(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSpeaking(value: boolean): void {
  if (speaking === value) return;
  speaking = value;
  for (const l of listeners) l(value);
}
