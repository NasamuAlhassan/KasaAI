/**
 * Pronunciation closeness (PRD 5.2).
 *
 * This compares the ASR transcription against the target phrase and produces a
 * gentle, encouraging cue. The design rule is strict: never shame the user. So
 * we expose three soft buckets ("good / almost / try once more") and a per-word
 * breakdown that lets KasaAI say "try the word 'finished' one more time" instead
 * of showing a percentage.
 *
 * Note: this judges *words*, not accent. True phoneme-level pronunciation
 * scoring is a Phase 2 concern; word-match is the honest MVP measure.
 */

export type FeedbackBucket = 'good' | 'almost' | 'again';

export interface WordResult {
  word: string;
  ok: boolean;
}

export interface ScoreResult {
  /** 0..1 overall closeness. */
  score: number;
  bucket: FeedbackBucket;
  /** Per target word, whether it was recognised. Drives targeted hints. */
  words: WordResult[];
  /** First target word the user missed, if any. */
  firstMiss?: string;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,!?;:"'“”‘’()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  const n = normalize(text);
  return n.length ? n.split(' ') : [];
}

/** Levenshtein distance between two token arrays. */
function tokenDistance(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

export function scorePhrase(target: string, heard: string): ScoreResult {
  const targetWords = tokenize(target);
  const heardWords = tokenize(heard);

  // Overall closeness from token-level edit distance.
  const dist = tokenDistance(targetWords, heardWords);
  const denom = Math.max(targetWords.length, heardWords.length, 1);
  const score = Math.max(0, 1 - dist / denom);

  // Per-word recognition: a target word is "ok" if it appears in what we heard.
  // We consume matches so repeated words are handled sensibly.
  const remaining = [...heardWords];
  const words: WordResult[] = targetWords.map((w) => {
    const idx = remaining.indexOf(w);
    if (idx >= 0) {
      remaining.splice(idx, 1);
      return { word: w, ok: true };
    }
    return { word: w, ok: false };
  });

  const firstMiss = words.find((w) => !w.ok)?.word;

  let bucket: FeedbackBucket;
  if (score >= 0.8) bucket = 'good';
  else if (score >= 0.5) bucket = 'almost';
  else bucket = 'again';

  return { score, bucket, words, firstMiss };
}
