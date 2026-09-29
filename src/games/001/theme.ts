import { colors } from "@/theme";
import type { Kind } from "./logic/pieces";
export const pieceColors: Record<Kind, string> = {
  I: colors.cyan,
  O: colors.yellow,
  T: colors.purple,
  L: "#FFAD58",
  J: "#599BFF",
  S: "#6DF5A5",
  Z: colors.pink,
};
export const boardColors = {
  grid: "#1C1C30",
  empty: "#0B0B18",
  overlay: "#070711F2",
};
