import type {
  Board,
  Cell,
  Inventory,
  LegalMove,
  PieceSize,
  Player,
} from "./types.ts";
export const SIZES = [1, 2, 3] as const;
export const PIECES_PER_SIZE = 2;
export const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;
export const otherPlayer = (player: Player): Player => (player === 1 ? 2 : 1);
export const topPiece = (cell: Cell) => cell[cell.length - 1];
export function canCover(cell: Cell, size: PieceSize): boolean {
  return !cell.length || topPiece(cell).size < size;
}
export function winningLines(board: Board, player: Player) {
  return WINNING_LINES.filter((line) =>
    line.every((index) => topPiece(board[index])?.player === player),
  );
}
export function legalMoves(
  board: Board,
  inventory: Inventory,
  player: Player,
): LegalMove[] {
  return SIZES.flatMap((size) =>
    inventory[player][size] > 0
      ? board.flatMap((cell, index) =>
          canCover(cell, size) ? [{ player, size, cell: index }] : [],
        )
      : [],
  );
}
