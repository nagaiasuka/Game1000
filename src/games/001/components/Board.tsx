import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { cells, ghost, HEIGHT, WIDTH, spawn, type Kind } from "../logic/pieces";
import type { State } from "../logic/engine";
import { CLEAR_MS } from "../logic/engine";
import { boardColors, pieceColors } from "../theme";

export const Board = memo(function Board({
  state,
  size,
}: {
  state: State;
  size: number;
}) {
  const active = new Map(
    state.active
      ? cells(state.active).map((p) => [`${p.x},${p.y}`, state.active!.kind])
      : [],
  );
  const shadow = new Set(
    state.active
      ? cells(ghost(state.board, state.active)).map((p) => `${p.x},${p.y}`)
      : [],
  );
  return (
    <View
      testID="block-drop-board"
      accessible
      accessibilityLabel="ブロック盤面、横10マス、縦20マス"
      style={{
        width: size * WIDTH,
        height: size * HEIGHT,
        backgroundColor: boardColors.empty,
      }}
    >
      {state.board.map((row, y) => (
        <View key={y} style={{ flexDirection: "row" }}>
          {row.map((value, x) => {
            const kind = active.get(`${x},${y}`) ?? value;
            const isGhost = !kind && shadow.has(`${x},${y}`) && !!state.active;
            const color = kind
              ? pieceColors[kind]
              : isGhost
                ? pieceColors[state.active!.kind]
                : boardColors.grid;
            const clearing = state.clearingRows.includes(y);
            return (
              <View
                key={x}
                style={{
                  width: size,
                  height: size,
                  padding: 0.65,
                  borderRightWidth: StyleSheet.hairlineWidth,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderColor: boardColors.grid,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    borderRadius: 2,
                    borderWidth: kind || isGhost ? 1 : 0,
                    borderTopWidth: kind ? 2 : isGhost ? 1 : 0,
                    borderColor: color,
                    backgroundColor: clearing
                      ? `rgba(255,255,255,${0.25 + 0.65 * Math.max(0, state.clearRemaining / CLEAR_MS)})`
                      : kind
                        ? color + "BB"
                        : isGhost
                          ? color + "12"
                          : "transparent",
                  }}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
});
export function PiecePreview({
  kind,
  dim = false,
}: {
  kind: Kind | null;
  dim?: boolean;
}) {
  const points = kind ? cells(spawn(kind)) : [];
  const minX = Math.min(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const width = points.length
    ? Math.max(...points.map((p) => p.x)) - minX + 1
    : 4;
  const height = points.length
    ? Math.max(...points.map((p) => p.y)) - minY + 1
    : 2;
  return (
    <View
      accessibilityLabel={kind ? `${kind}型ブロック` : "空"}
      style={{
        width: 60,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
        opacity: dim ? 0.3 : 1,
      }}
    >
      <View style={{ width: width * 13, height: height * 13 }}>
        {points.map((p) => (
          <View
            key={`${p.x},${p.y}`}
            style={{
              position: "absolute",
              left: (p.x - minX) * 13,
              top: (p.y - minY) * 13,
              width: 12,
              height: 12,
              borderRadius: 2,
              borderWidth: 1,
              borderColor: pieceColors[kind!],
              backgroundColor: pieceColors[kind!] + "BB",
            }}
          />
        ))}
      </View>
    </View>
  );
}
