import type {
  Brick,
  BrickKind,
  Stage,
  Gate,
  Wall,
  Bumper,
} from "./logic/types.ts";
function brick(
  x: number,
  y: number,
  kind: BrickKind = "normal",
  hp = 1,
): Brick {
  return { id: 0, x, y, w: 40, h: 20, kind, hp, maxHp: hp };
}
function bank(
  xs: readonly number[],
  y: number,
  kind: BrickKind = "normal",
  hp = 1,
) {
  return xs.map((x) => brick(x, y, kind, hp));
}
function gate(
  x: number,
  y: number,
  w: number,
  factor: number,
  motion?: number,
): Gate {
  return { id: 0, x, y, w, factor, motion };
}
function wall(x: number, y: number, w: number, h: number, door = false): Wall {
  return { id: 0, x, y, w, h, door };
}
function stage(
  id: number,
  title: string,
  hint: string,
  shots: number,
  stars: readonly [number, number],
  bricks: Brick[],
  gates: Gate[],
  walls: Wall[] = [],
  bumpers: Bumper[] = [],
  feverCore = false,
): Stage {
  return {
    id,
    title,
    hint,
    shots,
    stars,
    bricks: bricks.map((b, i) => ({ ...b, id: i + 1 })),
    gates: gates.map((g, i) => ({ ...g, id: i })),
    walls: walls.map((w, i) => ({ ...w, id: i })),
    bumpers: bumpers.map((b, i) => ({ ...b, id: i })),
    feverCore,
  };
}
export const STAGES: readonly Stage[] = [
  stage(
    1,
    "はじめの連鎖",
    "中央の×2を通そう。狙いを少しずつ変えてみよう。",
    4,
    [2, 3],
    bank([88, 136, 184, 232], 180),
    [gate(65, 395, 230, 2)],
  ),
  stage(
    2,
    "壁の向こう",
    "中央の壁を避け、横の壁で跳ね返そう。",
    5,
    [3, 4],
    [...bank([34, 82], 150), ...bank([238, 286], 150), ...bank([58, 262], 220)],
    [gate(10, 365, 116, 3), gate(234, 365, 116, 3)],
    [wall(150, 245, 60, 185)],
  ),
  stage(
    3,
    "分かれ道",
    "左は広い×2、右は細い×3。どちらから崩す？",
    4,
    [2, 3],
    [...bank([40, 88, 136], 170), ...bank([184, 232, 280], 115)],
    [gate(16, 380, 142, 2), gate(235, 330, 76, 3)],
    [wall(174, 255, 12, 180)],
  ),
  stage(
    4,
    "集中突破",
    "耐久3の装甲へ、×4で球を集中させよう。",
    5,
    [3, 4],
    bank([88, 136, 184, 232], 150, "armor", 3),
    [gate(60, 360, 240, 4)],
    [wall(24, 200, 18, 150), wall(318, 200, 18, 150)],
  ),
  stage(
    5,
    "爆発の導線",
    "丸印の爆弾を狙おう。爆風は隣の爆弾にも届く。",
    4,
    [2, 3],
    [
      ...bank([35, 83, 131, 179, 227, 275], 130),
      ...bank([35, 83, 131, 179, 227, 275], 170),
      ...bank([59, 155, 251], 210, "bomb"),
    ],
    [gate(55, 390, 250, 3)],
  ),
  stage(
    6,
    "スイッチ回廊",
    "鍵のブロックを壊すと、奥の通路が開く！",
    5,
    [3, 4],
    [brick(160, 365, "switch"), ...bank([95, 145, 195, 245], 125)],
    [gate(85, 445, 190, 2), gate(55, 265, 250, 4)],
    [wall(45, 310, 270, 14, true)],
  ),
  stage(
    7,
    "動くチャンス",
    "動く×8が狙いの線に重なったら発射しよう。",
    5,
    [3, 4],
    [...bank([42, 90, 138], 130), ...bank([186, 234, 282], 200)],
    [gate(134, 360, 92, 8, 100)],
    [wall(48, 255, 76, 10), wall(236, 280, 76, 10)],
  ),
  stage(
    8,
    "バンパーループ",
    "丸いバンパーで反射！左右の奥まで球を届けよう。",
    5,
    [3, 4],
    [
      ...bank([25, 73, 247, 295], 120),
      ...bank([49, 271], 210),
      ...bank([136, 184], 75),
    ],
    [gate(55, 420, 250, 8)],
    [],
    [
      { id: 0, x: 120, y: 290, r: 26 },
      { id: 1, x: 240, y: 290, r: 26 },
    ],
  ),
  stage(
    9,
    "フィーバーコア",
    "周りを連鎖で壊してフィーバー！その間にコアを狙おう。",
    5,
    [3, 4],
    [
      ...bank([40, 88, 232, 280], 120),
      ...bank([40, 88, 232, 280], 165),
      ...bank([64, 256], 205, "bomb"),
      brick(160, 90, "core", 3),
    ],
    [gate(50, 405, 260, 4), gate(45, 300, 270, 4)],
    [],
    [],
    true,
  ),
  stage(
    10,
    "大瀑布",
    "6段の×2で最大64球。爆弾で装甲の列を崩し切ろう。",
    6,
    [4, 5],
    [
      ...bank([20, 68, 116, 164, 212, 260, 308], 72, "armor", 2),
      ...bank([20, 68, 116, 164, 212, 260, 308], 108),
      ...bank([44, 140, 236], 145, "bomb"),
    ],
    Array.from({ length: 6 }, (_, i) => gate(22, 470 - i * 51, 316, 2)),
    [],
    [
      { id: 0, x: 42, y: 190, r: 17 },
      { id: 1, x: 318, y: 190, r: 17 },
    ],
  ),
];
/** Validated authored templates, deterministic progression; never random sealed chambers. */
export function endlessStage(level: number): Stage {
  const base = STAGES[(Math.max(1, level) - 1) % STAGES.length];
  const extra = Math.min(3, Math.floor((level - 1) / 10));
  return {
    ...base,
    id: level,
    title: base.title,
    shots: Math.max(4, base.shots + 1),
    stars: [0, 0],
    bricks: base.bricks.map((b) => ({
      ...b,
      hp: b.hp + extra,
      maxHp: b.maxHp + extra,
    })),
    gates: base.gates.map((g) => ({ ...g })),
    walls: base.walls.map((w) => ({ ...w })),
    bumpers: base.bumpers.map((b) => ({ ...b })),
  };
}
