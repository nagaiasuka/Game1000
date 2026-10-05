import type { Effect } from "../../audio/types.ts";
import type { Feedback } from "./logic/session.ts";
const sounds: Record<Feedback, Effect> = {
  start: "start",
  select: "pushSelect",
  move: "pushMove",
  push: "pushHit",
  blocked: "pushBlocked",
  push_out: "pushOut",
  win: "pushWin",
};
export const pushSound = (kind: Feedback): Effect => sounds[kind];
