import { useEffect, useState } from "react";
import { Animated, View } from "react-native";
export function VictoryWave({ color, size }: { color: string; size: number }) {
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress]);
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        inset: 0,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: i === 1 ? "#FFFFFF" : color,
            borderWidth: i === 1 ? 3 : 6,
            opacity: progress.interpolate({
              inputRange: [0, i * 0.12 + 0.05, i * 0.12 + 0.18, 1],
              outputRange: [0, 0, 0.85, 0],
            }),
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, i * 0.12 + 0.05, 1],
                  outputRange: [0.1, 0.1, 3 - i * 0.25],
                }),
              },
            ],
          }}
        />
      ))}
      {Array.from({ length: 28 }, (_, i) => {
        const angle = (i * Math.PI) / 14,
          distance = size * (0.65 + (i % 3) * 0.15);
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              width: i % 3 ? 5 : 9,
              height: i % 3 ? 16 : 9,
              borderRadius: 2,
              backgroundColor:
                i % 3 === 0 ? "#FFE600" : i % 2 ? "#FFFFFF" : color,
              opacity: progress.interpolate({
                inputRange: [0, 0.1, 0.65, 1],
                outputRange: [0, 1, 0.8, 0],
              }),
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.cos(angle) * distance],
                  }),
                },
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.sin(angle) * distance],
                  }),
                },
                { rotate: `${i * 37}deg` },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
