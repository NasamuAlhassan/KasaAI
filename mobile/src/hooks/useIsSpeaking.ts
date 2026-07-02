import { useEffect, useState } from 'react';
import { tts } from '../services/tts';

/** True while KasaAI's voice is loading or playing. Drives loading/speaking
 * cues so users always know whether to wait or act (see tts.ts). */
export function useIsSpeaking(): boolean {
  const [speaking, setSpeaking] = useState(tts.isSpeaking);
  useEffect(() => tts.subscribe(setSpeaking), []);
  return speaking;
}
