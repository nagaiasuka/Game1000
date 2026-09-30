import {
  canCover,
  legalMoves,
  otherPlayer,
  PIECES_PER_SIZE,
  topPiece,
  winningLines,
} from "./rules.ts";
import type { Match, Move, MoveResult, Player } from "./types.ts";
export function chooseFirst(random: () => number = Math.random): Player {
  return random() < 0.5 ? 1 : 2;
}
export function createMatch(first: Player): Match {
  return {
    board: Array.from({ length: 9 }, () => []),
    inventory: {
      1: { 1: PIECES_PER_SIZE, 2: PIECES_PER_SIZE, 3: PIECES_PER_SIZE },
      2: { 1: PIECES_PER_SIZE, 2: PIECES_PER_SIZE, 3: PIECES_PER_SIZE },
    },
    turn: first,
    first,
    phase: "playing",
    winner: null,
    winningLines: [],
    moves: 0,
    covers: 0,
    lastMove: null,
    captured: false,
    skipped: null,
  };
}
export function applyMove(match: Match, move: Move): MoveResult {
  if (match.phase !== "playing") return { ok: false, error: "finished" };
  if (move.player !== match.turn) return { ok: false, error: "wrong-turn" };
  if (!Number.isInteger(move.cell) || move.cell < 0 || move.cell >= 9)
    return { ok: false, error: "invalid-cell" };
  if (![1, 2, 3].includes(move.size))
    return { ok: false, error: "invalid-size" };
  if (match.inventory[move.player][move.size] <= 0)
    return { ok: false, error: "empty-hand" };
  const cell = match.board[move.cell];
  if (!canCover(cell, move.size)) return { ok: false, error: "too-small" };
  const previous = topPiece(cell);
  const piece = { id: match.moves + 1, player: move.player, size: move.size };
  const board = match.board.map((stack, index) =>
    index === move.cell ? [...stack, piece] : stack,
  );
  const inventory = {
    ...match.inventory,
    [move.player]: {
      ...match.inventory[move.player],
      [move.size]: match.inventory[move.player][move.size] - 1,
    },
  };
  const lines = winningLines(board, move.player);
  const next = otherPlayer(move.player);
  const nextCanPlay = legalMoves(board, inventory, next).length > 0;
  const currentCanPlay = legalMoves(board, inventory, move.player).length > 0;
  return {
    ok: true,
    match: {
      ...match,
      board,
      inventory,
      moves: piece.id,
      covers: match.covers + (previous ? 1 : 0),
      lastMove: move,
      captured: !!previous && previous.player !== move.player,
      winner: lines.length ? move.player : null,
      winningLines: lines,
      phase: lines.length
        ? "won"
        : !nextCanPlay && !currentCanPlay
          ? "draw"
          : "playing",
      turn: nextCanPlay ? next : move.player,
      skipped: !lines.length && !nextCanPlay && currentCanPlay ? next : null,
    },
  };
}
