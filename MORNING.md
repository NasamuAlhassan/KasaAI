# Good morning ☀️ — Kasa: what happened while you slept

Short version: **Phase 2 (backend) is fully coded and verified.** I couldn't
*finish* it because the last steps need accounts and keys only you can create —
but I got everything to the "paste keys and run" line. Below is your ~20-minute
checklist to bring it live, then what's next.

---

## What I did (no action needed)

- **Design system** applied from the `ui-ux-pro-max` skill → `design-system/MASTER.md`
  (colours, type, touch/a11y rules, and a prioritised list of refinements).
- **Supabase schema** with row-level security → `supabase/migrations/0001_init.sql`
  (profiles, streaks, lesson completions, over-the-air packs).
- **Orchestration layer** (edge functions, keys stay server-side) →
  `supabase/functions/` : `speak`, `transcribe`, `respond`, with provider
  adapters for Khaya / Whisper / Gemini / Abena.
- **App ↔ cloud sync** → anonymous auth + progress/streak sync wired into the
  existing store. **Safely no-ops until you add keys**, so nothing is broken today.
- Verified: TypeScript clean, Metro bundle clean (2.7MB).

---

## Your checklist (do these in order)

### A. Turn on the backend (~10 min) — unlocks auth + progress sync
1. Create a free project at https://supabase.com → note the **project ref**.
2. Install CLI: `brew install supabase/tap/supabase`
3. From the repo root:
   ```bash
   supabase login
   supabase link --project-ref <your-ref>
   supabase db push
   ```
4. Dashboard → **Authentication → Providers → Anonymous → ON**.
5. `cp mobile/.env.example mobile/.env`, then paste **URL** + **anon key**
   (Dashboard → Project Settings → API).
6. `cd mobile && npx expo start` → open in Expo Go. Streaks now sync to the cloud.

### B. Turn on real speech (~10 min + hosting) — unlocks Phase 3
7. `supabase functions deploy speak transcribe respond`
8. `cp supabase/.env.example supabase/.env`, fill in the keys you have:
   - **Khaya** key (you said you'd get this from GhanaNLP)
   - **Gemini** key (https://aistudio.google.com — free)
   - **Whisper**: needs a host (see "Decisions I need from you" below)
9. `supabase secrets set --env-file supabase/.env`

Each key you add lights up that service; until then the app uses its local
device-TTS + mock-ASR fallbacks, so it always runs.

---

## Decisions I need from you (leave answers in chat)

1. **Whisper hosting** — self-host on a GPU box, or use a hosted Whisper
   (Groq is cheapest/fastest) for the MVP? This is the one real infra choice.
2. **Khaya endpoints** — when you have the docs, confirm the TTS/ASR paths so I
   can replace the `TODO(verify)` guesses in `supabase/functions/_shared/providers.ts`.
3. **Icons** — OK to swap the emoji placeholders to `@expo/vector-icons` (design
   skill flags emoji-as-icons)? It's a clean change I can do next.

---

## What I genuinely can't do without you

- Create the Supabase/GhanaNLP/Gemini accounts (they're tied to your identity).
- **Phase 4 content**: native Twi speakers must review and voice the packs.
- Stand up Whisper hosting (needs your cloud account / budget call).

## Suggested next session
Pick one and I'll build it: **wire the app's tts/asr/brain to the live edge
functions** (finishes Phase 3 once keys are in), **the content pipeline +
audio caching** (Phase 4), or **the icon/design refinements** from the design
system. My vote: the icon swap first (fast, visible), then Phase 3 wiring once
your keys are set.
