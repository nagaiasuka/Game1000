export const WIDTH = 360;
export const HEIGHT = 600;
export const RADIUS = 6;
export const PADDLE_Y = 528;
export const MAX_SPEED = 400;
export const PADDLE_WIDTH = 90;
export const WIDE_PADDLE_WIDTH = 126;
export const PADDLE_BOTTOM = HEIGHT - PADDLE_Y;
// Keep circular geometry; only the vertical travel distance adapts to the phone.
export function fieldLayout(width: number, height: number) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 2 ||
    height <= 2
  )
    return { scale: 0, height: 360 };
  const scale = Math.min((width - 2) / WIDTH, (height - 2) / 360);
  return { scale, height: Math.max(360, (height - 2) / scale) };
}
export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));
export type Rect = { x: number; y: number; w: number; h: number };
export function inside(x: number, y: number, box: Rect, radius = RADIUS) {
  return (
    x >= box.x - radius &&
    x <= box.x + box.w + radius &&
    y >= box.y - radius &&
    y <= box.y + box.h + radius
  );
}
// Sweep the ball centre against an expanded rectangle. Returns first contact,
// so thin bricks remain solid even at the highest speed or low render FPS.
export function sweep(x: number, y: number, dx: number, dy: number, box: Rect) {
  const left = box.x - RADIUS,
    right = box.x + box.w + RADIUS;
  const top = box.y - RADIUS,
    bottom = box.y + box.h + RADIUS;
  if (
    (dx === 0 && (x < left || x > right)) ||
    (dy === 0 && (y < top || y > bottom))
  )
    return null;
  const ax = dx === 0 ? -Infinity : Math.min((left - x) / dx, (right - x) / dx);
  const bx = dx === 0 ? Infinity : Math.max((left - x) / dx, (right - x) / dx);
  const ay = dy === 0 ? -Infinity : Math.min((top - y) / dy, (bottom - y) / dy);
  const by = dy === 0 ? Infinity : Math.max((top - y) / dy, (bottom - y) / dy);
  const time = Math.max(ax, ay);
  if (time < -1e-8 || time > 1 || time > Math.min(bx, by)) return null;
  return {
    time: Math.max(0, time),
    nx: ax >= ay ? -Math.sign(dx) : 0,
    ny: ay >= ax ? -Math.sign(dy) : 0,
  };
}
export function paddleBounce(
  hitX: number,
  centre: number,
  width: number,
  speed: number,
) {
  const offset = clamp((hitX - centre) / (width / 2), -1, 1);
  const angle = (offset * Math.PI) / 3;
  // Avoid a perfectly vertical orbit that never reaches adjacent columns.
  const vx = Math.sin(angle) * speed;
  const boundedX =
    Math.abs(vx) < speed * 0.12 ? speed * 0.12 * (offset < 0 ? -1 : 1) : vx;
  return { vx: boundedX, vy: -Math.sqrt(speed * speed - boundedX * boundedX) };
}
