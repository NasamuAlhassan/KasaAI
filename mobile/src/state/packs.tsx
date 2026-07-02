/**
 * Offline-first scenario packs (PRD 5.4, 7.5).
 *
 * Order of truth, newest wins by version:
 *   1. bundled packs (always available, ship in the app)
 *   2. locally cached packs (last fetched from the backend)
 *   3. live packs from Supabase (fetched in the background when online)
 *
 * Screens read packs only through this hook, so whether content is bundled,
 * cached, or freshly downloaded is invisible to them.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DirectionId, ScenarioPack } from '../types/content';
import { ALL_PACKS } from '../content';
import { supabase } from '../services/supabase';

const CACHE_KEY = 'kasa.packs.v1';

/** Merge packs by id, keeping the higher version. */
function mergePacks(base: ScenarioPack[], incoming: ScenarioPack[]): ScenarioPack[] {
  const byId = new Map(base.map((p) => [p.id, p]));
  for (const p of incoming) {
    const existing = byId.get(p.id);
    if (!existing || p.version >= existing.version) byId.set(p.id, p);
  }
  return [...byId.values()];
}

interface PacksContextValue {
  packs: ScenarioPack[];
  refreshing: boolean;
  packsForDirection: (d: DirectionId) => ScenarioPack[];
  packById: (id: string) => ScenarioPack | undefined;
}

const PacksContext = createContext<PacksContextValue | null>(null);

export function PacksProvider({ children }: { children: React.ReactNode }) {
  const [packs, setPacks] = useState<ScenarioPack[]>(ALL_PACKS);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      // 2. overlay cached packs immediately (works fully offline)
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw && alive) {
          const cached = JSON.parse(raw) as ScenarioPack[];
          setPacks((cur) => mergePacks(cur, cached));
        }
      } catch {
        // ignore corrupt cache
      }

      // 3. refresh from the backend in the background
      if (!supabase) return;
      setRefreshing(true);
      try {
        const { data, error } = await supabase
          .from('packs')
          .select('data')
          .eq('published', true);
        if (!error && data && alive) {
          const remote = data
            .map((r) => r.data as ScenarioPack)
            .filter((p) => p && p.id && Array.isArray(p.phrases));
          if (remote.length) {
            setPacks((cur) => {
              const merged = mergePacks(cur, remote);
              AsyncStorage.setItem(CACHE_KEY, JSON.stringify(merged)).catch(() => {});
              return merged;
            });
          }
        }
      } catch {
        // offline or backend down: keep bundled/cached content
      } finally {
        if (alive) setRefreshing(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<PacksContextValue>(
    () => ({
      packs,
      refreshing,
      packsForDirection: (d) => packs.filter((p) => p.direction === d),
      packById: (id) => packs.find((p) => p.id === id),
    }),
    [packs, refreshing],
  );

  return <PacksContext.Provider value={value}>{children}</PacksContext.Provider>;
}

export function usePacks(): PacksContextValue {
  const ctx = useContext(PacksContext);
  if (!ctx) throw new Error('usePacks must be used within PacksProvider');
  return ctx;
}
