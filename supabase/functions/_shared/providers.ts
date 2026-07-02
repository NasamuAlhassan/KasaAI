/**
 * Provider adapters for the Kasa orchestration layer (PRD 7.3).
 *
 * All keys come from Supabase secrets (Deno.env), never the device. Each service
 * routes by language so the same endpoint serves both directions.
 *
 * TTS is Abena-first: Abena covers both Twi and English (Ghanaian accent) voices
 * from a single, no-signup-required API, so the app can run on Abena alone.
 * Khaya is preferred for Twi *when a key is configured* (better quality / special
 * character handling per GhanaNLP), with an automatic fallback to Abena if the
 * Khaya call fails for any reason — so a wrong/missing Khaya key never breaks
 * Twi speech, it just quietly uses Abena instead.
 *
 * IMPORTANT — verify against live docs before launch: the Khaya request shape
 * below is still best-effort (TODO(verify); GhanaNLP's TTS/ASR paths are behind
 * their developer-portal signup). The Abena shape was confirmed against their
 * published docs at abena.mobobi.com/playground/sdk/docs/. Whisper
 * (OpenAI-compatible) and Gemini shapes are stable.
 */

export type LanguageCode = 'twi' | 'en';

const env = (k: string, fallback = '') => Deno.env.get(k) ?? fallback;

// ---------------------------------------------------------------------------
// Text-to-speech. Returns base64 audio.
// ---------------------------------------------------------------------------
export interface SpeakResult {
  audioBase64: string;
  mime: string;
}

export async function speak(
  text: string,
  lang: LanguageCode,
): Promise<SpeakResult> {
  if (lang === 'twi' && env('KHAYA_API_KEY')) {
    try {
      return await khayaTts(text);
    } catch (e) {
      console.warn(`Khaya TTS failed, falling back to Abena: ${e}`);
    }
  }
  return abenaTts(text, lang);
}

async function khayaTts(text: string): Promise<SpeakResult> {
  // TODO(verify): confirm path + body with the Khaya developer portal.
  const base = env('KHAYA_BASE_URL', 'https://translation-api.ghananlp.org');
  const res = await fetch(`${base}/tts/v1/synthesize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': env('KHAYA_API_KEY'),
    },
    body: JSON.stringify({ text, language: 'tw', speaker_id: 'twi_speaker_5' }),
  });
  if (!res.ok) throw new Error(`Khaya TTS ${res.status}: ${await res.text()}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  return { audioBase64: toBase64(buf), mime: 'audio/wav' };
}

async function abenaTts(text: string, lang: LanguageCode): Promise<SpeakResult> {
  // Confirmed shape (abena.mobobi.com/playground/sdk/docs/): auth is optional
  // (free playground tier), response is JSON with audio_base64 + mime_type —
  // not raw bytes. Voice IDs pick the language; override via env if Abena
  // renames/adds voices.
  const base = env('ABENA_BASE_URL', 'https://abena.mobobi.com/playground/api/v1');
  const voice =
    lang === 'twi'
      ? env('ABENA_TWI_VOICE', 'abena_twi_high')
      : env('ABENA_EN_VOICE', 'akua_eng');

  const res = await fetch(`${base}/tts/synthesize/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(env('ABENA_API_KEY') && {
        Authorization: `Bearer ${env('ABENA_API_KEY')}`,
      }),
    },
    body: JSON.stringify({ text, voice, speed: 1.0 }),
  });
  if (!res.ok) throw new Error(`Abena TTS ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (!data.audio_base64) throw new Error('Abena TTS: no audio_base64 in response');
  return { audioBase64: data.audio_base64, mime: data.mime_type ?? 'audio/wav' };
}

// ---------------------------------------------------------------------------
// Speech recognition: English -> Whisper (accent-tolerant), Twi -> Khaya.
// Accepts base64 audio, returns a transcription string.
// ---------------------------------------------------------------------------
export async function transcribe(
  audioBase64: string,
  mime: string,
  lang: LanguageCode,
): Promise<string> {
  if (lang === 'en') return whisperAsr(audioBase64, mime);
  return khayaAsr(audioBase64, mime);
}

async function whisperAsr(audioBase64: string, mime: string): Promise<string> {
  // OpenAI-compatible endpoint. Default target is Groq's hosted Whisper
  // (fast + cheap); also works with self-hosted faster-whisper / whisper.cpp.
  // Normalise the base so a trailing "/v1" isn't doubled (Groq's base is
  // https://api.groq.com/openai/v1, self-hosts are usually http://host:9000).
  const raw = env('WHISPER_BASE_URL', 'https://api.groq.com/openai').replace(
    /\/+$/,
    '',
  );
  const base = raw.endsWith('/v1') ? raw.slice(0, -3) : raw;
  const bytes = fromBase64(audioBase64);
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: mime }), 'audio.m4a');
  form.append('model', env('WHISPER_MODEL', 'whisper-large-v3-turbo'));
  form.append('language', 'en');
  const res = await fetch(`${base}/v1/audio/transcriptions`, {
    method: 'POST',
    headers: env('WHISPER_API_KEY')
      ? { Authorization: `Bearer ${env('WHISPER_API_KEY')}` }
      : undefined,
    body: form,
  });
  if (!res.ok) throw new Error(`Whisper ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.text ?? '').trim();
}

async function khayaAsr(audioBase64: string, mime: string): Promise<string> {
  // TODO(verify): confirm Khaya ASR path/params.
  const base = env('KHAYA_BASE_URL', 'https://translation-api.ghananlp.org');
  const bytes = fromBase64(audioBase64);
  const res = await fetch(`${base}/asr/v1/transcribe?language=tw`, {
    method: 'POST',
    headers: {
      'Content-Type': mime,
      'Ocp-Apim-Subscription-Key': env('KHAYA_API_KEY'),
    },
    body: bytes,
  });
  if (!res.ok) throw new Error(`Khaya ASR ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.text ?? data.transcription ?? '').trim();
}

// ---------------------------------------------------------------------------
// KasaAI brain: Gemini free tier. Encouragement-first, in the bridge language.
// ---------------------------------------------------------------------------
export interface BrainInput {
  bridge: LanguageCode;
  bucket: 'good' | 'almost' | 'again';
  target: string;
  heard: string;
  firstMiss?: string;
}

export async function respond(input: BrainInput): Promise<string> {
  const model = env('GEMINI_MODEL', 'gemini-2.5-flash-lite');
  const key = env('GEMINI_API_KEY');
  const langName = input.bridge === 'twi' ? 'Twi' : 'English';

  const system =
    `You are KasaAI, a warm, patient older sibling helping someone practise ` +
    `speaking. Reply in ${langName} only, in ONE short spoken sentence. ` +
    `Lead with encouragement; correct gently and never harshly. Never give a ` +
    `score or percentage. If a specific word was missed, kindly invite them to ` +
    `try just that word again.`;

  const user =
    `They were practising: "${input.target}". We heard: "${input.heard}". ` +
    `Closeness: ${input.bucket}.` +
    (input.firstMiss ? ` Word to nudge: "${input.firstMiss}".` : '');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 80 },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('Gemini returned no text');
  return text;
}

// ---------------------------------------------------------------------------
// base64 helpers (Deno)
// ---------------------------------------------------------------------------
function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
