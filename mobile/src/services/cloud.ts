/**
 * Cloud progress sync (PRD 3.10, 7.5). Thin wrapper over Supabase tables that
 * safely no-ops when the backend isn't configured, so the local-first store in
 * state/progress.tsx works identically with or without a backend.
 */
import { supabase } from './supabase';
import type { DirectionId } from '../types/content';

export interface RemoteProfile {
  direction: DirectionId | null;
  streakDays: number;
  lastActiveDate: string | null;
}

export async function fetchProfile(
  userId: string,
): Promise<RemoteProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('direction, streak_days, last_active_date')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    direction: (data.direction as DirectionId | null) ?? null,
    streakDays: data.streak_days ?? 0,
    lastActiveDate: data.last_active_date ?? null,
  };
}

export async function pushProfile(
  userId: string,
  p: RemoteProfile,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    direction: p.direction,
    streak_days: p.streakDays,
    last_active_date: p.lastActiveDate,
  });
  if (error) console.warn('[kasa] pushProfile failed:', error.message);
}

export async function recordCompletion(
  userId: string,
  packId: string,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('lesson_completions')
    .insert({ user_id: userId, pack_id: packId });
  if (error) console.warn('[kasa] recordCompletion failed:', error.message);
}
