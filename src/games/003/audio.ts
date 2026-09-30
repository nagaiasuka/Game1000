import type { Feedback } from "./logic/session.ts";
import type { PieceSize } from "./logic/types.ts";
import type { Effect } from "../../audio/types.ts";
export function stackSound(kind: Feedback, size: PieceSize = 1): Effect {
  if (kind === "place")
    return size === 3 ? "place3" : size === 2 ? "place2" : "place1";
  if (kind === "undo") return "ui";
  return kind;
}
