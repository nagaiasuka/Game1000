import type { GameEvent, BreakState } from "./logic/engine.ts";
import { comboSound, type Effect } from "../../audio/types.ts";
export function breakSounds(
  events: readonly GameEvent[],
  state: BreakState,
): Effect[] {
  if (events.includes("clear"))
    return [state.phase === "complete" ? "allClear" : "clear"];
  if (events.includes("over")) return ["over"];
  const sounds: Effect[] = [];
  if (events.includes("start")) sounds.push("start");
  if (events.includes("miss")) sounds.push("miss");
  if (events.includes("fever")) sounds.push("fever");
  if (events.includes("feverEnd")) sounds.push("feverEnd");
  if (events.includes("item")) sounds.push("pickup");
  for (const item of ["multi", "wide", "power"] as const)
    if (events.includes(item)) sounds.push(item);
  if (events.includes("break")) sounds.push(comboSound(state.combo));
  return sounds;
}
