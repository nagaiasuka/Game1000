import { memo, useMemo, useState } from "react";
import { PanResponder, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { useColors } from "@/theme/ThemeProvider";
import {
  HEIGHT,
  LAUNCH,
  MAX_BALLS,
  RADIUS,
  SHOT_SPEED,
  GRAVITY,
  WIDTH,
  type Stage,
} from "../logic/types";
import { sweepRect, sweepCircle, clamp } from "../logic/physics";
import type { Hud } from "../useNeonCascade";
const KIND_COLOR = {
  normal: "#00F5FF",
  armor: "#A88AFF",
  bomb: "#FF2BD6",
  switch: "#FFE600",
  core: "#FFE600",
};
const BallNode = memo(function BallNode({
  index,
  frame,
  scale,
  color,
}: {
  index: number;
  frame: SharedValue<number[]>;
  scale: number;
  color: string;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: frame.value[index * 4 + 2],
    transform: [
      { translateX: frame.value[index * 4] * scale },
      { translateY: frame.value[index * 4 + 1] * scale },
    ],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: -RADIUS * scale,
          top: -RADIUS * scale,
          width: RADIUS * 2 * scale,
          height: RADIUS * 2 * scale,
          borderRadius: 20,
          backgroundColor: "#F1FFFF",
          borderWidth: 1,
          borderColor: color,
        },
        style,
      ]}
    />
  );
});
const GateNode = memo(function GateNode({
  stage,
  index,
  frame,
  scale,
}: {
  stage: Stage;
  index: number;
  frame: SharedValue<number[]>;
  scale: number;
}) {
  const g = stage.gates[index];
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: frame.value[MAX_BALLS * 4 + g.id] * scale }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: g.y * scale - 8,
          width: g.w * scale,
          height: 17,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: "#6DF5A5",
          backgroundColor: "#113C35",
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={{ color: "#9CFFD0", fontSize: 10, fontWeight: "900" }}
      >
        ×{g.factor}
        {g.motion ? " ↔" : ""}
      </Text>
    </Animated.View>
  );
});
function preview(stage: Stage, angle: number, open: boolean) {
  const points = [{ x: LAUNCH.x, y: LAUNCH.y }];
  let x = LAUNCH.x,
    y = LAUNCH.y,
    vx = Math.sin(angle) * SHOT_SPEED,
    vy = -Math.cos(angle) * SHOT_SPEED;
  for (let i = 0; i < 27; i++) {
    const dt = 0.025;
    vy += GRAVITY * dt;
    const dx = vx * dt,
      dy = vy * dt;
    if (
      stage.bricks.some(
        (b) => b.hp > 0 && sweepRect(x, y, dx, dy, b, RADIUS),
      ) ||
      stage.walls.some(
        (w) => (!w.door || !open) && sweepRect(x, y, dx, dy, w, RADIUS),
      ) ||
      stage.bumpers.some((b) =>
        sweepCircle(x, y, dx, dy, b.x, b.y, b.r + RADIUS),
      )
    )
      break;
    x += dx;
    y += dy;
    if (x < RADIUS || x > WIDTH - RADIUS) {
      x = clamp(x, RADIUS, WIDTH - RADIUS);
      vx = -vx;
    }
    if (y < RADIUS) break;
    points.push({ x, y });
  }
  return points;
}
export function Field({
  hud,
  frame,
  reducedEffects,
  onAim,
  onLaunch,
  onCancel,
}: {
  hud: Hud;
  frame: SharedValue<number[]>;
  reducedEffects: boolean;
  onAim: (angle: number) => void;
  onLaunch: () => void;
  onCancel: () => void;
}) {
  const c = useColors(),
    [area, setArea] = useState({ width: 0, height: 0 });
  const scale = Math.min(area.width / WIDTH, area.height / HEIGHT),
    canAim = ["ready", "aiming"].includes(hud.phase);
  const pan = useMemo(() => {
    const drag = { valid: false };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => canAim,
      onPanResponderGrant: (e) => {
        drag.valid =
          e.nativeEvent.touches.length === 1 &&
          e.nativeEvent.locationY / scale < LAUNCH.y - 24;
        if (drag.valid)
          onAim(
            Math.atan2(
              e.nativeEvent.locationX / scale - LAUNCH.x,
              LAUNCH.y - e.nativeEvent.locationY / scale,
            ),
          );
      },
      onPanResponderMove: (e) => {
        if (e.nativeEvent.touches.length !== 1) {
          drag.valid = false;
          onCancel();
        }
        if (drag.valid)
          onAim(
            Math.atan2(
              e.nativeEvent.locationX / scale - LAUNCH.x,
              LAUNCH.y - e.nativeEvent.locationY / scale,
            ),
          );
      },
      onPanResponderRelease: () => {
        if (drag.valid) onLaunch();
        drag.valid = false;
      },
      onPanResponderStart: (e) => {
        if (e.nativeEvent.touches.length > 1) {
          drag.valid = false;
          onCancel();
        }
      },
      onPanResponderTerminate: () => {
        drag.valid = false;
        onCancel();
      },
      onPanResponderTerminationRequest: () => true,
    });
  }, [canAim, onAim, onLaunch, onCancel, scale]);
  const points = canAim ? preview(hud.stage, hud.angle, hud.open) : [];
  const fever = hud.feverLeft > 0;
  return (
    <View
      testID="cascade-field-container"
      onLayout={(e) => setArea(e.nativeEvent.layout)}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 160,
      }}
    >
      {scale > 0 && (
        <View
          testID="cascade-field"
          {...pan.panHandlers}
          style={{
            width: WIDTH * scale,
            height: HEIGHT * scale,
            backgroundColor: "#091522",
            overflow: "hidden",
            borderWidth: 1,
            borderRadius: 14,
            borderColor: fever ? c.pink : c.cyan + "88",
          }}
        >
          <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 11 }, (_, i) => (
              <View
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: (i + 1) * 50 * scale,
                  borderTopWidth: 0.5,
                  borderColor: "#FFFFFF09",
                }}
              />
            ))}
            {hud.stage.walls.map((w) =>
              w.door && hud.open ? null : (
                <View
                  key={w.id}
                  style={{
                    position: "absolute",
                    left: w.x * scale,
                    top: w.y * scale,
                    width: w.w * scale,
                    height: w.h * scale,
                    backgroundColor: w.door ? "#8D753B" : "#344253",
                    borderWidth: 1,
                    borderColor: w.door ? c.yellow : "#71859A",
                  }}
                />
              ),
            )}
            {hud.stage.bumpers.map((b) => (
              <View
                key={b.id}
                style={{
                  position: "absolute",
                  left: (b.x - b.r) * scale,
                  top: (b.y - b.r) * scale,
                  width: b.r * 2 * scale,
                  height: b.r * 2 * scale,
                  borderRadius: 100,
                  borderWidth: 2,
                  borderColor: c.pink,
                  backgroundColor: "#4B1745",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{ color: "#FFD8F6", fontSize: 12 }}
                >
                  ↗
                </Text>
              </View>
            ))}
            {hud.stage.bricks.map((b) =>
              b.hp <= 0 ? null : (
                <View
                  key={b.id}
                  style={{
                    position: "absolute",
                    left: b.x * scale,
                    top: b.y * scale,
                    width: b.w * scale,
                    height: b.h * scale,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: KIND_COLOR[b.kind],
                    backgroundColor:
                      KIND_COLOR[b.kind] +
                      (b.kind === "core" && !fever ? "25" : "75"),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: Math.max(8, 10 * scale),
                      color: "#FFFFFF",
                      fontWeight: "800",
                    }}
                  >
                    {b.kind === "bomb"
                      ? "●"
                      : b.kind === "switch"
                        ? "鍵"
                        : b.kind === "core"
                          ? "核"
                          : b.hp > 1
                            ? b.hp
                            : ""}
                  </Text>
                </View>
              ),
            )}
            {hud.stage.gates.map((g, i) => (
              <GateNode
                key={g.id}
                stage={hud.stage}
                index={i}
                frame={frame}
                scale={scale}
              />
            ))}
            {!reducedEffects &&
              hud.sparks.map((p) => (
                <View
                  key={p.id}
                  style={{
                    position: "absolute",
                    left: p.x * scale - 11,
                    top: p.y * scale - 11,
                    width: 22,
                    height: 22,
                    borderRadius: 30,
                    borderWidth: 2,
                    borderColor:
                      p.kind === "bomb"
                        ? c.pink
                        : p.kind === "gate"
                          ? "#6DF5A5"
                          : c.cyan,
                    opacity: Math.max(0, 1 - p.age / 0.45),
                    transform: [{ scale: 1 + p.age * 3 }],
                  }}
                />
              ))}
            {Array.from({ length: MAX_BALLS }, (_, i) => (
              <BallNode
                key={i}
                index={i}
                frame={frame}
                scale={scale}
                color={fever ? c.pink : c.cyan}
              />
            ))}
            {points
              .filter((_, i) => i % 2 === 0)
              .map((p, i) => (
                <View
                  key={i}
                  style={{
                    position: "absolute",
                    left: p.x * scale - 2,
                    top: p.y * scale - 2,
                    width: 4,
                    height: 4,
                    borderRadius: 3,
                    backgroundColor: c.cyan,
                    opacity: 1 - i * 0.055,
                  }}
                />
              ))}
            <View
              style={{
                position: "absolute",
                left: LAUNCH.x * scale - 15,
                top: LAUNCH.y * scale - 8,
                width: 30,
                height: 19,
                borderRadius: 9,
                borderWidth: 2,
                borderColor: c.cyan,
                backgroundColor: "#123748",
              }}
            />
            {canAim && (
              <Text
                maxFontSizeMultiplier={1.1}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 7,
                  color: c.muted,
                  fontSize: 11,
                  textAlign: "center",
                }}
              >
                狙う → 指を離して発射
              </Text>
            )}
            {fever && (
              <Text
                allowFontScaling={false}
                style={{
                  position: "absolute",
                  top: 8,
                  left: 0,
                  right: 0,
                  color: c.pink,
                  fontSize: 16,
                  fontWeight: "900",
                  textAlign: "center",
                }}
              >
                フィーバー！ 得点×2
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
