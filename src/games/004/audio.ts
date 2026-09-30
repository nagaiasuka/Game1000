import type { Effect } from "../../audio/types.ts";
import type { Feedback } from "./logic/session.ts";
const sounds: Record<Feedback, Effect> = {
  start: "start",
  move: "pathMove",
  jump: "pathJump",
  wall: "pathWall",
  goal: "pathGoal",
  warning: "warning",
  undo: "ui",
};
export const pathSound = (kind: Feedback): Effect => sounds[kind];
