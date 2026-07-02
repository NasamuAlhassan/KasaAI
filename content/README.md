# Kasa — Content

Canonical scenario packs and the tooling that voices and publishes them.

- `packs/*.json` — the source of truth for pack content (text). The app also
  bundles copies in `mobile/src/content/` as an **offline fallback**; keep the
  two in sync, or (later) generate the bundled copies from these files.
- `scripts/generate-and-publish.mjs` — generates audio via the deployed `speak`
  edge function, uploads it to the public `packs` Storage bucket, and upserts
  each pack into the `packs` table as published. The app then loads them
  over-the-air and caches them for offline use.

## Publishing packs

Prereq: the Supabase backend is deployed (see `../supabase/README.md`). Audio
also needs the TTS provider keys set as function secrets — but you can publish
text-only first and add audio later by re-running.

```bash
cd content
npm install
SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
npm run publish-packs
```

- The service-role key is in Supabase Dashboard → Project Settings → API.
  **Never commit it or ship it in the app** — it bypasses row-level security and
  is only for this local tooling.
- Audio generation is best-effort: if `speak` isn't ready, packs publish without
  audio and the app falls back to device TTS. Re-run once keys are in.

## Editing content

1. Edit the relevant `packs/*.json` (and bump its `version` so clients update).
2. Have a native speaker review any Twi (see `TODO(content)` markers in the
   bundled copies).
3. Re-run `npm run publish-packs`.
