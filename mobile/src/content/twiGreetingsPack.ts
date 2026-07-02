import type { ScenarioPack } from '../types/content';

/**
 * Reverse direction for Sarah the visitor (PRD 2, 4, 5.1): English in, Twi out.
 * Starter set = greetings, market bargaining, basic directions.
 * TODO(content): native review of Twi target phrases and audio before launch.
 */
export const twiGreetingsPack: ScenarioPack = {
  id: 'greetings-twi',
  direction: 'learn-twi',
  title: 'Greetings & basics',
  emoji: '🙌',
  color: '#C1272D',
  version: 1,
  phrases: [
    {
      id: 'greet-1',
      situation: 'You meet someone in the morning. Greet them.',
      target: 'Maakye',
      gloss: 'Good morning.',
    },
    {
      id: 'greet-2',
      situation: 'Someone greets you. Reply that you are fine.',
      target: 'Me ho yɛ',
      gloss: 'I am fine.',
    },
    {
      id: 'greet-3',
      situation: 'You want to thank someone at the market.',
      target: 'Meda wo ase',
      gloss: 'Thank you.',
    },
    {
      id: 'greet-4',
      situation: 'Ask a trader how much an item costs.',
      target: 'Ɛyɛ sɛn?',
      gloss: 'How much is it?',
    },
    {
      id: 'greet-5',
      situation: 'Ask where the station is.',
      target: 'Station no wɔ he?',
      gloss: 'Where is the station?',
    },
  ],
};
