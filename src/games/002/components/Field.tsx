import { breakNotice } from "../presentation";
import { memo, useEffect, useMemo } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import type { BreakState } from "../logic/engine";
import { STAGES, type Brick } from "../stages";
import {
  WIDTH,
  PADDLE_BOTTOM,
  PADDLE_WIDTH,
  WIDE_PADDLE_WIDTH,
  RADIUS,
} from "../logic/physics";
import { colors as c, mono } from "@/theme";
const palette = [c.cyan, c.pink, c.purple, c.yellow, "#6DF5A5", "#599BFF"];
const Bricks = memo(function Bricks({
  bricks,
  scale,
  slide,
}: {
  bricks: Brick[];
  scale: number;
  slide: number;
}) {
  return (
    <>
      {bricks.map((b) => (
        <View
          key={b.id}
          style={{
            position: "absolute",
            left: b.x * scale,
            top: (b.y - (b.hp > 0 ? slide : 0)) * scale,
            width: b.w * scale,
            height: b.h * scale,
            borderRadius: 0,
            borderWidth: 0.5,
            borderColor: b.hp < 0 ? c.muted : palette[b.row % palette.length],
            backgroundColor:
              b.hp < 0
                ? c.elevated
                : palette[b.row % palette.length] +
                  (b.hp < b.maxHp ? "40" : "A0"),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {b.maxHp !== 1 && (
            <Text
              style={{ color: c.text, fontSize: 9 * scale, fontWeight: "800" }}
            >
              {b.hp < 0 ? "◆" : `${b.hp}${b.hp < b.maxHp ? "╱" : ""}`}
            </Text>
          )}
        </View>
      ))}
    </>
  );
});
type Props = {
  state: BreakState;
  scale: number;
  move: (x: number) => void;
  launch: () => void;
  cancel: () => void;
  getPaddle: () => number;
};
export function Field({
  state: s,
  scale,
  move,
  launch,
  cancel,
  getPaddle,
}: Props) {
  const phase = s.phase;
  const responder = useMemo(() => {
    const drag = { x: 0, active: false, moved: false };
    const cancelGesture = () => {
      drag.active = false;
      cancel();
    };
    const pan = PanResponder.create({
      onStartShouldSetPanResponder: () =>
        phase === "playing" || phase === "ready",
      onPanResponderGrant: (event) => {
        Object.assign(drag, {
          x: getPaddle(),
          active: event.nativeEvent.touches.length === 1,
          moved: false,
        });
      },
      onPanResponderStart: (event) => {
        if (event.nativeEvent.touches.length > 1) {
          drag.active = false;
          cancel();
        }
      },
      onPanResponderMove: (event, gesture) => {
        if (event.nativeEvent.touches.length !== 1) {
          drag.active = false;
          cancel();
        }
        if (!drag.active) return;
        if (Math.hypot(gesture.dx, gesture.dy) > 8) drag.moved = true;
        move(drag.x + gesture.dx / scale);
      },
      onPanResponderRelease: () => {
        if (drag.active && !drag.moved) launch();
        drag.active = false;
      },
      onPanResponderTerminate: () => {
        drag.active = false;
        cancel();
      },
      onPanResponderTerminationRequest: () => true,
    });
    return { ...pan, cancelGesture };
  }, [phase, scale, move, launch, cancel, getPaddle]);
  useEffect(() => {
    responder.cancelGesture();
    return responder.cancelGesture;
  }, [responder]);
  const neon = s.feverLeft > 0 ? c.pink : c.cyan;
  const width = s.wideLeft > 0 ? WIDE_PADDLE_WIDTH : PADDLE_WIDTH;
  const paddleY = s.height - PADDLE_BOTTOM;
  const compact = s.height < 460;
  return (
    <View
      testID="block-break-field"
      style={[
        styles.field,
        {
          width: WIDTH * scale + 2,
          height: s.height * scale + 2,
          borderColor: neon + "99",
          backgroundColor: s.feverLeft > 0 ? "#200D2D" : "#090B18",
        },
      ]}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Bricks bricks={s.bricks} scale={scale} slide={s.rowSlide} />
        {s.balls.map((ball) => (
          <View key={ball.id} style={StyleSheet.absoluteFill}>
            {ball.trail.map((p, i) => (
              <View
                key={i}
                style={[
                  styles.ball,
                  {
                    left: (p.x - 3) * scale,
                    top: (p.y - 3) * scale,
                    width: 6 * scale,
                    height: 6 * scale,
                    backgroundColor: neon,
                    opacity: (6 - i) / 12,
                  },
                ]}
              />
            ))}
            <View
              style={[
                styles.ball,
                {
                  left: (ball.x - RADIUS) * scale,
                  top: (ball.y - RADIUS) * scale,
                  width: RADIUS * 2 * scale,
                  height: RADIUS * 2 * scale,
                  backgroundColor: s.powerLeft > 0 ? c.yellow : c.text,
                  borderWidth: 2,
                  borderColor: s.powerLeft > 0 ? c.yellow : neon,
                },
              ]}
            />
          </View>
        ))}
        <View
          style={{
            position: "absolute",
            top: paddleY * scale,
            left: (s.paddle - width / 2) * scale,
            width: width * scale,
            height: 11 * scale,
            borderRadius: 6,
            backgroundColor: neon,
            borderTopWidth: 3,
            borderTopColor: c.text,
          }}
        />
        {s.items.map((i) => (
          <View
            key={i.id}
            style={{
              position: "absolute",
              left: (i.x - 11) * scale,
              top: (i.y - 9) * scale,
              width: 22 * scale,
              height: 18 * scale,
              backgroundColor: c.yellow,
              borderRadius: 4,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: c.background,
                fontSize: 10 * scale,
                fontWeight: "900",
              }}
            >
              {i.kind === "multi" ? "×3" : i.kind === "wide" ? "W" : "P"}
            </Text>
          </View>
        ))}
        {s.sparks.map((p) => (
          <View
            key={p.id}
            style={{
              position: "absolute",
              left: p.x * scale,
              top: p.y * scale,
              width: 3 * scale,
              height: 3 * scale,
              backgroundColor: palette[p.color % palette.length],
              opacity: Math.min(1, p.life / 0.25),
            }}
          />
        ))}
        {s.popups.map((p) => (
          <Text
            key={p.id}
            style={{
              position: "absolute",
              left: Math.min(300, p.x) * scale,
              top: p.y * scale,
              color: c.yellow,
              fontSize: 11 * scale,
              fontFamily: mono,
              fontWeight: "800",
              opacity: Math.min(1, p.life / 0.25),
            }}
          >
            +{p.value.toLocaleString()}
          </Text>
        ))}
        {s.flash > 0 && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: neon, opacity: s.flash * 0.25 },
            ]}
          />
        )}
        {s.phase === "ready" && (
          <View style={[styles.ready, compact && { top: "55%", gap: 4 }]}>
            {!compact && (
              <Text maxFontSizeMultiplier={1.2} style={styles.stage}>
                STAGE {String(s.stage + 1).padStart(2, "0")}
              </Text>
            )}
            <Text
              maxFontSizeMultiplier={1.2}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.launch}
            >
              {s.readyLeft > 0 ? "準備中…" : "タップしてボールを発射"}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.2}
              style={styles.hint}
            >
              {STAGES[s.stage].hint}
            </Text>
            {!compact && (
              <Text maxFontSizeMultiplier={1.2} style={styles.hint}>
                指を左右に動かしてバーを移動
              </Text>
            )}
          </View>
        )}
        {s.noticeLeft > 0 && s.phase === "playing" && (
          <Text
            style={[
              styles.notice,
              {
                color: s.feverLeft > 0 ? c.pink : c.yellow,
                fontSize: Math.min(23, 15 + s.combo / 5),
              },
            ]}
          >
            {breakNotice(s.notice)}
          </Text>
        )}
        <View
          style={{
            position: "absolute",
            left: 15,
            right: 15,
            top: (paddleY + 24) * scale,
            alignItems: "center",
          }}
        >
          <Text maxFontSizeMultiplier={1.2} style={styles.hint}>
            ← 指を左右に動かす →
          </Text>
        </View>
      </View>
      <View
        style={StyleSheet.absoluteFill}
        {...responder.panHandlers}
        accessible={false}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  field: { borderWidth: 1, borderRadius: 10, overflow: "hidden" },
  ball: { position: "absolute", borderRadius: 20 },
  ready: {
    position: "absolute",
    top: "58%",
    width: "100%",
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
  },
  stage: {
    color: c.cyan,
    fontSize: 14,
    fontFamily: mono,
    fontWeight: "800",
    letterSpacing: 2,
  },
  launch: { color: c.text, fontSize: 19, fontWeight: "900" },
  hint: { color: c.text, fontSize: 12 },
  notice: {
    position: "absolute",
    top: "47%",
    width: "100%",
    textAlign: "center",
    fontFamily: mono,
    fontWeight: "900",
  },
});
