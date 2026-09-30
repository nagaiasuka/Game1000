import { StackMonster } from "./stack-monster";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors as c, mono } from "@/theme";

// A static illustration built from the same square shapes as the game.
// Kept separate from gameplay so catalog previews never load a game engine.
const rows = [
  "..........",
  "..........",
  "....T.....",
  "...TTT....",
  "..........",
  "..........",
  "..........",
  "..........",
  "..........",
  "..........",
  "..S.......",
  ".SS...OO..",
  ".SJJJ.OO..",
  "LLJZZ.IIII",
  "LTTTZZ.JJJ",
  "L.TSS..JOO",
];
const palette: Record<string, string> = {
  I: c.cyan,
  O: c.yellow,
  T: c.purple,
  L: "#FFAD58",
  J: "#599BFF",
  S: "#6DF5A5",
  Z: c.pink,
};
export function BlockDropArtwork() {
  return (
    <LinearGradient
      colors={[c.purpleDark, c.background, "#082B35"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.art}
    >
      <View style={styles.halo} />
      <View style={styles.copy}>
        <Text style={styles.kicker}>STACK. CLEAR. REPEAT.</Text>
        <Text style={styles.title}>
          BLOCK{"\n"}DROP<Text style={{ color: c.pink }}>.</Text>
        </Text>
        <View style={styles.underline} />
        <Text style={styles.caption}>積んで、消して、ハイスコア。</Text>
      </View>
      <View style={styles.scene}>
        <View style={styles.board}>
          {rows.map((row, y) => (
            <View key={y} style={{ flexDirection: "row" }}>
              {[...row].map((cell, x) => (
                <View
                  key={x}
                  style={[
                    styles.cell,
                    cell !== "." && {
                      backgroundColor: palette[cell] + "B8",
                      borderColor: palette[cell],
                      borderTopWidth: 2,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
          <View style={styles.trail} />
          <View style={styles.lineGlow} />
        </View>
      </View>
    </LinearGradient>
  );
}
export function BlockBreakArtwork() {
  return (
    <LinearGradient
      colors={["#291039", c.background, "#0D343C"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.art}
    >
      <View style={styles.halo} />
      <View style={styles.copy}>
        <Text style={styles.kicker}>BREAK. COMBO. FEVER.</Text>
        <Text style={styles.title}>
          BLOCK{"\n"}BREAK<Text style={{ color: c.pink }}>.</Text>
        </Text>
        <View style={styles.underline} />
        <Text style={styles.caption}>壊すたび、気持ちいい。</Text>
      </View>
      <View
        style={{
          width: 120,
          height: 150,
          transform: [{ rotate: "-8deg" }],
          marginLeft: 4,
        }}
      >
        {[c.pink, c.purple, c.cyan, c.yellow].map((color, y) => (
          <View
            key={color}
            style={{ flexDirection: "row", gap: 4, marginBottom: 5 }}
          >
            {Array.from({ length: 4 }, (_, x) => (
              <View
                key={x}
                style={{
                  width: 27,
                  height: 12,
                  borderWidth: 1,
                  borderColor: color,
                  backgroundColor: color + "99",
                  borderRadius: 3,
                  opacity: y === 3 && x === 2 ? 0 : 1,
                }}
              />
            ))}
          </View>
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: 52 + i * 6,
              top: 104 - i * 8,
              width: 5 + i,
              height: 5 + i,
              borderRadius: 10,
              backgroundColor: c.cyan,
              opacity: (i + 1) / 5,
            }}
          />
        ))}
        <View
          style={{
            position: "absolute",
            top: 62,
            left: 82,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: c.text,
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 3,
            left: 24,
            width: 70,
            height: 9,
            borderRadius: 5,
            backgroundColor: c.cyan,
            borderTopWidth: 2,
            borderTopColor: c.text,
          }}
        />
        <Text
          style={{
            position: "absolute",
            top: 88,
            right: -2,
            color: c.pink,
            fontSize: 12,
            fontFamily: mono,
            fontWeight: "900",
          }}
        >
          ×10!
        </Text>
      </View>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  art: {
    width: "100%",
    height: 176,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    paddingHorizontal: 18,
  },
  halo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -45,
    top: -60,
    borderWidth: 1,
    borderColor: c.cyan + "22",
  },
  copy: { flex: 1, zIndex: 1, gap: 8 },
  kicker: { fontFamily: mono, fontSize: 7, letterSpacing: 1.1, color: c.cyan },
  title: {
    fontSize: 32,
    lineHeight: 33,
    fontWeight: "900",
    fontStyle: "italic",
    color: c.text,
    letterSpacing: 1,
  },
  underline: { width: 30, height: 3, backgroundColor: c.pink },
  caption: { color: c.muted, fontSize: 9 },
  scene: {
    width: 122,
    alignItems: "center",
    transform: [{ rotate: "9deg" }],
    marginLeft: 4,
  },
  board: {
    padding: 4,
    borderWidth: 1,
    borderColor: c.cyan + "77",
    borderRadius: 5,
    backgroundColor: c.background,
    shadowColor: c.cyan,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  cell: {
    width: 10,
    height: 10,
    margin: 0.5,
    borderWidth: 0.5,
    borderRadius: 1.5,
    borderColor: c.border + "77",
  },
  trail: {
    position: "absolute",
    top: 53,
    left: 42,
    width: 21,
    height: 36,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: c.purple + "66",
  },
  lineGlow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 30,
    height: 2,
    backgroundColor: c.cyan,
    shadowColor: c.cyan,
    shadowOpacity: 1,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
  },
});

export function NeonStackArtwork() {
  return (
    <LinearGradient
      colors={["#102A35", c.background, "#381237"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.art}
    >
      <View style={styles.copy}>
        <Text maxFontSizeMultiplier={1.1} style={styles.kicker}>
          2人の、かぶせる三目並べ
        </Text>
        <Text maxFontSizeMultiplier={1.1} style={styles.title}>
          NEON{"\n"}STACK<Text style={{ color: c.pink }}>.</Text>
        </Text>
        <View style={styles.underline} />
        <Text maxFontSizeMultiplier={1.1} style={styles.caption}>
          大きな駒で、逆転しよう。
        </Text>
      </View>
      <View
        accessible={false}
        style={{
          width: 126,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 3,
          transform: [{ rotate: "-8deg" }],
        }}
      >
        {[1, 2, 0, 0, 2, 1, 1, 0, 2].map((player, index) => (
          <View
            key={index}
            style={{
              width: 40,
              height: 40,
              borderWidth: 1,
              borderColor: c.cyan + "55",
              borderRadius: 6,
              backgroundColor: c.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!!player && (
              <StackMonster
                player={player === 1 ? 1 : 2}
                diameter={index === 4 ? 35 : index === 0 ? 19 : 28}
              />
            )}
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}
