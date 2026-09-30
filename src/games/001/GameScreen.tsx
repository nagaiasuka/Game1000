import { useColors, useThemedStyles } from "@/theme/ThemeProvider";
import { SoundButton } from "@/audio/SoundSettings";
import {
  GameButton as MenuButton,
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
import { Board, PiecePreview } from "./components/Board";
import { GestureSurface } from "./components/GestureSurface";
import { InputSettings } from "./components/InputSettings";
import { Controls } from "./components/Controls";
import { useBlockDrop } from "./hooks/useBlockDrop";
import { boardColors } from "./theme";

export default function GameScreen() {
  const c = useColors();
  const styles = useThemedStyles(baseStyles);

  const { fontScale } = useWindowDimensions();
  const [helpOpen, setHelpOpen] = useState(false);
  const game = useBlockDrop();
  const { state } = game;
  const [buttons, setButtons] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const showSettings = settingsOpen || state.phase === "paused";
  const openSettings = () => {
    game.pause();
    setSettingsOpen(true);
  };
  const closeSettings = () => {
    setSettingsOpen(false);
    game.resume();
  };
  const startGame = () => {
    setSettingsOpen(false);
    game.start();
  };
  const changeInput = (value: boolean) => {
    game.touchCancel();
    game.release("left");
    game.release("right");
    game.release("soft");
    setButtons(value);
  };
  const [area, setArea] = useState({ width: 0, height: 0 });
  const cell = Math.max(
    1,
    Math.floor(Math.min((area.width - 8) / 10, (area.height - 8) / 20)),
  );
  const home = useCallback(() => {
    game.pause();
    router.dismissTo("/");
  }, [game]);
  const back = useCallback(() => {
    if (settingsOpen && state.phase !== "paused") setSettingsOpen(false);
    else if (state.phase === "ready" || state.phase === "gameover") home();
    else game.pause();
    return true;
  }, [state.phase, home, game, settingsOpen]);
  useFocusEffect(
    useCallback(() => {
      const listener = BackHandler.addEventListener("hardwareBackPress", back);
      return () => listener.remove();
    }, [back]),
  );
  const overlay =
    showSettings ||
    ["ready", "countdown", "paused", "gameover"].includes(state.phase);
  return (
    <SafeAreaView key={`layout-${fontScale}`} style={styles.safe}>
      <HowToPlayModal
        gameId="001"
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ゲームを離れる"
            onPress={back}
            style={styles.headerButton}
          >
            <Icon name="chevron-back" color={c.muted} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text maxFontSizeMultiplier={1.2} style={styles.eyebrow}>
              GAME #001
            </Text>
            <Text maxFontSizeMultiplier={1.2} style={styles.smallTitle}>
              BLOCK DROP
            </Text>
          </View>

          <HelpButton
            onPress={() => {
              game.pause();
              setHelpOpen(true);
            }}
          />
          <Pressable
            testID="pause"
            accessibilityRole="button"
            accessibilityLabel="一時停止と設定"
            onPress={openSettings}
            style={styles.headerButton}
          >
            <Icon
              name={
                state.phase === "ready" || state.phase === "gameover"
                  ? "settings-outline"
                  : "pause"
              }
              color={c.cyan}
              size={21}
            />
          </Pressable>
        </View>
        <View style={styles.hud}>
          <View style={styles.score}>
            <Text maxFontSizeMultiplier={1.2} style={styles.eyebrow}>
              スコア
            </Text>
            <Text
              testID="score"
              maxFontSizeMultiplier={1.15}
              style={styles.scoreValue}
            >
              {state.score.toLocaleString()}
            </Text>
          </View>
          <View style={styles.stats}>
            <Text maxFontSizeMultiplier={1.1} style={styles.stat}>
              {game.levelUp ? "レベルアップ！ " : "レベル "}
              <Text style={styles.statValue}>
                {String(state.level).padStart(2, "0")}
              </Text>
            </Text>
            <Text maxFontSizeMultiplier={1.1} style={styles.stat}>
              消した列 <Text style={styles.statValue}>{state.lines}</Text>
            </Text>
          </View>
          <View style={styles.preview}>
            <Text maxFontSizeMultiplier={1.2} style={styles.eyebrow}>
              次のブロック
            </Text>
            <PiecePreview kind={state.queue[0] ?? null} />
          </View>
        </View>
        <View
          style={styles.boardArea}
          onLayout={(event) => setArea(event.nativeEvent.layout)}
        >
          {area.height > 0 && (
            <View style={styles.boardFrame}>
              <Board state={state} size={cell} />
              <View
                pointerEvents="none"
                style={[
                  styles.dropProgress,
                  { width: `${state.dropCharge * 100}%` },
                ]}
              />
            </View>
          )}
          <GestureSurface
            enabled={state.phase === "playing" && !buttons}
            cell={cell}
            onStart={game.touchStart}
            onMove={game.touchMove}
            onEnd={game.touchEnd}
            onCancel={game.touchCancel}
          />
          {overlay && (
            <View style={styles.overlay}>
              <ScrollView
                key={`menu-001-${fontScale}`}
                contentContainerStyle={styles.overlayContent}
                showsVerticalScrollIndicator
              >
                {state.phase === "countdown" && !showSettings ? (
                  <View
                    accessibilityLiveRegion="polite"
                    style={styles.countdown}
                  >
                    <Text
                      maxFontSizeMultiplier={1.3}
                      style={styles.countdownText}
                    >
                      {state.countdown || "GO!"}
                    </Text>
                    <Text style={styles.eyebrow}>まもなくスタート</Text>
                  </View>
                ) : (
                  <View style={styles.menu}>
                    {state.phase === "ready" && !showSettings && (
                      <>
                        <Text style={styles.eyebrow}>GAME #001 · 1人用</Text>
                        <Text
                          accessibilityRole="header"
                          maxFontSizeMultiplier={1.3}
                          style={styles.menuTitle}
                        >
                          BLOCK{"\n"}DROP
                          <Text style={{ color: c.pink }}>.</Text>
                        </Text>
                        <Text style={styles.description}>
                          ブロックを積んで、横一列そろえて消そう。
                        </Text>
                        <GameInstructions gameId="001" compact />
                        <MenuButton
                          title={game.loaded ? UI_TEXT.start : UI_TEXT.loading}
                          onPress={startGame}
                          disabled={!game.loaded}
                        />
                        <Text style={styles.tip}>
                          {buttons
                            ? "← → ↓ は長押し対応 / ↻ で回転"
                            : "タップで回転 / 左右ドラッグで移動\n下ドラッグで落下 / 0.5秒長押しで一気に落とす"}
                        </Text>
                      </>
                    )}
                    {showSettings && (
                      <>
                        <Text style={styles.eyebrow}>操作と設定</Text>
                        <Text
                          accessibilityRole="header"
                          maxFontSizeMultiplier={1.3}
                          style={styles.menuHeading}
                        >
                          {state.phase === "paused" ? UI_TEXT.paused : "設定"}
                        </Text>
                        <SoundButton />
                        <InputSettings
                          buttons={buttons}
                          onChange={changeInput}
                        />
                        <MenuButton
                          title={
                            state.phase === "paused" ? UI_TEXT.resume : "戻る"
                          }
                          onPress={closeSettings}
                        />
                        {state.phase === "paused" && (
                          <MenuButton
                            title={UI_TEXT.restart}
                            onPress={() =>
                              confirmGameAction("restart", startGame)
                            }
                            secondary
                          />
                        )}
                        <MenuButton
                          title={UI_TEXT.quit}
                          onPress={() => confirmGameAction("quit", home)}
                          secondary
                        />
                      </>
                    )}
                    {state.phase === "gameover" && !showSettings && (
                      <>
                        <Text
                          style={[
                            styles.eyebrow,
                            { color: game.newBest ? c.yellow : c.pink },
                          ]}
                        >
                          {game.newBest
                            ? "最高記録を更新！"
                            : "もう一度、遊びませんか？"}
                        </Text>
                        <Text
                          accessibilityRole="header"
                          maxFontSizeMultiplier={1.3}
                          style={styles.menuHeading}
                        >
                          GAME OVER
                        </Text>
                        <View style={styles.result}>
                          <Text style={styles.resultLabel}>
                            スコア{" "}
                            <Text style={styles.resultValue}>
                              {state.score.toLocaleString()}
                            </Text>
                          </Text>
                          <Text style={styles.resultLabel}>
                            最高記録{" "}
                            <Text style={styles.resultValue}>
                              {game.best.toLocaleString()}
                            </Text>
                          </Text>
                          <Text style={styles.resultLabel}>
                            レベル {state.level} / 消した列 {state.lines}
                          </Text>
                        </View>
                        <MenuButton title={UI_TEXT.retry} onPress={startGame} />
                        <MenuButton
                          title={UI_TEXT.home}
                          onPress={home}
                          secondary
                        />
                      </>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
        <View style={styles.bottomInfo}>
          <Text maxFontSizeMultiplier={1.1} style={styles.best}>
            最高記録 {game.best.toLocaleString()}
          </Text>
          <Text maxFontSizeMultiplier={1.1} style={styles.tip}>
            {game.storageError
              ? "記録を保存できませんでした"
              : state.phase === "clearing"
                ? `${state.clearingRows.length}列消えた！`
                : state.dropCharge > 0
                  ? "長押しで一気に落とす…"
                  : "とことん遊ぶ"}
          </Text>
        </View>
        {buttons && (
          <Controls
            enabled={state.phase === "playing"}
            input={game.input}
            press={game.press}
            release={game.release}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
const baseStyles = StyleSheet.create({
  dropProgress: {
    position: "absolute",
    left: 0,
    bottom: 0,
    height: 3,
    backgroundColor: c.cyan,
  },
  safe: { flex: 1, backgroundColor: c.background },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 6,
  },
  header: { flexDirection: "row", alignItems: "center", minHeight: 44, gap: 4 },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    color: c.muted,
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: "700",
  },
  smallTitle: {
    color: c.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  mode: { color: c.cyan, fontSize: 11, fontFamily: mono, letterSpacing: 1 },
  hud: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: c.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
  },
  preview: { alignItems: "center", gap: 4, width: 68 },
  score: { alignItems: "flex-start", flex: 1, gap: 2, paddingLeft: 8 },
  scoreValue: {
    color: c.text,
    fontSize: 25,
    fontWeight: "800",
    fontFamily: mono,
  },
  stats: { gap: 5, marginHorizontal: 12 },
  stat: { fontSize: 11, color: c.muted, fontFamily: mono },
  statValue: { color: c.cyan, fontWeight: "700" },
  boardArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 0,
  },
  boardFrame: {
    borderWidth: 1,
    borderColor: c.cyan + "66",
    padding: 2,
    borderRadius: 5,
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: boardColors.overlay,
    borderRadius: 12,
  },
  overlayContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  menu: { width: "100%", maxWidth: 290, alignItems: "center", gap: 10 },
  menuTitle: {
    color: c.cyan,
    fontSize: 44,
    fontWeight: "900",
    fontStyle: "italic",
    lineHeight: 46,
    textAlign: "center",
    letterSpacing: 2,
  },
  menuHeading: {
    color: c.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 1,
  },
  description: {
    color: c.muted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20,
  },
  tip: { fontSize: 14, color: c.muted, lineHeight: 17, textAlign: "center" },
  countdown: { alignItems: "center", gap: 12 },
  countdownText: {
    fontSize: 72,
    color: c.cyan,
    fontWeight: "900",
    fontFamily: mono,
  },
  bottomInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 18,
  },
  best: { color: c.yellow, fontFamily: mono, fontSize: 12 },
  result: { alignItems: "center", gap: 6, paddingVertical: 4 },
  resultLabel: { color: c.muted, fontSize: 12, fontFamily: mono },
  resultValue: { color: c.text, fontSize: 18, fontWeight: "800" },
});
