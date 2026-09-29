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
import { Board, PiecePreview } from "./components/Board";
import { GestureSurface } from "./components/GestureSurface";
import { InputSettings } from "./components/InputSettings";
import { Controls } from "./components/Controls";
import { useBlockDrop } from "./hooks/useBlockDrop";
import { boardColors } from "./theme";

function MenuButton({
  title,
  onPress,
  disabled = false,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      testID={`menu-${title.toLowerCase().replaceAll(" ", "-")}`}
      accessibilityRole="button"
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuButton,
        secondary && styles.secondary,
        { opacity: disabled ? 0.4 : pressed ? 0.65 : 1 },
      ]}
    >
      <Text
        maxFontSizeMultiplier={1.3}
        style={[styles.menuText, secondary && { color: c.text }]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export default function GameScreen() {
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
    <SafeAreaView style={styles.safe}>
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
          <Text maxFontSizeMultiplier={1.2} style={styles.mode}>
            ENDLESS
          </Text>
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
              SCORE
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
              LV{" "}
              <Text style={styles.statValue}>
                {String(state.level).padStart(2, "0")}
              </Text>
            </Text>
            <Text maxFontSizeMultiplier={1.1} style={styles.stat}>
              LINES <Text style={styles.statValue}>{state.lines}</Text>
            </Text>
          </View>
          <View style={styles.preview}>
            <Text maxFontSizeMultiplier={1.2} style={styles.eyebrow}>
              NEXT
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
                contentContainerStyle={styles.overlayContent}
                showsVerticalScrollIndicator={false}
              >
                {state.phase === "countdown" && !showSettings ? (
                  <View
                    accessibilityLiveRegion="polite"
                    style={styles.countdown}
                  >
                    <Text style={styles.countdownText}>
                      {state.countdown || "GO!"}
                    </Text>
                    <Text style={styles.eyebrow}>READY TO DROP</Text>
                  </View>
                ) : (
                  <View style={styles.menu}>
                    {state.phase === "ready" && !showSettings && (
                      <>
                        <Text style={styles.eyebrow}>GAME #001 · 1 PLAYER</Text>
                        <Text
                          accessibilityRole="header"
                          style={styles.menuTitle}
                        >
                          BLOCK{"\n"}DROP
                          <Text style={{ color: c.pink }}>.</Text>
                        </Text>
                        <Text style={styles.description}>
                          ブロックを積んで、ラインを消せ。
                        </Text>
                        <MenuButton
                          title={game.loaded ? "TAP TO START" : "LOADING…"}
                          onPress={startGame}
                          disabled={!game.loaded}
                        />
                        <Text style={styles.tip}>
                          {buttons
                            ? "← → ↓ は長押し対応 / ↻ で回転"
                            : "タップで回転 / 左右ドラッグで移動\n下ドラッグで落下 / 0.5秒長押しでDROP"}
                        </Text>
                      </>
                    )}
                    {showSettings && (
                      <>
                        <Text style={styles.eyebrow}>PAUSE & SETTINGS</Text>
                        <Text
                          accessibilityRole="header"
                          style={styles.menuHeading}
                        >
                          {state.phase === "paused" ? "PAUSED" : "SETTINGS"}
                        </Text>
                        <InputSettings
                          buttons={buttons}
                          onChange={changeInput}
                        />
                        <MenuButton
                          title={state.phase === "paused" ? "RESUME" : "戻る"}
                          onPress={closeSettings}
                        />
                        {state.phase === "paused" && (
                          <MenuButton
                            title="RESTART"
                            onPress={startGame}
                            secondary
                          />
                        )}
                        <MenuButton title="EXIT" onPress={home} secondary />
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
                          {game.newBest ? "NEW BEST!" : "ONE MORE GAME?"}
                        </Text>
                        <Text
                          accessibilityRole="header"
                          style={styles.menuHeading}
                        >
                          GAME OVER
                        </Text>
                        <View style={styles.result}>
                          <Text style={styles.resultLabel}>
                            SCORE{" "}
                            <Text style={styles.resultValue}>
                              {state.score.toLocaleString()}
                            </Text>
                          </Text>
                          <Text style={styles.resultLabel}>
                            BEST{" "}
                            <Text style={styles.resultValue}>
                              {game.best.toLocaleString()}
                            </Text>
                          </Text>
                          <Text style={styles.resultLabel}>
                            LEVEL {state.level} / LINES {state.lines}
                          </Text>
                        </View>
                        <MenuButton title="RETRY" onPress={startGame} />
                        <MenuButton title="HOME" onPress={home} secondary />
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
            BEST {game.best.toLocaleString()}
          </Text>
          <Text maxFontSizeMultiplier={1.1} style={styles.tip}>
            {game.storageError
              ? "記録を保存できませんでした"
              : state.phase === "clearing"
                ? `${state.clearingRows.length} LINE${state.clearingRows.length > 1 ? "S" : ""}!`
                : state.dropCharge > 0
                  ? "長押しでDROP…"
                  : "ENDLESS"}
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
const styles = StyleSheet.create({
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
    fontFamily: mono,
    fontSize: 9,
    letterSpacing: 1.8,
    fontWeight: "700",
  },
  smallTitle: {
    color: c.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  mode: { color: c.cyan, fontSize: 9, fontFamily: mono, letterSpacing: 1 },
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
  stat: { fontSize: 9, color: c.muted, fontFamily: mono },
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
    fontSize: 12,
    textAlign: "center",
    lineHeight: 20,
  },
  menuButton: {
    width: "100%",
    minHeight: 46,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    padding: 10,
    backgroundColor: c.cyan,
  },
  secondary: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  menuText: {
    color: c.background,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
  tip: { fontSize: 10, color: c.muted, lineHeight: 17, textAlign: "center" },
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
  best: { color: c.yellow, fontFamily: mono, fontSize: 10 },
  result: { alignItems: "center", gap: 6, paddingVertical: 4 },
  resultLabel: { color: c.muted, fontSize: 12, fontFamily: mono },
  resultValue: { color: c.text, fontSize: 18, fontWeight: "800" },
});
