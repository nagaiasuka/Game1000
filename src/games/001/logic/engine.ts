import { BoardGesture } from "./gestures.ts";
import {
  cells,
  emptyBoard,
  fits,
  fullRows,
  ghost,
  removeRows,
  rotated,
  shuffleBag,
  spawn,
  type Board,
  type Kind,
  type Piece,
} from "./pieces.ts";
export const STEP = 1000 / 60;
export const LOCK_MS = 450;
export const CLEAR_MS = 180;
export const COUNTDOWN_MS = 3300;
export const REPEAT_DELAY = 170;
export const REPEAT_MS = 65;
export const SOFT_MS = 35;
export type Phase =
  "ready" | "countdown" | "playing" | "clearing" | "paused" | "gameover";
export type Action = "left" | "right" | "soft" | "rotate" | "drop";
export type HeldAction = "left" | "right" | "soft";
export type GameEvent =
  "drop" | "lock" | "clear" | "four" | "level" | "over" | "scored";
export type State = {
  board: Board;
  active: Piece | null;
  queue: Kind[];
  dropCharge: number;
  score: number;
  lines: number;
  level: number;
  phase: Phase;
  countdown: number;
  clearingRows: number[];
  clearRemaining: number;
  elapsed: number;
};
export const speed = (level: number) =>
  Math.max(75, 850 * Math.pow(0.8, level - 1));
export const lineScore = (count: number, level: number) =>
  ([0, 100, 300, 500, 800][count] ?? 0) * level;
export function initialState(): State {
  return {
    board: emptyBoard(),
    active: null,
    queue: [],
    dropCharge: 0,
    score: 0,
    lines: 0,
    level: 1,
    phase: "ready",
    countdown: 3,
    clearingRows: [],
    clearRemaining: 0,
    elapsed: 0,
  };
}
/** No React/native dependencies. All timing and held input use the same fixed-step clock. */
export class BlockDropEngine {
  state = initialState();
  revision = 0;
  private events: GameEvent[] = [];
  private remainder = 0;
  private gravity = 0;
  private lockTime = 0;
  private lockResets = 0;
  private countdownTime = COUNTDOWN_MS;
  private previousPhase: Phase = "playing";
  private gesture = new BoardGesture();
  private held = new Map<HeldAction, number>();
  private random: () => number;
  constructor(random: () => number = Math.random) {
    this.random = random;
  }
  snapshot(): State {
    return { ...this.state, queue: [...this.state.queue] };
  }
  drainEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }
  private changed() {
    this.revision++;
  }
  start() {
    this.state = initialState();
    this.state.phase = "countdown";
    this.countdownTime = COUNTDOWN_MS;
    this.remainder = 0;
    this.events = [];
    this.releaseAll();
    this.refill();
    this.spawnNext();
    this.changed();
  }
  private refill() {
    while (this.state.queue.length < 7)
      this.state.queue.push(...shuffleBag(this.random));
  }
  private activate(kind: Kind) {
    this.state.active = spawn(kind);
    this.gravity = 0;
    this.lockTime = 0;
    this.lockResets = 0;
    if (!fits(this.state.board, this.state.active)) this.gameOver();
    this.changed();
  }
  private spawnNext() {
    this.refill();
    this.activate(this.state.queue.shift()!);
    this.refill();
  }
  private gameOver() {
    this.state.phase = "gameover";
    this.releaseAll();
    this.events.push("over");
    this.changed();
  }
  pause() {
    if (!["playing", "countdown", "clearing"].includes(this.state.phase))
      return;
    this.previousPhase = this.state.phase;
    this.state.phase = "paused";
    this.releaseAll();
    this.remainder = 0;
    this.changed();
  }
  resume() {
    if (this.state.phase === "paused") {
      this.state.phase = this.previousPhase;
      this.remainder = 0;
      this.changed();
    }
  }
  release(action: HeldAction) {
    this.held.delete(action);
  }
  releaseAll() {
    this.held.clear();
    this.touchCancel();
  }
  touchStart(cellSize: number) {
    if (this.state.phase === "playing") this.gesture.begin(cellSize);
  }
  touchMove(dx: number, dy: number, touches = 1) {
    if (this.state.phase !== "playing") return;
    for (const action of this.gesture.move(dx, dy, touches)) this.input(action);
    this.syncCharge();
  }
  touchEnd() {
    const action = this.gesture.end();
    if (action) this.input(action);
    this.syncCharge();
  }
  touchCancel() {
    this.gesture.cancel();
    this.syncCharge();
  }
  private syncCharge() {
    const progress = Math.floor(this.gesture.progress * 20) / 20;
    if (this.state.dropCharge !== progress) {
      this.state.dropCharge = progress;
      this.changed();
    }
  }
  press(action: HeldAction) {
    if (this.state.phase !== "playing" || this.held.has(action)) return;
    if (action === "left") this.held.delete("right");
    if (action === "right") this.held.delete("left");
    this.input(action);
    this.held.set(action, action === "soft" ? SOFT_MS : REPEAT_DELAY);
  }
  input(action: Action) {
    const s = this.state;
    if (s.phase !== "playing" || !s.active) return;
    if (action === "drop") {
      const landing = ghost(s.board, s.active);
      s.score += (landing.y - s.active.y) * 2;
      s.active = landing;
      this.events.push("drop");
      this.lock();
    } else if (action === "soft") {
      if (this.move(0, 1, false)) s.score++;
    } else if (action === "rotate") {
      const next = rotated(s.board, s.active);
      if (next) this.adjust(next);
    } else this.move(action === "left" ? -1 : 1, 0, true);
    this.changed();
  }
  private grounded() {
    const s = this.state;
    return !!s.active && !fits(s.board, { ...s.active, y: s.active.y + 1 });
  }
  private adjust(piece: Piece) {
    if (this.grounded() && this.lockResets < 15) {
      this.lockTime = 0;
      this.lockResets++;
    }
    this.state.active = piece;
    this.changed();
  }
  private move(x: number, y: number, adjust: boolean) {
    const s = this.state;
    if (!s.active) return false;
    const next = { ...s.active, x: s.active.x + x, y: s.active.y + y };
    if (!fits(s.board, next)) return false;
    if (adjust) this.adjust(next);
    else {
      s.active = next;
      this.changed();
    }
    return true;
  }
  private lock() {
    const s = this.state;
    if (!s.active) return;
    const blocks = cells(s.active);
    if (blocks.some((p) => p.y < 0)) {
      this.gameOver();
      return;
    }
    s.board = s.board.map((row) => [...row]);
    for (const { x, y } of blocks) s.board[y][x] = s.active.kind;
    s.active = null;
    this.releaseAll();
    this.events.push("lock");
    s.clearingRows = fullRows(s.board);
    if (s.clearingRows.length) {
      s.phase = "clearing";
      s.clearRemaining = CLEAR_MS;
      this.events.push(s.clearingRows.length === 4 ? "four" : "clear");
    } else this.spawnNext();
    this.changed();
  }
  advance(ms: number) {
    if (
      !Number.isFinite(ms) ||
      ms <= 0 ||
      ["ready", "paused", "gameover"].includes(this.state.phase)
    )
      return;
    // A suspended JS thread must never silently catch up a whole game.
    if (ms > 1000) {
      this.pause();
      return;
    }
    this.remainder += ms;
    while (this.remainder + 0.00001 >= STEP) {
      this.remainder -= STEP;
      this.tick(STEP);
    }
  }
  private tick(dt: number) {
    const s = this.state;
    if (s.phase === "countdown") {
      this.countdownTime -= dt;
      const count = Math.max(
        0,
        Math.ceil((this.countdownTime - 300 - 0.00001) / 1000),
      );
      if (s.countdown !== count) {
        s.countdown = count;
        this.changed();
      }
      if (this.countdownTime <= 0.001) {
        s.phase = "playing";
        this.changed();
      }
      return;
    }
    if (s.phase === "clearing") {
      s.elapsed += dt;
      s.clearRemaining -= dt;
      this.changed();
      if (s.clearRemaining <= 0.001) {
        const count = s.clearingRows.length;
        s.score += lineScore(count, s.level);
        this.events.push("scored");
        s.lines += count;
        const level = 1 + Math.floor(s.lines / 10);
        if (level > s.level) this.events.push("level");
        s.level = level;
        s.board = removeRows(s.board, s.clearingRows);
        s.clearingRows = [];
        s.phase = "playing";
        this.spawnNext();
      }
      return;
    }
    if (s.phase !== "playing") return;
    s.elapsed += dt;
    const gestureAction = this.gesture.advance(dt);
    this.syncCharge();
    if (gestureAction) {
      this.input(gestureAction);
      return;
    }
    for (const [action, remaining] of this.held) {
      let next = remaining - dt;
      if (next <= 0) {
        this.input(action);
        next += action === "soft" ? SOFT_MS : REPEAT_MS;
      }
      this.held.set(action, next);
    }
    this.gravity += dt;
    if (this.gravity >= speed(s.level)) {
      this.gravity -= speed(s.level);
      this.move(0, 1, false);
    }
    if (this.grounded()) {
      this.lockTime += dt;
      if (this.lockTime >= LOCK_MS) this.lock();
    } else this.lockTime = 0;
  }
}
