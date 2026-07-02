/**
 * Kasa content pipeline (PRD 5.4, 7.5).
 *
 * For every pack in ../packs/*.json this:
 *   1. generates prompt + target audio via the deployed `speak` edge function
 *      (so voices come from the same Khaya/Abena providers the app uses),
 *   2. uploads each clip to the public `packs` Storage bucket,
 *   3. writes the public audio URLs back into the pack, and
 *   4. upserts the pack into the `packs` table as published.
 *
 * Audio is best-effort: if `speak` fails (e.g. provider keys not set yet), the
 * pack is still published without audio, so the app can OTA-load text content
 * and fall back to device TTS. Re-run once keys are in to add the voices.
 *
 * Usage:
 *   cd content && npm install
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/generate-and-publish.mjs
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKS_DIR = join(__dirname, '..', 'packs');
const BUCKET = 'packs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// direction -> { bridge, target }
const DIRS = {
  'learn-en': { bridge: 'twi', target: 'en' },
  'learn-twi': { bridge: 'en', target: 'twi' },
};

async function ensureBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    await supabase.storage.createBucket(BUCKET, { public: true });
    console.log(`created public bucket "${BUCKET}"`);
  }
}

async function synthToStorage(text, lang, storagePath) {
  const { data, error } = await supabase.functions.invoke('speak', {
    body: { text, lang },
  });
  if (error || !data?.audioBase64) {
    console.warn(`  ! speak failed for "${text.slice(0, 30)}...": ${error?.message ?? 'no audio'}`);
    return undefined;
  }
  const bytes = Buffer.from(data.audioBase64, 'base64');
  const contentType = data.mime ?? 'audio/wav';
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType, upsert: true });
  if (upErr) {
    console.warn(`  ! upload failed for ${storagePath}: ${upErr.message}`);
    return undefined;
  }
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

async function processPack(pack) {
  const dir = DIRS[pack.direction];
  if (!dir) throw new Error(`unknown direction ${pack.direction}`);
  console.log(`\n=== ${pack.id} (${pack.phrases.length} phrases) ===`);

  for (const phrase of pack.phrases) {
    const sit = await synthToStorage(
      phrase.situation,
      dir.bridge,
      `${pack.id}/${phrase.id}_situation.wav`,
    );
    if (sit) phrase.situationAudio = sit;

    const tgt = await synthToStorage(
      phrase.target,
      dir.target,
      `${pack.id}/${phrase.id}_target.wav`,
    );
    if (tgt) phrase.targetAudio = tgt;

    console.log(`  ${phrase.id}: ${sit ? '🔊' : '—'} situation, ${tgt ? '🔊' : '—'} target`);
  }

  const { error } = await supabase.from('packs').upsert({
    id: pack.id,
    direction: pack.direction,
    title: pack.title,
    emoji: pack.emoji ?? null,
    color: pack.color ?? null,
    version: pack.version,
    data: pack,
    published: true,
  });
  if (error) throw new Error(`upsert ${pack.id}: ${error.message}`);
  console.log(`  published ${pack.id} v${pack.version}`);
}

async function main() {
  await ensureBucket();
  const files = (await readdir(PACKS_DIR)).filter((f) => f.endsWith('.json'));
  for (const f of files) {
    const pack = JSON.parse(await readFile(join(PACKS_DIR, f), 'utf8'));
    await processPack(pack);
  }
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
