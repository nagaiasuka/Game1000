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
