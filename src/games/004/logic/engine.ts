export type Player = 1 | 2;
export type Point = { row: number; col: number };
export type Wall = Point & {
  orientation: "horizontal" | "vertical";
  owner: Player;
};
export type Candidate = Omit<Wall, "owner">;
export type Match = {
  pawns: Record<Player, Point>;
  walls: readonly Wall[];
  remaining: Record<Player, number>;
  turn: Player;
  first: Player;
  moves: number;
  winner: Player | null;
};
export type Failure = "outside" | "overlap" | "blocked" | "empty" | "move";
export const other = (p: Player): Player => (p === 1 ? 2 : 1);
export const same = (a: Point, b: Point) => a.row === b.row && a.col === b.col;
export const inside = (p: Point) =>
  Number.isInteger(p.row) &&
  Number.isInteger(p.col) &&
  p.row >= 0 &&
  p.row < 9 &&
  p.col >= 0 &&
  p.col < 9;
const directions = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;
export function createMatch(first: Player = 1): Match {
  return {
    pawns: { 1: { row: 8, col: 4 }, 2: { row: 0, col: 4 } },
    walls: [],
    remaining: { 1: 10, 2: 10 },
    turn: first,
    first,
    moves: 0,
    winner: null,
  };
}
export function canStep(a: Point, b: Point, walls: readonly Wall[]): boolean {
  if (
    !inside(a) ||
    !inside(b) ||
    Math.abs(a.row - b.row) + Math.abs(a.col - b.col) !== 1
  )
    return false;
  return !walls.some((w) =>
    a.row !== b.row
      ? w.orientation === "horizontal" &&
        w.row === Math.min(a.row, b.row) &&
        (a.col === w.col || a.col === w.col + 1)
      : w.orientation === "vertical" &&
        w.col === Math.min(a.col, b.col) &&
        (a.row === w.row || a.row === w.row + 1),
  );
}
// Reachability ignores the other pawn: a pawn is not a permanent barrier.
export function shortestPath(match: Match, player: Player): number | null {
  const queue = [{ ...match.pawns[player], distance: 0 }];
  const seen = new Set([match.pawns[player].row * 9 + match.pawns[player].col]);
  for (let head = 0; head < queue.length; head++) {
    const a = queue[head];
    if (a.row === (player === 1 ? 0 : 8)) return a.distance;
    for (const [dr, dc] of directions) {
      const b = { row: a.row + dr, col: a.col + dc };
      const key = b.row * 9 + b.col;
      if (!seen.has(key) && canStep(a, b, match.walls)) {
        seen.add(key);
        queue.push({ ...b, distance: a.distance + 1 });
      }
    }
  }
  return null;
}
export function legalMoves(match: Match): Point[] {
  if (match.winner) return [];
  const a = match.pawns[match.turn],
    opponent = match.pawns[other(match.turn)];
  const result: Point[] = [];
  for (const [dr, dc] of directions) {
    const b = { row: a.row + dr, col: a.col + dc };
    if (!canStep(a, b, match.walls)) continue;
    if (!same(b, opponent)) {
      result.push(b);
      continue;
    }
    const behind = { row: b.row + dr, col: b.col + dc };
    if (canStep(b, behind, match.walls)) result.push(behind);
    else
      for (const [sr, sc] of dr !== 0
        ? [
            [0, -1],
            [0, 1],
          ]
        : [
            [-1, 0],
            [1, 0],
          ]) {
        const side = { row: b.row + sr, col: b.col + sc };
        if (canStep(b, side, match.walls)) result.push(side);
      }
  }
  return result.filter((p, i) => result.findIndex((q) => same(p, q)) === i);
}
export function wallError(match: Match, candidate: Candidate): Failure | null {
  const { row, col, orientation } = candidate;
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(col) ||
    row < 0 ||
    row > 7 ||
    col < 0 ||
    col > 7 ||
    !["horizontal", "vertical"].includes(orientation)
  )
    return "outside";
  if (match.remaining[match.turn] <= 0) return "empty";
  if (
    match.walls.some((w) =>
      w.orientation !== orientation
        ? w.row === row && w.col === col
        : orientation === "horizontal"
          ? w.row === row && Math.abs(w.col - col) < 2
          : w.col === col && Math.abs(w.row - row) < 2,
    )
  )
    return "overlap";
  const next = {
    ...match,
    walls: [...match.walls, { ...candidate, owner: match.turn }],
  };
  return shortestPath(next, 1) === null || shortestPath(next, 2) === null
    ? "blocked"
    : null;
}
export type TurnAction =
  { type: "move"; target: Point } | { type: "wall"; wall: Candidate };
export function applyTurn(match: Match, action: TurnAction): Match | null {
  if (match.winner) return null;
  const player = match.turn;
  if (action.type === "move") {
    if (!legalMoves(match).some((p) => same(p, action.target))) return null;
    const winner = action.target.row === (player === 1 ? 0 : 8) ? player : null;
    return {
      ...match,
      pawns: { ...match.pawns, [player]: { ...action.target } },
      winner,
      turn: winner ?? other(player),
      moves: match.moves + 1,
    };
  }
  if (wallError(match, action.wall)) return null;
  return {
    ...match,
    walls: [...match.walls, { ...action.wall, owner: player }],
    remaining: { ...match.remaining, [player]: match.remaining[player] - 1 },
    turn: other(player),
    moves: match.moves + 1,
  };
}
