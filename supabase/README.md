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

## Notes / to verify

- The Khaya and Abena request shapes in `_shared/providers.ts` are best-effort
  and marked `TODO(verify)` — confirm paths/params against the live docs; base
  URLs are env-overridable so no code change is needed.
- Whisper expects an OpenAI-compatible `/v1/audio/transcriptions` endpoint.
- `respond` uses Gemini free tier (`gemini-2.5-flash-lite`). Note the free tier
  trains on inputs — revisit before handling real user voice at scale (see the
  project memory on provider decisions).
