// POST /transcribe  { audioBase64, mime, lang } -> { text }
// English -> Whisper (accent-tolerant), Twi -> Khaya (PRD 7.4 step 5).
// Scoring stays on the client (src/services/scoring.ts) so feedback is instant.
import { corsHeaders, json, preflight } from '../_shared/cors.ts';
import { transcribe, LanguageCode } from '../_shared/providers.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const { audioBase64, mime, lang } = (await req.json()) as {
      audioBase64: string;
      mime: string;
      lang: LanguageCode;
    };
    if (!audioBase64 || (lang !== 'twi' && lang !== 'en')) {
      return json({ error: 'audioBase64 and lang ("twi"|"en") required' }, 400);
    }
    const text = await transcribe(audioBase64, mime ?? 'audio/m4a', lang);
    return json({ text });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
