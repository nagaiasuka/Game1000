import type { MoveError, PieceSize, Player } from "./logic/types";
export const PLAYER = {
  1: { label: "プレイヤー1", symbol: "1本ツノ", color: "#00F5FF" },
  2: { label: "プレイヤー2", symbol: "2本ツノ", color: "#FF2BD6" },
} as const;
export const SIZE_LABEL: Record<PieceSize, string> = {
  1: "小",
  2: "中",
  3: "大",
};
export const playerName = (player: Player, names?: Record<Player, string>) =>
  names?.[player].trim() || PLAYER[player].label;
export const ERRORS: Record<MoveError | "choose-size", string> = {
  "choose-size": "先に、下から駒の大きさを選ぼう。",
  "too-small": "その駒にはかぶせられません。もっと大きな駒を選ぼう。",
  "empty-hand": "その大きさの駒は、もうありません。",
  finished: "対戦は終わりました。もう一度遊べます。",
  "wrong-turn": "次のプレイヤーの番です。",
  "invalid-cell": "盤面のマスを選んでください。",
  "invalid-size": "小・中・大から選んでください。",
};
