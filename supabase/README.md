# Kasa — Backend (Supabase)

Auth, progress/streak sync, over-the-air packs, and the orchestration layer that
fronts the AI services so **API keys never touch the device** (PRD 7.5, §8).

## Layout

```
supabase/
  migrations/0001_init.sql   # schema + row-level security + triggers
  functions/
    _shared/                 # cors + provider adapters (Khaya/Whisper/Gemini/Abena)
    speak/                   # POST { text, lang } -> { audioBase64, mime }
    transcribe/              # POST { audioBase64, mime, lang } -> { text }
    respond/                 # POST { bridge, bucket, target, heard } -> { text }
  .env.example               # provider secrets (server-side only)
```

## One-time setup (~10 min)

Prereq: the Supabase CLI (`brew install supabase/tap/supabase`, or see docs).

```bash
# 1. Create a project at https://supabase.com (free tier), then:
supabase login
supabase link --project-ref <your-project-ref>

# 2. Apply the schema
supabase db push

# 3. Enable anonymous sign-ins
#    Dashboard > Authentication > Providers > Anonymous  ->  ON

# 4. Deploy the edge functions
supabase functions deploy speak transcribe respond

# 5. Set provider secrets (after filling supabase/.env)
cp supabase/.env.example supabase/.env   # then edit
supabase secrets set --env-file supabase/.env

# 6. Point the app at the backend: fill mobile/.env
#    EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
#    (Dashboard > Project Settings > API)
```

That's it — auth + progress sync work immediately after steps 1–3 and 6. The AI
endpoints (steps 4–5) come alive as you fill in each provider key; until then the
app keeps using its local device-TTS + mock-ASR fallbacks.

## Fastest way to hear it for real: Abena only, no Khaya

Abena covers TTS for **both** Twi and Ghanaian-English from one no-signup API, so
you can light up real voices without Khaya at all:

```
ABENA_API_KEY=          # can stay blank — playground tier works without one
GEMINI_API_KEY=<your key>
WHISPER_API_KEY=<your groq key>
```

This is enough for the **primary direction** (Twi speaker learning English) end
to end: Twi prompts + English target phrases both speak via Abena, English
speech recognition runs on Whisper/Groq, and KasaAI's replies come from Gemini.
Khaya only becomes necessary for: (a) potentially higher-quality/primary-choice
Twi TTS, once you have it `speak` will prefer it automatically and fall back to
Abena if it ever fails; and (b) Twi *speech recognition*, which only the reverse
"learn Twi" direction uses.

## Notes / to verify

- **Khaya**: the TTS/ASR request shapes in `_shared/providers.ts` are still
  best-effort (`TODO(verify)`) — GhanaNLP's docs are behind their developer-portal
  signup. Base URLs are env-overridable so no code change is needed once you can see them.
- **Abena**: TTS shape confirmed against `abena.mobobi.com/playground/sdk/docs/`
  (JSON body with a `voice` id, e.g. `abena_twi_high` / `akua_eng`; response has
  `audio_base64` + `mime_type`). Their ASR docs only list `en`/`gpe` language
  codes — Twi ASR support there is unconfirmed, so Twi ASR still routes to Khaya.
- Whisper expects an OpenAI-compatible `/v1/audio/transcriptions` endpoint.
- `respond` uses Gemini free tier (`gemini-2.5-flash-lite`). Note the free tier
  trains on inputs — revisit before handling real user voice at scale (see the
  project memory on provider decisions).
