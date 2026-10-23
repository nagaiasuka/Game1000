import type { Rect } from "./types.ts";
export type Hit = { t: number; nx: number; ny: number; push: number };
const EPS = 1e-8;
export const clamp = (x: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, x));
/** Exact swept circle against a circle; dx/dy is this step's displacement. */
export function sweepCircle(
  x: number,
  y: number,
  dx: number,
  dy: number,
  cx: number,
  cy: number,
  radius: number,
): Hit | null {
  const ox = x - cx,
    oy = y - cy,
    len = Math.hypot(ox, oy);
  if (len < radius - EPS) {
    const nx = len > EPS ? ox / len : 0,
      ny = len > EPS ? oy / len : -1;
    return dx * nx + dy * ny < EPS
      ? { t: 0, nx, ny, push: radius - len + 0.002 }
      : null;
  }
  const a = dx * dx + dy * dy;
  if (a < EPS) return null;
  const b = ox * dx + oy * dy,
    c = ox * ox + oy * oy - radius * radius,
    d = b * b - a * c;
  if (d < 0) return null;
  const t = (-b - Math.sqrt(d)) / a;
  if (t < -EPS || t > 1 + EPS) return null;
  const px = ox + dx * t,
    py = oy + dy * t,
    length = Math.hypot(px, py);
  const nx = px / length,
    ny = py / length;
  return dx * nx + dy * ny < -EPS
    ? { t: Math.max(0, t), nx, ny, push: 0.002 }
    : null;
}
/** Rect faces plus rounded corners, not a square approximation of a circle. */
export function sweepRect(
  x: number,
  y: number,
  dx: number,
  dy: number,
  rect: Rect,
  radius: number,
): Hit | null {
  let best: Hit | null = null;
  const accept = (h: Hit | null) => {
    if (h && h.t >= -EPS && h.t <= 1 + EPS && (!best || h.t < best.t)) best = h;
  };
  const nearX = clamp(x, rect.x, rect.x + rect.w),
    nearY = clamp(y, rect.y, rect.y + rect.h);
  const ox = x - nearX,
    oy = y - nearY,
    distance = Math.hypot(ox, oy);
  if (distance < radius - EPS) {
    if (distance > EPS) {
      const nx = ox / distance,
        ny = oy / distance;
      if (dx * nx + dy * ny < EPS)
        accept({ t: 0, nx, ny, push: radius - distance + 0.002 });
    } else {
      const exits = [
        { d: x - rect.x + radius, nx: -1, ny: 0 },
        { d: rect.x + rect.w - x + radius, nx: 1, ny: 0 },
        { d: y - rect.y + radius, nx: 0, ny: -1 },
        { d: rect.y + rect.h - y + radius, nx: 0, ny: 1 },
      ];
      const p = exits.sort((a, b) => a.d - b.d)[0];
      accept({ t: 0, nx: p.nx, ny: p.ny, push: p.d + 0.002 });
    }
  }
  if (Math.abs(dx) > EPS)
    for (const [edge, nx] of [
      [rect.x - radius, -1],
      [rect.x + rect.w + radius, 1],
    ]) {
      const t = (edge - x) / dx,
        py = y + dy * t;
      if (dx * nx < 0 && py >= rect.y - EPS && py <= rect.y + rect.h + EPS)
        accept({ t, nx, ny: 0, push: 0.002 });
    }
  if (Math.abs(dy) > EPS)
    for (const [edge, ny] of [
      [rect.y - radius, -1],
      [rect.y + rect.h + radius, 1],
    ]) {
      const t = (edge - y) / dy,
        px = x + dx * t;
      if (dy * ny < 0 && px >= rect.x - EPS && px <= rect.x + rect.w + EPS)
        accept({ t, nx: 0, ny, push: 0.002 });
    }
  for (const cx of [rect.x, rect.x + rect.w])
    for (const cy of [rect.y, rect.y + rect.h])
      accept(sweepCircle(x, y, dx, dy, cx, cy, radius));
  return best;
}
export type Collider = {
  kind: "brick" | "wall" | "bumper";
  index: number;
  bounds: Rect;
};
/** Static broadphase; dead bricks/doors are filtered at query use, without rebuilding. */
export class SpatialGrid {
  private cells = new Map<number, number[]>();
  private stamps: Int32Array;
  private serial = 0;
  private result: number[] = [];
  readonly colliders: Collider[];
  constructor(colliders: Collider[]) {
    this.colliders = colliders;
    this.stamps = new Int32Array(colliders.length);
    colliders.forEach((c, i) => {
      for (
        let row = Math.floor(c.bounds.y / 48);
        row <= Math.floor((c.bounds.y + c.bounds.h) / 48);
        row++
      )
        for (
          let col = Math.floor(c.bounds.x / 48);
          col <= Math.floor((c.bounds.x + c.bounds.w) / 48);
          col++
        ) {
          const key = row * 32 + col;
          const cell = this.cells.get(key) ?? [];
          cell.push(i);
          this.cells.set(key, cell);
        }
    });
  }
  query(
    x: number,
    y: number,
    dx: number,
    dy: number,
    radius: number,
  ): readonly number[] {
    this.result.length = 0;
    if (++this.serial >= 2147483647) {
      this.stamps.fill(0);
      this.serial = 1;
    }
    for (
      let row = Math.floor((Math.min(y, y + dy) - radius) / 48);
      row <= Math.floor((Math.max(y, y + dy) + radius) / 48);
      row++
    )
      for (
        let col = Math.floor((Math.min(x, x + dx) - radius) / 48);
        col <= Math.floor((Math.max(x, x + dx) + radius) / 48);
        col++
      ) {
        const cell = this.cells.get(row * 32 + col);
        if (cell)
          for (const i of cell)
            if (this.stamps[i] !== this.serial) {
              this.stamps[i] = this.serial;
              this.result.push(i);
            }
      }
    return this.result;
  }
}
