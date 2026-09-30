import { useColors, useThemedStyles } from "@/theme/ThemeProvider";
import { SoundButton } from "@/audio/SoundSettings";
import {
  GameButton as Button,
  HelpButton,
  GameInstructions,
  HowToPlayModal,
  confirmGameAction,
} from "@/components/game/common";
import { UI_TEXT } from "@/data/ui-text";
import { useCallback, useState } from "react";
import {
  BackHandler,
  useWindowDimensions,
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

export default function GameScreen() {
  const c = useColors();
  const styles = useThemedStyles(baseStyles);

  const { fontScale } = useWindowDimensions();
  const [helpOpen, setHelpOpen] = useState(false);
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
    <SafeAreaView key={`layout-${fontScale}`} style={styles.safe}>
      <HowToPlayModal
        gameId="002"
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
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
            <Text maxFontSizeMultiplier={1.3} style={styles.label}>
              GAME #002
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.title}>
              BLOCK BREAK
            </Text>
          </View>
          <HelpButton
            onPress={() => {
              game.pause();
              setHelpOpen(true);
            }}
          />
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
            <Text maxFontSizeMultiplier={1.3} style={styles.label}>
              スコア
            </Text>
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
            <Text maxFontSizeMultiplier={1.3} style={styles.stage}>
              ステージ {s.stage + 1} / {STAGES.length}
            </Text>
            <Text
              accessibilityLabel={`残り${s.lives}回`}
              maxFontSizeMultiplier={1.2}
              style={styles.lives}
            >
              残り {"♥".repeat(s.lives)}
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
            コンボ ×{s.combo}
          </Text>
          <Text maxFontSizeMultiplier={1.2} style={styles.label}>
            {s.feverLeft > 0
              ? `得点2倍 · あと${Math.ceil(s.feverLeft)}秒`
              : "フィーバー"}
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
            最高記録 {game.best.toLocaleString()}
          </Text>
          {stage.incomingRows > 0 && (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.2}
              style={[
                styles.label,
                { color: s.incomingIn >= 0 ? c.pink : c.cyan },
              ]}
            >
              {s.incomingIn >= 0
                ? "新しい列が来ます ↓"
                : `追加列 ${s.rowsLeft} / ${stage.incomingRows}`}
            </Text>
          )}
        </View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.2}
          style={[styles.label, styles.effects]}
        >
          {s.wideLeft > 0 ? `幅UP ${Math.ceil(s.wideLeft)}秒  ` : ""}
          {s.powerLeft > 0 ? `突き抜け ${Math.ceil(s.powerLeft)}秒` : ""}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.2}
          style={[styles.tip, { color: game.storageError ? c.yellow : c.pink }]}
        >
          {game.storageError
            ? "記録を保存・読み込みできませんでした"
            : game.developerMode || s.practice
              ? "開発者モード・記録は保存しません"
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
                key={`menu-002-${fontScale}`}
                contentContainerStyle={styles.overlayContent}
                showsVerticalScrollIndicator
              >
                <View style={styles.menu}>
                  {s.phase === "select" && (
                    <>
                      <Text maxFontSizeMultiplier={1.3} style={styles.label}>
                        1人用 · 全{STAGES.length}ステージ
                      </Text>
                      <Text
                        accessibilityRole="header"
                        maxFontSizeMultiplier={1.3}
                        style={styles.hero}
                      >
                        BLOCK{"\n"}BREAK<Text style={{ color: c.pink }}>.</Text>
                      </Text>
                      <Text style={styles.copy}>
                        壊すたび、気持ちいい。{"\n"}続くほど、止められない。
                      </Text>
                      <Text maxFontSizeMultiplier={1.3} style={styles.stage}>
                        ステージを選ぶ
                      </Text>
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
                                  maxFontSizeMultiplier={1.3}
                                  style={{
                                    color: c.cyan,
                                    fontFamily: mono,
                                    fontWeight: "800",
                                  }}
                                >
                                  {selected === index ? "▶ " : ""}
                                  {String(index + 1).padStart(2, "0")}
                                  {s.cleared.includes(index + 1) ? "✓" : ""}
                                </Text>
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                      <Text maxFontSizeMultiplier={1.3} style={styles.stage}>
                        {STAGES[selected].name}
                      </Text>
                      <GameInstructions gameId="002" compact />
                      <Button
                        title={
                          game.loaded
                            ? `ステージ${selected + 1}を遊ぶ`
                            : UI_TEXT.loading
                        }
                        disabled={!game.loaded}
                        onPress={() => game.start(selected)}
                      />
                      <Text style={styles.copy}>
                        指を左右に動かしてバーを移動 · タップで発射{"\n"}
                        ×3：ボール追加 / W：バーが広がる / P：突き抜ける
                      </Text>
                    </>
                  )}
                  {s.phase === "paused" && (
                    <>
                      <Text maxFontSizeMultiplier={1.3} style={styles.label}>
                        {stage.name}
                      </Text>
                      <Text
                        accessibilityRole="header"
                        maxFontSizeMultiplier={1.3}
                        style={styles.heading}
                      >
                        一時停止
                      </Text>
                      <Text style={styles.copy}>
                        指を左右に動かしてバーを移動。{"\n"}
                        端で当てて、飛ばす向きを狙おう。
                      </Text>
                      <SoundButton />
                      <Button title={UI_TEXT.resume} onPress={game.resume} />
                      <Button
                        title="このステージを最初から"
                        onPress={() =>
                          confirmGameAction("restart", game.restart, true)
                        }
                        secondary
                      />
                      <Text style={styles.copy}>
                        やり直すと、このステージ開始時の{"\n"}
                        スコア・残機に戻ります。
                      </Text>
                      <Button
                        title={UI_TEXT.quit}
                        onPress={() => confirmGameAction("quit", home)}
                        secondary
                      />
                    </>
                  )}
                  {(s.phase === "clear" || s.phase === "complete") && (
                    <>
                      <Text style={[styles.label, { color: c.pink }]}>
                        {s.phase === "complete"
                          ? "全部のステージをクリア！"
                          : stage.name}
                      </Text>
                      <Text
                        accessibilityRole="header"
                        maxFontSizeMultiplier={1.3}
                        style={[styles.heading, { color: c.cyan }]}
                      >
                        {s.phase === "complete"
                          ? "全ステージ\nクリア！"
                          : "STAGE CLEAR!"}
                      </Text>
                      <Text style={styles.copy}>スコア</Text>
                      <Text
                        maxFontSizeMultiplier={1.3}
                        style={styles.resultScore}
                      >
                        {s.score.toLocaleString()}
                      </Text>
                      <Text style={styles.copy}>
                        ステージ{s.stage + 1} クリア！
                      </Text>
                      <Text style={styles.copy}>
                        最大コンボ ×{s.stageMaxCombo} · 時間 {time}
                        {"\n"}クリアボーナス +{s.clearBonus.toLocaleString()}
                        {"\n"}ハートのボーナス +{s.lifeBonus.toLocaleString()}
                      </Text>
                      <Button
                        title={
                          s.phase === "complete"
                            ? UI_TEXT.stageSelect
                            : UI_TEXT.nextStage
                        }
                        onPress={
                          s.phase === "complete" ? game.select : game.next
                        }
                      />
                      <Button title={UI_TEXT.home} onPress={home} secondary />
                    </>
                  )}
                  {s.phase === "over" && (
                    <>
                      <Text style={[styles.label, { color: c.pink }]}>
                        もう一度、挑戦しよう
                      </Text>
                      <Text
                        accessibilityRole="header"
                        maxFontSizeMultiplier={1.3}
                        style={styles.heading}
                      >
                        GAME OVER
                      </Text>
                      <Text style={styles.copy}>スコア</Text>
                      <Text
                        maxFontSizeMultiplier={1.3}
                        style={styles.resultScore}
                      >
                        {s.score.toLocaleString()}
                      </Text>
                      <Text style={styles.copy}>
                        STAGE {String(s.stage + 1).padStart(2, "0")} ·
                        最大コンボ ×{s.maxCombo}
                        {"\n"}最高記録 {game.best.toLocaleString()}
                      </Text>
                      <Button
                        title={UI_TEXT.retry}
                        onPress={() => game.start(s.stage)}
                      />
                      <Button
                        title={UI_TEXT.stageSelect}
                        onPress={game.select}
                        secondary
                      />
                      <Button title={UI_TEXT.home} onPress={home} secondary />
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
const baseStyles = StyleSheet.create({
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
    fontSize: 11,
    letterSpacing: 0,
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
  copy: { color: c.text, fontSize: 15, lineHeight: 24, textAlign: "center" },
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
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 9,
    backgroundColor: c.surface,
  },
  comboRow: {
    marginHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 28,
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
    height: 24,
    gap: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  effects: { height: 20, lineHeight: 18, marginHorizontal: 12 },
  best: { flexShrink: 1, color: c.yellow, fontSize: 12, fontFamily: mono },
  tip: {
    height: 22,
    lineHeight: 18,
    marginHorizontal: 12,
    color: c.muted,
    fontSize: 12,
    textAlign: "center",
  },
});
