import { View, Text } from "react-native";

/** Original holographic people: round helmet / square helmet, plus jersey number. */
export function PathPerson({ player, size }: { player: 1 | 2; size: number }) {
  const color = player === 1 ? "#00F5FF" : "#FF2BD6";
  return (
    <View
      pointerEvents="none"
      style={{ width: size, height: size, alignItems: "center" }}
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: player === 1 ? size : size * 0.06,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: size * 0.34,
          width: size * 0.42,
          height: size * 0.4,
          borderRadius: size * 0.09,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          allowFontScaling={false}
          style={{ color: "#070711", fontSize: size * 0.27, fontWeight: "900" }}
        >
          {player}
        </Text>
      </View>
      {[-1, 1].map((side) => (
        <View
          key={`arm${side}`}
          style={{
            position: "absolute",
            top: size * 0.38,
            left: size * (side === -1 ? 0.12 : 0.73),
            width: size * 0.14,
            height: size * 0.32,
            borderRadius: size * 0.06,
            backgroundColor: color,
            transform: [{ rotate: `${side * -15}deg` }],
          }}
        />
      ))}
      {[-1, 1].map((side) => (
        <View
          key={`leg${side}`}
          style={{
            position: "absolute",
            top: size * 0.69,
            left: size * (side === -1 ? 0.3 : 0.54),
            width: size * 0.16,
            height: size * 0.3,
            borderRadius: size * 0.05,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}
