import { useEffect, useRef, useState, type RefObject } from "react";
import { AppState, Text, View } from "react-native";
import { audio } from "@/audio/native";
import { wallAt, isDrag, type BoardRect } from "../logic/gestures";
import type { Candidate } from "../logic/engine";

export function WallTray({
  boardRef,
  count,
  color,
  disabled,
  onPreview,
  onDrop,
}: {
  boardRef: RefObject<View | null>;
  count: number;
  color: string;
  disabled: boolean;
  onPreview: (candidate: Candidate | null, dragging: boolean) => void;
  onDrop: (candidate: Candidate) => void;
}) {
  const [orientation, setOrientation] =
    useState<Candidate["orientation"]>("horizontal");
  const gesture = useRef<{
    start: { x: number; y: number };
    rect: BoardRect | null;
    dragged: boolean;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const cancel = () => {
    gesture.current = null;
    setDragging(false);
    onPreview(null, false);
  };
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        gesture.current = null;
        setDragging(false);
        onPreview(null, false);
      }
    });
    return () => sub.remove();
  }, [onPreview]);
  const rotate = () => {
    audio.play("ui");
    setOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"));
  };
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`壁 残り${count}枚、${orientation === "horizontal" ? "横向き" : "縦向き"}。タップで回転、盤面へ引っ張って離すと配置`}
      accessibilityState={{ disabled: disabled || count === 0 }}
      accessibilityActions={[{ name: "activate", label: "壁を回転" }]}
      onAccessibilityAction={() => {
        if (!disabled && count > 0) rotate();
      }}
      onStartShouldSetResponder={() => !disabled && count > 0}
      onResponderGrant={(e) => {
        const current = {
          start: { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
          rect: null as BoardRect | null,
          dragged: false,
        };
        gesture.current = current;
        boardRef.current?.measureInWindow((x, y, width, height) => {
          if (gesture.current === current)
            current.rect = { x, y, width, height };
        });
      }}
      onResponderMove={(e) => {
        const g = gesture.current;
        if (!g || disabled) return;
        const p = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        g.dragged ||= isDrag(g.start, p);
        if (g.dragged) {
          setDragging(true);
          onPreview(
            g.rect ? wallAt(p.x, p.y, g.rect, orientation) : null,
            true,
          );
        }
      }}
      onResponderRelease={(e) => {
        const g = gesture.current;
        if (!g) return;
        const p = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        const moved = g.dragged || isDrag(g.start, p);
        const target =
          moved && g.rect ? wallAt(p.x, p.y, g.rect, orientation) : null;
        cancel();
        if (disabled || AppState.currentState !== "active") return;
        if (!moved) rotate();
        else if (target) onDrop(target);
      }}
      onResponderTerminationRequest={() => true}
      onResponderTerminate={cancel}
      style={{
        flex: 1,
        height: 48,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        opacity: disabled || !count ? 0.3 : 1,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          width: 48,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {[2, 1, 0].map((i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              width: orientation === "horizontal" ? 42 : 6,
              height: orientation === "horizontal" ? 6 : 38,
              borderRadius: 3,
              backgroundColor: color,
              opacity: i ? 0.25 : dragging ? 0.4 : 1,
              transform: [{ translateX: i * 3 }, { translateY: i * 4 }],
            }}
          />
        ))}
      </View>
      <Text
        pointerEvents="none"
        numberOfLines={2}
        maxFontSizeMultiplier={1.15}
        style={{ fontSize: 12, lineHeight: 17, color: "#F5F5FF" }}
      >
        {dragging ? "離すと配置" : "壁を引っ張る"}
        {"\n"}タップで縦・横
      </Text>
    </View>
  );
}
