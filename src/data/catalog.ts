export type GameCategory =
  | "brain"
  | "reflex"
  | "psychology"
  | "party"
  | "luck"
  | "puzzle"
  | "board"
  | "quiz"
  | "card";
export type Game = {
  id: string;
  gameNumber: number;
  title: string;
  shortDescription: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedMinutes?: number;
  mode?: "endless";
  categories: GameCategory[];
  thumbnail?: string;
  artwork?:
    "block-drop" | "block-break" | "neon-stack" | "neon-path" | "neon-sling";
  isNew?: boolean;
  isPopular?: boolean;
} & (
  { status: "coming-soon" } | { status: "available"; route: `/play/${string}` }
);
// Only available entries count toward the collection and can be launched.
export const games: Game[] = [
  {
    id: "001",
    gameNumber: 1,
    title: "テトリス BLOCK DROP",
    shortDescription: "ブロックを積んで、横一列そろえて消そう。",
    minPlayers: 1,
    maxPlayers: 1,
    categories: ["puzzle"],
    mode: "endless",
    artwork: "block-drop",
    isNew: true,
    status: "available",
    route: "/play/001",
  },
  {
    id: "002",
    gameNumber: 2,
    title: "BLOCK BREAK",
    shortDescription: "壊すたび、気持ちいい。10ステージのブロック崩し。",
    minPlayers: 1,
    maxPlayers: 1,
    categories: ["reflex"],
    artwork: "block-break",
    isNew: true,
    status: "available",
    route: "/play/002",
  },
  {
    id: "003",
    gameNumber: 3,
    title: "NEON STACK",
    shortDescription: "大きな駒で相手にかぶせる、2人の三目並べ。",
    minPlayers: 2,
    maxPlayers: 2,
    categories: ["board", "brain"],
    artwork: "neon-stack",
    isNew: true,
    status: "available",
    route: "/play/003",
  },
  {
    id: "004",
    gameNumber: 4,
    title: "NEON PATH",
    shortDescription: "道を進め。道をふさげ。壁で駆け引きする2人の頭脳戦。",
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 10,
    categories: ["board", "brain"],
    artwork: "neon-path",
    isNew: true,
    status: "available",
    route: "/play/004",
  },
  {
    id: "005",
    gameNumber: 5,
    title: "NEON SLING",
    shortDescription: "引け。離せ。全部送り込め。2人同時のパック対戦。",
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 2,
    categories: ["reflex", "party"],
    artwork: "neon-sling",
    isNew: true,
    status: "available",
    route: "/play/005",
  },
];
export const playerOptions = [
  { id: "1", label: "1人で遊ぶ", caption: "ひとりで", min: 1, max: 1 },
  { id: "2", label: "2人で遊ぶ", caption: "ふたりで", min: 2, max: 2 },
  { id: "3-4", label: "3〜4人で遊ぶ", caption: "みんなで", min: 3, max: 4 },
  { id: "5+", label: "5人以上", caption: "大人数で", min: 5, max: Infinity },
] as const;
export function availableCount(catalog: readonly Game[]) {
  return catalog.filter((g) => g.status === "available").length;
}
export function filterGames(
  catalog: readonly Game[],
  players?: string,
  collection?: string,
) {
  const group = playerOptions.find((p) => p.id === players);
  return catalog.filter(
    (g) =>
      (!group || (g.minPlayers <= group.max && g.maxPlayers >= group.min)) &&
      (collection !== "popular" || g.isPopular) &&
      (collection !== "new" || g.isNew),
  );
}

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  brain: "頭の体操",
  reflex: "アクション",
  psychology: "かけひき",
  party: "みんなで遊ぶ",
  luck: "運だめし",
  puzzle: "パズル",
  board: "ボードゲーム",
  quiz: "クイズ",
  card: "カード",
};
