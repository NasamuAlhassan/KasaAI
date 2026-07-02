// POST /speak  { text: string, lang: 'twi' | 'en' } -> { audioBase64, mime }
// KasaAI's voice. In production, most prompts are pre-generated and cached; this
// serves anything not yet cached (PRD 7.4 step 2).
import { corsHeaders, json, preflight } from '../_shared/cors.ts';
import { speak, LanguageCode } from '../_shared/providers.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const { text, lang } = (await req.json()) as {
      text: string;
      lang: LanguageCode;
    };
    if (!text || (lang !== 'twi' && lang !== 'en')) {
      return json({ error: 'text and lang ("twi"|"en") required' }, 400);
    }
    const result = await speak(text, lang);
    return json(result);
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
