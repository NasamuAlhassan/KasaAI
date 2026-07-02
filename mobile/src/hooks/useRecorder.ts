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
    // Keep audio audible in silent mode. Recording is enabled only while we're
    // actually recording (below) — leaving it on globally makes playback quiet
    // and routes to the earpiece on iOS.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      setPermissionDenied(true);
      return false;
    }
    setPermissionDenied(false);
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }).catch(
      () => {},
    );
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
    return true;
  }, [recorder]);

  const stop = useCallback(async (): Promise<string | null> => {
    if (!recorder.isRecording && !isRecording) return null;
    await recorder.stop();
    setIsRecording(false);
    // Hand the audio route back to playback (important for iOS loudness).
    await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    return recorder.uri ?? null;
  }, [recorder, isRecording]);

  return { isRecording, permissionDenied, start, stop };
}
