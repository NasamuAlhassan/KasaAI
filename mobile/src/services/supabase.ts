/**
 * Supabase client + anonymous auth (PRD 7.5).
 *
 * Anonymous sign-in gives every user a stable id so streaks/progress sync
 * without forcing an account up front — right for a low-friction, low-literacy
 * audience. `supabase` is null until keys are set, so callers must guard.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
} from '../config/env';

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

/** Ensure we have a session; create an anonymous one if needed. */
export async function ensureSignedIn(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) return session.user.id;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn('[kasa] anonymous sign-in failed:', error.message);
      return null;
    }
    return data.user?.id ?? null;
  } catch (e) {
    console.warn('[kasa] auth error:', e);
    return null;
  }
}
