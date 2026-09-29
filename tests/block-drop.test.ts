import test from "node:test";
import assert from "node:assert/strict";
import {
  BlockDropEngine,
  CLEAR_MS,
  COUNTDOWN_MS,
  LOCK_MS,
  lineScore,
  speed,
  STEP,
} from "../src/games/001/logic/engine.ts";
import {
  cells,
  emptyBoard,
  fits,
  fullRows,
  ghost,
  HEIGHT,
  KINDS,
  removeRows,
  rotated,
  shuffleBag,
  spawn,
  WIDTH,
} from "../src/games/001/logic/pieces.ts";
import {
  BEST_KEY,
  createBestStore,
  parseBest,
} from "../src/games/001/storage/best-store.ts";
function advance(engine: BlockDropEngine, ms: number, frame = 10) {
  for (let time = 0; time < ms; time += frame)
    engine.advance(Math.min(frame, ms - time));
}
function playing() {
  const e = new BlockDropEngine(() => 0.42);
  e.start();
  advance(e, COUNTDOWN_MS + STEP);
  assert.equal(e.state.phase, "playing");
  return e;
}

test("all seven pieces have four unique cells and each shuffled bag contains all seven", () => {
  for (const kind of KINDS) {
    for (let rotation = 0; rotation < 4; rotation++) {
      const points = cells({ ...spawn(kind), rotation });
      assert.equal(new Set(points.map((p) => `${p.x},${p.y}`)).size, 4);
      assert.ok(fits(emptyBoard(), { ...spawn(kind), rotation }));
    }
  }
  for (let i = 0; i < 100; i++)
    assert.deepEqual(shuffleBag().sort(), [...KINDS].sort());
});
test("ready does not fall; start counts 3, 2, 1, GO before play", () => {
  const e = new BlockDropEngine();
  e.advance(500);
  assert.equal(e.state.active, null);
  e.start();
  assert.equal(e.state.countdown, 3);
  advance(e, 1010);
  assert.equal(e.state.countdown, 2);
  advance(e, 1000);
  assert.equal(e.state.countdown, 1);
  advance(e, 1000);
  assert.equal(e.state.countdown, 0);
  assert.equal(e.state.phase, "countdown");
  advance(e, 300);
  assert.equal(e.state.phase, "playing");
});
test("collision detects both walls, floor and occupied cells", () => {
  const board = emptyBoard();
  const p = spawn("O");
  assert.equal(fits(board, { ...p, x: -1 }), false);
  assert.equal(fits(board, { ...p, x: 9 }), false);
  assert.equal(fits(board, { ...p, y: 19 }), false);
  board[1][4] = "J";
  assert.equal(fits(board, p), false);
  assert.equal(fits(board, { ...p, x: 0 }), true);
});
test("tap moves exactly once; held movement repeats only after its delay and release stops it", () => {
  const e = playing();
  e.state.active = spawn("O");
  e.press("left");
  assert.equal(e.state.active.x, 3);
  advance(e, 100);
  assert.equal(e.state.active.x, 3);
  advance(e, 100);
  assert.equal(e.state.active.x, 2);
  e.release("left");
  advance(e, 150);
  assert.equal(e.state.active.x, 2);
  e.press("right");
  advance(e, 450);
  assert.ok(e.state.active.x > 3);
  e.releaseAll();
});
test("rotation has wall and floor kicks and cannot enter occupied cells", () => {
  const board = emptyBoard();
  const vertical = { kind: "I" as const, rotation: 1, x: -2, y: 4 };
  assert.ok(fits(board, vertical));
  const wall = rotated(board, vertical);
  assert.ok(wall);
  assert.ok(fits(board, wall));
  assert.equal(wall.x, 0);
  const floor = rotated(board, { ...spawn("T"), y: 18 });
  assert.ok(floor);
  assert.ok(fits(board, floor));
  const full = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill("J"));
  assert.equal(rotated(full, spawn("T")), null);
  const p = spawn("T");
  let r = p;
  for (let i = 0; i < 4; i++) r = rotated(board, r)!;
  assert.deepEqual(cells(r), cells(p));
});
test("ghost lands on the stack without changing the active piece", () => {
  const board = emptyBoard();
  board[18][4] = "J";
  const p = spawn("O");
  assert.equal(ghost(board, p).y, 16);
  assert.equal(p.y, 0);
});
test("hard drop locks immediately at ghost and advances NEXT, scoring two per cell", () => {
  const e = playing();
  e.state.active = spawn("O");
  const next = e.state.queue[0];
  e.input("drop");
  assert.equal(e.state.score, 36);
  assert.equal(e.state.board[19][4], "O");
  assert.equal(e.state.active?.kind, next);
  assert.ok(e.state.queue.length >= 7);
});
test("soft drop repeats while held, adds points, and does not bypass lock delay", () => {
  const e = playing();
  e.state.active = spawn("O");
  e.press("soft");
  advance(e, 350);
  e.release("soft");
  assert.ok(e.state.active.y >= 10);
  assert.equal(e.state.score, e.state.active.y);
  e.state.active = { ...spawn("O"), y: 18 };
  e.input("soft");
  assert.equal(e.state.board[19][4], null);
});
test("landing allows adjustment for 450ms before locking", () => {
  const e = playing();
  e.state.active = { ...spawn("O"), y: 18 };
  advance(e, LOCK_MS - 60);
  assert.equal(e.state.board[19][4], null);
  e.input("left");
  advance(e, 100);
  assert.equal(e.state.board[19][3], null);
  advance(e, LOCK_MS);
  assert.equal(e.state.board[19][3], "O");
});
test("grounded reset limit prevents unlimited rotation/movement stalling", () => {
  const e = playing();
  e.state.active = { ...spawn("O"), y: 18 };
  for (let i = 0; i < 15; i++) {
    advance(e, 100);
    e.input(i % 2 ? "right" : "left");
  }
  advance(e, 350);
  e.input("right");
  advance(e, 120);
  assert.ok(e.state.board[19].some(Boolean));
});
for (const count of [1, 2, 3, 4])
  test(`${count} rows flash before collapse and score at the current level`, () => {
    const e = playing();
    for (let y = HEIGHT - count; y < HEIGHT; y++)
      e.state.board[y] = Array.from({ length: WIDTH }, (_, x) =>
        x === 5 ? null : "J",
      );
    e.state.board[10][0] = "S";
    e.state.active = { kind: "I", rotation: 1, x: 3, y: 0 };
    e.state.lines = 8;
    e.state.level = 1;
    const landing = ghost(e.state.board, e.state.active);
    const dropPoints = landing.y * 2;
    e.input("drop");
    assert.equal(e.state.phase, "clearing");
    assert.equal(e.state.clearingRows.length, count);
    assert.equal(fullRows(e.state.board).length, count);
    advance(e, CLEAR_MS - 30);
    assert.equal(e.state.phase, "clearing");
    advance(e, 40);
    assert.equal(e.state.phase, "playing");
    assert.equal(fullRows(e.state.board).length, 0);
    assert.equal(e.state.board[10 + count][0], "S");
    assert.equal(e.state.lines, 8 + count);
    assert.equal(e.state.level, 1 + Math.floor((8 + count) / 10));
    assert.equal(e.state.score, dropPoints + lineScore(count, 1));
  });
test("removeRows preserves board dimensions and does not mutate input", () => {
  const board = emptyBoard();
  board[19].fill("I");
  const result = removeRows(board, [19]);
  assert.equal(result.length, 20);
  assert.ok(result.every((row) => row.length === 10));
  assert.equal(board[19][0], "I");
});
test("speed scales with level and remains bounded", () => {
  assert.equal(speed(1), 850);
  assert.ok(speed(5) < speed(1));
  assert.ok(speed(10) < speed(5));
  assert.equal(speed(30), 75);
});
test("fixed-step gravity produces identical states at different rendering rates", () => {
  const a = playing();
  const b = playing();
  advance(a, 7000, 10);
  advance(b, 7000, 100);
  assert.deepEqual(a.snapshot(), b.snapshot());
});
test("pause freezes gravity, input, time, and held buttons; resume does not catch up", () => {
  const e = playing();
  e.press("left");
  e.pause();
  const before = e.snapshot();
  e.advance(100000);
  e.input("drop");
  e.press("soft");
  assert.deepEqual(e.snapshot(), before);
  e.resume();
  advance(e, 200);
  assert.equal(e.state.active!.x, before.active!.x);
  assert.equal(e.state.active!.y, before.active!.y);
});
test("countdown and line-clear animations also stop during pause", () => {
  const e = new BlockDropEngine();
  e.start();
  advance(e, 500);
  e.pause();
  e.advance(900);
  e.resume();
  advance(e, 300);
  assert.equal(e.state.countdown, 3);
  e.state.phase = "clearing";
  e.state.clearingRows = [19];
  e.state.clearRemaining = 180;
  e.pause();
  e.advance(500);
  assert.equal(e.state.clearRemaining, 180);
  e.resume();
  assert.equal(e.state.phase, "clearing");
});
test("unexpected long frame pauses rather than fast-forwarding", () => {
  const e = playing();
  e.advance(2000);
  assert.equal(e.state.phase, "paused");
});
test("blocked next spawn causes game over; restart empties score and board", () => {
  const e = playing();
  e.state.active = { ...spawn("O"), x: 0, y: 18 };
  e.state.board[0].fill("J");
  e.state.board[1].fill("J");
  e.state.board[0][9] = null;
  e.state.board[1][9] = null;
  e.input("drop");
  assert.equal(e.state.phase, "gameover");
  e.start();
  assert.equal(e.state.phase, "countdown");
  assert.equal(e.state.score, 0);
  assert.equal(e.state.lines, 0);
  assert.ok(e.state.board.flat().every((cell) => cell === null));
});
test("locking above the visible top ends the run without indexing negative rows", () => {
  const e = playing();
  e.state.active = { ...spawn("O"), y: -1 };
  e.state.board[1][4] = "J";
  e.input("drop");
  assert.equal(e.state.phase, "gameover");
});
test("records use a game-specific key, survive new store instances, and never regress under concurrent writes", async () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: async (key: string) => data.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      data.set(key, value);
    },
  };
  const store = createBestStore(storage);
  await Promise.all([
    store.save(400),
    store.save(100),
    store.save(900),
    store.save(500),
  ]);
  assert.equal(data.get(BEST_KEY), "900");
  assert.equal(await createBestStore(storage).load(), 900);
});
test("corrupt best scores are ignored and failed writes can be retried", async () => {
  for (const value of [null, "", "-1", "NaN", "1.5", "Infinity", "100junk"])
    assert.equal(parseBest(value), 0);
  let fail = true;
  let saved = "0";
  const store = createBestStore({
    getItem: async () => saved,
    setItem: async (_, value) => {
      if (fail) throw new Error("disk");
      saved = value;
    },
  });
  await assert.rejects(store.save(100));
  fail = false;
  await store.save(300);
  assert.equal(await store.load(), 300);
});
