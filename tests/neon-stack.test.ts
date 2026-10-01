import test from "node:test";
import assert from "node:assert/strict";
import {
  applyMove,
  chooseFirst,
  createMatch,
} from "../src/games/003/logic/engine.ts";
import {
  canCover,
  legalMoves,
  PIECES_PER_SIZE,
  SIZES,
  topPiece,
  WINNING_LINES,
  winningLines,
} from "../src/games/003/logic/rules.ts";
import {
  initialSession,
  sessionReducer,
} from "../src/games/003/logic/session.ts";
import type {
  Board,
  Match,
  PieceSize,
  Player,
} from "../src/games/003/logic/types.ts";
import { games, filterGames } from "../src/data/catalog.ts";
import { projectProgress } from "../src/utils/project.ts";
const piece = (player: Player, size: PieceSize, id = 1) => ({
  player,
  size,
  id,
});
function place(match: Match, cell: number, size: PieceSize) {
  const result = applyMove(match, { player: match.turn, cell, size });
  assert.ok(result.ok);
  return result.match;
}
function freeze(value: unknown) {
  if (value && typeof value === "object") {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
}

test("003 is available to exactly two players and progress derives the catalog count", () => {
  const game = games.find((g) => g.id === "003");
  assert.equal(game?.status, "available");
  assert.equal(game?.minPlayers, 2);
  assert.equal(game?.maxPlayers, 2);
  assert.ok(filterGames(games, "2").includes(game!));
  assert.ok(!filterGames(games, "1").includes(game!));
  const progress = projectProgress(games, 30);
  assert.equal(progress.countLabel, "005 / 030");
  assert.equal(progress.remaining, 25);
  assert.equal(progress.percent, 5 / 30 * 100);
});
test("each player begins with two of each size, independent hands and nine independent stacks", () => {
  const match = createMatch(2);
  assert.equal(match.turn, 2);
  assert.equal(match.first, 2);
  assert.equal(match.board.length, 9);
  assert.equal(new Set(match.board).size, 9);
  assert.notEqual(match.inventory[1], match.inventory[2]);
  for (const player of [1, 2] as const)
    for (const size of SIZES)
      assert.equal(match.inventory[player][size], PIECES_PER_SIZE);
});
test("first player is random with injectable outcomes", () => {
  assert.equal(
    chooseFirst(() => 0),
    1,
  );
  assert.equal(
    chooseFirst(() => 0.499),
    1,
  );
  assert.equal(
    chooseFirst(() => 0.5),
    2,
  );
  assert.equal(
    chooseFirst(() => 0.999),
    2,
  );
});
for (const incoming of SIZES) {
  test(`size ${incoming} may enter an empty cell`, () =>
    assert.ok(canCover([], incoming)));
  for (const existing of SIZES)
    test(`size ${incoming} over ${existing} obeys strict size ordering`, () => {
      assert.equal(
        canCover([piece(2, existing)], incoming),
        incoming > existing,
      );
      const match = {
        ...createMatch(1),
        board: [[piece(2, existing)], ...Array.from({ length: 8 }, () => [])],
      };
      const result = applyMove(match, { player: 1, size: incoming, cell: 0 });
      assert.equal(result.ok, incoming > existing);
      if (!result.ok) assert.equal(result.error, "too-small");
    });
}
test("covering both opponent and own pieces preserves every layer immutably", () => {
  let match = createMatch(1);
  freeze(match);
  match = place(match, 0, 1);
  match = place(match, 0, 2);
  assert.ok(match.captured);
  match = place(match, 0, 3);
  assert.deepEqual(
    match.board[0].map((p) => [p.player, p.size]),
    [
      [1, 1],
      [2, 2],
      [1, 3],
    ],
  );
  assert.equal(match.covers, 2);
  assert.equal(topPiece(match.board[0]).player, 1);
  let own = createMatch(1);
  own = place(own, 0, 1);
  own = place(own, 8, 1);
  own = place(own, 0, 3);
  assert.equal(own.board[0].length, 2);
  assert.equal(own.captured, false);
});
test("only the acting player's chosen inventory decreases", () => {
  const original = createMatch(1);
  const next = place(original, 4, 2);
  assert.equal(next.inventory[1][2], 1);
  assert.equal(original.inventory[1][2], 2);
  assert.equal(next.inventory[1][1], 2);
  assert.deepEqual(next.inventory[2], original.inventory[2]);
});
test("empty sizes, invalid cells, invalid sizes and wrong turns do not alter state", () => {
  const match = createMatch(1);
  freeze(match);
  for (const cell of [-1, 9, 1.5, NaN])
    assert.equal(applyMove(match, { player: 1, size: 1, cell }).ok, false);
  assert.equal(applyMove(match, { player: 2, size: 1, cell: 0 }).ok, false);
  assert.equal(
    applyMove(match, { player: 1, size: 4 as PieceSize, cell: 0 }).ok,
    false,
  );
  const empty = {
    ...match,
    inventory: { ...match.inventory, 1: { 1: 0, 2: 2, 3: 2 } },
  };
  assert.deepEqual(applyMove(empty, { player: 1, size: 1, cell: 0 }), {
    ok: false,
    error: "empty-hand",
  });
  assert.equal(match.moves, 0);
  assert.ok(match.board.every((cell) => !cell.length));
});
for (const [i, line] of WINNING_LINES.entries())
  test(`winning line ${i + 1} uses only visible pieces`, () => {
    const board: Board = Array.from({ length: 9 }, (_, index) =>
      line.some((cell) => cell === index)
        ? [piece(2, 1, index * 2), piece(1, 2, index * 2 + 1)]
        : [],
    );
    assert.ok(
      winningLines(board, 1).some((found) =>
        found.every((n, i) => n === line[i]),
      ),
    );
    assert.equal(winningLines(board, 2).length, 0);
  });
test("a covered opponent reach disappears; a covering move can win", () => {
  const base = createMatch(1);
  const reach = {
    ...base,
    board: [[piece(2, 1)], [piece(2, 1)], [], [], [], [], [], [], []],
  };
  const blocked = place(reach, 1, 2);
  assert.equal(topPiece(blocked.board[1]).player, 1);
  assert.equal(blocked.board[1][0].player, 2);
  const setup = {
    ...base,
    board: [
      [piece(1, 1)],
      [piece(1, 1)],
      [piece(2, 1)],
      [],
      [],
      [],
      [],
      [],
      [],
    ],
  };
  const win = place(setup, 2, 3);
  assert.equal(win.phase, "won");
  assert.equal(win.winner, 1);
  assert.equal(win.captured, true);
  assert.deepEqual(win.winningLines, [[0, 1, 2]]);
  assert.deepEqual(applyMove(win, { player: win.turn, size: 1, cell: 3 }), {
    ok: false,
    error: "finished",
  });
});
test("one player without moves is skipped; neither with a move is a draw", () => {
  const base = createMatch(1);
  const single = {
    ...base,
    inventory: { 1: { 1: 2, 2: 0, 3: 0 }, 2: { 1: 0, 2: 0, 3: 0 } },
  };
  const next = place(single, 0, 1);
  assert.equal(next.phase, "playing");
  assert.equal(next.turn, 1);
  assert.equal(next.skipped, 2);
  const draw = place(next, 4, 1);
  assert.equal(draw.phase, "draw");
  assert.equal(draw.winner, null);
  assert.equal(legalMoves(draw.board, draw.inventory, 1).length, 0);
  assert.equal(legalMoves(draw.board, draw.inventory, 2).length, 0);
});
test("legal moves include own covers, exclude exhausted sizes and large occupied cells", () => {
  const base = createMatch(1);
  const board = [
    [piece(1, 1)],
    [piece(2, 3)],
    ...Array.from({ length: 7 }, () => []),
  ];
  const inventory = { ...base.inventory, 1: { 1: 0, 2: 1, 3: 1 } };
  const legal = legalMoves(board, inventory, 1);
  assert.ok(legal.some((move) => move.cell === 0 && move.size === 2));
  assert.ok(
    legal.every(
      (move) => move.cell !== 1 && move.size !== 1 && move.player === 1,
    ),
  );
});
test("session requires selection, clears selection, rejects stale double taps and counts each win once", () => {
  let s = sessionReducer(initialSession(), { type: "start", first: 1 });
  s = sessionReducer(s, { type: "place", cell: 0, expectedMoves: 0 });
  assert.equal(s.error, "choose-size");
  for (const [cell, size] of [
    [0, 1],
    [3, 1],
    [1, 1],
    [4, 1],
    [2, 2],
  ] as const) {
    s = sessionReducer(s, { type: "select", size });
    const oldMoves = s.match!.moves;
    s = sessionReducer(s, { type: "place", cell, expectedMoves: oldMoves });
    assert.equal(s.selected, null);
    assert.equal(
      sessionReducer(s, { type: "place", cell: 8, expectedMoves: oldMoves }),
      s,
    );
  }
  assert.equal(s.match!.winner, 1);
  assert.equal(s.wins[1], 1);
  assert.equal(s.rounds, 1);
  s = sessionReducer(s, { type: "start", first: 2 });
  assert.equal(s.match!.turn, 2);
  assert.equal(s.match!.moves, 0);
  assert.equal(s.wins[1], 1);
  assert.deepEqual(s.match!.inventory, createMatch(1).inventory);
});
test("500 seeded matches terminate within twelve placements with conserved pieces and legal stacks", () => {
  let seed = 173,
    draws = 0,
    wins = 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  for (let run = 0; run < 500; run++) {
    let match = createMatch(chooseFirst(random));
    while (match.phase === "playing") {
      const legal = legalMoves(match.board, match.inventory, match.turn);
      assert.ok(legal.length > 0);
      const result = applyMove(
        match,
        legal[Math.floor(random() * legal.length)],
      );
      assert.ok(result.ok);
      match = result.match;
      assert.ok(match.moves <= 12);
      for (const player of [1, 2] as const)
        for (const size of SIZES) {
          const placed = match.board
            .flat()
            .filter((p) => p.player === player && p.size === size).length;
          assert.equal(placed + match.inventory[player][size], 2);
        }
      for (const stack of match.board)
        for (let i = 1; i < stack.length; i++)
          assert.ok(stack[i].size > stack[i - 1].size);
    }
    if (match.phase === "draw") draws++;
    else {
      wins++;
      assert.ok(winningLines(match.board, match.winner!).length > 0);
    }
  }
  assert.ok(draws > 0 && wins > 0);
});

test("a full board is not a draw while a larger piece can still be placed", () => {
  const board = ([1, 2, 1, 1, 2, 2, 2, 1, 2] as const).map((player, index) => [
    piece(player, 1, index + 1),
  ]);
  const match = { ...createMatch(1), board };
  assert.equal(winningLines(board, 1).length, 0);
  assert.equal(winningLines(board, 2).length, 0);
  assert.equal(legalMoves(board, match.inventory, 1).length, 18);
  const next = place(match, 4, 2);
  assert.equal(next.board[4].length, 2);
  assert.notEqual(next.phase, "draw");
});

test("winning takes priority over exhausted hands and can highlight two lines", () => {
  const board = Array.from({ length: 9 }, (_, index) =>
    [0, 2, 6, 8].includes(index) ? [piece(1, 1, index + 1)] : [],
  );
  const match = {
    ...createMatch(1),
    board,
    inventory: { 1: { 1: 0, 2: 1, 3: 0 }, 2: { 1: 0, 2: 0, 3: 0 } },
  };
  const next = place(match, 4, 2);
  assert.equal(next.phase, "won");
  assert.equal(next.winner, 1);
  assert.deepEqual(next.winningLines, [
    [0, 4, 8],
    [2, 4, 6],
  ]);
});

test("undo restores covered pieces, inventory and turn; rejects repeated stale undo", () => {
  let s = sessionReducer(initialSession(), { type: "start", first: 1 });
  s = sessionReducer(s, { type: "select", size: 1 });
  s = sessionReducer(s, { type: "place", cell: 0, expectedMoves: 0 });
  const before = s.match;
  s = sessionReducer(s, { type: "select", size: 3 });
  s = sessionReducer(s, { type: "place", cell: 0, expectedMoves: 1 });
  assert.equal(s.match!.board[0].length, 2);
  s = sessionReducer(s, { type: "undo", expectedMoves: 2 });
  assert.deepEqual(s.match, before);
  assert.equal(s.selected, null);
  assert.equal(sessionReducer(s, { type: "undo", expectedMoves: 2 }), s);
  s = sessionReducer(s, { type: "undo", expectedMoves: 1 });
  assert.deepEqual(s.match, createMatch(1));
  assert.equal(sessionReducer(s, { type: "undo", expectedMoves: 0 }), s);
});

test("undo after victory rolls back the result and re-winning counts only once", () => {
  let s = sessionReducer(initialSession(), { type: "start", first: 1 });
  for (const [cell, size] of [
    [0, 1],
    [3, 1],
    [1, 1],
    [4, 1],
    [2, 2],
  ] as const) {
    s = sessionReducer(s, { type: "select", size });
    s = sessionReducer(s, {
      type: "place",
      cell,
      expectedMoves: s.match!.moves,
    });
  }
  assert.equal(s.wins[1], 1);
  s = sessionReducer(s, { type: "undo", expectedMoves: 5 });
  assert.equal(s.match!.phase, "playing");
  assert.equal(s.rounds, 0);
  assert.equal(s.wins[1], 0);
  s = sessionReducer(s, { type: "select", size: 2 });
  s = sessionReducer(s, { type: "place", cell: 2, expectedMoves: 4 });
  assert.equal(s.wins[1], 1);
  assert.equal(s.rounds, 1);
  s = sessionReducer(s, { type: "start", first: 2 });
  assert.equal(s.history.length, 0);
  assert.equal(sessionReducer(s, { type: "undo", expectedMoves: 0 }), s);
});

test("undo restores every previous state including skipped turns and draws", () => {
  for (let run = 0; run < 30; run++) {
    let s = sessionReducer(initialSession(), { type: "start", first: 1 });
    const snapshots = [];
    while (s.match!.phase === "playing") {
      snapshots.push(s.match);
      const legal = legalMoves(
        s.match!.board,
        s.match!.inventory,
        s.match!.turn,
      );
      const move = legal[(run * 7 + s.match!.moves * 3) % legal.length];
      s = sessionReducer(s, { type: "select", size: move.size });
      s = sessionReducer(s, {
        type: "place",
        cell: move.cell,
        expectedMoves: s.match!.moves,
      });
    }
    while (snapshots.length) {
      s = sessionReducer(s, { type: "undo", expectedMoves: s.match!.moves });
      assert.deepEqual(s.match, snapshots.pop());
      assert.equal(s.rounds, 0);
      assert.deepEqual(s.wins, { 1: 0, 2: 0 });
    }
  }
});
