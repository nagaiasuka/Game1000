import { View } from "react-native";

/** Shared vector-like character: the horns stay inside the measured square. */
export function StackMonster({
  player,
  diameter: d,
}: {
  player: 1 | 2;
  diameter: number;
}) {
  const color = player === 1 ? "#00F5FF" : "#FF2BD6";
  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={{ width: d, height: d }}
    >
      {(player === 1 ? [0.5] : [0.24, 0.76]).map((x) => (
        <View
          key={x}
          style={{
            position: "absolute",
            left: d * (x - 0.1),
            top: 0,
            width: 0,
            height: 0,
            borderLeftWidth: d * 0.1,
            borderRightWidth: d * 0.1,
            borderBottomWidth: d * 0.29,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: "#FFE8A3",
            transform: [
              { rotate: x < 0.5 ? "-16deg" : x > 0.5 ? "16deg" : "0deg" },
            ],
          }}
        />
      ))}
      <View
        style={{
          position: "absolute",
          top: d * 0.2,
          bottom: 0,
          left: d * 0.04,
          right: d * 0.04,
          backgroundColor: color,
          borderTopLeftRadius: d * 0.4,
          borderTopRightRadius: d * 0.4,
          borderBottomLeftRadius: d * 0.18,
          borderBottomRightRadius: d * 0.18,
          borderBottomWidth: d * 0.07,
          borderColor: player === 1 ? "#168798" : "#9B227F",
        }}
      >
        <View
          style={{
            position: "absolute",
            left: "13%",
            top: "12%",
            width: "18%",
            height: "13%",
            borderRadius: d,
            backgroundColor: "#FFFFFF88",
          }}
        />
        {[0.25, 0.65].map((x) => (
          <View
            key={x}
            style={{
              position: "absolute",
              left: d * (x - 0.1),
              top: d * 0.22,
              width: d * 0.21,
              height: d * 0.24,
              borderRadius: d,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: d * 0.09,
                height: d * 0.12,
                borderRadius: d,
                backgroundColor: "#12172D",
              }}
            />
          </View>
        ))}
        <View
          style={{
            position: "absolute",
            left: "35%",
            top: "68%",
            width: "30%",
            height: "15%",
            backgroundColor: "#12172D",
            borderBottomLeftRadius: d,
            borderBottomRightRadius: d,
          }}
        />
      </View>
    </View>
  );
}
