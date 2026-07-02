/**
 * Reads a recorded-audio URI into base64 + its real mime type.
 *
 * expo-audio produces different URI kinds per platform: a file:// path on
 * native, a blob: URL on web (see expo-audio/build/AudioRecorder.web.js).
 * expo-file-system has no web implementation at all, so web must go through
 * fetch()+Blob instead — which conveniently also reports the *real* mime type
 * (native has to guess from the file extension since there's no easy way to
 * sniff it from a bare path).
 */
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export interface AudioBytes {
  base64: string;
  mime: string;
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function mimeFromExtension(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.caf')) return 'audio/x-caf';
  return 'audio/m4a'; // expo-audio HIGH_QUALITY default on native
}

export async function readAudioUri(uri: string): Promise<AudioBytes> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    const base64 = bufferToBase64(await blob.arrayBuffer());
    return { base64, mime: blob.type || 'audio/webm' };
  }
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  return { base64, mime: mimeFromExtension(uri) };
}
