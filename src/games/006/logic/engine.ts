export type Player = 1 | 2;
export type Hex = {
  q: number;
  r: number;
};
export type Match = {
  board: Record<string, Player>;
  turn: Player;
  scores: Record<Player, number>;
  winner: Player | null;
  moves: number;
};
export const DIRECTIONS: readonly Hex[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];
export const PLAYER_COLOR = { 1: "#00F5FF", 2: "#FF2BD6" } as const;
export const TARGET = 5;
export const key = (h: Hex) => `${h.q},${h.r}`;
export const fromKey = (s: string): Hex => {
  const [q, r] = s.split(",").map(Number);
  return { q, r };
};
export const add = (a: Hex, b: Hex): Hex => ({ q: a.q + b.q, r: a.r + b.r });
export const inside = (h: Hex) =>
  Number.isInteger(h.q) &&
  Number.isInteger(h.r) &&
  Math.max(Math.abs(h.q), Math.abs(h.r), Math.abs(h.q + h.r)) <= 4;
export const CELLS: Hex[] = [];
for (let r = -4; r <= 4; r++)
  for (let q = -4; q <= 4; q++) if (inside({ q, r })) CELLS.push({ q, r });
export function createMatch(): Match {
  const board: Match["board"] = {};
  // Five outer cores and six on the next row; reflection preserves both axes.
  for (const h of CELLS)
    if (h.r >= 3) {
      board[key(h)] = 1;
      board[key({ q: -h.q, r: -h.r })] = 2;
    }
  return { board, turn: 1, scores: { 1: 0, 2: 0 }, winner: null, moves: 0 };
}
export function validSelection(m: Match, selection: readonly Hex[]): boolean {
  if (
    !selection.length ||
    selection.length > 3 ||
    new Set(selection.map(key)).size !== selection.length ||
    selection.some((h) => !inside(h) || m.board[key(h)] !== m.turn)
  )
    return false;
  return DIRECTIONS.some((d) =>
    selection.some((start) =>
      selection.every((_, i) =>
        selection.some(
          (h) => key(h) === key({ q: start.q + d.q * i, r: start.r + d.r * i }),
        ),
      ),
    ),
  );
}
export type Motion = {
  from: Hex;
  to: Hex;
  player: Player;
  out: boolean;
};
export type Move = {
  direction: Hex;
  target: Hex;
  motions: Motion[];
  pushed: number;
  out: number;
};
export function planMove(
  m: Match,
  selection: readonly Hex[],
  direction: Hex,
): Move | null {
  if (
    m.winner ||
    !validSelection(m, selection) ||
    !DIRECTIONS.some((d) => key(d) === key(direction))
  )
    return null;
  const selected = new Set(selection.map(key));
  const destinations = selection.map((h) => add(h, direction));
  if (destinations.some((h) => !inside(h))) return null;
  const fronts = destinations.filter((h) => !selected.has(key(h)));
  const opponents: Hex[] = [];
  if (fronts.some((h) => m.board[key(h)])) {
    // Only inline movement can push. Broadside destinations must all be empty.
    if (fronts.length !== 1) return null;
    let cursor = fronts[0];
    while (
      inside(cursor) &&
      m.board[key(cursor)] &&
      m.board[key(cursor)] !== m.turn
    ) {
      opponents.push(cursor);
      cursor = add(cursor, direction);
    }
    if (
      !opponents.length ||
      opponents.length >= selection.length ||
      (inside(cursor) && m.board[key(cursor)])
    )
      return null;
  }
  const motions: Motion[] = [...selection, ...opponents].map((from) => ({
    from,
    to: add(from, direction),
    player: m.board[key(from)],
    out: !inside(add(from, direction)),
  }));
  return {
    direction,
    target: fronts[0],
    motions,
    pushed: opponents.length,
    out: motions.filter((x) => x.out).length,
  };
}
export function legalMoves(m: Match, selection: readonly Hex[]): Move[] {
  return DIRECTIONS.map((d) => planMove(m, selection, d)).filter(
    (x): x is Move => x !== null,
  );
}
export function applyMove(
  m: Match,
  selection: readonly Hex[],
  direction: Hex,
): {
  match: Match;
  move: Move;
} | null {
  const move = planMove(m, selection, direction);
  if (!move) return null;
  const board = { ...m.board };
  for (const motion of move.motions) delete board[key(motion.from)];
  for (const motion of move.motions)
    if (!motion.out) board[key(motion.to)] = motion.player;
  const scores = { ...m.scores, [m.turn]: m.scores[m.turn] + move.out };
  const winner = scores[m.turn] >= TARGET ? m.turn : null;
  return {
    match: {
      board,
      scores,
      winner,
      turn: winner ? m.turn : m.turn === 1 ? 2 : 1,
      moves: m.moves + 1,
    },
    move,
  };
}
