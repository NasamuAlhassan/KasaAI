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

The full core loop from PRD section 4 runs end to end:

1. **Welcome** — KasaAI greets in Twi, aloud.
2. **Language select** — two big, audio-labelled buttons (learn English / learn Twi).
3. **Onboarding** — short spoken explanation in the user's bridge language.
4. **Home** — illustrated, audio-labelled scenario tiles + a kente streak strip.
5. **Lesson** — situation (spoken) → target phrase (spoken slowly, replayable,
   tap any word to hear it) → tap-to-speak → gentle per-word feedback.
6. **Done** — congratulations, streak ticks up, practise again or continue.

Streaks and progress persist across restarts (AsyncStorage).

## The service seams (where the real APIs plug in)

Every AI service is behind an interface with a working stand-in, so wiring the
real provider is a one-file change with **no UI impact**:

| Service | File | Now | Later (PRD 7.3) |
|---|---|---|---|
| Text-to-speech | `src/services/tts.ts` | device TTS (`expo-speech`) | Khaya / Abena, pre-generated + cached |
| Speech recognition | `src/services/asr.ts` | **mock** (`isReal = false`) | Whisper (English), Khaya/Abena (Twi) |
| KasaAI brain | `src/services/brain.ts` | warm templates | Gemini free tier |

The mock ASR is why lessons show a small **"demo feedback"** tag. Real feedback
requires the Whisper/Khaya endpoints, which go behind the orchestration layer so
API keys never touch the device (PRD 7.5, 8).

## Project layout (`mobile/src`)

- `theme/` — Ghana-inspired design tokens (kente palette, large tap targets)
- `types/` — content model (`Phrase`, `ScenarioPack`, direction metadata)
- `content/` — bundled scenario packs (market, transport, Twi greetings)
- `i18n/` — UI copy in Twi and English
- `services/` — tts, asr, brain, scoring (the swappable seams)
- `state/` — progress + streak store (AsyncStorage; Supabase sync later)
- `components/` — voice-first building blocks (BigButton, MicButton, etc.)
- `screens/` + `navigation/` — the six-screen flow

## Known gaps / next steps

- **Content needs native review.** The Twi copy in `content/` and `i18n/` is a
  first pass and must be reviewed and re-voiced by native speakers before launch
  (PRD 5.1). Search for `TODO(content)`.
- **Real ASR.** Stand up self-hosted Whisper (or a hosted Whisper) + Khaya/Abena
  ASR behind an orchestration function.
- **Orchestration layer + Supabase** for keys, auth, progress sync, and
  over-the-air scenario packs.
- **Offline packs** — pre-generate and cache prompt/target audio (PRD 5.4).
- **Real illustrations** replacing the emoji placeholders on tiles.
