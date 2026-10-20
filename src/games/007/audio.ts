import type { Effect } from "../../audio/types.ts";
export const blockSounds: readonly Effect[] = [
  "fishPop1",
  "fishPop2",
  "fishPop3",
  "fishPop4",
  "fishPop5",
  "fishPop6",
  "fishPop7",
  "fishPop8",
  "fishPop9",
];
export const catchSound = (blocks: number): Effect =>
  blocks === 9
    ? "fishJackpot"
    : blocks >= 7
      ? "fishBig"
      : blocks >= 4
        ? "fishMedium"
        : "fishSmall";
