/**
 * Thin wrapper over expo-audio recording so screens get a simple
 * start / stop-and-get-uri API. Handles the mic permission prompt and the
 * audio-mode setup that recording needs.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';

export function useRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    // Allow playback + recording; keep audio audible in silent mode on iOS.
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true }).catch(
      () => {},
    );
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      setPermissionDenied(true);
      return false;
    }
    setPermissionDenied(false);
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
    return true;
  }, [recorder]);

  const stop = useCallback(async (): Promise<string | null> => {
    if (!recorder.isRecording && !isRecording) return null;
    await recorder.stop();
    setIsRecording(false);
    return recorder.uri ?? null;
  }, [recorder, isRecording]);

  return { isRecording, permissionDenied, start, stop };
}
