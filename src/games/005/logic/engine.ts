export type Player = 1 | 2;
export type TouchId = string | number;
export type Phase = "ready" | "countdown" | "playing" | "paused" | "won";
export const WIDTH = 360,
  RADIUS = 15,
  GATE = 66,
  WALL = 8,
  STEP = 1 / 120,
  MAX_SPEED = 1100,
  MAX_PULL = 100,
  MIN_PULL = 10;
export type Puck = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  side: Player;
  flash: number;
};
export type Hold = {
  touch: TouchId;
  player: Player;
  puck: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
};
export type Spark = {
  id: number;
  x: number;
  y: number;
  age: number;
  gate: boolean;
  shot?: boolean;
};
export type Event = "grab" | "shot" | "hit" | "gate" | "win" | "start" | "tick";
export type State = {
  height: number;
  phase: Phase;
  pucks: Puck[];
  holds: Hold[];
  counts: Record<Player, number>;
  winner: Player | null;
  wins: Record<Player, number>;
  countdown: number;
  sparks: Spark[];
  gateGlow: number;
  time: number;
};
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
export function aim(hold: Hold) {
  const length = Math.hypot(hold.dx, hold.dy),
    power = Math.min(1, length / MAX_PULL);
  return {
    power,
    vx: (-hold.dx / MAX_PULL) * MAX_SPEED,
    vy: (-hold.dy / MAX_PULL) * MAX_SPEED,
  };
}
export class SlingEngine {
  state: State;
  private accumulator = 0;
  private resumePhase: Phase = "playing";
  private events: Event[] = [];
  private sparkId = 0;
  private lastHit = -1;
  constructor(height = 720) {
    this.state = {
      height: Math.max(300, height),
      phase: "ready",
      pucks: [],
      holds: [],
      counts: { 1: 5, 2: 5 },
      winner: null,
      wins: { 1: 0, 2: 0 },
      countdown: 3,
      sparks: [],
      gateGlow: 0,
      time: 0,
    };
    this.resetPucks();
  }
  private resetPucks() {
    const s = this.state;
    s.pucks = Array.from({ length: 10 }, (_, id) => {
      const side: Player = id < 5 ? 1 : 2;
      const col = id % 5;
      const y = s.height * 0.74 + (col % 2) * RADIUS * 2.3;
      return {
        id,
        x: WIDTH * (0.15 + col * 0.175),
        y: side === 1 ? y : s.height - y,
        vx: 0,
        vy: 0,
        side,
        flash: 0,
      };
    });
  }
  resize(height: number) {
    if (
      !Number.isFinite(height) ||
      height < 300 ||
      Math.abs(height - this.state.height) < 0.5
    )
      return;
    const old = this.state.height;
    this.cancelAll();
    this.state.height = height;
    if (this.state.phase === "ready" || this.state.phase === "countdown")
      this.resetPucks();
    else {
      this.pause();
      for (const p of this.state.pucks) {
        p.y = (p.y / old) * height;
        this.boundary(p);
      }
    }
  }
  start() {
    const wins = { ...this.state.wins },
      height = this.state.height;
    this.state = {
      height,
      phase: "countdown",
      pucks: [],
      holds: [],
      counts: { 1: 5, 2: 5 },
      winner: null,
      wins,
      countdown: 3,
      sparks: [],
      gateGlow: 0,
      time: 0,
    };
    this.accumulator = 0;
    this.lastHit = -1;
    this.events = [];
    this.resetPucks();
    this.emit("tick");
  }
  pause() {
    if (this.state.phase !== "playing" && this.state.phase !== "countdown")
      return;
    this.resumePhase = this.state.phase;
    this.state.phase = "paused";
    this.accumulator = 0;
    this.cancelAll();
    this.events = [];
  }
  resume() {
    if (this.state.phase === "paused") this.state.phase = this.resumePhase;
  }
  cancelAll() {
    this.state.holds = [];
  }
  cancel(touch: TouchId) {
    this.state.holds = this.state.holds.filter((h) => h.touch !== touch);
  }
  begin(touch: TouchId, x: number, y: number, hitRadius = RADIUS * 1.65) {
    const s = this.state;
    if (
      s.phase !== "playing" ||
      !Number.isFinite(x + y) ||
      x < 0 ||
      x > WIDTH ||
      y < 0 ||
      y > s.height ||
      s.holds.some((h) => h.touch === touch)
    )
      return false;
    const player: Player = y < s.height / 2 ? 2 : 1;
    if (s.holds.some((h) => h.player === player)) return false;
    const p = s.pucks
      .filter(
        (p) =>
          p.side === player &&
          this.settledSide(p) === player &&
          Math.hypot(p.vx, p.vy) < 14 &&
          !s.holds.some((h) => h.puck === p.id),
      )
      .sort(
        (a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
      )[0];
    if (!p || Math.hypot(p.x - x, p.y - y) > hitRadius) return false;
    p.vx = 0;
    p.vy = 0;
    s.holds.push({
      touch,
      player,
      puck: p.id,
      startX: x,
      startY: y,
      dx: 0,
      dy: 0,
    });
    this.emit("grab");
    return true;
  }
  move(touch: TouchId, x: number, y: number) {
    if (this.state.phase !== "playing" || !Number.isFinite(x + y)) return;
    const h = this.state.holds.find((h) => h.touch === touch);
    if (!h) return;
    let dx = x - h.startX,
      dy = y - h.startY;
    dy = h.player === 1 ? Math.max(0, dy) : Math.min(0, dy);
    const length = Math.hypot(dx, dy);
    if (length > MAX_PULL) {
      dx *= MAX_PULL / length;
      dy *= MAX_PULL / length;
    }
    h.dx = dx;
    h.dy = dy;
  }
  release(touch: TouchId) {
    const h = this.state.holds.find((h) => h.touch === touch);
    if (!h) return;
    this.cancel(touch);
    if (
      this.state.phase !== "playing" ||
      Math.hypot(h.dx, h.dy) < MIN_PULL ||
      Math.abs(h.dy) < MIN_PULL * 0.5
    )
      return;
    const p = this.state.pucks.find((p) => p.id === h.puck)!;
    const v = aim(h);
    p.vx = v.vx;
    p.vy = v.vy;
    p.flash = 0.18;
    this.impact(p.x, p.y, false, true);
  }
  private emit(e: Event) {
    if (!this.events.includes(e)) this.events.push(e);
  }
  drainEvents() {
    const result = this.events;
    this.events = [];
    return result;
  }
  snapshot(): State {
    return {
      ...this.state,
      pucks: this.state.pucks.map((p) => ({ ...p })),
      holds: this.state.holds.map((h) => ({ ...h })),
      counts: { ...this.state.counts },
      wins: { ...this.state.wins },
      sparks: this.state.sparks.map((p) => ({ ...p })),
    };
  }
  advance(seconds: number) {
    if (
      !Number.isFinite(seconds) ||
      seconds <= 0 ||
      !["playing", "countdown"].includes(this.state.phase)
    )
      return;
    this.accumulator += Math.min(seconds, 0.1);
    while (this.accumulator + 1e-9 >= STEP) {
      this.accumulator -= STEP;
      this.step();
      if (!["playing", "countdown"].includes(this.state.phase)) {
        this.accumulator = 0;
        break;
      }
    }
  }
  private impact(x: number, y: number, gate = false, shot = false) {
    const s = this.state;
    if (!gate && !shot && s.time - this.lastHit < 0.065) return;
    if (!gate && !shot) this.lastHit = s.time;
    s.sparks.push({ id: ++this.sparkId, x, y, age: 0, gate, shot });
    if (s.sparks.length > 12) s.sparks.shift();
    this.emit(shot ? "shot" : gate ? "gate" : "hit");
  }
  private settledSide(p: Puck): Player | null {
    const mid = this.state.height / 2;
    if (p.y + RADIUS < mid - WALL / 2) return 2;
    if (p.y - RADIUS > mid + WALL / 2) return 1;
    return null;
  }
  private boundary(p: Puck) {
    const s = this.state;
    const oldV = Math.hypot(p.vx, p.vy);
    let hit = false;
    if (p.x < RADIUS) {
      p.x = RADIUS;
      p.vx = Math.abs(p.vx) * 0.86;
      hit = true;
    }
    if (p.x > WIDTH - RADIUS) {
      p.x = WIDTH - RADIUS;
      p.vx = -Math.abs(p.vx) * 0.86;
      hit = true;
    }
    if (p.y < RADIUS) {
      p.y = RADIUS;
      p.vy = Math.abs(p.vy) * 0.86;
      hit = true;
    }
    if (p.y > s.height - RADIUS) {
      p.y = s.height - RADIUS;
      p.vy = -Math.abs(p.vy) * 0.86;
      hit = true;
    }
    const mid = s.height / 2;
    for (const [left, right] of [
      [0, (WIDTH - GATE) / 2],
      [(WIDTH + GATE) / 2, WIDTH],
    ]) {
      const nearX = clamp(p.x, left, right),
        nearY = clamp(p.y, mid - WALL / 2, mid + WALL / 2);
      let dx = p.x - nearX,
        dy = p.y - nearY,
        d = Math.hypot(dx, dy);
      if (d >= RADIUS) continue;
      if (d < 1e-8) {
        dx = 0;
        dy = p.side === 1 ? 1 : -1;
        d = 1;
        p.y = mid + dy * (WALL / 2 + RADIUS);
      } else {
        p.x += (dx / d) * (RADIUS - d + 0.001);
        p.y += (dy / d) * (RADIUS - d + 0.001);
      }
      const nx = dx / d,
        ny = dy / d,
        dot = p.vx * nx + p.vy * ny;
      if (dot < 0) {
        p.vx -= 1.86 * dot * nx;
        p.vy -= 1.86 * dot * ny;
        hit = true;
      }
    }
    if (hit && oldV > 45) {
      p.flash = 0.12;
      this.impact(p.x, p.y);
    }
  }
  private step() {
    const s = this.state;
    s.time += STEP;
    if (s.phase === "countdown") {
      const previous = Math.ceil(s.countdown);
      s.countdown = Math.max(0, s.countdown - STEP);
      if (s.countdown < 1e-7) {
        s.countdown = 0;
        s.phase = "playing";
        this.emit("start");
      } else if (Math.ceil(s.countdown) < previous) this.emit("tick");
      return;
    }
    s.gateGlow = Math.max(0, s.gateGlow - STEP);
    s.sparks = s.sparks
      .map((p) => ({ ...p, age: p.age + STEP }))
      .filter((p) => p.age < 0.55);
    const held = new Set(s.holds.map((h) => h.puck));
    for (const p of s.pucks) {
      p.flash = Math.max(0, p.flash - STEP);
      if (held.has(p.id)) continue;
      p.x += p.vx * STEP;
      p.y += p.vy * STEP;
      p.vx *= Math.exp(-0.62 * STEP);
      p.vy *= Math.exp(-0.62 * STEP);
      if (Math.hypot(p.vx, p.vy) < 12) {
        p.vx = 0;
        // A slowly crossing puck must not become permanently ungrabbable in the gate.
        p.vy =
          this.settledSide(p) === null
            ? p.vy < 0
              ? -70
              : p.vy > 0
                ? 70
                : p.side === 1
                  ? -70
                  : 70
            : 0;
      }
      this.boundary(p);
    }
    // Equal-mass impulses, with held pucks temporarily immovable. Two passes settle clusters.
    for (let pass = 0; pass < 2; pass++)
      for (let i = 0; i < s.pucks.length; i++)
        for (let j = i + 1; j < s.pucks.length; j++) {
          const a = s.pucks[i],
            b = s.pucks[j],
            dx = b.x - a.x,
            dy = b.y - a.y,
            d = Math.hypot(dx, dy);
          if (d >= RADIUS * 2) continue;
          const nx = d > 1e-8 ? dx / d : 1,
            ny = d > 1e-8 ? dy / d : 0,
            ia = held.has(a.id) ? 0 : 1,
            ib = held.has(b.id) ? 0 : 1;
          if (!ia && !ib) continue;
          const push = (RADIUS * 2 - d + 0.001) / (ia + ib);
          a.x -= nx * push * ia;
          a.y -= ny * push * ia;
          b.x += nx * push * ib;
          b.y += ny * push * ib;
          const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (relative < 0) {
            const impulse = (-1.92 * relative) / (ia + ib);
            a.vx -= impulse * nx * ia;
            a.vy -= impulse * ny * ia;
            b.vx += impulse * nx * ib;
            b.vy += impulse * ny * ib;
            if (relative < -40) {
              a.flash = 0.14;
              b.flash = 0.14;
              this.impact((a.x + b.x) / 2, (a.y + b.y) / 2);
            }
          }
        }
    for (const p of s.pucks) {
      if (!held.has(p.id)) this.boundary(p);
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > MAX_SPEED) {
        p.vx *= MAX_SPEED / speed;
        p.vy *= MAX_SPEED / speed;
      }
      const side = this.settledSide(p);
      if (side && side !== p.side) {
        p.side = side;
        p.flash = 0.4;
        s.gateGlow = 0.6;
        this.impact(p.x, p.y, true);
      }
    }
    s.counts = {
      1: s.pucks.filter((p) => p.side === 1).length,
      2: s.pucks.filter((p) => p.side === 2).length,
    };
    // All pucks are advanced before deciding: simultaneous opposite crossings cannot cause a false win.
    if (!s.pucks.some((p) => this.settledSide(p) === null))
      for (const player of [1, 2] as const)
        if (s.counts[player] === 0) {
          s.winner = player;
          s.wins[player]++;
          s.phase = "won";
          s.holds = [];
          for (const p of s.pucks) {
            p.vx = 0;
            p.vy = 0;
          }
          this.emit("win");
          break;
        }
  }
}
