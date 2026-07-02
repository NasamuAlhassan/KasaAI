/**
 * Offline audio cache for scenario packs (PRD 5.4).
 *
 * Pre-generated prompt/target audio is downloaded once (ideally over Wi-Fi) and
 * played from local files afterwards, so lessons work with no data. If a pack
 * has no pre-generated audio yet, callers fall back to live/device TTS.
 *
 * expo-file-system has no web implementation, and "offline" isn't a first-class
 * concept for a browser tab anyway — on web this module is a pass-through: it
 * hands back the remote URL as-is and lets the browser's normal HTTP cache do
 * the work, rather than faking a native file cache.
 */
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import type { ScenarioPack } from '../types/content';

const DIR = `${FileSystem.cacheDirectory}kasa-packs/`;
const isWeb = Platform.OS === 'web';

export type AudioKind = 'situation' | 'target';

async function ensureDir(): Promise<void> {
  if (isWeb) return;
  try {
    const info = await FileSystem.getInfoAsync(DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  } catch {
    // ignore; download will surface real errors
  }
}

function localPath(packId: string, phraseId: string, kind: AudioKind): string {
  return `${DIR}${packId}__${phraseId}__${kind}`;
}

/** Local uri for a phrase's audio if it's already cached, else null. */
export async function cachedAudioUri(
  packId: string,
  phraseId: string,
  kind: AudioKind,
): Promise<string | null> {
  if (isWeb) return null; // no native file cache concept on web
  const path = localPath(packId, phraseId, kind);
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists ? path : null;
  } catch {
    return null;
  }
}

/** Download one clip if not already present. Returns a playable uri, or null. */
export async function ensureAudioCached(
  packId: string,
  phraseId: string,
  kind: AudioKind,
  remoteUrl?: string,
): Promise<string | null> {
  if (!remoteUrl) return null;
  if (isWeb) return remoteUrl; // let the browser fetch + cache it directly
  const existing = await cachedAudioUri(packId, phraseId, kind);
  if (existing) return existing;
  await ensureDir();
  const path = localPath(packId, phraseId, kind);
  try {
    const res = await FileSystem.downloadAsync(remoteUrl, path);
    return res.uri;
  } catch {
    return null; // stay graceful; caller falls back to TTS
  }
}

/** Download every referenced clip in a pack for offline use. No-op on web. */
export async function downloadPack(pack: ScenarioPack): Promise<void> {
  if (isWeb) return;
  await ensureDir();
  for (const p of pack.phrases) {
    await ensureAudioCached(pack.id, p.id, 'situation', p.situationAudio);
    await ensureAudioCached(pack.id, p.id, 'target', p.targetAudio);
  }
}

/** True when all clips referenced by the pack are present locally. Offline
 * download doesn't apply on web, so this is trivially true there. */
export async function isPackDownloaded(pack: ScenarioPack): Promise<boolean> {
  if (isWeb) return true;
  for (const p of pack.phrases) {
    if (p.situationAudio && !(await cachedAudioUri(pack.id, p.id, 'situation')))
      return false;
    if (p.targetAudio && !(await cachedAudioUri(pack.id, p.id, 'target')))
      return false;
  }
  return true;
}
