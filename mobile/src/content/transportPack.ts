import type { ScenarioPack } from '../types/content';

/**
 * Transport (trotro, taxi, ride apps) — PRD 5.1.
 * TODO(content): native review + re-voicing of Twi copy before launch.
 */
export const transportPack: ScenarioPack = {
  id: 'transport-en',
  direction: 'learn-en',
  title: 'Akwantuo (trotro, taxi)',
  emoji: '🚐',
  color: '#E8A317',
  version: 1,
  phrases: [
    {
      id: 'transport-1',
      situation: 'Sɛ wopɛ sɛ woka kyerɛ mate no baabi a worekɔ a.',
      target: 'I am going to Circle, please.',
      gloss: 'Merekɔ Circle, mepa wo kyɛw.',
    },
    {
      id: 'transport-2',
      situation: 'Sɛ wopɛ sɛ wobisa sɛ ka ne sɛn a.',
      target: 'How much is the fare?',
      gloss: 'Ka no yɛ sɛn?',
    },
    {
      id: 'transport-3',
      situation: 'Sɛ wopɛ sɛ wo ne wo sie a.',
      target: 'Bus stop here, please.',
      gloss: 'Gyina ha ma me, mepa wo kyɛw.',
    },
    {
      id: 'transport-4',
      situation: 'Sɛ wopɛ sɛ wokyerɛ ɔkafoɔ no kwan a.',
      target: 'Turn left at the traffic light.',
      gloss: 'Dane benkum wɔ kanea no ho.',
    },
  ],
};
