export const WIDTH = 360,
  HEIGHT = 600,
  RADIUS = 5,
  MAX_BALLS = 64;
export const STEP = 1 / 120,
  GRAVITY = 300,
  SHOT_SPEED = 680;
export const LAUNCH = { x: WIDTH / 2, y: HEIGHT - 28 };
export type Phase =
  | "ready"
  | "aiming"
  | "firing"
  | "simulating"
  | "resolving"
  | "stage_clear"
  | "game_over"
  | "paused";
export type BrickKind = "normal" | "armor" | "bomb" | "switch" | "core";
export type Rect = { x: number; y: number; w: number; h: number };
export type Brick = Rect & {
  id: number;
  kind: BrickKind;
  hp: number;
  maxHp: number;
};
export type Wall = Rect & { id: number; door?: boolean };
export type Bumper = { id: number; x: number; y: number; r: number };
export type Gate = {
  id: number;
  x: number;
  y: number;
  w: number;
  factor: number;
  motion?: number;
};
export type Stage = {
  id: number;
  title: string;
  hint: string;
  shots: number;
  stars: readonly [number, number];
  bricks: Brick[];
  walls: Wall[];
  bumpers: Bumper[];
  gates: Gate[];
  feverCore?: boolean;
};
export type Ball = {
  id: number;
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  gates: number;
  contacts: number[];
};
export type Events = {
  hit: number;
  broken: number;
  gate: number;
  bumper: number;
  bomb: number;
  start: boolean;
  fever: boolean;
  feverEnd: boolean;
  clear: boolean;
  over: boolean;
};
export const emptyEvents = (): Events => ({
  hit: 0,
  broken: 0,
  gate: 0,
  bumper: 0,
  bomb: 0,
  start: false,
  fever: false,
  feverEnd: false,
  clear: false,
  over: false,
});
export type Spark = {
  id: number;
  x: number;
  y: number;
  age: number;
  kind: "hit" | "gate" | "bomb";
};
export type State = {
  phase: Phase;
  mode: "stages" | "endless";
  stage: Stage;
  balls: Ball[];
  score: number;
  combo: number;
  maxCombo: number;
  comboLeft: number;
  fever: number;
  feverLeft: number;
  used: number;
  remaining: number;
  time: number;
  shotTime: number;
  angle: number;
  open: boolean;
  coreCleared: boolean;
  peakBalls: number;
  stars: number;
  revision: number;
  sparks: Spark[];
  shotsResolved: number;
};
export const gateX = (gate: Gate, time: number) =>
  gate.x + (gate.motion ? Math.sin(time * 1.35) * gate.motion : 0);
