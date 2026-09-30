import type { Effect } from "../../audio/types.ts";
import type { Event } from "./logic/engine.ts";
const sounds: Record<Event, Effect> = {
  grab: "slingGrab",
  shot: "slingShot",
  hit: "slingHit",
  gate: "slingGate",
  win: "slingWin",
  start: "start",
  tick: "slingTick",
};
export function slingSounds(events: readonly Event[]): Effect[] {
  return events.includes("win") ? [sounds.win] : events.map((e) => sounds[e]);
}
