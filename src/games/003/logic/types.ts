export type Player = 1 | 2;
export type PieceSize = 1 | 2 | 3;
export type Piece = Readonly<{ id: number; player: Player; size: PieceSize }>;
export type Cell = readonly Piece[]; // Bottom to top. Covered pieces remain here.
export type Board = readonly Cell[];
export type Inventory = Readonly<
  Record<Player, Readonly<Record<PieceSize, number>>>
>;
export type Move = Readonly<{ player: Player; size: PieceSize; cell: number }>;
export type LegalMove = Move;
export type Winner = Player | null;
export type Match = Readonly<{
  board: Board;
  inventory: Inventory;
  turn: Player;
  first: Player;
  phase: "playing" | "won" | "draw";
  winner: Winner;
  winningLines: readonly (readonly number[])[];
  moves: number;
  covers: number;
  lastMove: Move | null;
  captured: boolean;
  skipped: Player | null;
}>;
export type MoveError =
  | "finished"
  | "wrong-turn"
  | "invalid-cell"
  | "invalid-size"
  | "empty-hand"
  | "too-small";
export type MoveResult =
  { ok: true; match: Match } | { ok: false; error: MoveError };
