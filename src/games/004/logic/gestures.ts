import type { Candidate } from "./engine.ts";
export type BoardRect = { x: number; y: number; width: number; height: number };
export function wallAt(
  x: number,
  y: number,
  rect: BoardRect,
  orientation: Candidate["orientation"],
): Candidate | null {
  if (
    rect.width <= 0 ||
    rect.height <= 0 ||
    x < rect.x ||
    y < rect.y ||
    x > rect.x + rect.width ||
    y > rect.y + rect.height
  )
    return null;
  return {
    row: Math.max(
      0,
      Math.min(7, Math.round(((y - rect.y) / rect.height) * 9) - 1),
    ),
    col: Math.max(
      0,
      Math.min(7, Math.round(((x - rect.x) / rect.width) * 9) - 1),
    ),
    orientation,
  };
}
export const isDrag = (
  start: { x: number; y: number },
  end: { x: number; y: number },
) => Math.hypot(end.x - start.x, end.y - start.y) > 8;
