import type { SoundId } from "./sounds.ts";
export type Scene = "home" | "001" | "002" | "003" | "004" | "005";
export type Effect = Exclude<SoundId, `bgm${string}`>;
export type AudioSettings = {
  bgm: boolean;
  se: boolean;
  bgmVolume: number;
  seVolume: number;
};
export const AUDIO_KEY = "@game1000/settings/audio/v1";
export const DEFAULT_AUDIO: AudioSettings = {
  bgm: true,
  se: true,
  bgmVolume: 0.32,
  seVolume: 0.7,
};
export function readSettings(raw: string | null): AudioSettings {
  try {
    const value = JSON.parse(raw ?? "{}");
    const volume = (x: unknown, fallback: number) =>
      typeof x === "number" && Number.isFinite(x)
        ? Math.max(0, Math.min(1, x))
        : fallback;
    return {
      bgm: typeof value.bgm === "boolean" ? value.bgm : true,
      se: typeof value.se === "boolean" ? value.se : true,
      bgmVolume: volume(value.bgmVolume, DEFAULT_AUDIO.bgmVolume),
      seVolume: volume(value.seVolume, DEFAULT_AUDIO.seVolume),
    };
  } catch {
    return { ...DEFAULT_AUDIO };
  }
}
export const sceneEffects: Record<Scene, readonly Effect[]> = {
  home: ["ui", "start", "warning"],
  "005": [
    "ui",
    "start",
    "slingGrab",
    "slingShot",
    "slingHit",
    "slingGate",
    "slingWin",
    "slingTick",
  ],
  "004": [
    "ui",
    "start",
    "warning",
    "pathMove",
    "pathJump",
    "pathWall",
    "pathGoal",
  ],
  "001": [
    "ui",
    "start",
    "warning",
    "over",
    "best",
    "move",
    "rotate",
    "drop",
    "lock",
    "line1",
    "line2",
    "line3",
    "line4",
    "level",
  ],
  "002": [
    "ui",
    "start",
    "warning",
    "over",
    "best",
    "break1",
    "break2",
    "break3",
    "break4",
    "fever",
    "feverEnd",
    "pickup",
    "multi",
    "wide",
    "power",
    "miss",
    "clear",
    "allClear",
  ],
  "003": [
    "ui",
    "start",
    "warning",
    "place1",
    "place2",
    "place3",
    "cover",
    "win",
    "draw",
  ],
};
export function comboSound(combo: number): Effect {
  return combo >= 20
    ? "break4"
    : combo >= 10
      ? "break3"
      : combo >= 5
        ? "break2"
        : "break1";
}
