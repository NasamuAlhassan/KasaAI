import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/** The linear flow from PRD section 4. Direction lives in progress state. */
export type RootStackParamList = {
  Welcome: undefined;
  LanguageSelect: undefined;
  Onboarding: undefined;
  Home: undefined;
  Lesson: { packId: string };
  LessonComplete: { packId: string };
};

export type ScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
