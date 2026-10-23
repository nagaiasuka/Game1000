import {
  clamp,
  SpatialGrid,
  sweepCircle,
  sweepRect,
  type Collider,
  type Hit,
} from "./physics.ts";
import {
  emptyEvents,
  gateX,
  GRAVITY,
  HEIGHT,
  LAUNCH,
  MAX_BALLS,
  RADIUS,
  SHOT_SPEED,
  STEP,
  WIDTH,
  type Ball,
  type Brick,
  type Events,
  type Phase,
  type Stage,
  type State,
} from "./types.ts";
import { endlessStage } from "../stages.ts";
export const FEVER_THRESHOLD = 10,
  FEVER_SECONDS = 8,
  MAX_SHOT_SECONDS = 16;
export class CascadeEngine {
  state: State;
  private accumulator = 0;
  private resumePhase: Phase = "ready";
  private events: Events = emptyEvents();
  private grid: SpatialGrid;
  private id = 0;
  private sparkId = 0;
  private resolveLeft = 0;
  private gateFlags = 0;
  constructor(stage: Stage, mode: "stages" | "endless" = "stages") {
    const owned = {
      ...stage,
      bricks: stage.bricks.map((b) => ({ ...b, hp: b.maxHp })),
      walls: stage.walls.map((w) => ({ ...w })),
      gates: stage.gates.map((g) => ({ ...g })),
      bumpers: stage.bumpers.map((b) => ({ ...b })),
    };
    this.state = {
      phase: "ready",
      mode,
      stage: owned,
      balls: Array.from({ length: MAX_BALLS }, () => ({
        id: 0,
        active: false,
        x: LAUNCH.x,
        y: LAUNCH.y,
        vx: 0,
        vy: 0,
        age: 0,
        gates: 0,
        contacts: [],
      })),
      score: 0,
      combo: 0,
      maxCombo: 0,
      comboLeft: 0,
      fever: 0,
      feverLeft: 0,
      used: 0,
      remaining: owned.bricks.length,
      time: 0,
      shotTime: 0,
      angle: 0,
      open: false,
      coreCleared: false,
      peakBalls: 0,
      stars: 0,
      revision: 0,
      sparks: [],
      shotsResolved: 0,
    };
    const colliders: Collider[] = [];
    owned.bricks.forEach((b, index) =>
      colliders.push({ kind: "brick", index, bounds: b }),
    );
    owned.walls.forEach((w, index) =>
      colliders.push({ kind: "wall", index, bounds: w }),
    );
    owned.bumpers.forEach((b, index) =>
      colliders.push({
        kind: "bumper",
        index,
        bounds: { x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 },
      }),
    );
    this.grid = new SpatialGrid(colliders);
  }
  get activeBalls() {
    return this.state.balls.reduce((n, b) => n + Number(b.active), 0);
  }
  get shotsLeft() {
    return this.state.stage.shots - this.state.used;
  }
  get canAim() {
    return this.state.phase === "ready" || this.state.phase === "aiming";
  }
  aim(angle: number) {
    if (!this.canAim || !Number.isFinite(angle)) return false;
    this.state.angle = clamp(angle, -1.12, 1.12);
    this.state.phase = "aiming";
    return true;
  }
  cancelAim() {
    if (this.state.phase === "aiming") this.state.phase = "ready";
  }
  launch(angle = this.state.angle) {
    if (!this.canAim || !Number.isFinite(angle) || this.shotsLeft <= 0)
      return false;
    this.state.angle = clamp(angle, -1.12, 1.12);
    this.state.phase = "firing";
    this.state.used++;
    this.state.shotTime = 0;
    this.state.combo = 0;
    this.state.comboLeft = 0;
    this.gateFlags = 0;
    this.events.start = true;
    return true;
  }
  pause() {
    if (["paused", "stage_clear", "game_over"].includes(this.state.phase))
      return;
    this.resumePhase =
      this.state.phase === "aiming" ? "ready" : this.state.phase;
    this.state.phase = "paused";
    this.accumulator = 0;
    this.events = emptyEvents();
  }
  resume() {
    if (this.state.phase === "paused") {
      this.state.phase = this.resumePhase;
      this.accumulator = 0;
    }
  }
  drainEvents() {
    const e = this.events;
    this.events = emptyEvents();
    return e;
  }
  advance(ms: number) {
    if (
      !Number.isFinite(ms) ||
      ms <= 0 ||
      ["paused", "stage_clear", "game_over"].includes(this.state.phase)
    )
      return;
    if (ms > 250) {
      this.pause();
      return;
    }
    this.accumulator += ms / 1000;
    let steps = 0;
    while (this.accumulator + 1e-9 >= STEP && steps++ < 30) {
      this.accumulator -= STEP;
      this.step();
      if (["paused", "stage_clear", "game_over"].includes(this.state.phase)) {
        this.accumulator = 0;
        break;
      }
    }
  }
  private spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    gates = 0,
  ): Ball | null {
    const ball = this.state.balls.find((b) => !b.active);
    if (!ball) return null;
    Object.assign(ball, {
      id: ++this.id,
      active: true,
      x,
      y,
      vx,
      vy,
      age: 0,
      gates,
    });
    ball.contacts.length = 0;
    this.state.peakBalls = Math.max(this.state.peakBalls, this.activeBalls);
    return ball;
  }
  private spark(x: number, y: number, kind: "hit" | "gate" | "bomb") {
    const s = this.state;
    if (s.sparks.length >= 18) s.sparks.shift();
    s.sparks.push({ id: ++this.sparkId, x, y, age: 0, kind });
  }
  private charge(value: number) {
    const s = this.state;
    if (s.feverLeft > 0) return;
    s.fever += value;
    if (s.fever >= FEVER_THRESHOLD) {
      s.fever = 0;
      s.feverLeft = FEVER_SECONDS;
      this.events.fever = true;
    }
  }
  private damage(b: Brick, amount = 1) {
    const s = this.state;
    if (b.hp <= 0) return;
    if (b.kind === "core" && s.feverLeft <= 0) {
      this.charge(0.6);
      return;
    }
    b.hp = Math.max(0, b.hp - amount);
    s.revision++;
    this.events.hit++;
    s.score += 10;
    this.charge(0.2);
    if (b.hp > 0) return;
    s.remaining--;
    s.combo++;
    s.maxCombo = Math.max(s.combo, s.maxCombo);
    s.comboLeft = 2.5;
    s.score +=
      100 *
      Math.min(5, 1 + Math.floor(s.combo / 5)) *
      (s.feverLeft > 0 ? 2 : 1);
    this.charge(2);
    this.events.broken++;
    this.spark(
      b.x + b.w / 2,
      b.y + b.h / 2,
      b.kind === "bomb" ? "bomb" : "hit",
    );
    if (b.kind === "switch") {
      s.open = true;
      s.revision++;
    }
    if (b.kind === "core") s.coreCleared = true;
    if (b.kind === "bomb") {
      this.events.bomb++;
      // Mark dead before recursion; a bomb and its neighbours can score only once.
      for (const other of s.stage.bricks)
        if (other.hp > 0 && Math.hypot(other.x - b.x, other.y - b.y) <= 111)
          this.damage(other, 3);
    }
  }
  private moveBall(ball: Ball) {
    const s = this.state;
    ball.age += STEP;
    if (ball.age > MAX_SHOT_SECONDS) {
      ball.active = false;
      return;
    }
    ball.vy += GRAVITY * STEP;
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > 1050) {
      ball.vx *= 1050 / speed;
      ball.vy *= 1050 / speed;
    }
    ball.contacts = ball.contacts.filter((id) => {
      const b = s.stage.bricks[id - 1];
      return (
        !!b &&
        b.hp > 0 &&
        ball.x >= b.x - RADIUS - 0.1 &&
        ball.x <= b.x + b.w + RADIUS + 0.1 &&
        ball.y >= b.y - RADIUS - 0.1 &&
        ball.y <= b.y + b.h + RADIUS + 0.1
      );
    });
    let left = STEP;
    for (let iteration = 0; iteration < 10 && left > 1e-7; iteration++) {
      const dx = ball.vx * left,
        dy = ball.vy * left;
      let best: Hit | null = null,
        chosen: Collider | null = null;
      const accept = (hit: Hit | null, c: Collider | null) => {
        if (hit && (!best || hit.t < best.t)) {
          best = hit;
          chosen = c;
        }
      };
      if (dx < 0) {
        const t = (RADIUS - ball.x) / dx;
        if (t >= 0 && t <= 1) accept({ t, nx: 1, ny: 0, push: 0.002 }, null);
      }
      if (dx > 0) {
        const t = (WIDTH - RADIUS - ball.x) / dx;
        if (t >= 0 && t <= 1) accept({ t, nx: -1, ny: 0, push: 0.002 }, null);
      }
      if (dy < 0) {
        const t = (RADIUS - ball.y) / dy;
        if (t >= 0 && t <= 1) accept({ t, nx: 0, ny: 1, push: 0.002 }, null);
      }
      for (const index of this.grid.query(ball.x, ball.y, dx, dy, RADIUS)) {
        const c = this.grid.colliders[index];
        if (c.kind === "brick") {
          const b = s.stage.bricks[c.index];
          if (b.hp > 0) accept(sweepRect(ball.x, ball.y, dx, dy, b, RADIUS), c);
        } else if (c.kind === "wall") {
          const w = s.stage.walls[c.index];
          if (!w.door || !s.open)
            accept(sweepRect(ball.x, ball.y, dx, dy, w, RADIUS), c);
        } else {
          const b = s.stage.bumpers[c.index];
          accept(
            sweepCircle(ball.x, ball.y, dx, dy, b.x, b.y, b.r + RADIUS),
            c,
          );
        }
      }
      // TS does not track writes made through the accept closure.
      const hit = best as Hit | null,
        collider = chosen as Collider | null;
      const fraction = hit ? clamp(hit.t, 0, 1) : 1;
      const oldX = ball.x,
        oldY = ball.y;
      ball.x += dx * fraction;
      ball.y += dy * fraction;
      this.crossGates(ball, oldX, oldY, ball.x, ball.y);
      if (!hit) {
        left = 0;
        break;
      }
      ball.x += hit.nx * hit.push;
      ball.y += hit.ny * hit.push;
      const dot = ball.vx * hit.nx + ball.vy * hit.ny;
      if (dot < 0) {
        ball.vx -= 2 * dot * hit.nx;
        ball.vy -= 2 * dot * hit.ny;
      }
      if (collider?.kind === "brick") {
        const b = s.stage.bricks[collider.index];
        if (!ball.contacts.includes(b.id)) {
          ball.contacts.push(b.id);
          this.damage(b);
        }
      } else if (collider?.kind === "bumper") {
        this.events.bumper++;
        this.spark(ball.x, ball.y, "hit");
      }
      left *= 1 - fraction;
      if (fraction < 1e-6) left = Math.max(0, left - STEP * 0.02);
    }
    ball.x = clamp(ball.x, RADIUS, WIDTH - RADIUS);
    if (
      ball.y > HEIGHT + RADIUS ||
      !Number.isFinite(ball.x + ball.y + ball.vx + ball.vy)
    )
      ball.active = false;
  }
  private crossGates(
    ball: Ball,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ) {
    const s = this.state;
    for (const gate of s.stage.gates) {
      const mask = 1 << gate.id;
      if (ball.gates & mask || Math.abs(y1 - y0) < 1e-8) continue;
      const t = (gate.y - y0) / (y1 - y0);
      if (t < 0 || t > 1) continue;
      const x = x0 + (x1 - x0) * t,
        gx = gateX(gate, s.time - STEP + STEP * t);
      if (x < gx || x > gx + gate.w) continue;
      ball.gates |= mask;
      if (!(this.gateFlags & mask)) {
        this.gateFlags |= mask;
        this.events.gate++;
        this.spark(x, gate.y, "gate");
      }
      const originalVx = ball.vx,
        originalVy = ball.vy;
      for (let i = 1; i < gate.factor; i++) {
        const angle = (i % 2 ? 1 : -1) * (0.025 + 0.035 * Math.ceil(i / 2));
        const vx = originalVx * Math.cos(angle) - originalVy * Math.sin(angle),
          vy = originalVx * Math.sin(angle) + originalVy * Math.cos(angle);
        const child = this.spawn(
          x,
          gate.y + (y1 > y0 ? 1 : -1) * 0.02,
          vx,
          vy,
          ball.gates,
        );
        if (!child) break;
      }
    }
  }
  private step() {
    const s = this.state;
    s.time += STEP;
    if (s.feverLeft > 0) {
      s.feverLeft = Math.max(0, s.feverLeft - STEP);
      if (s.feverLeft === 0) this.events.feverEnd = true;
    }
    s.comboLeft = Math.max(0, s.comboLeft - STEP);
    if (!s.comboLeft) s.combo = 0;
    for (const p of s.sparks) p.age += STEP;
    s.sparks = s.sparks.filter((p) => p.age < 0.45);
    if (s.phase === "firing") {
      this.spawn(
        LAUNCH.x,
        LAUNCH.y,
        Math.sin(s.angle) * SHOT_SPEED,
        -Math.cos(s.angle) * SHOT_SPEED,
      );
      s.phase = "simulating";
    }
    if (s.phase === "simulating") {
      s.shotTime += STEP;
      // Capture IDs, not just array length: descendants begin on the next fixed step.
      const lastId = this.id;
      for (const b of s.balls) if (b.active && b.id <= lastId) this.moveBall(b);
      if (s.shotTime >= MAX_SHOT_SECONDS)
        for (const b of s.balls) b.active = false;
      if (!this.activeBalls) {
        s.phase = "resolving";
        this.resolveLeft = 0.18;
      }
    } else if (s.phase === "resolving") {
      this.resolveLeft -= STEP;
      if (this.resolveLeft <= 0) {
        s.shotsResolved++;
        if (s.remaining === 0 && (!s.stage.feverCore || s.coreCleared)) {
          s.phase = "stage_clear";
          s.stars =
            s.used <= s.stage.stars[0] ? 3 : s.used <= s.stage.stars[1] ? 2 : 1;
          s.score += Math.max(0, this.shotsLeft) * 250;
          this.events.clear = true;
        } else if (this.shotsLeft <= 0) {
          s.phase = "game_over";
          this.events.over = true;
        } else s.phase = "ready";
      }
    }
  }
  fork() {
    const next = new CascadeEngine(this.state.stage, this.state.mode);
    next.state = {
      ...this.state,
      stage: {
        ...next.state.stage,
        bricks: this.state.stage.bricks.map((b) => ({ ...b })),
      },
      balls: this.state.balls.map((b) => ({ ...b, contacts: [...b.contacts] })),
      sparks: this.state.sparks.map((p) => ({ ...p })),
    };
    next.accumulator = this.accumulator;
    next.resumePhase = this.resumePhase;
    next.id = this.id;
    next.sparkId = this.sparkId;
    next.resolveLeft = this.resolveLeft;
    next.gateFlags = this.gateFlags;
    next.events = { ...this.events };
    return next;
  }
  restart() {
    return new CascadeEngine(
      this.state.mode === "endless"
        ? endlessStage(this.state.stage.id)
        : this.state.stage,
      this.state.mode,
    );
  }
}
