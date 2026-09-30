import { useColors, useThemedStyles } from "@/theme/ThemeProvider";
import { StackMonster } from "@/components/stack-monster";
import { useEffect, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { colors as c } from "@/theme";
import { canCover, topPiece } from "../logic/rules";
import type { Match, Piece, PieceSize, Player } from "../logic/types";
import { PLAYER, SIZE_LABEL, playerName } from "../presentation";

export function Chip({
  player,
  size,
  diameter,
}: {
  player: Player;
  size: PieceSize;
  diameter: number;
}) {
  return (
    <StackMonster
      player={player}
      diameter={diameter * { 1: 0.43, 2: 0.65, 3: 0.87 }[size]}
    />
  );
}
function DropChip({
  piece,
  diameter,
  capture,
}: {
  piece: Piece;
  diameter: number;
  capture: boolean;
}) {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: capture ? 280 : 180,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, capture]);
  return (
    <>
      {capture && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: PLAYER[piece.player].color,
              borderRadius: 10,
              opacity: progress.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0.25, 0.15, 0],
              }),
            },
          ]}
        />
      )}
      {capture &&
        Array.from({ length: 6 }, (_, i) => {
          const angle = (i * Math.PI) / 3;
          return (
            <Animated.View
              key={i}
              style={{
                position: "absolute",
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: PLAYER[piece.player].color,
                opacity: progress.interpolate({
                  inputRange: [0, 0.25, 1],
                  outputRange: [0, 1, 0],
                }),
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.cos(angle) * diameter * 0.46],
                    }),
                  },
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.sin(angle) * diameter * 0.46],
                    }),
                  },
                ],
              }}
            />
          );
        })}
      <Animated.View
        style={{
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [-16, 2, 0],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [1.3, 0.94, 1],
              }),
            },
          ],
          opacity: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
          }),
        }}
      >
        <Chip player={piece.player} size={piece.size} diameter={diameter} />
      </Animated.View>
    </>
  );
}
export function Board({
  match,
  selected,
  onCell,
  names,
}: {
  names?: Record<Player, string>;
  match: Match;
  selected: PieceSize | null;
  onCell: (index: number) => void;
}) {
  const c = useColors();
  const styles = useThemedStyles(baseStyles);

  const [width, setWidth] = useState(0);
  const cellSize = Math.max(44, Math.floor((width - 30) / 3));
  const ended = match.phase !== "playing";
  const color = PLAYER[match.winner ?? match.turn].color;
  return (
    <View
      testID="neon-stack-board"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={styles.board}
    >
      {width > 0 && (
        <>
          <View style={styles.grid}>
            {match.board.map((stack, index) => {
              const piece = topPiece(stack);
              const legal =
                !ended &&
                !!selected &&
                canCover(stack, selected) &&
                match.inventory[match.turn][selected] > 0;
              const winning = match.winningLines.some((line) =>
                line.includes(index),
              );
              return (
                <Pressable
                  key={index}
                  testID={`stack-cell-${index}`}
                  disabled={ended}
                  onPress={() => onCell(index)}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: ended }}
                  accessibilityLabel={`${Math.floor(index / 3) + 1}行${(index % 3) + 1}列、${piece ? `${playerName(piece.player, names)}の${SIZE_LABEL[piece.size]}、${stack.length}段` : "空きマス"}`}
                  accessibilityHint={
                    ended
                      ? "対戦終了"
                      : !selected
                        ? "先に駒を選んでください"
                        : legal
                          ? "置けます"
                          : "この大きさは置けません"
                  }
                  style={({ pressed }) => [
                    styles.cell,
                    {
                      width: cellSize,
                      height: cellSize,
                      borderColor: winning || legal ? color : c.border,
                      borderWidth: winning ? 3 : 1,
                      backgroundColor: winning
                        ? color + "25"
                        : legal
                          ? color + "12"
                          : c.surface,
                      opacity: pressed
                        ? 0.6
                        : selected && !legal && !ended
                          ? 0.5
                          : 1,
                    },
                  ]}
                >
                  {piece && (
                    <DropChip
                      key={piece.id}
                      piece={piece}
                      diameter={cellSize - 14}
                      capture={
                        winning ||
                        (stack.length > 1 &&
                          stack[stack.length - 2].player !== piece.player)
                      }
                    />
                  )}
                  {!piece && legal && (
                    <Text
                      allowFontScaling={false}
                      style={{ color, fontSize: 22 }}
                    >
                      ＋
                    </Text>
                  )}
                  {legal && (
                    <Text
                      allowFontScaling={false}
                      style={[styles.legal, { color }]}
                    >
                      置ける
                    </Text>
                  )}
                  {stack.length > 1 && (
                    <Text allowFontScaling={false} style={styles.depth}>
                      {stack.length}段
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
          {match.winningLines.map((line, i) => {
            const point = (index: number) => ({
              x: 8 + cellSize / 2 + (index % 3) * (cellSize + 6),
              y: 8 + cellSize / 2 + Math.floor(index / 3) * (cellSize + 6),
            });
            const a = point(line[0]),
              b = point(line[2]);
            const length = Math.hypot(b.x - a.x, b.y - a.y);
            return (
              <View
                key={i}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  height: 4,
                  width: length,
                  left: (a.x + b.x) / 2 - length / 2,
                  top: (a.y + b.y) / 2 - 2,
                  backgroundColor: color,
                  borderRadius: 2,
                  transform: [
                    { rotate: `${Math.atan2(b.y - a.y, b.x - a.x)}rad` },
                  ],
                  shadowColor: color,
                  shadowOpacity: 1,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 0 },
                }}
              />
            );
          })}
        </>
      )}
    </View>
  );
}
const baseStyles = StyleSheet.create({
  board: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: "#0B1022",
    borderWidth: 1,
    borderColor: c.border,
  },
  grid: { padding: 8, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cell: { borderRadius: 12, alignItems: "center", justifyContent: "center" },
  legal: { position: "absolute", bottom: 3, fontSize: 10, fontWeight: "700" },
  depth: {
    position: "absolute",
    top: 3,
    right: 4,
    color: c.text,
    fontSize: 10,
  },
});
