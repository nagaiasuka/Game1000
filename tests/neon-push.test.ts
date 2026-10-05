import test from "node:test";
import assert from "node:assert/strict";
import {
  CELLS,
  DIRECTIONS,
  add,
  applyMove,
  createMatch,
  inside,
  key,
  legalMoves,
  validSelection,
} from "../src/games/006/logic/engine.ts";
import type { Hex, Match, Player } from "../src/games/006/logic/engine.ts";
import {
  initialSession,
  sessionReducer,
} from "../src/games/006/logic/session.ts";
import { pushSound } from "../src/games/006/audio.ts";
import { sceneEffects } from "../src/audio/types.ts";
const hex = (q: number, r = 0): Hex => ({ q, r });
function fixture(
  own: number,
  other: number,
  first = -2,
): {
  m: Match;
  s: Hex[];
} {
  const m = { ...createMatch(), board: {} as Record<string, Player> };
  const s = [];
  for (let i = 0; i < own; i++) {
    s.push(hex(first + i));
    m.board[key(hex(first + i))] = 1;
  }
  for (let i = 0; i < other; i++) m.board[key(hex(first + own + i))] = 2;
  return { m, s };
}
test("61 hexes in nine rows, 11 pieces per side, mirrored setup", () => {
  const m = createMatch();
  assert.equal(CELLS.length, 61);
  assert.deepEqual(
    Array.from(
      { length: 9 },
      (_, i) => CELLS.filter((h) => h.r === i - 4).length,
    ),
    [5, 6, 7, 8, 9, 8, 7, 6, 5],
  );
  for (const p of [1, 2])
    assert.equal(Object.values(m.board).filter((x) => x === p).length, 11);
  for (const h of CELLS)
    if (m.board[key(h)])
      assert.notEqual(m.board[key(h)], m.board[key(hex(-h.q, -h.r))]);
});
test("single adjacent step is immutable and switches turn", () => {
  const { m, s } = fixture(1, 0);
  const before = JSON.stringify(m);
  const n = applyMove(m, s, hex(1))!;
  assert.equal(n.match.board["-1,0"], 1);
  assert.equal(n.match.turn, 2);
  assert.equal(n.match.moves, 1);
  assert.equal(JSON.stringify(m), before);
  assert.equal(applyMove(m, s, hex(2)), null);
});
for (const [own, other, legal] of [
  [2, 1, true],
  [3, 1, true],
  [3, 2, true],
  [1, 1, false],
  [2, 2, false],
  [3, 3, false],
] as const)
  test(`${own} vs ${other} ${legal ? "pushes" : "blocks"}`, () => {
    const { m, s } = fixture(own, other, -3);
    const n = applyMove(m, s, hex(1));
    assert.equal(!!n, legal);
    if (n) assert.equal(n.move.pushed, other);
  });
test("edge ejection and fifth ejection wins for either player", () => {
  for (const p of [1, 2] as const) {
    const { m, s } = fixture(2, 1, 2);
    m.turn = p;
    m.board = { "2,0": p, "3,0": p, "4,0": p === 1 ? 2 : 1 };
    m.scores[p] = 4;
    const n = applyMove(m, s, hex(1))!;
    assert.equal(n.move.out, 1);
    assert.equal(n.match.scores[p], 5);
    assert.equal(n.match.winner, p);
    assert.equal(Object.values(n.match.board).length, 2);
    assert.deepEqual(legalMoves(n.match, s), []);
  }
});
test("blocked backing piece, equal rows and jumping never change match", () => {
  const { m, s } = fixture(2, 1);
  m.board["1,0"] = 1;
  assert.equal(applyMove(m, s, hex(1)), null);
  assert.equal(applyMove(m, s, hex(2)), null);
});
test("reject four, duplicates, gaps, wrong owner and bent groups", () => {
  const { m, s } = fixture(4, 0);
  assert.equal(validSelection(m, s), false);
  assert.equal(validSelection(m, [s[0], s[2]]), false);
  assert.equal(validSelection(m, [s[0], s[0]]), false);
  m.board["-2,1"] = 1;
  assert.equal(validSelection(m, [s[0], s[1], hex(-2, 1)]), false);
  assert.equal(validSelection(m, [hex(4)]), false);
});
test("no normal move off board and no self sacrifice in groups", () => {
  const { m, s } = fixture(2, 0, 3);
  assert.equal(applyMove(m, s, hex(1)), null);
  assert.equal(applyMove(m, [s[1]], hex(1)), null);
});
test("broadside groups move only into empty cells and cannot push", () => {
  const { m, s } = fixture(3, 0);
  assert.ok(applyMove(m, s, hex(0, 1)));
  m.board["-2,1"] = 2;
  assert.equal(applyMove(m, s, hex(0, 1)), null);
});
test("six axes consistently apply strength and ejection", () => {
  for (const d of DIRECTIONS) {
    const m = { ...createMatch(), board: {} as Record<string, Player> };
    const at = (n: number) => hex(d.q * n, d.r * n);
    const s = [at(2), at(3)];
    s.forEach((h) => (m.board[key(h)] = 1));
    m.board[key(at(4))] = 2;
    const n = applyMove(m, s, d)!;
    assert.equal(n.move.out, 1);
    assert.equal(n.match.scores[1], 1);
  }
});
test("selection toggles and stale repeated move is ignored", () => {
  let s = sessionReducer(initialSession(), { type: "start" });
  const h = hex(-1, 3);
  s = sessionReducer(s, { type: "select", cell: h, revision: s.revision });
  assert.equal(s.selection.length, 1);
  s = sessionReducer(s, { type: "select", cell: h, revision: s.revision });
  assert.equal(s.selection.length, 0);
  s = sessionReducer(s, { type: "select", cell: h, revision: s.revision });
  const revision = s.revision;
  const move = legalMoves(s.match!, s.selection)[0];
  assert.ok(move);
  s = sessionReducer(s, { type: "move", direction: move.direction, revision });
  assert.equal(
    sessionReducer(s, { type: "move", direction: move.direction, revision }),
    s,
  );
  const reset = sessionReducer(s, { type: "start" });
  assert.deepEqual(reset.match, createMatch());
  assert.equal(reset.selection.length, 0);
});
test("registered feedback respects shared audio scenes", () => {
  for (const kind of [
    "start",
    "select",
    "move",
    "push",
    "blocked",
    "push_out",
    "win",
  ] as const)
    assert.ok(sceneEffects["006"].includes(pushSound(kind)));
  assert.ok(sceneEffects["006"].includes("pushTurn"));
  assert.equal(
    new Set(
      ["select", "move", "push", "blocked", "push_out", "win"].map((k) =>
        pushSound(k as Parameters<typeof pushSound>[0]),
      ),
    ).size,
    6,
  );
});
test("seeded legal play conserves pieces and scores across both turns", () => {
  let m = createMatch(),
    seed = 6;
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  for (let turn = 0; turn < 300 && !m.winner; turn++) {
    const groups = CELLS.filter((h) => m.board[key(h)] === m.turn).flatMap(
      (h) => [
        [h],
        ...DIRECTIONS.flatMap((d) => [
          [h, add(h, d)],
          [h, add(h, d), add(add(h, d), d)],
        ]),
      ],
    );
    const options = groups.flatMap((s) =>
      legalMoves(m, s).map((move) => ({ s, move })),
    );
    assert.ok(options.length);
    const choice = options[Math.floor(random() * options.length)];
    m = applyMove(m, choice.s, choice.move.direction)!.match;
    assert.equal(Object.values(m.board).length + m.scores[1] + m.scores[2], 22);
    for (const id of Object.keys(m.board)) {
      const [q, r] = id.split(",").map(Number);
      assert.ok(inside(hex(q, r)));
    }
  }
});

test("tapping the middle selected core clears a disconnected selection", () => {
  const { m, s } = fixture(3, 0);
  const before = { ...initialSession(), match: m, selection: s };
  const session = sessionReducer(before, {
    type: "select",
    cell: s[1],
    revision: before.revision,
  });
  assert.deepEqual(session.selection, []);
  assert.equal(session.event?.kind, "select");
  assert.equal(session.match, m);
});
