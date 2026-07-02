/**
 * Local progress + streak store (PRD 3.8, 3.10).
 *
 * Persists to AsyncStorage so a streak survives app restarts. This is the local
 * source of truth in v1; Supabase sync layers on top later without changing this
 * API (screens only ever call the hook).
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DirectionId } from '../types/content';
import { ensureSignedIn } from '../services/supabase';
import { fetchProfile, pushProfile, recordCompletion } from '../services/cloud';

const STORAGE_KEY = 'kasa.progress.v1';

interface ProgressData {
  direction: DirectionId | null;
  streakDays: number;
  lastActiveDate: string | null; // local YYYY-MM-DD
  completedPackIds: string[];
  /** Voice-recording consent given (PRD 8). */
  consentGiven: boolean;
  /** Opt-in to contribute recordings to improve the models (PRD 8). */
  improveOptIn: boolean;
}

const EMPTY: ProgressData = {
  direction: null,
  streakDays: 0,
  lastActiveDate: null,
  completedPackIds: [],
  consentGiven: false,
  improveOptIn: false,
};

interface ProgressContextValue extends ProgressData {
  hydrated: boolean;
  chooseDirection: (d: DirectionId) => void;
  completeLesson: (packId: string) => void;
  giveConsent: (improveOptIn: boolean) => void;
  resetAll: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

function todayStr(d = new Date()): string {
  // Local date, not UTC, so a streak follows the user's day.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isYesterday(dateStr: string, ref = new Date()): boolean {
  const y = new Date(ref);
  y.setDate(y.getDate() - 1);
  return dateStr === todayStr(y);
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ProgressData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const syncedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setData({ ...EMPTY, ...JSON.parse(raw) });
      } catch {
        // Corrupt/missing state: start fresh rather than crash.
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Once local state is loaded, sign in and reconcile with the cloud (no-op
  // when the backend isn't configured). Runs exactly once.
  useEffect(() => {
    if (!hydrated || syncedRef.current) return;
    syncedRef.current = true;
    (async () => {
      const uid = await ensureSignedIn();
      if (!uid) return;
      userIdRef.current = uid;
      const remote = await fetchProfile(uid);
      setData((local) => {
        const remoteAhead =
          remote &&
          (remote.streakDays > local.streakDays ||
            (!local.direction && !!remote.direction));
        if (remoteAhead && remote) {
          const merged: ProgressData = {
            ...local,
            direction: remote.direction ?? local.direction,
            streakDays: Math.max(remote.streakDays, local.streakDays),
            lastActiveDate: remote.lastActiveDate ?? local.lastActiveDate,
          };
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged)).catch(() => {});
          return merged;
        }
        // Local is the more advanced copy: push it up.
        pushProfile(uid, {
          direction: local.direction,
          streakDays: local.streakDays,
          lastActiveDate: local.lastActiveDate,
        });
        return local;
      });
    })();
  }, [hydrated]);

  const persist = useCallback((next: ProgressData) => {
    setData(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    const uid = userIdRef.current;
    if (uid) {
      pushProfile(uid, {
        direction: next.direction,
        streakDays: next.streakDays,
        lastActiveDate: next.lastActiveDate,
      });
    }
  }, []);

  const chooseDirection = useCallback(
    (d: DirectionId) => persist({ ...data, direction: d }),
    [data, persist],
  );

  const completeLesson = useCallback(
    (packId: string) => {
      const today = todayStr();
      let streakDays = data.streakDays;

      if (data.lastActiveDate === today) {
        // Already practised today — streak unchanged.
      } else if (data.lastActiveDate && isYesterday(data.lastActiveDate)) {
        streakDays += 1;
      } else {
        streakDays = 1; // first day, or streak was broken
      }

      const completedPackIds = data.completedPackIds.includes(packId)
        ? data.completedPackIds
        : [...data.completedPackIds, packId];

      persist({ ...data, streakDays, lastActiveDate: today, completedPackIds });
      if (userIdRef.current) recordCompletion(userIdRef.current, packId);
    },
    [data, persist],
  );

  const giveConsent = useCallback(
    (improveOptIn: boolean) =>
      persist({ ...data, consentGiven: true, improveOptIn }),
    [data, persist],
  );

  const resetAll = useCallback(() => persist(EMPTY), [persist]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      ...data,
      hydrated,
      chooseDirection,
      completeLesson,
      giveConsent,
      resetAll,
    }),
    [data, hydrated, chooseDirection, completeLesson, giveConsent, resetAll],
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
