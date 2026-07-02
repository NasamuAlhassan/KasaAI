import type { DirectionId, ScenarioPack } from '../types/content';
import { marketPack } from './marketPack';
import { transportPack } from './transportPack';
import { twiGreetingsPack } from './twiGreetingsPack';

/**
 * Local pack registry. In v1 packs ship in the bundle; later they are fetched
 * and cached for offline use from Supabase (PRD 5.4, 7.5). Screens should only
 * read packs through these helpers so that swap is invisible to the UI.
 */
export const ALL_PACKS: ScenarioPack[] = [
  marketPack,
  transportPack,
  twiGreetingsPack,
];

export function packsForDirection(direction: DirectionId): ScenarioPack[] {
  return ALL_PACKS.filter((p) => p.direction === direction);
}

export function packById(id: string): ScenarioPack | undefined {
  return ALL_PACKS.find((p) => p.id === id);
}
