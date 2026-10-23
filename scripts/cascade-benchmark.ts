/** Node CPU/memory evidence only. This does not measure native rendering or audio latency. */
import { writeFileSync } from "node:fs";
import { CascadeEngine } from "../src/games/008/logic/engine.ts";
import { STAGES } from "../src/games/008/stages.ts";
import type { Stage } from "../src/games/008/logic/types.ts";
const fixture: Stage = {
  ...STAGES[9],
  title: "64-ball CPU stress fixture",
  bricks: Array.from({ length: 160 }, (_, i) => ({
    id: i + 1,
    x: 11 + (i % 16) * 21,
    y: 24 + Math.floor(i / 16) * 16,
    w: 17,
    h: 10,
    hp: 99999,
    maxHp: 99999,
    kind: "armor",
  })),
  bumpers: [
    { id: 0, x: 100, y: 280, r: 25 },
    { id: 1, x: 260, y: 280, r: 25 },
  ],
};
const gc = () => {
  (globalThis as { gc?: () => void }).gc?.();
};
const report = {
  runtime: process.version,
  platform: `${process.platform}/${process.arch}`,
  scope:
    "Node CPU only; native JS/UI FPS, real-device audio and thermal behaviour not measured",
  colliders: fixture.bricks.length + fixture.bumpers.length,
  framesPerCase: 1800,
  results: [] as {
    balls: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
    maxMs: number;
    meanMs: number;
    heapAfterGcDelta: number;
  }[],
};
for (const count of [1, 16, 32, 64]) {
  const e = new CascadeEngine(fixture);
  e.launch(0);
  for (let i = 0; i < 240 && e.state.peakBalls < 64; i++) e.advance(1000 / 120);
  if (e.state.peakBalls !== 64)
    throw Error("Stress precondition: real six-gate spawn must reach 64");
  const seed = () => {
    e.state.phase = "simulating";
    e.state.shotTime = 0;
    e.state.balls.forEach((b, i) =>
      Object.assign(b, {
        active: i < count,
        x: 30 + (i % 8) * 42,
        y: 230 + Math.floor(i / 8) * 25,
        vx: (i % 2 ? -1 : 1) * (300 + i * 3),
        vy: -350 - (i % 7) * 21,
        age: 0,
        gates: 63,
        contacts: [],
      }),
    );
  };
  seed();
  for (let i = 0; i < 240; i++) {
    if (e.activeBalls !== count || e.state.phase !== "simulating") seed();
    e.advance(1000 / 60);
    e.drainEvents();
  }
  gc();
  const before = process.memoryUsage().heapUsed;
  const values: number[] = [];
  for (let i = 0; i < report.framesPerCase; i++) {
    if (e.activeBalls !== count || e.state.phase !== "simulating") seed();
    const start = performance.now();
    e.advance(1000 / 60);
    values.push(performance.now() - start);
    e.drainEvents();
    if (e.activeBalls > 64 || e.state.sparks.length > 18)
      throw Error("Unbounded resource growth");
  }
  gc();
  const after = process.memoryUsage().heapUsed;
  values.sort((a, b) => a - b);
  const rounded = (n: number) => Number(n.toFixed(4));
  report.results.push({
    balls: count,
    p50Ms: rounded(values[Math.floor(values.length * 0.5)]),
    p95Ms: rounded(values[Math.floor(values.length * 0.95)]),
    p99Ms: rounded(values[Math.floor(values.length * 0.99)]),
    maxMs: rounded(values.at(-1)!),
    meanMs: rounded(values.reduce((a, b) => a + b, 0) / values.length),
    heapAfterGcDelta: after - before,
  });
}
const json = JSON.stringify(report, null, 2) + "\n";
console.log(json);
if (process.argv[2]) writeFileSync(process.argv[2], json);
