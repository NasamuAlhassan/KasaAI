/**
 * UI copy in both bridge languages (PRD 6.1: every label can be heard, and the
 * chrome is shown in the language the user already knows). Twi uses the special
 * characters ɛ and ɔ as in the PRD.
 *
 * `speak: true` marks strings that KasaAI should voice aloud, not just show.
 */

import type { LanguageCode } from '../types/content';

export interface Strings {
  welcomeGreeting: string; // KasaAI's opening line (voiced)
  welcomeTapToStart: string;
  chooseLanguagePrompt: string; // voiced
  learnEnglish: string;
  learnTwi: string;
  onboardingTitle: string;
  onboardingBody: string; // voiced
  onboardingStart: string;
  homeTitle: string;
  lessonListen: string;
  lessonYourTurn: string;
  lessonTapToSpeak: string;
  lessonListening: string;
  lessonThinking: string;
  kasaSpeaking: string;
  lessonReplay: string;
  lessonNext: string;
  lessonTryAgain: string;
  micPermission: string; // shown + voiced if the mic is blocked
  feedbackGood: string;
  feedbackAlmost: string;
  feedbackAgain: string;
  lessonDoneTitle: string;
  lessonDoneBody: string; // voiced
  streakLabel: (n: number) => string;
  continueWord: string;
  practiseAgain: string;
  consentTitle: string;
  consentBody: string; // voiced
  consentUnderstand: string;
  consentImproveLabel: string;
}

const twi: Strings = {
  welcomeGreeting: 'Akwaaba! Me din de KasaAI. M’ani agye sɛ woaba.',
  welcomeTapToStart: 'Fa wo nsa ka ha na yɛnkɔ so.',
  chooseLanguagePrompt:
    'Kasa bɛn na wopɛ sɛ wosua? Mia bobɔn no wɔ nea wopɛ so.',
  learnEnglish: 'Mepɛ sɛ mesua English',
  learnTwi: 'I want to learn Twi',
  onboardingTitle: 'Sɛnea yɛbɛyɛ',
  onboardingBody:
    'Mɛboa wo ma woatumi aka English wɔ ahotoso mu. Mɛkyerɛ wo tebea bi, makyerɛ wo sɛnea woka, na woasan aka akyerɛ me.',
  onboardingStart: 'Yɛmfi ase',
  homeTitle: 'Fa nea wopɛ sɛ wosua',
  lessonListen: 'Tie',
  lessonYourTurn: 'Wo berɛ nie',
  lessonTapToSpeak: 'Mia na kasa',
  lessonListening: 'Meretie…',
  lessonThinking: 'Merehwehwɛ mmuae…',
  kasaSpeaking: 'KasaAI rekasa…',
  lessonReplay: 'Ti bio',
  lessonNext: 'Kɔ nea edi so',
  lessonTryAgain: 'Sɔ hwɛ bio',
  micPermission: 'Fa kwan ma microphone no na yɛatumi atie wo.',
  feedbackGood: 'Papa paa!',
  feedbackAlmost: 'Ɛbɛn! Sɔ hwɛ bio.',
  feedbackAgain: 'Yɛnsɔ hwɛ bio, brɛoo.',
  lessonDoneTitle: 'Woayɛ adwuma!',
  lessonDoneBody: 'Woawie ɔfa yi. Kɔ so saa ara.',
  streakLabel: (n) => `Nnafua ${n}`,
  continueWord: 'Kɔ so',
  practiseAgain: 'San yɛ bio',
  consentTitle: 'Wo nne banbɔ',
  consentBody:
    'Sɛ woreyɛ adesua no, app yi tie wo nne kakra sɛnea ɛbɛtumi aboa wo. Yɛmfa nsie. Sɛ wopɛ sɛ woboa ma KasaAI tu mpɔn a, mia toggle no.',
  consentUnderstand: 'Mate aseɛ, yɛmfi ase',
  consentImproveLabel: 'Boa ma KasaAI tu mpɔn (fa wo nne kyɛ)',
};

const en: Strings = {
  welcomeGreeting: 'Welcome! My name is KasaAI. I’m glad you came.',
  welcomeTapToStart: 'Tap anywhere to begin.',
  chooseLanguagePrompt: 'Which language do you want to learn? Tap your choice.',
  learnEnglish: 'Mepɛ sɛ mesua English', // Twi learner won't pick this; kept for parity
  learnTwi: 'I want to learn Twi',
  onboardingTitle: 'How this works',
  onboardingBody:
    'I’ll help you speak Twi with confidence. I’ll give you a situation, show you how to say it, and you say it back to me.',
  onboardingStart: 'Let’s begin',
  homeTitle: 'Pick what to practise',
  lessonListen: 'Listen',
  lessonYourTurn: 'Your turn',
  lessonTapToSpeak: 'Tap and speak',
  lessonListening: 'Listening…',
  lessonThinking: 'Thinking…',
  kasaSpeaking: 'KasaAI is speaking…',
  lessonReplay: 'Play again',
  lessonNext: 'Next',
  lessonTryAgain: 'Try again',
  micPermission: 'Please allow the microphone so I can hear you.',
  feedbackGood: 'Very good!',
  feedbackAlmost: 'Close! Try once more.',
  feedbackAgain: 'Let’s try that again, gently.',
  lessonDoneTitle: 'Well done!',
  lessonDoneBody: 'You finished this pack. Keep it up.',
  streakLabel: (n) => `${n}-day streak`,
  continueWord: 'Continue',
  practiseAgain: 'Practise again',
  consentTitle: 'Your privacy',
  consentBody:
    'When you practise, the app listens to your voice so it can give you feedback. We don’t keep your recordings. If you’d like to help improve KasaAI, you can turn on sharing below.',
  consentUnderstand: 'I understand, let’s start',
  consentImproveLabel: 'Help improve KasaAI (share my recordings)',
};

const TABLE: Record<LanguageCode, Strings> = { twi, en };

export function stringsFor(bridge: LanguageCode): Strings {
  return TABLE[bridge];
}
