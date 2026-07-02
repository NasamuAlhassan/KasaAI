/**
 * Content model for Kasa lessons.
 *
 * A single engine runs both directions (PRD 3, 4). "Bridge" is the language the
 * user already knows; "target" is the one they are learning. Everything the user
 * reads/hears as instruction is in the bridge language; the phrase they practise
 * is in the target language.
 */

export type LanguageCode = 'twi' | 'en';

export type DirectionId = 'learn-en' | 'learn-twi';

export interface DirectionMeta {
  id: DirectionId;
  bridge: LanguageCode;
  target: LanguageCode;
}

export const DIRECTIONS: Record<DirectionId, DirectionMeta> = {
  'learn-en': { id: 'learn-en', bridge: 'twi', target: 'en' },
  'learn-twi': { id: 'learn-twi', bridge: 'en', target: 'twi' },
};

export interface Phrase {
  id: string;
  /** Sets the real-life situation, in the bridge language (PRD 4, step 1). */
  situation: string;
  /** The phrase the user must say, in the target language (step 2). */
  target: string;
  /** Optional plain gloss of the target phrase in the bridge language. */
  gloss?: string;
}

export interface ScenarioPack {
  id: string;
  direction: DirectionId;
  /** Pack name in the bridge language. */
  title: string;
  /** MaterialCommunityIcons glyph name (vector icon, per the design system). */
  icon?: string;
  /** Legacy emoji fallback if no vector icon is set. */
  emoji?: string;
  /** Accent colour for the tile. */
  color: string;
  phrases: Phrase[];
  /** Bumped when content changes so packs can update over the air (PRD 7.5). */
  version: number;
}
