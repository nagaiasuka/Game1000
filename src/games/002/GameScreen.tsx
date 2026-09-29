import { useCallback, useState } from "react";
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Icon } from "@/components/ui";
import { colors as c, mono } from "@/theme";
import { STAGES } from "./stages";
import { fieldLayout } from "./logic/physics";
import { useBlockBreak } from "./hooks/useBlockBreak";
import { Field } from "./components/Field";

// Percentage margins use the safe-area container width as their reference.
// Keep 95% of the available width; leave 5% below for rounded display corners.
const FIELD_MARGIN_PERCENT = 5;

function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        { opacity: disabled ? 0.35 : pressed ? 0.65 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: c.text }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export default function GameScreen() {
  const game = useBlockBreak();
  const { state: s, pause } = game;
  const [selected, setSelected] = useState(0);
  const [area, setArea] = useState({ width: 0, height: 0 });
  const { scale } = fieldLayout(area.width, area.height);
  const home = useCallback(() => {
    pause();
    router.dismissTo("/");
  }, [pause]);
  const back = useCallback(() => {
    if (["playing", "ready", "paused"].includes(s.phase)) pause();
    else home();
    return true;
  }, [s.phase, pause, home]);
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", back);
      return () => sub.remove();
    }, [back]),
  );
  const overlay = !["ready", "playing"].includes(s.phase);
  const stage = STAGES[s.stage];
  const time = `${Math.floor(s.stageTime / 60)}:${String(Math.floor(s.stageTime % 60)).padStart(2, "0")}`;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={back}
            accessibilityRole="button"
            accessibilityLabel="戻る・プレイ中は一時停止"
            style={styles.icon}
          >
            <Icon name="chevron-back" color={c.muted} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>GAME #002</Text>
            <Text style={styles.title}>BLOCK BREAK</Text>
          </View>
          <Pressable
            onPress={pause}
            disabled={!["playing", "ready"].includes(s.phase)}
            accessibilityRole="button"
            accessibilityLabel="一時停止"
            style={styles.icon}
          >
            <Icon name="pause" color={overlay ? c.border : c.cyan} />
          </Pressable>
        </View>
        <View style={styles.hud}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.label}>SCORE</Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.3}
              style={styles.score}
            >
              {s.score.toLocaleString()}
            </Text>
          </View>
          <View style={{ gap: 5, alignItems: "flex-end" }}>
            <Text style={styles.stage}>
              STAGE {String(s.stage + 1).padStart(2, "0")} / {STAGES.length}
            </Text>
            <Text accessibilityLabel={`残機${s.lives}`} style={styles.lives}>
              {"♥".repeat(s.lives)}
              <Text style={{ color: c.border }}>{"♥".repeat(3 - s.lives)}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.comboRow}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.2}
            style={{
              color: s.combo >= 5 ? c.pink : c.cyan,
              fontFamily: mono,
              fontSize: Math.min(18, 12 + s.combo / 5),
              fontWeight: "900",
            }}
          >
            COMBO ×{s.combo}
          </Text>
          <Text style={styles.label}>
            {s.feverLeft > 0
              ? `FEVER ×2 · ${Math.ceil(s.feverLeft)}s`
              : "FEVER"}
          </Text>
        </View>
        <View style={styles.track}>
          <View
            style={{
              height: "100%",
              width: `${s.feverLeft > 0 ? (s.feverLeft / 8) * 100 : s.fever}%`,
              backgroundColor: s.feverLeft > 0 ? c.pink : c.cyan,
            }}
          />
        </View>
        <View style={styles.recordsRow}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.2}
            style={styles.best}
          >
            BEST {game.best.toLocaleString()}
          </Text>
          {stage.incomingRows > 0 && (
            <Text
              style={[
                styles.label,
                { color: s.incomingIn >= 0 ? c.pink : c.cyan },
              ]}
            >
              {s.incomingIn >= 0
                ? "NEXT ROW ↓"
                : `追加列 ${s.rowsLeft} / ${stage.incomingRows}`}
            </Text>
          )}
          <Text style={styles.label}>
            {s.wideLeft > 0 ? `W ${Math.ceil(s.wideLeft)}s  ` : ""}
            {s.powerLeft > 0 ? `P ${Math.ceil(s.powerLeft)}s` : ""}
          </Text>
        </View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.2}
          style={[styles.tip, { color: game.storageError ? c.yellow : c.pink }]}
        >
          {game.storageError
            ? "記録を保存・読み込みできませんでした"
            : game.developerMode || s.practice
              ? "DEV MODE · 全ステージ選択可 / 記録保存なし"
              : " "}
        </Text>
        <View
          style={styles.arena}
          onLayout={(e) => {
            const next = e.nativeEvent.layout;
            setArea(next);
            game.resize(fieldLayout(next.width, next.height).height);
          }}
        >
          {area.width > 2 && area.height > 2 && (
            <Field
              state={s}
              scale={scale}
              move={game.move}
              launch={game.launch}
              cancel={game.cancel}
              getPaddle={game.getPaddle}
            />
          )}
          {overlay && (
            <View style={styles.overlay}>
              <ScrollView
                contentContainerStyle={styles.overlayContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.menu}>
                  {s.phase === "select" && (
                    <>
                      <Text style={styles.label}>
                        1 PLAYER · {STAGES.length} STAGES
                      </Text>
                      <Text accessibilityRole="header" style={styles.hero}>
                        BLOCK{"\n"}BREAK<Text style={{ color: c.pink }}>.</Text>
                      </Text>
                      <Text style={styles.copy}>
                        壊すたび、気持ちいい。{"\n"}続くほど、止められない。
                      </Text>
                      <Text style={styles.stage}>STAGE SELECT</Text>
                      <View style={styles.stageGrid}>
                        {STAGES.map((level, index) => {
                          const locked =
                            !game.developerMode && index >= s.highest;
                          return (
                            <Pressable
                              key={level.name}
                              accessibilityRole="button"
                              accessibilityLabel={`ステージ${index + 1} ${level.name}${locked ? "、未解放" : s.cleared.includes(index + 1) ? "、クリア済み" : ""}`}
                              accessibilityState={{
                                disabled: locked || !game.loaded,
                                selected: selected === index,
                              }}
                              disabled={locked || !game.loaded}
                              onPress={() => setSelected(index)}
                              style={[
                                styles.stageCell,
                                selected === index && {
                                  borderColor: c.cyan,
                                  backgroundColor: "#0A353D",
                                },
                              ]}
                            >
                              {locked ? (
                                <Icon
                                  name="lock-closed-outline"
                                  size={15}
                                  color={c.muted}
                                />
                              ) : (
                                <Text
                                  style={{
                                    color: c.cyan,
                                    fontFamily: mono,
                                    fontWeight: "800",
                                  }}
                                >
                                  {String(index + 1).padStart(2, "0")}
                                  {s.cleared.includes(index + 1) ? "✓" : ""}
                                </Text>
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                      <Text style={styles.stage}>{STAGES[selected].name}</Text>
                      <Button
                        title={
                          game.loaded
                            ? "PLAY STAGE " +
                              String(selected + 1).padStart(2, "0")
                            : "LOADING…"
                        }
                        disabled={!game.loaded}
                        onPress={() => game.start(selected)}
                      />
                      <Text style={styles.copy}>
                        左右ドラッグでパドル移動 · タップで発射{"\n"}
                        ×3：ボール追加 / W：幅UP / P：貫通
                      </Text>
                    </>
                  )}
                  {s.phase === "paused" && (
                    <>
                      <Text style={styles.label}>{stage.name}</Text>
                      <Text accessibilityRole="header" style={styles.heading}>
                        PAUSED
                      </Text>
                      <Text style={styles.copy}>
                        左右ドラッグでパドル移動。{"\n"}
                        端で当てて、飛ばす向きを狙おう。
                      </Text>
                      <Button title="RESUME" onPress={game.resume} />
                      <Button
                        title="RESTART STAGE"
                        onPress={game.restart}
                        secondary
                      />
                      <Text style={styles.copy}>
                        やり直すと、このステージ開始時の{"\n"}
                        スコア・残機に戻ります。
                      </Text>
                      <Button title="EXIT" onPress={home} secondary />
                    </>
                  )}
                  {(s.phase === "clear" || s.phase === "complete") && (
                    <>
                      <Text style={[styles.label, { color: c.pink }]}>
                        {s.phase === "complete"
                          ? "YOU BROKE EVERYTHING."
                          : stage.name}
                      </Text>
                      <Text
                        accessibilityRole="header"
                        style={[styles.heading, { color: c.cyan }]}
                      >
                        {s.phase === "complete"
                          ? "ALL STAGES\nCLEAR"
                          : "STAGE CLEAR!"}
                      </Text>
                      <Text style={styles.resultScore}>
                        {s.score.toLocaleString()}
                      </Text>
                      <Text style={styles.copy}>
                        MAX COMBO ×{s.stageMaxCombo} · TIME {time}
                        {"\n"}CLEAR BONUS +{s.clearBonus.toLocaleString()}
                        {"\n"}LIFE BONUS +{s.lifeBonus.toLocaleString()}
                      </Text>
                      <Button
                        title={
                          s.phase === "complete" ? "STAGE SELECT" : "NEXT STAGE"
                        }
                        onPress={
                          s.phase === "complete" ? game.select : game.next
                        }
                      />
                      <Button title="HOME" onPress={home} secondary />
                    </>
                  )}
                  {s.phase === "over" && (
                    <>
                      <Text style={[styles.label, { color: c.pink }]}>
                        ONE MORE BREAK?
                      </Text>
                      <Text accessibilityRole="header" style={styles.heading}>
                        GAME OVER
                      </Text>
                      <Text style={styles.resultScore}>
                        {s.score.toLocaleString()}
                      </Text>
                      <Text style={styles.copy}>
                        STAGE {String(s.stage + 1).padStart(2, "0")} · MAX COMBO
                        ×{s.maxCombo}
                        {"\n"}BEST {game.best.toLocaleString()}
                      </Text>
                      <Button
                        title="RETRY"
                        onPress={() => game.start(s.stage)}
                      />
                      <Button
                        title="STAGE SELECT"
                        onPress={game.select}
                        secondary
                      />
                      <Button title="HOME" onPress={home} secondary />
                    </>
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: c.background,
  },
  container: {
    flex: 1,
    gap: 6,
    width: "100%",
    alignSelf: "center",
  },
  header: { flexDirection: "row", minHeight: 44, alignItems: "center", gap: 5 },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 9,
    fontFamily: mono,
    letterSpacing: 1.2,
    color: c.muted,
    fontWeight: "700",
  },
  title: { color: c.text, fontSize: 15, fontWeight: "900", letterSpacing: 1 },
  hud: {
    marginHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  score: { color: c.text, fontSize: 25, fontFamily: mono, fontWeight: "800" },
  stage: {
    color: c.cyan,
    fontSize: 11,
    fontFamily: mono,
    fontWeight: "800",
    letterSpacing: 1,
  },
  lives: { color: c.pink, fontSize: 18, letterSpacing: 3 },
  arena: {
    flex: 1,
    marginHorizontal: `${FIELD_MARGIN_PERCENT / 2}%`,
    marginBottom: `${FIELD_MARGIN_PERCENT}%`,
    overflow: "hidden",
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#070711E8",
    borderRadius: 12,
  },
  overlayContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  menu: { width: "100%", maxWidth: 310, gap: 12, alignItems: "center" },
  hero: {
    color: c.cyan,
    fontSize: 42,
    lineHeight: 44,
    fontWeight: "900",
    fontStyle: "italic",
    textAlign: "center",
  },
  heading: {
    color: c.text,
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center",
  },
  copy: { color: c.muted, fontSize: 11, lineHeight: 19, textAlign: "center" },
  resultScore: {
    color: c.yellow,
    fontSize: 34,
    fontFamily: mono,
    fontWeight: "900",
  },
  stageGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  stageCell: {
    width: "18%",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 9,
    backgroundColor: c.surface,
  },
  button: {
    width: "100%",
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.cyan,
    borderWidth: 1,
    borderColor: c.cyan,
    borderRadius: 12,
  },
  secondary: { backgroundColor: c.surface, borderColor: c.border },
  buttonText: {
    color: c.background,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  comboRow: {
    marginHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 26,
    overflow: "hidden",
  },
  track: {
    marginHorizontal: 12,
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: c.border,
  },
  recordsRow: {
    marginHorizontal: 12,
    height: 16,
    overflow: "hidden",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  best: { flexShrink: 1, color: c.yellow, fontSize: 10, fontFamily: mono },
  tip: {
    height: 18,
    lineHeight: 14,
    marginHorizontal: 12,
    color: c.muted,
    fontSize: 10,
    textAlign: "center",
  },
});
