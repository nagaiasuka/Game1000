import test from "node:test";
import assert from "node:assert/strict";
import {
  BoardGesture,
  LONG_PRESS_MS,
} from "../src/games/001/logic/gestures.ts";
import { BlockDropEngine } from "../src/games/001/logic/engine.ts";
import { spawn } from "../src/games/001/logic/pieces.ts";
function advance(e: BlockDropEngine, ms: number) {
  for (let t = 0; t < ms; t += 10) e.advance(Math.min(10, ms - t));
}
function playing() {
  const e = new BlockDropEngine(() => 0.4);
  e.start();
  advance(e, 3310);
  return e;
}

test("short tap rotates once and small finger jitter does not move the piece", () => {
  const g = new BoardGesture();
  g.begin(20);
  assert.deepEqual(g.move(3, 2), []);
  g.advance(150);
  assert.equal(g.end(), "rotate");
  assert.equal(g.end(), null);
  assert.equal(g.advance(1000), null);
});
test("horizontal drag translates whole cells and responds to reversal", () => {
  const g = new BoardGesture();
  g.begin(20);
  assert.deepEqual(g.move(45, 2), ["right", "right"]);
  assert.deepEqual(g.move(65, 4), ["right"]);
  assert.deepEqual(g.move(20, 3), ["left", "left"]);
  assert.equal(g.end(), null);
});
test("vertical drag soft drops and dragging upward never hard drops or rotates", () => {
  const g = new BoardGesture();
  g.begin(20);
  assert.deepEqual(g.move(2, 65), ["soft", "soft", "soft"]);
  assert.deepEqual(g.move(3, -20), []);
  assert.equal(g.advance(900), null);
  assert.equal(g.end(), null);
});
test("stationary long press drops once, never rotates or drops a second time on release", () => {
  const g = new BoardGesture();
  g.begin(20);
  g.advance(LONG_PRESS_MS - 1);
  assert.ok(g.progress > 0.9);
  assert.equal(g.advance(1), "drop");
  assert.equal(g.advance(1000), null);
  assert.equal(g.end(), null);
  assert.equal(g.progress, 0);
});
test("a drag permanently cancels long press even if the finger returns to its starting point", () => {
  const g = new BoardGesture();
  g.begin(20);
  g.advance(300);
  g.move(12, 0);
  g.move(0, 0);
  assert.equal(g.advance(700), null);
  assert.equal(g.end(), null);
  assert.equal(g.progress, 0);
});
test("multi-touch and responder cancellation discard all pending actions", () => {
  for (const multi of [true, false]) {
    const g = new BoardGesture();
    g.begin(20);
    g.advance(400);
    if (multi) g.move(0, 0, 2);
    else g.cancel();
    assert.equal(g.advance(500), null);
    assert.equal(g.end(), null);
  }
});
test("gesture integration rotates, moves and hard drops the actual engine piece", () => {
  const e = playing();
  e.state.active = spawn("T");
  e.touchStart(20);
  e.touchEnd();
  assert.equal(e.state.active.rotation, 1);
  e.touchStart(20);
  e.touchMove(-40, 0);
  e.touchEnd();
  assert.equal(e.state.active.x, 1);
  e.touchStart(20);
  advance(e, 300);
  assert.ok(e.state.dropCharge > 0.5);
  advance(e, 210);
  assert.equal(e.state.board.flat().filter(Boolean).length, 4);
  const next = { ...e.state.active };
  e.touchEnd();
  assert.deepEqual(e.state.active, next);
});
test("Pause and resume do not resurrect a pending long press", () => {
  const e = playing();
  e.touchStart(20);
  advance(e, 300);
  e.pause();
  e.resume();
  advance(e, 300);
  assert.equal(e.state.board.flat().filter(Boolean).length, 0);
  assert.equal(e.state.dropCharge, 0);
  const active = { ...e.state.active };
  e.touchEnd();
  assert.deepEqual(e.state.active, active);
});
test("natural lock cancels a gesture so the next piece cannot drop or rotate accidentally", () => {
  const e = playing();
  e.state.active = { ...spawn("O"), y: 18 };
  e.touchStart(20);
  advance(e, 700);
  e.touchEnd();
  assert.equal(e.state.board.flat().filter(Boolean).length, 4);
  assert.equal(e.state.active!.y, 0);
  assert.equal(e.state.active!.rotation, 0);
  assert.equal(e.state.dropCharge, 0);
});
test("restarting clears touch state and countdown ignores touches", () => {
  const e = playing();
  e.touchStart(20);
  advance(e, 250);
  e.start();
  e.touchStart(20);
  e.touchMove(100, 0);
  e.touchEnd();
  advance(e, 3400);
  assert.equal(e.state.active!.x, spawn(e.state.active!.kind).x);
  assert.equal(e.state.dropCharge, 0);
  assert.equal(e.state.board.flat().filter(Boolean).length, 0);
});
