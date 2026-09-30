import test from "node:test";
import assert from "node:assert/strict";
import {
  SlingEngine,
  WIDTH,
  RADIUS,
  GATE,
  WALL,
  MAX_SPEED,
  STEP,
  aim,
} from "../src/games/005/logic/engine.ts";
import { slingSounds } from "../src/games/005/audio.ts";
import { sceneEffects } from "../src/audio/types.ts";
const playing = (height = 720) => {
  const e = new SlingEngine(height);
  e.state.phase = "playing";
  return e;
};
const advance = (e: SlingEngine, seconds: number) => {
  for (let i = 0; i < Math.round(seconds / STEP); i++) e.advance(STEP);
};
function emptyArea(e: SlingEngine) {
  e.state.pucks.forEach((p, i) => {
    p.x = RADIUS + 20 + (i % 5) * 65;
    p.y = i < 5 ? 80 : 150;
    p.side = 2;
    p.vx = p.vy = 0;
  });
}
test("005 starts with ten free pucks and perfectly mirrored halves", () => {
  for (const height of [420, 720, 1100]) {
    const e = new SlingEngine(height);
    assert.equal(e.state.pucks.length, 10);
    for (let i = 0; i < 5; i++) {
      const a = e.state.pucks[i],
        b = e.state.pucks[i + 5];
      assert.equal(a.x, b.x);
      assert.ok(Math.abs(a.y + b.y - height) < 1e-9);
    }
    assert.deepEqual(e.state.counts, { 1: 5, 2: 5 });
  }
});
test("countdown disables both players then starts them together", () => {
  const e = new SlingEngine();
  e.start();
  const p = e.state.pucks[0];
  assert.equal(e.begin(1, p.x, p.y), false);
  advance(e, 2);
  assert.equal(e.state.phase, "countdown");
  advance(e, 1);
  assert.equal(e.state.phase, "playing");
  assert.ok(e.drainEvents().includes("start"));
});
test("two touch IDs independently aim and release, with one puck per player", () => {
  const e = playing();
  const a = e.state.pucks[0],
    b = e.state.pucks[5];
  assert.equal(e.begin(10, a.x, a.y), true);
  assert.equal(e.begin(20, b.x, b.y), true);
  assert.equal(e.begin(30, e.state.pucks[1].x, e.state.pucks[1].y), false);
  e.move(10, a.x + 20, a.y + 70);
  e.move(20, b.x - 20, b.y - 70);
  const second = { ...e.state.holds[1] };
  e.release(10);
  assert.equal(e.state.holds.length, 1);
  assert.deepEqual(e.state.holds[0], second);
  assert.ok(a.vy < 0);
  assert.equal(b.vy, 0);
  e.release(20);
  assert.equal(e.state.holds.length, 0);
  assert.ok(b.vy > 0);
  assert.ok(Math.abs(a.vy + b.vy) < 1e-9);
});
test("short pull, reverse pull and cancelled touch never fire", () => {
  for (const action of ["short", "reverse", "cancel"]) {
    const e = playing(),
      p = e.state.pucks[0];
    e.begin(1, p.x, p.y);
    e.move(
      1,
      p.x,
      p.y + (action === "short" ? 3 : action === "reverse" ? -80 : 80),
    );
    if (action === "cancel") e.cancel(1);
    e.release(1);
    assert.equal(p.vx, 0);
    assert.equal(p.vy, 0);
    assert.equal(e.state.holds.length, 0);
  }
});
test("power is capped and symmetrically aimed towards the opponent", () => {
  const e = playing(),
    p = e.state.pucks[0];
  e.begin(1, p.x, p.y);
  e.move(1, p.x + 900, p.y + 900);
  assert.ok(aim(e.state.holds[0]).power <= 1);
  e.release(1);
  assert.ok(Math.abs(Math.hypot(p.vx, p.vy) - MAX_SPEED) < 1e-8);
  assert.ok(p.vx < 0 && p.vy < 0);
});
test("moving pucks, transit pucks, reused touch IDs and touches outside field are rejected", () => {
  const e = playing(),
    p = e.state.pucks[0];
  p.vx = 100;
  assert.equal(e.begin(1, p.x, p.y), false);
  p.vx = 0;
  p.x = WIDTH / 2;
  p.y = e.state.height / 2;
  assert.equal(e.begin(1, p.x, p.y), false);
  assert.equal(e.begin(1, -5, 10), false);
  const b = e.state.pucks[5];
  assert.equal(e.begin(2, b.x, b.y), true);
  assert.equal(e.begin(2, b.x, b.y), false);
});
test("cancel one finger does not cancel the other player", () => {
  const e = playing(),
    a = e.state.pucks[0],
    b = e.state.pucks[5];
  e.begin(1, a.x, a.y);
  e.begin(2, b.x, b.y);
  e.cancel(1);
  assert.equal(e.state.holds.length, 1);
  assert.equal(e.state.holds[0].touch, 2);
});
test("central wall reflects a maximum-power shot without tunneling", () => {
  const e = playing(),
    p = e.state.pucks[0];
  p.x = 50;
  p.y = e.state.height / 2 + RADIUS + WALL / 2 + 2;
  p.vy = -MAX_SPEED;
  e.advance(STEP);
  assert.ok(p.vy > 0);
  assert.ok(p.y >= e.state.height / 2 + RADIUS + WALL / 2 - 0.01);
  assert.equal(p.side, 1);
});
test("gate crossing updates allegiance only after the whole puck clears", () => {
  const e = playing(),
    p = e.state.pucks[0];
  p.x = WIDTH / 2;
  p.y = e.state.height / 2 + RADIUS + WALL / 2 + 1;
  p.vy = -350;
  advance(e, 0.06);
  assert.equal(p.side, 1);
  assert.equal(e.state.counts[1], 5);
  assert.equal(e.begin(8, p.x, p.y), false);
  advance(e, 0.1);
  assert.equal(p.side, 2);
  assert.deepEqual(e.state.counts, { 1: 4, 2: 6 });
  assert.ok(e.drainEvents().includes("gate"));
  p.vx = p.vy = 0;
  assert.equal(e.begin(8, p.x, p.y), true);
  assert.equal(e.state.holds[0].player, 2);
});
test("gate shoulders reflect near-edge shots instead of allowing passage through corners", () => {
  const e = playing(),
    p = e.state.pucks[0];
  p.x = (WIDTH - GATE) / 2 + 2;
  p.y = e.state.height / 2 + RADIUS + WALL / 2 + 1;
  p.vy = -800;
  e.advance(STEP);
  assert.ok(p.vy > 0);
  assert.equal(p.side, 1);
});
test("equal-mass collision transfers motion to stationary pucks", () => {
  const e = playing(),
    a = e.state.pucks[0],
    b = e.state.pucks[1];
  Object.assign(a, { x: 110, y: 450, vx: 400, vy: 0 });
  Object.assign(b, { x: 140, y: 450, vx: 0, vy: 0 });
  e.advance(STEP);
  assert.ok(b.vx > 300);
  assert.ok(a.vx < 50);
  assert.ok(e.drainEvents().includes("hit"));
});
test("held pucks remain pinned when hit, while the other puck rebounds", () => {
  const e = playing(),
    a = e.state.pucks[0],
    b = e.state.pucks[1];
  Object.assign(a, { x: 140, y: 450, vx: 0, vy: 0 });
  Object.assign(b, { x: 108, y: 450, vx: 500, vy: 0 });
  assert.ok(e.begin(1, a.x, a.y));
  e.advance(STEP);
  assert.equal(a.x, 140);
  assert.equal(a.y, 450);
  assert.ok(b.vx < 0);
});
test("friction settles motion, outer walls contain every puck", () => {
  const e = playing(),
    p = e.state.pucks[0];
  p.x = RADIUS + 1;
  p.y = 600;
  p.vx = -600;
  e.advance(STEP);
  assert.ok(p.vx > 0);
  advance(e, 20);
  assert.equal(p.vx, 0);
  assert.equal(p.vy, 0);
  for (const p of e.state.pucks) {
    assert.ok(p.x >= RADIUS - 0.01 && p.x <= WIDTH - RADIUS + 0.01);
    assert.ok(p.y >= RADIUS - 0.01 && p.y <= e.state.height - RADIUS + 0.01);
  }
});
test("pause cancels both holds and freezes physics/countdown until resumed", () => {
  const e = playing(),
    a = e.state.pucks[0],
    b = e.state.pucks[5];
  e.begin(1, a.x, a.y);
  e.begin(2, b.x, b.y);
  e.pause();
  assert.equal(e.state.holds.length, 0);
  const before = e.snapshot();
  advance(e, 5);
  assert.deepEqual(e.snapshot(), before);
  e.resume();
  assert.equal(e.state.phase, "playing");
  e.start();
  advance(e, 1);
  e.pause();
  const remaining = e.state.countdown;
  advance(e, 3);
  assert.equal(e.state.countdown, remaining);
  e.resume();
  advance(e, 2);
  assert.equal(e.state.phase, "playing");
});
test("victory waits for gate clearance, then freezes all pucks once and keeps session wins", () => {
  const e = playing();
  emptyArea(e);
  const p = e.state.pucks[9];
  Object.assign(p, { x: WIDTH / 2, y: 360 + 20, vx: 0, vy: -800, side: 1 });
  e.advance(STEP);
  assert.equal(e.state.winner, null);
  advance(e, 0.06);
  assert.equal(e.state.winner, 1);
  assert.equal(e.state.wins[1], 1);
  assert.ok(e.state.pucks.every((p) => p.vx === 0 && p.vy === 0));
  advance(e, 1);
  assert.equal(e.state.wins[1], 1);
  e.start();
  assert.equal(e.state.wins[1], 1);
  assert.deepEqual(e.state.counts, { 1: 5, 2: 5 });
  assert.equal(e.state.winner, null);
});
test("simultaneous opposite crossings do not create a premature victory", () => {
  const e = playing();
  emptyArea(e);
  Object.assign(e.state.pucks[8], { x: 164, y: 340, vx: 0, vy: 800, side: 2 });
  Object.assign(e.state.pucks[9], { x: 196, y: 380, vx: 0, vy: -800, side: 1 });
  advance(e, 0.06);
  assert.equal(e.state.winner, null);
  assert.equal(e.state.counts[1], 1);
  assert.equal(e.state.pucks[8].side, 1);
  assert.equal(e.state.pucks[9].side, 2);
});
test("different render rates give the same fixed-step physics", () => {
  const a = playing(),
    b = playing();
  a.state.pucks[0].vy = b.state.pucks[0].vy = -600;
  for (let i = 0; i < 120; i++) a.advance(1 / 60);
  for (let i = 0; i < 240; i++) b.advance(1 / 120);
  for (let i = 0; i < 10; i++) {
    assert.ok(Math.abs(a.state.pucks[i].x - b.state.pucks[i].x) < 1e-7);
    assert.ok(Math.abs(a.state.pucks[i].y - b.state.pucks[i].y) < 1e-7);
  }
});
test("layout changes preserve symmetry and pause live play without catch-up", () => {
  const e = new SlingEngine();
  e.start();
  e.resize(1000);
  assert.equal(e.state.phase, "countdown");
  for (let i = 0; i < 5; i++)
    assert.equal(e.state.pucks[i].y + e.state.pucks[i + 5].y, 1000);
  advance(e, 3);
  e.resize(700);
  assert.equal(e.state.phase, "paused");
  const before = e.snapshot();
  e.advance(100);
  assert.deepEqual(e.snapshot(), before);
});
test("005 sounds are registered; victory takes priority over collision noise", () => {
  for (const sound of slingSounds([
    "grab",
    "shot",
    "hit",
    "gate",
    "win",
    "start",
    "tick",
  ]))
    assert.ok(sceneEffects["005"].includes(sound));
  assert.deepEqual(slingSounds(["hit", "gate", "win"]), ["slingWin"]);
});
test("seeded high-speed stress stays finite and bounded with capped effects", () => {
  let seed = 5;
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  for (const h of [420, 720, 1100]) {
    const e = playing(h);
    for (let frame = 0; frame < 5000; frame++) {
      if (frame % 120 === 0)
        for (const p of e.state.pucks) {
          const angle = random() * Math.PI * 2;
          p.vx = Math.cos(angle) * MAX_SPEED;
          p.vy = Math.sin(angle) * MAX_SPEED;
        }
      e.advance(STEP);
      e.drainEvents();
      for (const p of e.state.pucks) {
        assert.ok(Number.isFinite(p.x + p.y + p.vx + p.vy));
        assert.ok(p.x >= RADIUS - 0.02 && p.x <= WIDTH - RADIUS + 0.02);
        assert.ok(p.y >= RADIUS - 0.02 && p.y <= h - RADIUS + 0.02);
        assert.ok(Math.hypot(p.vx, p.vy) <= MAX_SPEED + 0.01);
      }
      assert.equal(e.state.counts[1] + e.state.counts[2], 10);
      assert.ok(e.state.sparks.length <= 12);
      if (e.state.winner) {
        e.start();
        e.state.phase = "playing";
      }
    }
  }
});

test("opaque native string identifiers and cancelled releases cannot fire again", () => {
  const e = playing(),
    a = e.state.pucks[0],
    b = e.state.pucks[5];
  e.begin("finger-A", a.x, a.y);
  e.begin("finger-B", b.x, b.y);
  e.move("finger-A", a.x, a.y + 60);
  e.cancel("finger-A");
  e.release("finger-A");
  assert.equal(a.vy, 0);
  assert.equal(e.state.holds[0].touch, "finger-B");
});
test("mirrored trajectories retain equal physics through collisions and friction", () => {
  const a = playing(),
    b = playing();
  for (let i = 0; i < 10; i++) {
    const p = a.state.pucks[i],
      q = b.state.pucks[(i + 5) % 10];
    p.vx = ((i % 3) - 1) * 130;
    p.vy = i < 5 ? -700 : 500;
    q.vx = p.vx;
    q.vy = -p.vy;
  }
  for (let i = 0; i < 240; i++) {
    a.advance(STEP);
    b.advance(STEP);
  }
  for (let i = 0; i < 10; i++) {
    const p = a.state.pucks[i],
      q = b.state.pucks[(i + 5) % 10];
    assert.ok(Math.abs(p.x - q.x) < 0.001);
    assert.ok(Math.abs(p.y + q.y - 720) < 0.001);
  }
});
test("a slow puck cannot get permanently stranded in the ungrabbable gate", () => {
  for (const side of [1, 2] as const) {
    const e = playing(),
      p = e.state.pucks[side === 1 ? 0 : 5];
    Object.assign(p, { x: WIDTH / 2, y: 360, side, vx: 0, vy: 0 });
    advance(e, 1);
    assert.equal(p.side, side === 1 ? 2 : 1);
    assert.ok(Math.abs(p.y - 360) > RADIUS + WALL / 2);
  }
});

test("narrow gate passes centered shots and reflects shots outside the opening", () => {
  const e = playing(),
    p = e.state.pucks[0];
  Object.assign(p, { x: WIDTH / 2, y: 400, vx: 0, vy: -500 });
  advance(e, 0.2);
  assert.equal(p.side, 2);
  assert.ok(p.vy < 0);
  const b = playing(),
    q = b.state.pucks[0];
  Object.assign(q, { x: (WIDTH - GATE) / 2 - 5, y: 380, vx: 0, vy: -500 });
  advance(b, 0.03);
  assert.ok(q.vy > 0);
  assert.equal(q.side, 1);
});
test("launch burst is cosmetic and freezes with gameplay", () => {
  const e = playing(),
    p = e.state.pucks[0];
  e.begin(1, p.x, p.y);
  e.move(1, p.x, p.y + 70);
  e.release(1);
  assert.ok(e.state.sparks.some((s) => s.shot));
  assert.ok(e.drainEvents().includes("shot"));
  e.pause();
  const before = e.snapshot();
  advance(e, 1);
  assert.deepEqual(e.snapshot(), before);
  e.resume();
  advance(e, 0.7);
  assert.ok(!e.state.sparks.some((s) => s.shot));
});
