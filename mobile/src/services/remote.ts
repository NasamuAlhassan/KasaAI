/**
 * Calls to the Kasa orchestration layer (Supabase edge functions). Auth (the
 * anonymous JWT) is attached automatically by supabase.functions.invoke, and API
 * keys stay server-side (PRD 7.5, §8). These throw on failure; callers decide
 * whether to fall back to a local provider.
 */
import { supabase } from './supabase';
import type { LanguageCode } from '../types/content';
import type { BrainInput } from './brain';

export interface RemoteSpeakResult {
  audioBase64: string;
  mime: string;
}

export async function remoteSpeak(
  text: string,
  lang: LanguageCode,
): Promise<RemoteSpeakResult> {
  if (!supabase) throw new Error('backend not configured');
  const { data, error } = await supabase.functions.invoke('speak', {
    body: { text, lang },
  });
  if (error) throw error;
  if (!data?.audioBase64) throw new Error('speak: empty response');
  return data as RemoteSpeakResult;
}

export async function remoteTranscribe(
  audioBase64: string,
  mime: string,
  lang: LanguageCode,
): Promise<string> {
  if (!supabase) throw new Error('backend not configured');
  const { data, error } = await supabase.functions.invoke('transcribe', {
    body: { audioBase64, mime, lang },
  });
  if (error) throw error;
  return (data?.text ?? '').trim();
}

export async function remoteRespond(input: BrainInput): Promise<string> {
  if (!supabase) throw new Error('backend not configured');
  const { data, error } = await supabase.functions.invoke('respond', {
    body: input,
  });
  if (error) throw error;
  const text = (data?.text ?? '').trim();
  if (!text) throw new Error('respond: empty response');
  return text;
}
