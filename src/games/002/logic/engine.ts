import {
  STAGES,
  buildStage,
  buildIncomingRow,
  growthFloor,
  BRICK_HEIGHT,
  type Brick,
} from "../stages.ts";
import {
  WIDTH,
  HEIGHT,
  RADIUS,
  PADDLE_BOTTOM,
  PADDLE_WIDTH,
  WIDE_PADDLE_WIDTH,
  MAX_SPEED,
  clamp,
  inside,
  sweep,
  paddleBounce,
} from "./physics.ts";

export const STEP = 1000 / 120;
export type Phase =
  "select" | "ready" | "playing" | "paused" | "clear" | "complete" | "over";
export type ItemKind = "multi" | "wide" | "power";
export type Ball = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
  contacts: number[];
};
export type Item = { id: number; x: number; y: number; kind: ItemKind };
export type Spark = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: number;
};
export type Popup = {
  id: number;
  x: number;
  y: number;
  value: number;
  life: number;
};
export type GameEvent =
  | "hit"
  | "break"
  | "combo"
  | "fever"
  | "item"
  | "miss"
  | "clear"
  | "over"
  | "start"
  | "feverEnd"
  | "multi"
  | "wide"
  | "power";
export type BreakState = {
  height: number;
  rowsLeft: number;
  incomingIn: number;
  rowSlide: number;
  practice: boolean;
  phase: Phase;
  stage: number;
  score: number;
  lives: number;
  combo: number;
  maxCombo: number;
  stageMaxCombo: number;
  comboLeft: number;
  fever: number;
  feverLeft: number;
  wideLeft: number;
  powerLeft: number;
  stageTime: number;
  readyLeft: number;
  flash: number;
  notice: string;
  noticeLeft: number;
  paddle: number;
  target: number;
  bricks: Brick[];
  balls: Ball[];
  items: Item[];
  sparks: Spark[];
  popups: Popup[];
  highest: number;
  cleared: number[];
  clearBonus: number;
  lifeBonus: number;
};
const initial = (): BreakState => ({
  height: HEIGHT,
  rowsLeft: 0,
  incomingIn: -1,
  rowSlide: 0,
  practice: false,
  phase: "select",
  stage: 0,
  score: 0,
  lives: 3,
  combo: 0,
  maxCombo: 0,
  stageMaxCombo: 0,
  comboLeft: 0,
  fever: 0,
  feverLeft: 0,
  wideLeft: 0,
  powerLeft: 0,
  stageTime: 0,
  readyLeft: 0,
  flash: 0,
  notice: "",
  noticeLeft: 0,
  paddle: WIDTH / 2,
  target: WIDTH / 2,
  bricks: [],
  balls: [],
  items: [],
  sparks: [],
  popups: [],
  highest: 1,
  cleared: [],
  clearBonus: 0,
  lifeBonus: 0,
});

export class BlockBreakEngine {
  state = initial();
  private savedPhase: Phase = "ready";
  private accumulator = 0;
  private id = 0;
  private ticks = 0;
  private bottomRow = 0;
  private events = new Set<GameEvent>();
  private checkpoint = { score: 0, lives: 3, maxCombo: 0 };
  private random: () => number;
  constructor(random: () => number = Math.random) {
    this.random = random;
  }
  get paddleWidth() {
    return this.state.wideLeft > 0 ? WIDE_PADDLE_WIDTH : PADDLE_WIDTH;
  }
  get paddleY() {
    return this.state.height - PADDLE_BOTTOM;
  }
  resize(height: number) {
    if (
      !Number.isFinite(height) ||
      height < 360 ||
      Math.abs(height - this.state.height) < 0.1
    )
      return;
    const s = this.state;
    const oldPaddle = this.paddleY;
    this.pause();
    s.height = height;
    // Preserve positions around the bricks, remap the open space below them.
    const remap = (y: number) =>
      y <= 240
        ? y
        : 240 + ((y - 240) * (this.paddleY - 240)) / (oldPaddle - 240);
    for (const ball of s.balls) {
      ball.y =
        ball.vx === 0 && ball.vy === 0
          ? this.paddleY - RADIUS - 1
          : remap(ball.y);
      ball.trail = [];
    }
    for (const item of s.items) item.y = remap(item.y);
    this.cancelInput();
  }
  snapshot(): BreakState {
    const s = this.state;
    return {
      ...s,
      balls: s.balls.map((b) => ({ ...b, trail: [...b.trail] })),
      items: s.items.map((i) => ({ ...i })),
      sparks: s.sparks.map((p) => ({ ...p })),
      popups: s.popups.map((p) => ({ ...p })),
    };
  }
  drainEvents() {
    const events = [...this.events];
    this.events.clear();
    return events;
  }
  restore(highest: number, cleared: number[]) {
    this.state.highest = clamp(Math.floor(highest), 1, STAGES.length);
    this.state.cleared = [...cleared];
  }
  start(stage = 0, practice = false) {
    if (
      !Number.isInteger(stage) ||
      stage < 0 ||
      (!practice && stage >= this.state.highest) ||
      stage >= STAGES.length
    )
      return;
    const { highest, cleared, height } = this.state;
    this.state = { ...initial(), highest, cleared, height, practice };
    this.events.clear();
    this.loadStage(stage);
  }
  private loadStage(stage: number) {
    const s = this.state;
    s.stage = stage;
    s.bricks = buildStage(stage);
    this.bottomRow = growthFloor(stage);
    s.rowsLeft = STAGES[stage].incomingRows;
    s.incomingIn = -1;
    s.rowSlide = 0;
    s.phase = "ready";
    s.paddle = s.target = WIDTH / 2;
    s.stageTime = 0;
    s.stageMaxCombo = 0;
    s.clearBonus = s.lifeBonus = 0;
    s.combo =
      s.comboLeft =
      s.fever =
      s.feverLeft =
      s.wideLeft =
      s.powerLeft =
        0;
    s.items = [];
    s.sparks = [];
    s.popups = [];
    s.notice = "";
    s.noticeLeft = s.flash = 0;
    this.accumulator = 0;
    this.checkpoint = { score: s.score, lives: s.lives, maxCombo: s.maxCombo };
    this.attachBall();
  }
  private attachBall() {
    const s = this.state;
    s.phase = "ready";
    s.readyLeft = 0.45;
    s.balls = [this.ball(s.paddle, this.paddleY - RADIUS - 1, 0, 0)];
    s.target = s.paddle;
  }
  private ball(x: number, y: number, vx: number, vy: number): Ball {
    return { id: ++this.id, x, y, vx, vy, contacts: [], trail: [] };
  }
  launch() {
    const s = this.state;
    if (s.phase !== "ready" || s.readyLeft > 0) return;
    s.phase = "playing";
    this.events.add("start");
    const speed = STAGES[s.stage].speed;
    Object.assign(s.balls[0], {
      vx: speed * 0.3,
      vy: -speed * Math.sqrt(0.91),
    });
  }
  movePaddle(x: number) {
    if (!["playing", "ready"].includes(this.state.phase)) return;
    this.state.target = clamp(
      x,
      this.paddleWidth / 2,
      WIDTH - this.paddleWidth / 2,
    );
  }
  cancelInput() {
    this.state.target = this.state.paddle;
  }
  pause() {
    if (!["playing", "ready"].includes(this.state.phase)) return;
    this.savedPhase = this.state.phase;
    this.state.phase = "paused";
    this.accumulator = 0;
    this.cancelInput();
  }
  resume() {
    if (this.state.phase === "paused") {
      this.state.phase = this.savedPhase;
      this.accumulator = 0;
    }
  }
  restartStage() {
    if (this.state.phase !== "paused") return;
    Object.assign(this.state, this.checkpoint);
    this.loadStage(this.state.stage);
  }
  nextStage() {
    if (this.state.phase === "clear") this.loadStage(this.state.stage + 1);
  }
  select() {
    this.state.phase = "select";
    this.accumulator = 0;
    this.cancelInput();
  }
  advance(ms: number) {
    if (
      !Number.isFinite(ms) ||
      ms < 0 ||
      !["playing", "ready"].includes(this.state.phase)
    )
      return;
    if (ms > 250) {
      this.pause();
      return;
    }
    this.accumulator += ms;
    while (this.accumulator + 1e-7 >= STEP) {
      this.accumulator -= STEP;
      this.tick(STEP / 1000);
      if (!["playing", "ready"].includes(this.state.phase)) {
        this.accumulator = 0;
        break;
      }
    }
  }
  private tick(dt: number) {
    const s = this.state;
    s.paddle += (s.target - s.paddle) * Math.min(1, dt * 24);
    s.paddle = clamp(
      s.paddle,
      this.paddleWidth / 2,
      WIDTH - this.paddleWidth / 2,
    );
    if (s.phase === "ready") {
      s.readyLeft = Math.max(0, s.readyLeft - dt);
      s.balls[0].x = s.paddle;
      return;
    }
    const wasFever = s.feverLeft > 0;
    s.stageTime += dt;
    s.rowSlide = Math.max(0, s.rowSlide - dt * 80);
    this.updateRows(dt);
    for (const key of [
      "comboLeft",
      "feverLeft",
      "wideLeft",
      "powerLeft",
      "flash",
      "noticeLeft",
    ] as const)
      s[key] = Math.max(0, s[key] - dt);
    if (wasFever && s.feverLeft === 0) this.events.add("feverEnd");
    if (s.comboLeft === 0) s.combo = 0;
    s.sparks = s.sparks.filter((p) => (p.life -= dt) > 0);
    for (const p of s.sparks) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += dt * 120;
    }
    s.popups = s.popups.filter((p) => (p.life -= dt) > 0);
    for (const p of s.popups) p.y -= 25 * dt;
    for (const b of s.balls) {
      this.moveBall(b, dt);
      if (++this.ticks % 3 === 0) {
        b.trail.unshift({ x: b.x, y: b.y });
        b.trail.length = Math.min(6, b.trail.length);
      }
      if (s.phase !== "playing") return;
    }
    s.balls = s.balls.filter((b) => b.y < s.height + RADIUS);
    if (!s.balls.length) {
      this.miss();
      return;
    }
    for (const item of s.items) {
      const oldY = item.y;
      item.y += dt * 125;
      if (
        oldY <= this.paddleY + 12 &&
        item.y + 9 >= this.paddleY &&
        Math.abs(item.x - s.paddle) <= this.paddleWidth / 2 + 9
      ) {
        this.collect(item.kind);
        item.y = s.height + 30;
      }
    }
    s.items = s.items.filter((i) => i.y < s.height + 15);
  }
  private moveBall(ball: Ball, dt: number) {
    const s = this.state;
    ball.contacts = ball.contacts.filter((id) => {
      const b = s.bricks.find((b) => b.id === id);
      return b && inside(ball.x, ball.y, b, RADIUS + 0.1);
    });
    let remaining = dt;
    for (let pass = 0; pass < 8 && remaining > 1e-7; pass++) {
      const dx = ball.vx * remaining,
        dy = ball.vy * remaining;
      let best: {
        time: number;
        nx: number;
        ny: number;
        brick?: Brick;
        paddle?: boolean;
      } | null = null;
      const candidate = (hit: NonNullable<typeof best>) => {
        if (hit.time >= 0 && hit.time <= 1 && (!best || hit.time < best.time))
          best = hit;
      };
      if (dx < 0) candidate({ time: (RADIUS - ball.x) / dx, nx: 1, ny: 0 });
      if (dx > 0)
        candidate({ time: (WIDTH - RADIUS - ball.x) / dx, nx: -1, ny: 0 });
      if (dy < 0) candidate({ time: (RADIUS - ball.y) / dy, nx: 0, ny: 1 });
      if (dy > 0 && ball.y <= this.paddleY - RADIUS + 0.01) {
        const time = (this.paddleY - RADIUS - ball.y) / dy;
        if (
          Math.abs(ball.x + dx * time - s.paddle) <=
          this.paddleWidth / 2 + RADIUS
        )
          candidate({ time, nx: 0, ny: -1, paddle: true });
      }
      for (const brick of s.bricks) {
        if (ball.contacts.includes(brick.id)) continue;
        const hit = sweep(ball.x, ball.y, dx, dy, brick);
        if (hit) candidate({ ...hit, brick });
      }
      // TS cannot observe assignments made inside candidate().
      const hit = best as {
        time: number;
        nx: number;
        ny: number;
        brick?: Brick;
        paddle?: boolean;
      } | null;
      if (!hit) {
        ball.x += dx;
        ball.y += dy;
        break;
      }
      ball.x += dx * hit.time;
      ball.y += dy * hit.time;
      remaining *= 1 - hit.time;
      const piercing = !!hit.brick && hit.brick.hp > 0 && s.powerLeft > 0;
      if (hit.brick) {
        ball.contacts.push(hit.brick.id);
        this.damage(hit.brick);
        if (s.phase !== "playing") return;
      }
      if (hit.paddle) {
        Object.assign(
          ball,
          paddleBounce(
            ball.x,
            s.paddle,
            this.paddleWidth,
            Math.min(MAX_SPEED, Math.hypot(ball.vx, ball.vy) + 2),
          ),
        );
      } else if (!piercing) {
        if (hit.nx) ball.vx *= -1;
        if (hit.ny) ball.vy *= -1;
      }
      ball.x += Math.sign(ball.vx) * 0.01;
      ball.y += Math.sign(ball.vy) * 0.01;
    }
  }
  private damage(brick: Brick) {
    const s = this.state;
    if (brick.hp < 0) {
      this.events.add("hit");
      return;
    }
    s.bricks = s.bricks
      .map((b) => (b.id === brick.id ? { ...b, hp: b.hp - 1 } : b))
      .filter((b) => b.hp !== 0);
    if (brick.hp > 1) {
      this.events.add("hit");
      this.burst(brick.x + brick.w / 2, brick.y + brick.h / 2, 3, brick.row);
      return;
    }
    s.combo++;
    s.comboLeft = 4.5;
    s.maxCombo = Math.max(s.maxCombo, s.combo);
    s.stageMaxCombo = Math.max(s.stageMaxCombo, s.combo);
    const multiplier = Math.min(5, 1 + Math.floor(s.combo / 5));
    const points =
      (100 + (brick.maxHp - 1) * 50) * multiplier * (s.feverLeft > 0 ? 2 : 1);
    s.score += points;
    s.flash = Math.min(0.2, 0.05 + s.combo * 0.003);
    s.popups = [
      ...s.popups.slice(-7),
      { id: ++this.id, x: brick.x, y: brick.y, value: points, life: 0.65 },
    ];
    this.burst(
      brick.x + brick.w / 2,
      brick.y + brick.h / 2,
      s.feverLeft > 0 ? 12 : s.combo >= 5 ? 8 : 5,
      brick.row,
    );
    this.events.add("break");
    if (s.combo % 5 === 0) {
      this.notice(`${s.combo} COMBO${s.combo >= 20 ? "!!" : "!"}`);
      this.events.add("combo");
    }
    if (s.feverLeft === 0) {
      s.fever += STAGES[s.stage].feverGain;
      if (s.fever >= 100) {
        s.fever = 0;
        s.feverLeft = 8;
        this.notice("FEVER ×2 SCORE");
        this.events.add("fever");
      }
    }
    if (this.random() < 0.09 && s.items.length < 6) {
      const kind = (["multi", "wide", "power"] as const)[
        Math.min(2, Math.floor(this.random() * 3))
      ];
      s.items.push({
        id: ++this.id,
        x: brick.x + brick.w / 2,
        y: brick.y + brick.h / 2,
        kind,
      });
    }
    if (s.rowsLeft === 0 && s.bricks.every((b) => b.hp < 0)) this.clear();
  }
  private updateRows(dt: number) {
    const s = this.state;
    if (s.rowsLeft === 0) return;
    if (s.bricks.some((b) => b.hp > 0 && b.row === this.bottomRow)) return;
    if (s.incomingIn < 0) {
      s.incomingIn = 0.65;
      this.notice("NEXT ROW ↓");
    }
    s.incomingIn = Math.max(0, s.incomingIn - dt);
    if (s.incomingIn > 0) return;
    const wave = STAGES[s.stage].incomingRows - s.rowsLeft + 1;
    const next = [
      ...s.bricks.map((b) =>
        b.hp < 0 ? b : { ...b, row: b.row + 1, y: b.y + BRICK_HEIGHT },
      ),
      ...buildIncomingRow(s.stage, wave),
    ];
    // Wait until the descending row cannot spawn on a ball. Steel stays fixed.
    if (
      s.balls.some((ball) =>
        next.some((b) => b.hp > 0 && inside(ball.x, ball.y, b, RADIUS + 2)),
      )
    )
      return;
    s.bricks = next;
    s.rowsLeft--;
    s.incomingIn = -1;
    s.rowSlide = BRICK_HEIGHT;
    this.notice(
      s.rowsLeft === 0 ? "FINAL ROW!" : `ROW ADDED · ${s.rowsLeft} LEFT`,
    );
  }
  private burst(x: number, y: number, count: number, color: number) {
    const sparks = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      return {
        id: ++this.id,
        x,
        y,
        vx: Math.cos(angle) * 85,
        vy: Math.sin(angle) * 85,
        life: 0.45,
        color,
      };
    });
    this.state.sparks = [...this.state.sparks, ...sparks].slice(-48);
  }
  private notice(text: string) {
    this.state.notice = text;
    this.state.noticeLeft = 1.5;
  }
  private collect(kind: ItemKind) {
    const s = this.state;
    this.events.add("item");
    this.events.add(kind);
    if (kind === "wide") {
      s.wideLeft = 12;
      this.notice("WIDE PADDLE");
    }
    if (kind === "power") {
      s.powerLeft = 8;
      this.notice("POWER BALL");
    }
    if (kind === "multi") {
      const source = s.balls[0];
      if (source)
        for (const angle of [-0.5, 0.5]) {
          if (s.balls.length >= 3) break;
          const speed = Math.min(MAX_SPEED, Math.hypot(source.vx, source.vy));
          const vx = clamp(
            source.vx * Math.cos(angle) - source.vy * Math.sin(angle),
            -speed * 0.85,
            speed * 0.85,
          );
          s.balls.push(
            this.ball(
              source.x,
              source.y,
              vx,
              -Math.sqrt(speed * speed - vx * vx),
            ),
          );
        }
      this.notice("MULTI BALL ×3");
    }
  }
  private miss() {
    const s = this.state;
    s.lives--;
    s.combo =
      s.comboLeft =
      s.fever =
      s.feverLeft =
      s.wideLeft =
      s.powerLeft =
        0;
    s.items = [];
    s.sparks = [];
    s.popups = [];
    this.events.add("miss");
    if (s.lives <= 0) {
      s.phase = "over";
      this.events.add("over");
    } else {
      this.attachBall();
      this.notice("MISS · TRY AGAIN");
    }
  }
  private clear() {
    const s = this.state;
    s.clearBonus = (s.stage + 1) * 500;
    s.lifeBonus = s.lives * 250;
    s.score += s.clearBonus + s.lifeBonus;
    if (!s.practice) {
      s.highest = Math.max(s.highest, Math.min(STAGES.length, s.stage + 2));
      s.cleared = [...new Set([...s.cleared, s.stage + 1])];
    }
    s.phase = s.stage === STAGES.length - 1 ? "complete" : "clear";
    s.items = [];
    s.flash = 0.2;
    this.burst(WIDTH / 2, 250, s.phase === "complete" ? 48 : 24, 2);
    this.events.add("clear");
  }
}
