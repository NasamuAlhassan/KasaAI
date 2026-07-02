# Kasa — Deep Review (2026-07-02)

A full health + correctness pass over the app: dependency/config health,
research on the live-API assumptions, and a critical read of the runtime-heavy
code. Everything below is verified with `tsc`, `expo-doctor`, and a Metro export.

## Result

- `expo-doctor`: **20/20** (was 19/20)
- `tsc --noEmit`: **0 errors**
- Metro bundle (android): **clean**, ~3.1 MB

## Fixed

1. **Missing native peer deps** (would crash a standalone build, not caught in
   Expo Go): added `expo-font` (icons) and `expo-asset` (audio). — *expo-doctor*
2. **iOS audio routing / quiet playback**: recording mode was left enabled
   globally; now `allowsRecording` is toggled on only while recording and off
   afterward, so feedback/TTS plays at full volume and through the speaker.
   (`hooks/useRecorder.ts`)
3. **Silent mic-permission failure**: tapping the mic with permission denied did
   nothing. Now it shows and *speaks* a "please allow the microphone" message.
   (`screens/LessonScreen.tsx`, new `micPermission` string)
4. **Playback could hang a prompt**: if a clip's `didJustFinish` event never
   fired, the situation/target await could stall. Added a 20s safety resolve.
   (`services/audioPlayback.ts`)
5. **Mic double-tap race**: a fast double-tap could call `recorder.start()`
   twice mid-prepare. Guarded with a `starting` ref. (`screens/LessonScreen.tsx`)

## Research findings (live services)

- **Gemini** — `gemini-2.5-flash-lite` is a valid model and on the free tier as
  of April 2026. No change needed. (Newer Flash-Lite models now exist too, if we
  ever want to bump.)
- **Khaya** — the `/translate` request shape (`{ in, lang: "en-tw" }`) is
  confirmed public, but the **TTS/ASR endpoint paths and the subscription-key
  header remain behind the developer-portal signup**. These are still guesses
  (`TODO(verify)` in `supabase/functions/_shared/providers.ts`). Base URLs and
  paths are env-configurable, so this is a config fix once you can see the docs
  from your GhanaNLP/Khaya account — no code change.

## Deliberately NOT changed (and why)

- **"Outdated" npm packages** (async-storage 3.x, react 19.2.7, etc.): pinned by
  Expo SDK 57 on purpose. `expo install --check` reports **up to date**. Chasing
  npm "latest" would risk crashes.
- **`npm audit` 10 moderate**: all inside Expo's own build tooling
  (`@expo/config-plugins` / `prebuild-config` / `inline-modules`) — build-time
  only, not shipped in the app. `audit fix --force` would break Expo. Leave until
  Expo patches upstream.
- **`expo-file-system/legacy`**: used for base64 read/write; supported in SDK 57.
  Migrate to the new `File` API in a future SDK bump.

## Residual risks I can't close from here (need you / a device)

1. **Real-device run** — audio record/playback and mic permission can only be
   truly confirmed on a physical Android phone. Recommended next step: an EAS
   `preview` build (`eas build -p android --profile preview`) or Expo Go.
2. **Live API request shapes** — Khaya/Abena `TODO(verify)` above; verify once
   you have portal access, then re-run `content/scripts/generate-and-publish.mjs`.
3. **Native Twi content review** — `TODO(content)` markers; needs a native speaker.
