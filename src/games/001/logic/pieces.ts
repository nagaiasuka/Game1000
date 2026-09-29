export const WIDTH = 10;
export const HEIGHT = 20;
export const KINDS = ["I", "O", "T", "L", "J", "S", "Z"] as const;
export type Kind = (typeof KINDS)[number];
export type Cell = Kind | null;
export type Board = Cell[][];
export type Point = { x: number; y: number };
export type Piece = Point & { kind: Kind; rotation: number };
const shapes: Record<Kind, string[]> = {
  I: ["0000", "1111", "0000", "0000"],
  O: ["11", "11"],
  T: ["010", "111", "000"],
  L: ["001", "111", "000"],
  J: ["100", "111", "000"],
  S: ["011", "110", "000"],
  Z: ["110", "011", "000"],
};
export function cells(piece: Piece): Point[] {
  const shape = shapes[piece.kind];
  const result: Point[] = [];
  shape.forEach((row, y) =>
    [...row].forEach((value, x) => {
      if (value !== "1") return;
      let point = { x, y };
      for (let r = 0; r < piece.rotation % 4; r++)
        point = { x: shape.length - 1 - point.y, y: point.x };
      result.push({ x: point.x + piece.x, y: point.y + piece.y });
    }),
  );
  return result;
}
export function emptyBoard(): Board {
  return Array.from({ length: HEIGHT }, () => Array<Cell>(WIDTH).fill(null));
}
export function spawn(kind: Kind): Piece {
  return { kind, rotation: 0, x: kind === "O" ? 4 : 3, y: 0 };
}
export function fits(board: Board, piece: Piece): boolean {
  return cells(piece).every(
    ({ x, y }) =>
      x >= 0 && x < WIDTH && y >= -4 && y < HEIGHT && (y < 0 || !board[y][x]),
  );
}
export function ghost(board: Board, piece: Piece): Piece {
  let landing = { ...piece };
  while (fits(board, { ...landing, y: landing.y + 1 }))
    landing = { ...landing, y: landing.y + 1 };
  return landing;
}
export function rotated(board: Board, piece: Piece): Piece | null {
  if (piece.kind === "O") return null;
  const next = { ...piece, rotation: (piece.rotation + 1) % 4 };
  // Simple wall/floor kicks. No downward kick through a stack.
  for (const [x, y] of [
    [0, 0],
    [-1, 0],
    [1, 0],
    [-2, 0],
    [2, 0],
    [0, -1],
    [-1, -1],
    [1, -1],
    [0, -2],
  ]) {
    const candidate = { ...next, x: next.x + x, y: next.y + y };
    if (fits(board, candidate)) return candidate;
  }
  return null;
}
export function fullRows(board: Board): number[] {
  return board.flatMap((row, y) => (row.every(Boolean) ? [y] : []));
}
export function removeRows(board: Board, rows: number[]): Board {
  return [
    ...Array.from({ length: rows.length }, () => Array<Cell>(WIDTH).fill(null)),
    ...board.filter((_, y) => !rows.includes(y)),
  ];
}
export function shuffleBag(random: () => number = Math.random): Kind[] {
  const bag = [...KINDS];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}
