import type { GameEvent, State } from "./logic/engine.ts";
import type { Effect } from "../../audio/types.ts";
export function dropSounds(
  events: readonly GameEvent[],
  state: State,
  newBest: boolean,
): Effect[] {
  if (events.includes("over")) return [newBest ? "best" : "over"];
  const sounds: Effect[] = [];
  if (events.includes("start")) sounds.push("start");
  if (events.includes("drop")) sounds.push("drop");
  else if (events.includes("lock")) sounds.push("lock");
  if (events.includes("four")) sounds.push("line4");
  else if (events.includes("clear"))
    sounds.push(
      state.clearingRows.length >= 3
        ? "line3"
        : state.clearingRows.length === 2
          ? "line2"
          : "line1",
    );
  if (events.includes("level")) sounds.push("level");
  if (events.includes("rotate")) sounds.push("rotate");
  else if (events.includes("move")) sounds.push("move");
  return sounds;
}
