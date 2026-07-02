/**
 * Imperative audio playback: plays TTS bytes returned by the backend, or a local
 * cached file (offline packs), and resolves when the clip finishes so callers can
 * sequence prompts (situation -> target phrase).
 */
import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

let current: AudioPlayer | null = null;

export function stopPlayback(): void {
  if (current) {
    try {
      current.remove();
    } catch {
      // player may already be released
    }
    current = null;
  }
}

/** Longest a single clip could reasonably run; safety net so a missed
 * "didJustFinish" event can never leave a prompt awaiting forever. */
const MAX_CLIP_MS = 20000;

/** Play an already-created player and resolve when it finishes. */
function awaitPlayer(player: AudioPlayer): Promise<void> {
  current = player;
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      sub?.remove?.();
      if (current === player) {
        try {
          player.remove();
        } catch {
          // ignore
        }
        current = null;
      }
      resolve();
    };
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) finish();
    });
    const timer = setTimeout(finish, MAX_CLIP_MS);
    player.play();
  });
}

/** Play a local (or remote) audio file by uri. */
export async function playUri(uri: string): Promise<void> {
  stopPlayback();
  await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  return awaitPlayer(createAudioPlayer(uri));
}

function extensionFor(mime: string): string {
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('ogg')) return 'ogg';
  return 'm4a';
}

function base64ToBlobUrl(base64: string, mime: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

export async function playBase64Audio(
  audioBase64: string,
  mime: string,
): Promise<void> {
  stopPlayback();
  await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

  // expo-file-system has no web implementation at all; the browser-native way
  // to play in-memory audio bytes is a Blob object URL, which createAudioPlayer
  // accepts as a plain source URI just like a file:// path on native.
  if (Platform.OS === 'web') {
    const url = base64ToBlobUrl(audioBase64, mime);
    try {
      await awaitPlayer(createAudioPlayer(url));
    } finally {
      URL.revokeObjectURL(url);
    }
    return;
  }

  const path = `${FileSystem.cacheDirectory}kasa-tts-${Date.now()}.${extensionFor(mime)}`;
  await FileSystem.writeAsStringAsync(path, audioBase64, { encoding: 'base64' });
  return awaitPlayer(createAudioPlayer(path));
}
