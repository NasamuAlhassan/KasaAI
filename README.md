# Kasa

*Speak with confidence, in any language.*

A voice-first mobile app that teaches spoken language through conversation.
Twi speakers learn English; English speakers learn Twi. One engine, two
directions. See `Kasa_PRD.md` for the full product spec.

This repo currently contains the **mobile app** (`mobile/`). The backend
(Supabase) and the orchestration layer that fronts the AI services are planned
but not yet built (see *Roadmap* below).

## Running the app

Prereqs: Node (installed here via nvm) and the Expo Go app on your Android phone,
or an Android emulator.

```bash
cd mobile
npm install          # first time only
npx expo start       # then scan the QR code with Expo Go
```

The microphone and TTS need a real device or emulator — they won't work in a web
browser preview.

## What works today

The full flow from PRD section 4 runs end to end:

1. **Welcome** — KasaAI greets in Twi, aloud.
2. **Language select** — two big, audio-labelled buttons (learn English / learn Twi).
3. **Onboarding** — short spoken explanation in the user's bridge language.
4. **Consent** — spoken voice-recording consent + opt-in sharing (PRD 8).
5. **Home** — illustrated, audio-labelled scenario tiles + a kente streak strip.
6. **Lesson** — situation (spoken) → target phrase (spoken slowly, replayable,
   tap any word to hear it) → tap-to-speak → gentle per-word feedback.
7. **Done** — congratulations, streak ticks up, practise again or continue.

Streaks and progress persist across restarts (AsyncStorage) and sync to the
cloud once the backend is configured. Packs load over-the-air with an offline
cache; vector icons throughout (per the design system).

## The service seams (backend when configured, local fallback otherwise)

Every AI service is behind an interface. When the Supabase backend + keys are
set, it uses the real providers; otherwise it falls back to local behaviour —
**no UI change either way**:

| Service | File | Fallback (no backend) | Live (backend configured) |
|---|---|---|---|
| Text-to-speech | `src/services/tts.ts` | device TTS (`expo-speech`) | Khaya / Abena via `speak`, cached for offline |
| Speech recognition | `src/services/asr.ts` | **mock** (`isReal = false`) | Whisper (English) / Khaya (Twi) via `transcribe` |
| KasaAI brain | `src/services/brain.ts` | warm templates | Gemini via `respond` |

Until the backend is live, lessons show a small **"demo feedback"** tag (mock
ASR). The edge functions keep API keys server-side (PRD 7.5, 8). See
[MORNING.md](MORNING.md) and `supabase/README.md` to switch it on.

## Project layout (`mobile/src`)

- `theme/` — Ghana-inspired design tokens (kente palette, large tap targets)
- `types/` — content model (`Phrase`, `ScenarioPack`, direction metadata)
- `content/` — bundled scenario packs (market, transport, Twi greetings)
- `i18n/` — UI copy in Twi and English
- `services/` — tts, asr, brain, scoring, remote calls, audio cache (the seams)
- `state/` — progress/streak store (AsyncStorage + cloud sync) and packs store
- `components/` — voice-first building blocks (BigButton, MicButton, etc.)
- `screens/` + `navigation/` — the seven-screen flow

## Status

Built & pushed: the core loop, Supabase backend + orchestration layer, live
service wiring, vector-icon design pass, over-the-air + offline content pipeline,
and the voice-consent / EAS launch prep. All of it typechecks and Metro-bundles
clean. The app runs today on local fallbacks; each backend key you add lights up
that service with no rebuild.

### To activate / to finish (needs you)
- **Turn on the backend** — create the Supabase project and paste keys
  (Groq for Whisper). Step-by-step in [MORNING.md](MORNING.md).
- **Content needs native review.** Twi copy in `content/packs/`,
  `mobile/src/content/`, and `i18n/` is a first pass — have native speakers
  review and re-voice it before launch (PRD 5.1). Search `TODO(content)`.
- **Verify Khaya/Abena request shapes** in `supabase/functions/_shared/providers.ts`
  (`TODO(verify)`) against the live docs.
- **Real illustrations** to replace the tile icons (PRD 6.5).

### Genuinely future (Phase 7–8, not started)
iOS release (needs an Apple account), live peer-to-peer practice (needs realtime
infra + product design), on-device ASR, and additional Ghanaian languages.
