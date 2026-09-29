// Dense 18-column field. Dots are intentional courses, not padding between bricks.
export const COLUMNS = 18;
export const BRICK_WIDTH = 18;
export const BRICK_HEIGHT = 16;
export const FIELD_LEFT = 18;
export const FIELD_TOP = 60;
const band = (row: string, count: number) =>
  Array.from({ length: count }, () => row);
export const STAGES = [
  {
    name: "FIRST HIT",
    hint: "小さなブロックをまとめて崩そう。",
    speed: 260,
    feverGain: 8,
    incomingRows: 0,
    refill: "..................",
    rows: [...band("..11111111111111..", 4), "....1111111111...."],
  },
  {
    name: "WALL",
    hint: "左右の入口から、壁の裏へ潜り込もう。",
    speed: 275,
    feverGain: 8,
    incomingRows: 0,
    refill: "..................",
    rows: [
      ...band("..11111111111111..", 5),
      "..................",
      "..XXXXXXXXXXXXXX..",
    ],
  },
  {
    name: "PYRAMID",
    hint: "斜面を削って、内側から連続破壊。",
    speed: 285,
    feverGain: 8,
    incomingRows: 0,
    refill: "..................",
    rows: [
      "........22........",
      "......112211......",
      "....1111221111....",
      "..11111222211111..",
      ".1111111111111111.",
      "111111111111111111",
    ],
  },
  {
    name: "TUNNEL",
    hint: "下の入口から入れて、壁の中ではめよう。",
    speed: 290,
    feverGain: 10,
    incomingRows: 0,
    refill: "..................",
    rows: [
      ...band("X1111111111111111X", 6),
      "X................X",
      "X................X",
      "XXXXXXX....XXXXXXX",
    ],
  },
  {
    name: "NEON RUSH",
    hint: "最下段を崩すと追加列。全4列を出し切ろう。",
    speed: 320,
    feverGain: 12,
    incomingRows: 4,
    refill: "..11111111111111..",
    rows: [
      ...band("..11111111111111..", 6),
      "..................",
      "..................",
      "..XXXXXX..XXXXXX..",
    ],
  },
  {
    name: "FORTRESS",
    hint: "要塞の入口を狙って、追加列ごと崩そう。",
    speed: 305,
    feverGain: 10,
    incomingRows: 5,
    refill: "..11121111211111..",
    rows: [
      "..22222222222222..",
      ...band("..11121111211111..", 5),
      "..................",
      "..................",
      ".XXXXXXX..XXXXXXX.",
    ],
  },
  {
    name: "SPLIT",
    hint: "中央の壁で左右へ反射。追加は左右同時。",
    speed: 315,
    feverGain: 10,
    incomingRows: 6,
    refill: "11111111..11111111",
    rows: [
      ...band("11111111XX11111111", 6),
      "........XX........",
      "........XX........",
      "..XXXX..XX..XXXX..",
    ],
  },
  {
    name: "CHAOS",
    hint: "ずれた壁のすき間から上へ。追加6列。",
    speed: 325,
    feverGain: 12,
    incomingRows: 6,
    refill: ".1111211112111111.",
    rows: [
      ".1111211112111111.",
      "..11112211111111..",
      ".1111111111111111.",
      ".1112111121111111.",
      "...111111111111...",
      ".1111112111111111.",
      "..................",
      "..XXXX............",
      "............XXXX..",
      ".....XXX..XXX.....",
    ],
  },
  {
    name: "DOPAMINE",
    hint: "横から壁の裏へ。追加8列の連続破壊ラッシュ。",
    speed: 330,
    feverGain: 14,
    incomingRows: 8,
    refill: ".1111111111111111.",
    rows: [
      ...band(".1111111111111111.", 8),
      "..................",
      "..................",
      "..XXXXXXXXXXXXXX..",
    ],
  },
  {
    name: "FINAL BREAK",
    hint: "左右の部屋と追加10列。最後まで壊し切ろう。",
    speed: 340,
    feverGain: 12,
    incomingRows: 10,
    refill: "11112111..11121111",
    rows: [
      "11222211XX11222211",
      ...band("11112111XX11121111", 6),
      "........XX........",
      "........XX........",
      "..XXXX..XX..XXXX..",
      "........XX........",
    ],
  },
] as const;
export type Brick = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  row: number;
};
function makeRow(pattern: string, row: number, idOffset: number): Brick[] {
  return [...pattern].flatMap((cell, x) =>
    cell === "."
      ? []
      : [
          {
            id: idOffset + x,
            x: FIELD_LEFT + x * BRICK_WIDTH,
            y: FIELD_TOP + row * BRICK_HEIGHT,
            w: BRICK_WIDTH,
            h: BRICK_HEIGHT,
            hp: cell === "X" ? -1 : Number(cell),
            maxHp: cell === "X" ? -1 : Number(cell),
            row,
          },
        ],
  );
}
export function buildStage(index: number): Brick[] {
  return STAGES[index].rows.flatMap((row, y) => makeRow(row, y, y * COLUMNS));
}
export function buildIncomingRow(index: number, wave: number): Brick[] {
  return makeRow(STAGES[index].refill, 0, 10000 + wave * COLUMNS);
}
export function growthFloor(index: number) {
  return Math.max(
    ...buildStage(index)
      .filter((b) => b.hp > 0)
      .map((b) => b.row),
  );
}
