import { AudioManager } from "./audio-manager";
import { sources, durations } from "./sounds";
// Load only when preparing audio: older development clients can still run silently.
let module: typeof import("expo-audio") | null = null;
export async function prepareAudio(): Promise<boolean> {
  try {
    module = await import("expo-audio");
    await module.setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: "mixWithOthers",
      shouldPlayInBackground: false,
      allowsRecording: false,
    });
    return true;
  } catch {
    module = null;
    return false;
  }
}
export const audio = new AudioManager((id) => {
  if (!module) throw new Error("Audio unavailable");
  return module.createAudioPlayer(sources[id], {
    updateInterval: 1000,
    keepAudioSessionActive: false,
  });
}, durations);
