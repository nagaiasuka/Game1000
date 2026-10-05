import { memo, useEffect, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useColors } from "@/theme/ThemeProvider";
import { CELLS, key, PLAYER_COLOR } from "../logic/engine";
import type { Hex, Match, Move, Player } from "../logic/engine";
export function HexTile({ size, color }: { size: number; color: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {[0, 60, 120].map((deg) => (
        <View
          key={deg}
          style={{
            position: "absolute",
            width: size * 0.866,
            height: size * 0.5,
            backgroundColor: color,
            transform: [{ rotate: `${deg}deg` }],
          }}
        />
      ))}
    </View>
  );
}
export const Piece = memo(function Piece({
  player,
  size,
  selected = false,
}: {
  player: Player;
  size: number;
  selected?: boolean;
}) {
  const color = PLAYER_COLOR[player];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: selected ? 3 : 2,
        borderColor: color,
        backgroundColor: "#080F20",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: color,
        shadowOpacity: selected ? 1 : 0.6,
        shadowRadius: selected ? 12 : 4,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <View
        style={{
          position: "absolute",
          width: size * 0.65,
          height: size * 0.65,
          borderRadius: size,
          borderWidth: 1,
          borderColor: color + "77",
          backgroundColor: color + "18",
        }}
      />
      <Text
        allowFontScaling={false}
        style={{
          fontSize: Math.max(10, size * 0.4),
          fontWeight: "900",
          color: selected ? "#FFFFFF" : color,
        }}
      >
        {selected ? "✓" : player}
      </Text>
    </View>
  );
});
export const point = (h: Hex, step: number, size: number) => ({
  x: size / 2 + (h.q + h.r / 2) * step,
  y: size / 2 + (h.r * step * Math.sqrt(3)) / 2,
});
function MotionEffect({ move, size }: { move: Move; size: number }) {
  const [progress] = useState(() => new Animated.Value(0));
  const step = size / 10;
  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: move.out ? 430 : 200,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, move]);
  return (
    <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
      {move.motions.map((motion, i) => {
        const a = point(motion.from, step, size),
          b = point(motion.to, step, size),
          diameter = step * 0.8;
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              left: a.x - diameter / 2,
              top: a.y - diameter / 2,
              opacity: progress.interpolate({
                inputRange: [0, 0.65, 1],
                outputRange: [1, 0.8, 0],
              }),
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, b.x - a.x],
                  }),
                },
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, b.y - a.y],
                  }),
                },
              ],
            }}
          >
            <Piece player={motion.player} size={diameter} />
          </Animated.View>
        );
      })}
      {move.pushed > 0 && (
        <Animated.View
          style={{
            position: "absolute",
            left: size * 0.25,
            top: size * 0.25,
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: size,
            borderWidth: 2,
            borderColor: PLAYER_COLOR[move.motions[0].player],
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 0],
            }),
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 1.7],
                }),
              },
            ],
          }}
        />
      )}
      {move.out > 0 &&
        Array.from({ length: 8 }, (_, i) => (
          <Animated.View
            key={`p${i}`}
            style={{
              position: "absolute",
              left: size / 2,
              top: size / 2,
              width: 5,
              height: 5,
              backgroundColor: PLAYER_COLOR[move.motions[0].player],
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.cos((i * Math.PI) / 4) * size * 0.4],
                  }),
                },
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.sin((i * Math.PI) / 4) * size * 0.4],
                  }),
                },
              ],
            }}
          />
        ))}
    </View>
  );
}
export function Board({
  match,
  selection,
  moves,
  size,
  onCell,
  move,
  eventId,
  disabled,
}: {
  match: Match;
  selection: Hex[];
  moves: Move[];
  size: number;
  onCell: (h: Hex) => void;
  move?: Move;
  eventId: number;
  disabled: boolean;
}) {
  const c = useColors(),
    step = size / 10;
  const [shake] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!move?.pushed) return;
    const a = Animated.sequence(
      [3, -3, 2, -2, 0].map((toValue) =>
        Animated.timing(shake, {
          toValue,
          duration: 35,
          useNativeDriver: true,
        }),
      ),
    );
    a.start();
    return () => {
      a.stop();
      shake.setValue(0);
    };
  }, [eventId, move, shake]);
  return (
    <Animated.View
      style={{ width: size, height: size, transform: [{ translateX: shake }] }}
    >
      {CELLS.map((h) => {
        const p = point(h, step, size),
          player = match.board[key(h)],
          selected = selection.some((s) => key(s) === key(h)),
          guide = moves.some((m) => key(m.target) === key(h));
        return (
          <Pressable
            key={key(h)}
            disabled={disabled}
            onPress={() => onCell(h)}
            accessibilityRole="button"
            accessibilityLabel={`${h.r + 5}行 ${h.q + 5}列、${player ? `プレイヤー${player}の駒` : "空きマス"}${guide ? "、移動先" : ""}`}
            accessibilityState={{ selected, disabled }}
            style={{
              position: "absolute",
              left: p.x - step / 2,
              top: p.y - step / 2,
              width: step,
              height: step,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={{ position: "absolute" }}>
              <HexTile
                size={step * 1.08}
                color={
                  guide
                    ? PLAYER_COLOR[match.turn] + "55"
                    : selected
                      ? PLAYER_COLOR[match.turn] + "33"
                      : c.border
                }
              />
              <View style={{ position: "absolute", left: 1.5, top: 1.5 }}>
                <HexTile
                  size={step * 1.08 - 3}
                  color={guide ? PLAYER_COLOR[match.turn] + "22" : c.surface}
                />
              </View>
            </View>
            {player ? (
              <Piece player={player} size={step * 0.78} selected={selected} />
            ) : guide ? (
              <Text
                allowFontScaling={false}
                style={{
                  color: PLAYER_COLOR[match.turn],
                  fontWeight: "900",
                  fontSize: step * 0.5,
                }}
              >
                ＋
              </Text>
            ) : null}
          </Pressable>
        );
      })}
      {move && <MotionEffect key={eventId} move={move} size={size} />}
    </Animated.View>
  );
}

export function VictoryWave({ color }: { color: string }) {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const a = Animated.timing(progress, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [progress]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        inset: 0,
        borderWidth: 3,
        borderColor: color,
        borderRadius: 20,
        opacity: progress.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0, 1, 0],
        }),
        transform: [
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 1.1],
            }),
          },
        ],
      }}
    />
  );
}
