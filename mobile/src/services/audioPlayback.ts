/**
 * Imperative playback of audio bytes returned by the TTS edge function.
 * Writes the base64 payload to a cache file, plays it, and resolves when the
 * clip finishes so callers can sequence prompts (situation -> target phrase).
 */
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

function extensionFor(mime: string): string {
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('ogg')) return 'ogg';
  return 'm4a';
}

export async function playBase64Audio(
  audioBase64: string,
  mime: string,
): Promise<void> {
  stopPlayback();

  const path = `${FileSystem.cacheDirectory}kasa-tts-${Date.now()}.${extensionFor(mime)}`;
  await FileSystem.writeAsStringAsync(path, audioBase64, { encoding: 'base64' });
  await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

  const player = createAudioPlayer(path);
  current = player;

  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
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
    player.play();
  });
}
