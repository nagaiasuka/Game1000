import { useRef, useState } from "react";
import { Text, View, type GestureResponderEvent } from "react-native";
import {
  WIDTH,
  RADIUS,
  GATE,
  WALL,
  aim,
  type SlingEngine,
  type State,
} from "../logic/engine";
import { VictoryWave } from "./VictoryWave";
const COLORS = { 1: "#00F5FF", 2: "#FF2BD6" };
function Line({
  x,
  y,
  dx,
  dy,
  color,
  width = 2,
}: {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  width?: number;
}) {
  const length = Math.hypot(dx, dy);
  return (
    <View
      style={{
        position: "absolute",
        left: x + dx / 2 - length / 2,
        top: y + dy / 2 - width / 2,
        width: length,
        height: width,
        borderRadius: 2,
        backgroundColor: color,
        transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
      }}
    />
  );
}
export function Field({
  engine,
  state,
  onLayout,
  onInput,
}: {
  engine: SlingEngine;
  state: State;
  onLayout: (width: number, height: number) => void;
  onInput: () => void;
}) {
  const ref = useRef<View>(null),
    origin = useRef({ x: 0, y: 0 });
  const [width, setWidth] = useState(0);
  const scale = width / WIDTH,
    height = state.height * scale,
    mid = height / 2;
  const touch = (
    kind: "start" | "move" | "end" | "cancel",
    event: GestureResponderEvent,
  ) => {
    if (!scale) return;
    for (const t of event.nativeEvent.changedTouches) {
      const x = (t.pageX - origin.current.x) / scale,
        y = (t.pageY - origin.current.y) / scale;
      if (kind === "start")
        engine.begin(t.identifier, x, y, Math.max(RADIUS * 1.65, 22 / scale));
      else if (kind === "cancel") engine.cancel(t.identifier);
      else {
        engine.move(t.identifier, x, y);
        if (kind === "end") engine.release(t.identifier);
      }
    }
    onInput();
  };
  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ flex: 1, overflow: "hidden", backgroundColor: "#070D1B" }}
      onLayout={({ nativeEvent: { layout } }) => {
        setWidth(layout.width);
        onLayout(layout.width, layout.height);
        ref.current?.measureInWindow((x, y) => {
          origin.current = { x, y };
        });
      }}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => true}
      onResponderTerminate={() => {
        engine.cancelAll();
        onInput();
      }}
      onTouchStart={(e) => touch("start", e)}
      onTouchMove={(e) => touch("move", e)}
      onTouchEnd={(e) => touch("end", e)}
      onTouchCancel={(e) => touch("cancel", e)}
    >
      <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
        {([2, 1] as const).map((p) => {
          const top = p === 2 ? 0 : mid;
          const near = state.counts[p] === 1;
          return (
            <View
              key={p}
              style={{
                position: "absolute",
                left: 0,
                top,
                width,
                height: mid,
                borderWidth: 2,
                borderTopWidth: p === 2 ? 2 : 0,
                borderBottomWidth: p === 1 ? 2 : 0,
                borderColor:
                  COLORS[p] +
                  (near
                    ? Math.round((0.45 + 0.3 * Math.sin(state.time * 5)) * 255)
                        .toString(16)
                        .padStart(2, "0")
                    : "60"),
                backgroundColor: COLORS[p] + "08",
              }}
            >
              <View
                style={{
                  position: "absolute",
                  inset: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.05,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 100,
                    fontWeight: "900",
                    color: COLORS[p],
                    transform: p === 2 ? [{ rotate: "180deg" }] : [],
                  }}
                >
                  {p}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.1}
                style={{
                  position: "absolute",
                  left: 8,
                  right: 8,
                  top: p === 2 ? 14 : undefined,
                  bottom: p === 1 ? 14 : undefined,
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: "800",
                  color: COLORS[p],
                  transform: p === 2 ? [{ rotate: "180deg" }] : [],
                }}
              >
                プレイヤー{p} · 手前に引いて、離す
              </Text>
              {state.winner === p && (
                <VictoryWave color={COLORS[p]} size={width * 0.7} />
              )}
              {state.winner === p && (
                <View
                  style={{
                    position: "absolute",
                    inset: 8,
                    borderWidth: 4,
                    borderRadius: 24,
                    borderColor: COLORS[p],
                    opacity: 0.4 + 0.25 * Math.sin(state.time * 5),
                    backgroundColor: COLORS[p] + "18",
                  }}
                />
              )}
            </View>
          );
        })}
        {[0, (WIDTH + GATE) / 2].map((x) => (
          <View
            key={x}
            style={{
              position: "absolute",
              left: x * scale,
              top: mid - (WALL / 2) * scale,
              width: ((WIDTH - GATE) / 2) * scale,
              height: WALL * scale,
              backgroundColor: "#A88AFF",
              shadowColor: "#A88AFF",
              shadowRadius: 5,
              shadowOpacity: 0.8,
            }}
          />
        ))}
        <View
          style={{
            position: "absolute",
            left: ((WIDTH - GATE) / 2) * scale,
            top: mid - 12,
            width: GATE * scale,
            height: 24,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: state.gateGlow > 0 ? "#FFE600" : "#FFE60055",
            backgroundColor: state.gateGlow > 0 ? "#FFE60033" : "transparent",
          }}
        />
        {state.pucks.map((p) => {
          const x = p.x * scale,
            y = p.y * scale,
            r = RADIUS * scale,
            speed = Math.hypot(p.vx, p.vy),
            held = state.holds.find((h) => h.puck === p.id);
          return (
            <View key={p.id} style={{ position: "absolute", left: 0, top: 0 }}>
              {speed > 70 &&
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <View
                    key={i}
                    style={{
                      position: "absolute",
                      left: x - p.vx * 0.012 * i * scale - r * 0.8,
                      top: y - p.vy * 0.012 * i * scale - r * 0.8,
                      width: r * 1.6,
                      height: r * 1.6,
                      borderRadius: r,
                      backgroundColor: COLORS[p.side],
                      opacity: (p.flash > 0.15 ? 0.65 : 0.4) / (i * 0.7 + 1),
                    }}
                  />
                ))}
              <View
                style={{
                  position: "absolute",
                  left: x - r,
                  top: y - r,
                  width: r * 2,
                  height: r * 2,
                  borderRadius: r,
                  borderWidth: 2,
                  borderColor: held ? COLORS[p.side] : "#D5F9FF",
                  backgroundColor: p.flash > 0 ? "#FFFFFF" : "#DBF5FF",
                  shadowColor: COLORS[p.side],
                  shadowOpacity: 0.8,
                  shadowRadius: held ? 14 : p.flash > 0 ? 14 : 6,
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    inset: r * 0.5,
                    borderWidth: 1,
                    borderRadius: r,
                    borderColor: "#5B7188",
                  }}
                />
              </View>
            </View>
          );
        })}
        {state.holds.map((h) => {
          const p = state.pucks.find((p) => p.id === h.puck)!;
          const a = aim(h);
          const color =
            a.power > 0.95
              ? "#FFE600"
              : a.power > 0.65
                ? "#FF2BD6"
                : a.power > 0.3
                  ? "#A88AFF"
                  : "#00F5FF";
          const x = p.x * scale,
            y = p.y * scale;
          const dx = -h.dx * 1.4 * scale,
            dy = -h.dy * 1.4 * scale;
          const angle = Math.atan2(dy, dx);
          return (
            <View key={h.touch} style={{ position: "absolute", inset: 0 }}>
              <Line
                x={x}
                y={y}
                dx={h.dx * scale}
                dy={h.dy * scale}
                color={color + "80"}
              />
              <View
                style={{
                  position: "absolute",
                  left: x + h.dx * scale - 8,
                  top: y + h.dy * scale - 8,
                  width: 16,
                  height: 16,
                  borderWidth: 2,
                  borderColor: color,
                  borderRadius: 8,
                }}
              />
              <Line
                x={x}
                y={y}
                dx={dx}
                dy={dy}
                color={color}
                width={2 + a.power * 3}
              />
              {a.power > 0.1 &&
                [-1, 1].map((sign) => (
                  <Line
                    key={sign}
                    x={x + dx}
                    y={y + dy}
                    dx={-10 * Math.cos(angle + sign * 0.5)}
                    dy={-10 * Math.sin(angle + sign * 0.5)}
                    color={color}
                    width={3}
                  />
                ))}
            </View>
          );
        })}
        {state.gateGlow > 0 && (
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: mid - 4 - (1 - state.gateGlow / 0.6) * 65,
              height: 8 + (1 - state.gateGlow / 0.6) * 130,
              borderTopWidth: 2,
              borderBottomWidth: 2,
              borderColor: "#FFE600",
              backgroundColor: "#FFE6000C",
              opacity: state.gateGlow / 0.6,
            }}
          />
        )}
        {state.sparks.map((s) => {
          const progress = Math.min(1, s.age / 0.55),
            count = s.gate ? 16 : s.shot ? 12 : 8;
          const color = s.gate ? "#FFE600" : s.shot ? "#00F5FF" : "#C6A6FF";
          const radius =
            (10 + progress * (s.gate ? 95 : s.shot ? 65 : 40)) * scale;
          return (
            <View key={s.id} style={{ position: "absolute", inset: 0 }}>
              <View
                style={{
                  position: "absolute",
                  left: s.x * scale - radius,
                  top: s.y * scale - radius,
                  width: radius * 2,
                  height: radius * 2,
                  borderRadius: radius,
                  borderWidth: s.gate ? 3 : 2,
                  borderColor: color,
                  opacity: (1 - progress) * 0.85,
                }}
              />
              {Array.from({ length: count }, (_, i) => {
                const angle = (i * Math.PI * 2) / count,
                  distance =
                    (12 + progress * (s.gate ? 125 : 75)) *
                    (i % 2 ? 0.8 : 1) *
                    scale;
                return (
                  <View
                    key={i}
                    style={{
                      position: "absolute",
                      left: s.x * scale + Math.cos(angle) * distance - 6,
                      top: s.y * scale + Math.sin(angle) * distance - 2,
                      width: s.gate ? 14 : 10,
                      height: i % 3 ? 3 : 5,
                      borderRadius: 2,
                      backgroundColor: i % 3 === 0 ? "#FFFFFF" : color,
                      opacity: 1 - progress,
                      transform: [{ rotate: `${angle}rad` }],
                    }}
                  />
                );
              })}
            </View>
          );
        })}
        {(state.phase === "countdown" ||
          (state.phase === "playing" && state.time < 3.55)) && (
          <View
            style={{
              position: "absolute",
              inset: 0,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {[true, false].map((up) => (
              <Text
                key={String(up)}
                maxFontSizeMultiplier={1.1}
                style={{
                  color: "#FFFFFF",
                  fontSize: state.phase === "countdown" ? 64 : 28,
                  fontWeight: "900",
                  transform: up ? [{ rotate: "180deg" }] : [],
                  backgroundColor: "#070D1BEE",
                  paddingHorizontal: 16,
                  borderRadius: 12,
                }}
              >
                {state.phase === "countdown"
                  ? Math.ceil(state.countdown)
                  : "スタート！"}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
