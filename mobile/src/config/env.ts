/**
 * Runtime configuration from environment (Expo reads EXPO_PUBLIC_* at build).
 * Copy mobile/.env.example to mobile/.env and fill these in. When they're empty
 * the app runs fully local (no backend), so development never blocks on keys.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True once a Supabase project is wired up. Gates all cloud behaviour. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
