import type { Failure, Player } from "./logic/engine";
export const PLAYER_COLOR = { 1: "#00F5FF", 2: "#FF2BD6" } as const;
export const playerName = (p: Player, names: Record<Player, string>) =>
  names[p].trim() || `プレイヤー${p}`;
export const ERRORS: Record<Failure, string> = {
  outside: "壁は盤面の中に置いてください",
  overlap: "壁を重ねたり、交差させたりできません",
  blocked: "ゴールへの道を完全にふさぐことはできません",
  empty: "残りの壁がありません。駒を進めましょう",
  move: "光っているマスに進めます",
};
