import { useColors, useThemedStyles } from "@/theme/ThemeProvider";
import { PathPerson } from "./path-person";
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
  const c = useColors();
  const styles = useThemedStyles(baseStyles);

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
  const c = useColors();
  const styles = useThemedStyles(baseStyles);

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
const baseStyles = StyleSheet.create({
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
  const c = useColors();
  const styles = useThemedStyles(baseStyles);

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

export function NeonPathArtwork() {
  const c = useColors();
  return (
    <LinearGradient
      colors={["#081E2D", "#101226", "#29132B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        height: 180,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
      }}
      accessibilityLabel="ネオンの盤面で、人型の駒がレーザーの壁を回り込むゲーム"
    >
      <View
        style={{
          width: 150,
          height: 150,
          transform: [{ rotate: "-12deg" }],
          borderTopWidth: 2,
          borderTopColor: "#00F5FF",
          borderBottomWidth: 2,
          borderBottomColor: "#FF2BD6",
        }}
      >
        {Array.from({ length: 81 }, (_, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: (i % 9) * 16.6 + 1,
              top: Math.floor(i / 9) * 16.6 + 1,
              width: 14,
              height: 14,
              borderRadius: 2,
              backgroundColor: "#FFFFFF08",
              borderWidth: 1,
              borderColor: "#53608044",
            }}
          />
        ))}
        {[
          { x: 33, y: 49, w: 33, h: 4 },
          { x: 83, y: 83, w: 4, h: 33 },
          { x: 16, y: 116, w: 33, h: 4 },
        ].map((b, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: b.x,
              top: b.y,
              width: b.w,
              height: b.h,
              backgroundColor: i % 2 ? "#FF2BD6" : "#00F5FF",
              borderRadius: 3,
              shadowOpacity: 0.8,
              shadowRadius: 8,
              shadowColor: i % 2 ? "#FF2BD6" : "#00F5FF",
            }}
          />
        ))}
        <View style={{ position: "absolute", left: 66, top: 96 }}>
          <PathPerson player={1} size={22} />
        </View>
        <View style={{ position: "absolute", left: 98, top: 29 }}>
          <PathPerson player={2} size={22} />
        </View>
      </View>
      <Text
        allowFontScaling={false}
        style={{
          position: "absolute",
          left: 14,
          bottom: 12,
          color: c.text,
          fontSize: 11,
          fontWeight: "800",
          letterSpacing: 2,
        }}
      >
        NEON PATH
      </Text>
      <Text
        allowFontScaling={false}
        style={{
          position: "absolute",
          right: 14,
          top: 12,
          color: c.cyan,
          fontSize: 11,
        }}
      >
        2人の頭脳戦
      </Text>
    </LinearGradient>
  );
}

export function NeonSlingArtwork() {
  const c = useColors();
  return (
    <LinearGradient
      colors={["#2D0B35", "#091120", "#072E3A"]}
      style={{
        height: 180,
        borderRadius: 14,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
      accessibilityLabel="中央のゲートへ白いパックを打ち合う2人同時対戦"
    >
      <View
        style={{
          width: 150,
          height: 158,
          borderWidth: 2,
          borderColor: "#A88AFF66",
          borderRadius: 12,
          transform: [{ rotate: "-10deg" }],
        }}
      >
        {[0, 87].map((x) => (
          <View
            key={x}
            style={{
              position: "absolute",
              left: x,
              top: 76,
              width: 59,
              height: 4,
              backgroundColor: "#A88AFF",
            }}
          />
        ))}
        {[
          { x: 26, y: 25 },
          { x: 67, y: 34 },
          { x: 109, y: 22 },
          { x: 28, y: 124 },
          { x: 105, y: 128 },
          { x: 72, y: 96 },
        ].map((p, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#ECFCFF",
              shadowColor: i < 3 ? "#FF2BD6" : "#00F5FF",
              shadowOpacity: 1,
              shadowRadius: 7,
            }}
          />
        ))}
        <View
          style={{
            position: "absolute",
            left: 76,
            top: 61,
            width: 3,
            height: 31,
            backgroundColor: "#00F5FF",
            transform: [{ rotate: "-8deg" }],
          }}
        />
        <Text
          allowFontScaling={false}
          style={{
            position: "absolute",
            top: 47,
            left: 66,
            fontSize: 23,
            color: "#00F5FF",
          }}
        >
          ↑
        </Text>
      </View>
      <Text
        allowFontScaling={false}
        style={{
          position: "absolute",
          left: 14,
          bottom: 12,
          color: c.text,
          fontSize: 11,
          fontWeight: "800",
          letterSpacing: 2,
        }}
      >
        NEON SLING
      </Text>
      <Text
        allowFontScaling={false}
        style={{
          position: "absolute",
          right: 12,
          top: 12,
          color: c.cyan,
          fontSize: 11,
        }}
      >
        2人同時対戦
      </Text>
    </LinearGradient>
  );
}
