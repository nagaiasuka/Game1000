import type { Action } from "./engine.ts";
export const LONG_PRESS_MS = 500;
export const TOUCH_SLOP = 10;
/** One touch controls one piece. Drag and long-press are mutually exclusive. */
export class BoardGesture {
  private touching = false;
  private axis: "x" | "y" | null = null;
  private elapsed = 0;
  private anchor = 0;
  private step = 20;
  begin(cellSize: number) {
    this.cancel();
    this.touching = true;
    this.step = Math.max(12, cellSize);
  }
  get progress() {
    return this.touching && !this.axis
      ? Math.min(1, this.elapsed / LONG_PRESS_MS)
      : 0;
  }
  cancel() {
    this.touching = false;
    this.axis = null;
    this.elapsed = 0;
    this.anchor = 0;
  }
  move(dx: number, dy: number, touches = 1): Action[] {
    if (touches !== 1) {
      this.cancel();
      return [];
    }
    if (!this.touching) return [];
    if (!this.axis && Math.hypot(dx, dy) >= TOUCH_SLOP)
      this.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    if (!this.axis) return [];
    const position = this.axis === "x" ? dx : dy;
    if (this.axis === "y" && position < this.anchor) {
      this.anchor = position;
      return [];
    }
    const steps = Math.trunc((position - this.anchor) / this.step);
    this.anchor += steps * this.step;
    const action = this.axis === "x" ? (steps < 0 ? "left" : "right") : "soft";
    return Array<Action>(
      Math.min(Math.abs(steps), this.axis === "x" ? 10 : 20),
    ).fill(action);
  }
  advance(ms: number): Action | null {
    if (!this.touching || this.axis) return null;
    this.elapsed += ms;
    if (this.elapsed + 0.00001 < LONG_PRESS_MS) return null;
    this.cancel();
    return "drop";
  }
  end(): Action | null {
    const action = this.touching && !this.axis ? "rotate" : null;
    this.cancel();
    return action;
  }
}
