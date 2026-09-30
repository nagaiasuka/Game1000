import { useEffect, useMemo, useState, type RefObject } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import {
  legalMoves,
  same,
  wallError,
  type Candidate,
  type Match,
  type Point,
  type Wall,
} from "../logic/engine";
import { PathPerson } from "@/components/path-person";
import { PLAYER_COLOR } from "../presentation";

function Barrier({
  wall,
  unit,
  flash = false,
  invalid = false,
  preview = false,
}: {
  wall: Candidate & { owner?: 1 | 2 };
  unit: number;
  flash?: boolean;
  invalid?: boolean;
  preview?: boolean;
}) {
  const [light] = useState(() => new Animated.Value(flash ? 0 : 1));
  useEffect(() => {
    if (!flash) return;
    light.setValue(0);
    const a = Animated.timing(light, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [flash, light]);
  const horizontal = wall.orientation === "horizontal";
  const color = invalid
    ? "#FF806F"
    : preview
      ? "#FFFFFF"
      : PLAYER_COLOR[wall.owner ?? 1];
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: horizontal ? wall.col * unit + 2 : (wall.col + 1) * unit - 3,
        top: horizontal ? (wall.row + 1) * unit - 3 : wall.row * unit + 2,
        width: horizontal ? unit * 2 - 4 : 6,
        height: horizontal ? 6 : unit * 2 - 4,
        borderRadius: 3,
        backgroundColor: color,
        opacity: light,
        shadowColor: color,
        shadowOpacity: 0.9,
        shadowRadius: preview ? 9 : 4,
        transform: [
          {
            scale: light.interpolate({
              inputRange: [0, 1],
              outputRange: [0.65, 1],
            }),
          },
        ],
        borderWidth: preview ? 1 : 0,
        borderColor: "#070711",
      }}
    />
  );
}
function GoalGlow({ size, color }: { size: number; color: string }) {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const a = Animated.timing(progress, {
      toValue: 1,
      duration: 1100,
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
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 3,
        borderColor: color,
        opacity: progress.interpolate({
          inputRange: [0, 0.2, 1],
          outputRange: [0, 1, 0],
        }),
        transform: [
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.4, 3],
            }),
          },
        ],
      }}
    >
      {Array.from({ length: 8 }, (_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: color,
            left: size / 2 + (Math.cos((i * Math.PI) / 4) * size) / 2 - 2,
            top: size / 2 + (Math.sin((i * Math.PI) / 4) * size) / 2 - 2,
          }}
        />
      ))}
    </Animated.View>
  );
}
export function Board({
  match,
  size,
  mode,
  candidate,
  orientation,
  boardRef,
  onMove,
  onSelectPawn,
  disabled,
}: {
  match: Match;
  size: number;
  mode: "move" | "wall";
  candidate: Candidate | null;
  orientation: Candidate["orientation"];
  boardRef: RefObject<View | null>;
  onMove: (p: Point) => void;
  onSelectPawn: () => void;
  disabled: boolean;
}) {
  const unit = size / 9;
  const moves = useMemo(() => legalMoves(match), [match]);
  const candidates = useMemo(
    () =>
      mode === "wall"
        ? Array.from({ length: 64 }, (_, i) => ({
            row: Math.floor(i / 8),
            col: i % 8,
            orientation,
          })).filter((c) => !wallError(match, c))
        : [],
    [match, mode, orientation],
  );
  const previewError = candidate ? wallError(match, candidate) : null;
  return (
    <View
      ref={boardRef}
      collapsable={false}
      style={{
        width: size,
        height: size,
        backgroundColor: "#0B101F",
      }}
    >
      {Array.from({ length: 81 }, (_, i) => {
        const p = { row: Math.floor(i / 9), col: i % 9 };
        const owner = same(p, match.pawns[1])
          ? 1
          : same(p, match.pawns[2])
            ? 2
            : null;
        const legal = mode === "move" && moves.some((q) => same(p, q));
        const color = PLAYER_COLOR[owner ?? match.turn];
        return (
          <Pressable
            key={i}
            disabled={disabled || !!match.winner || mode === "wall"}
            accessibilityRole="button"
            accessibilityLabel={`${p.row + 1}行${p.col + 1}列${owner ? `、プレイヤー${owner}の駒` : legal ? "、移動できます" : ""}`}
            accessibilityState={{
              disabled:
                disabled || !!match.winner || (!legal && owner !== match.turn),
            }}
            onPress={() => (owner === match.turn ? onSelectPawn() : onMove(p))}
            style={{
              position: "absolute",
              left: p.col * unit + 2,
              top: p.row * unit + 2,
              width: unit - 4,
              height: unit - 4,
              borderWidth: 1,
              borderColor: legal ? color + "AA" : "#253047",
              backgroundColor: legal ? color + "20" : "#111725",
              borderRadius: 4,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {owner ? (
              <>
                <PathPerson player={owner} size={unit * 0.8} />
                {match.winner === owner && (
                  <GoalGlow key={match.moves} size={unit} color={color} />
                )}
              </>
            ) : legal ? (
              <Text
                allowFontScaling={false}
                style={{ color, fontSize: unit * 0.42 }}
              >
                ＋
              </Text>
            ) : null}
          </Pressable>
        );
      })}
      {([1, 2] as const).map((p) => (
        <View
          key={`goal-${p}`}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: p === 1 ? 0 : undefined,
            bottom: p === 2 ? 0 : undefined,
            height: match.winner === p ? 4 : 2,
            backgroundColor: PLAYER_COLOR[p],
            shadowColor: PLAYER_COLOR[p],
            shadowOpacity: match.winner === p ? 1 : 0,
            shadowRadius: 12,
          }}
        />
      ))}
      {match.walls.map((wall: Wall, i) => (
        <Barrier
          key={`${i}-${wall.row}-${wall.col}-${wall.orientation}`}
          wall={wall}
          unit={unit}
          flash={i === match.walls.length - 1}
        />
      ))}
      {mode === "wall" && (
        <View style={{ position: "absolute", inset: 0 }} pointerEvents="none">
          <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
            {candidates.map((c) => (
              <View
                key={`${c.row}-${c.col}`}
                style={{
                  position: "absolute",
                  left: (c.col + 1) * unit - 3,
                  top: (c.row + 1) * unit - 3,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#FFFFFF",
                  opacity: 0.65,
                }}
              />
            ))}
            {candidate && (
              <Barrier
                wall={candidate}
                unit={unit}
                preview
                invalid={!!previewError}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
}
