import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  FishHead,
  FishTail,
  SmallFish,
  FishingHook,
} from "@/components/neon-fish";
import { PLAYER_COLORS, type Match } from "../logic/engine";

function SwimmingFish({
  label,
  id,
  color,
  selected,
  disabled,
  onPress,
  moving,
}: {
  label: string;
  id: number;
  color: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  moving: boolean;
}) {
  const drift = useState(() => new Animated.Value(0))[0];
  const hook = useState(() => new Animated.Value(-80))[0];
  useEffect(() => {
    if (!selected) {
      hook.setValue(-80);
      return;
    }
    if (!moving) {
      hook.stopAnimation();
      return;
    }
    const motion = Animated.timing(hook, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    motion.start();
    return () => motion.stop();
  }, [hook, selected, moving]);
  useEffect(() => {
    if (!moving) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 1300 + id * 90,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 1300 + id * 90,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift, id, moving]);
  return (
    <Animated.View
      style={{
        transform: [
          {
            translateY: drift.interpolate({
              inputRange: [0, 1],
              outputRange: [-4, 4],
            }),
          },
          {
            rotate: drift.interpolate({
              inputRange: [0, 1],
              outputRange: ["-5deg", "5deg"],
            }),
          },
        ],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}${selected ? "、針がかかっています" : "を選ぶ"}`}
        accessibilityState={{ disabled, selected }}
        disabled={disabled}
        onPress={onPress}
        style={{
          width: 80,
          minHeight: 78,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 24,
          borderWidth: 2,
          borderColor: selected ? "#FFFFFF" : "transparent",
          backgroundColor: selected ? color + "22" : "transparent",
        }}
      >
        {selected && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -23,
              transform: [{ translateY: hook }],
            }}
          >
            <View
              style={{
                width: 1,
                height: 18,
                backgroundColor: "#E9FFFF99",
                alignSelf: "center",
              }}
            />
            <FishingHook />
          </Animated.View>
        )}
        <SmallFish color={color} />
        <View style={{ height: 14 }}>
          {selected && (
            <Text
              allowFontScaling={false}
              style={{ color: "#FFFFFF", fontSize: 12 }}
            >
              ✓
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
function Block({ color, paused }: { color: string; paused: boolean }) {
  const spring = useState(() => new Animated.Value(0.08))[0];
  useEffect(() => {
    if (paused) {
      spring.stopAnimation();
      return;
    }
    const a = Animated.spring(spring, {
      toValue: 1,
      friction: 5,
      tension: 160,
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [spring, paused]);
  return (
    <Animated.View
      style={{
        height: 16,
        width: 42,
        transform: [
          { scaleY: spring },
          {
            scaleX: spring.interpolate({
              inputRange: [0, 1],
              outputRange: [1.35, 1],
            }),
          },
        ],
        backgroundColor: color + "99",
        borderColor: color,
        borderWidth: 2,
        borderRadius: 4,
        shadowColor: color,
        shadowRadius: 10,
        shadowOpacity: 0.7,
      }}
    >
      <View style={{ height: 2, backgroundColor: "#FFFFFF88", marginTop: 3 }} />
    </Animated.View>
  );
}
export function Pond({
  match,
  paused,
  onSelect,
  onLift,
}: {
  match: Match;
  paused: boolean;
  onSelect: (id: number) => void;
  onLift: () => void;
}) {
  const [area, setArea] = useState({ width: 300, height: 360 });
  const color = PLAYER_COLORS[match.turn];
  const growing = ["lifting", "stretching", "caught"].includes(match.phase);
  const rise = useState(() => new Animated.Value(0))[0];
  const splash = useState(() => new Animated.Value(0))[0];
  const touch = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (paused) {
      rise.stopAnimation();
      splash.stopAnimation();
      return;
    }
    if (!growing) {
      rise.setValue(0);
      splash.setValue(0);
      return;
    }
    const motion = Animated.spring(rise, {
      toValue: match.revealed * 16,
      friction: 6,
      tension: 130,
      useNativeDriver: true,
    });
    motion.start();
    if (match.phase === "lifting")
      Animated.timing(splash, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }).start();
    return () => {
      motion.stop();
      splash.stopAnimation();
    };
  }, [match.revealed, match.phase, paused, growing, rise, splash]);
  const fishColor = PLAYER_COLORS[(match.selected ?? 0) % 4];
  return (
    <View
      onLayout={(e) => setArea(e.nativeEvent.layout)}
      testID="fish-pond"
      style={[styles.pond, { borderColor: color, shadowColor: color }]}
      onTouchStart={(e) => {
        const point = e.nativeEvent.touches[0] ?? e.nativeEvent;
        touch.current =
          e.nativeEvent.touches.length === 1
            ? { x: point.pageX, y: point.pageY }
            : null;
      }}
      onTouchEnd={(e) => {
        const t = touch.current;
        const point = e.nativeEvent.changedTouches[0] ?? e.nativeEvent;
        touch.current = null;
        if (
          t &&
          e.nativeEvent.touches.length === 0 &&
          t.y - point.pageY >= 28 &&
          t.y - point.pageY > Math.abs(t.x - point.pageX) * 0.7 &&
          match.phase === "hooked" &&
          !paused
        )
          onLift();
      }}
      onTouchCancel={() => {
        touch.current = null;
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: "absolute",
            width: 180 + i * 60,
            height: 60 + i * 35,
            borderWidth: 1,
            borderColor: color + "18",
            borderRadius: 150,
            top: `${15 + i * 15}%`,
            alignSelf: "center",
            transform: [{ rotate: "-15deg" }],
          }}
        />
      ))}
      {growing ? (
        <View
          style={{
            position: "absolute",
            width: 300,
            height: 370,
            left: (area.width - 300) / 2,
            top: (area.height - 370) / 2,
            alignItems: "center",
            justifyContent: "center",
            transform: [
              { scale: Math.min(1, (area.height - 8) / 370, area.width / 300) },
            ],
          }}
        >
          <View
            style={{
              height: 260,
              width: 220,
              alignItems: "center",
              justifyContent: "flex-end",
              transform: [{ scale: 0.95 }],
            }}
          >
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                bottom: 24,
                alignItems: "center",
                opacity: 0.17,
                transform: [
                  { translateY: Animated.multiply(rise, -1) },
                  { translateX: 9 },
                ],
              }}
            >
              <FishHead color={fishColor} surprised />
            </Animated.View>
            <Animated.View
              style={{
                position: "absolute",
                bottom: 24,
                alignItems: "center",
                transform: [{ translateY: Animated.multiply(rise, -1) }],
              }}
            >
              <View
                style={{ width: 1, height: 24, backgroundColor: "#DBF9FF88" }}
              />
              <FishingHook />
              <FishHead color={fishColor} surprised />
            </Animated.View>
            <View
              style={{ position: "absolute", bottom: 24, alignItems: "center" }}
            >
              {Array.from({ length: match.revealed }, (_, i) => (
                <Block
                  key={`${match.selected}-${i}`}
                  color={fishColor}
                  paused={paused}
                />
              ))}
            </View>
            <FishTail color={fishColor} />
            {Array.from({ length: 10 }, (_, i) => (
              <Animated.View
                key={i}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 106,
                  width: 5,
                  height: 12,
                  borderRadius: 5,
                  backgroundColor: color,
                  opacity: splash.interpolate({
                    inputRange: [0, 0.2, 1],
                    outputRange: [0, 0.8, 0],
                  }),
                  transform: [
                    {
                      translateX: splash.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, Math.cos(i * 0.63) * 95],
                      }),
                    },
                    {
                      translateY: splash.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -30 - Math.sin(i * 0.63) * 65],
                      }),
                    },
                    { rotate: `${i * 36}deg` },
                  ],
                }}
              />
            ))}
          </View>
          <Text
            accessibilityLiveRegion="polite"
            maxFontSizeMultiplier={1.2}
            style={{ fontSize: 44, fontWeight: "900", color, marginTop: 6 }}
          >
            {match.revealed}
            <Text style={{ fontSize: 15 }}>
              {" "}
              ブロック{match.phase === "caught" ? "！" : "…"}
            </Text>
          </Text>
          {match.phase === "caught" && (
            <Text
              maxFontSizeMultiplier={1.2}
              style={{
                fontSize: 18,
                color: match.overtake ? "#FFE600" : color,
                fontWeight: "900",
                textAlign: "center",
              }}
            >
              {match.overtake
                ? `${match.completed > match.fish.length - match.players ? "最後の逆転！" : "逆転！"} `
                : ""}
              {match.revealed === 9
                ? "最大の大物！ JACKPOT!"
                : match.revealed >= 7
                  ? "大物ゲット！"
                  : match.revealed >= 4
                    ? "いい調子！"
                    : "かわいい1匹！"}
            </Text>
          )}
          {match.phase === "caught" && match.revealed >= 7 && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 210,
                height: 210,
                borderRadius: 105,
                borderWidth: match.revealed === 9 ? 4 : 2,
                borderColor: color + "66",
                shadowColor: color,
                shadowRadius: 22,
                shadowOpacity: 0.8,
              }}
            />
          )}
        </View>
      ) : (
        <View
          style={{
            position: "absolute",
            width: 276,
            height: 270,
            left: (area.width - 276) / 2,
            top: (area.height - 270) / 2,
            alignItems: "center",
            justifyContent: "center",
            transform: [
              { scale: Math.min(1, (area.height - 8) / 270, area.width / 276) },
            ],
          }}
        >
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              width: 264,
              justifyContent: "center",
              gap: 4,
            }}
          >
            {match.fish.map((f) => (
              <View
                key={f.id}
                style={{
                  width: 84,
                  height: 84,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {f.caught ? (
                  <Text
                    allowFontScaling={false}
                    style={{ color: "#4C6780", fontSize: 12 }}
                  >
                    釣り上げ済み
                  </Text>
                ) : (
                  <SwimmingFish
                    label={`${["上段", "中段", "下段"][Math.floor(f.id / 3)]}の${match.fish.length === 8 && f.id === 7 ? "右" : ["左", "中央", "右"][f.id % 3]}の魚`}
                    id={f.id}
                    color={PLAYER_COLORS[f.id % 4]}
                    selected={match.selected === f.id}
                    disabled={paused || match.phase !== "choosing"}
                    moving={!paused}
                    onPress={() => onSelect(f.id)}
                  />
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  pond: {
    flex: 1,
    minHeight: 180,
    marginHorizontal: 12,
    backgroundColor: "#071C30",
    borderRadius: 28,
    borderWidth: 2,
    overflow: "hidden",
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
});
