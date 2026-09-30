import { useCallback, useEffect, useReducer, useState, useRef } from "react";
import {
  Alert,
  AppState,
  BackHandler,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { audio } from "@/audio/native";
import {
  GameButton,
  GameInstructions,
  HelpButton,
  HowToPlayModal,
} from "@/components/game/common";
import { NeonPathArtwork } from "@/components/game-artwork";
import { useColors } from "@/theme/ThemeProvider";
import { UI_TEXT } from "@/data/ui-text";
import { initialSession, sessionReducer } from "./logic/session";
import {
  shortestPath,
  wallError,
  type Candidate,
  type TurnAction,
} from "./logic/engine";
import { pathSound } from "./audio";
import { ERRORS, PLAYER_COLOR, playerName } from "./presentation";
import { PathPerson } from "@/components/path-person";
import { WallTray } from "./components/WallTray";
import { Board } from "./components/Board";

export default function GameScreen() {
  const c = useColors();
  const [state, dispatch] = useReducer(
    sessionReducer,
    undefined,
    initialSession,
  );
  const match = state.match;
  const [names, setNames] = useState({ 1: "", 2: "" });
  const [help, setHelp] = useState(false);
  const [mode, setMode] = useState<"move" | "wall">("move");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const boardRef = useRef<View>(null);
  const preview = useCallback((value: Candidate | null, dragging: boolean) => {
    setCandidate(value);
    setMode(dragging ? "wall" : "move");
  }, []);
  const [size, setSize] = useState(0);
  const [compact, setCompact] = useState(false);
  const phase = match ? (match.winner ? "won" : "playing") : "intro";
  useFocusEffect(
    useCallback(() => {
      audio.setScene("004", phase === "intro" ? "home" : "004");
      audio.setPaused("004", phase === "won");
      return () => audio.setPaused("004", true);
    }, [phase]),
  );
  useEffect(() => {
    if (!state.event || AppState.currentState !== "active") return;
    const kind = state.event.kind;
    audio.play(pathSound(kind), kind === "goal" ? 3 : 1);
    const effect =
      kind === "goal" || kind === "warning"
        ? Haptics.notificationAsync(
            kind === "goal"
              ? Haptics.NotificationFeedbackType.Success
              : Haptics.NotificationFeedbackType.Warning,
          )
        : Haptics.impactAsync(
            kind === "wall"
              ? Haptics.ImpactFeedbackStyle.Medium
              : Haptics.ImpactFeedbackStyle.Light,
          );
    void effect.catch(() => {});
  }, [state.event]);
  const goHome = useCallback(() => {
    const leave = () => router.dismissTo("/");
    if (phase === "playing")
      Alert.alert("ホームに戻りますか？", "現在の対戦は終了します。", [
        { text: UI_TEXT.cancel, style: "cancel" },
        { text: UI_TEXT.home, onPress: leave },
      ]);
    else leave();
  }, [phase]);
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        goHome();
        return true;
      });
      return () => sub.remove();
    }, [goHome]),
  );
  const resetMode = () => {
    setMode("move");
    setCandidate(null);
  };
  const start = () => {
    Keyboard.dismiss();
    resetMode();
    dispatch({ type: "start" });
  };
  const act = (action: TurnAction) => {
    if (help || AppState.currentState !== "active") return;
    dispatch({ type: "act", action, revision: state.revision });
    if (action.type === "move" || (match && !wallError(match, action.wall)))
      resetMode();
  };
  const name = (p: 1 | 2) => playerName(p, names);
  const accent = PLAYER_COLOR[match?.winner ?? match?.turn ?? 1];
  const error = match && candidate ? wallError(match, candidate) : null;
  const button = (
    title: string,
    onPress: () => void,
    disabled = false,
    primary = false,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        {
          borderColor: primary ? c.cyan : c.border,
          backgroundColor: primary ? c.cyan : c.surface,
          opacity: disabled ? 0.35 : pressed ? 0.6 : 1,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
        adjustsFontSizeToFit
        style={{
          color: primary ? c.background : c.text,
          fontSize: 14,
          fontWeight: "800",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <HowToPlayModal
        gameId="004"
        visible={help}
        onClose={() => setHelp(false)}
      />
      <View style={s.header}>
        <Pressable accessibilityRole="button" onPress={goHome} style={s.home}>
          <Text maxFontSizeMultiplier={1.2} style={{ color: c.cyan }}>
            ‹ ホーム
          </Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            maxFontSizeMultiplier={1.1}
            style={{ color: c.muted, fontSize: 11, letterSpacing: 2 }}
          >
            GAME #004
          </Text>
          <Text
            maxFontSizeMultiplier={1.1}
            style={{ color: c.text, fontWeight: "900", fontSize: 18 }}
          >
            NEON PATH
          </Text>
        </View>
        <HelpButton
          onPress={() => {
            resetMode();
            setHelp(true);
          }}
        />
      </View>
      {!match ? (
        <ScrollView
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.intro}
        >
          <Text style={{ color: c.cyan, textAlign: "center", fontSize: 14 }}>
            1台のスマホで、2人の頭脳戦
          </Text>
          <NeonPathArtwork />
          <Text
            style={{
              color: c.text,
              fontSize: 23,
              fontWeight: "900",
              textAlign: "center",
            }}
          >
            道を進め。道をふさげ。
          </Text>
          <GameInstructions gameId="004" compact />
          <Text style={{ color: c.muted, fontSize: 14 }}>
            名前を入れて遊べます（入力しなくてもOK）
          </Text>
          {([1, 2] as const).map((p) => (
            <View key={p} style={{ gap: 6 }}>
              <Text style={{ color: PLAYER_COLOR[p], fontSize: 14 }}>
                プレイヤー{p} · {p === 1 ? "上" : "下"}
                がゴール
              </Text>
              <TextInput
                accessibilityLabel={`プレイヤー${p}の名前`}
                placeholder={`プレイヤー${p}`}
                placeholderTextColor={c.muted}
                value={names[p]}
                onChangeText={(value) =>
                  setNames((old) => ({ ...old, [p]: value }))
                }
                maxLength={12}
                autoCorrect={false}
                returnKeyType="done"
                style={{
                  color: c.text,
                  backgroundColor: c.surface,
                  borderColor: c.border,
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 12,
                  minHeight: 48,
                }}
              />
            </View>
          ))}
          <GameButton title="2人でスタート" onPress={start} />
          <Text style={{ color: c.muted, textAlign: "center" }}>
            プレイヤー1が先攻。もう一度遊ぶと先攻が交代します。
          </Text>
        </ScrollView>
      ) : (
        <View
          style={s.game}
          onLayout={({ nativeEvent: { layout } }) =>
            setCompact(layout.height < 560)
          }
        >
          <View style={s.hud}>
            {([1, 2] as const).map((p) => (
              <View
                key={p}
                style={[
                  s.player,
                  {
                    borderColor:
                      PLAYER_COLOR[p] + (match.turn === p ? "FF" : "70"),
                    backgroundColor:
                      compact && match.turn === p
                        ? PLAYER_COLOR[p] + "18"
                        : c.surface,
                  },
                ]}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                >
                  <PathPerson player={p} size={28} />
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      maxFontSizeMultiplier={1.15}
                      style={{
                        color: PLAYER_COLOR[p],
                        fontSize: 13,
                        fontWeight: "800",
                      }}
                    >
                      {name(p)}
                    </Text>
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      maxFontSizeMultiplier={1.15}
                      style={{ color: c.text, fontSize: 13 }}
                    >
                      {compact
                        ? `壁${match.remaining[p]}枚${!match.winner && match.turn === p ? " · 手番" : ""}`
                        : `壁 残り${match.remaining[p]}枚`}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
          {!compact && (
            <View
              accessibilityLiveRegion="polite"
              style={[
                s.turn,
                { borderColor: accent, backgroundColor: accent + "10" },
              ]}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1.2}
                style={{ fontSize: 17, fontWeight: "800", color: accent }}
              >
                {match.winner
                  ? `${name(match.winner)}の勝ち！`
                  : `${name(match.turn)}の番`}
              </Text>
            </View>
          )}
          <View
            style={s.boardArea}
            onLayout={({ nativeEvent: { layout } }) =>
              setSize(
                Math.floor(
                  Math.max(0, Math.min(layout.width, layout.height - 36)),
                ),
              )
            }
          >
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.1}
              style={[s.goal, { color: PLAYER_COLOR[1] }]}
            >
              ↑ 1のゴール
            </Text>
            {size > 0 && (
              <Board
                match={match}
                size={size}
                mode={mode}
                candidate={candidate}
                orientation={candidate?.orientation ?? "horizontal"}
                boardRef={boardRef}
                onMove={(target) => act({ type: "move", target })}
                onSelectPawn={() => {
                  audio.play("ui");
                  resetMode();
                }}
                disabled={help || !!match.winner}
              />
            )}
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={1.1}
              style={[s.goal, { color: PLAYER_COLOR[2] }]}
            >
              2のゴール ↓
            </Text>
            {match.winner && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  maxWidth: "90%",
                  padding: 18,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: accent,
                  backgroundColor: c.background + "EF",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Text
                  maxFontSizeMultiplier={1.2}
                  style={{
                    color: accent,
                    fontSize: 26,
                    fontWeight: "900",
                    letterSpacing: 4,
                  }}
                >
                  GOAL!
                </Text>
                <Text
                  numberOfLines={2}
                  maxFontSizeMultiplier={1.2}
                  style={{
                    color: c.text,
                    fontSize: 17,
                    fontWeight: "800",
                    textAlign: "center",
                  }}
                >
                  {name(match.winner)}の勝ち！
                </Text>
              </View>
            )}
          </View>
          <View style={s.controls}>
            <View accessibilityLiveRegion="polite" style={s.message}>
              <Text
                numberOfLines={2}
                maxFontSizeMultiplier={1.15}
                style={{
                  fontSize: 13,
                  lineHeight: 17,
                  textAlign: "center",
                  color: error || state.error ? c.yellow : c.text,
                }}
              >
                {match.winner
                  ? `ゴール！ ${match.moves}手 ／ 置いた壁 1：${10 - match.remaining[1]}枚・2：${10 - match.remaining[2]}枚`
                  : mode === "wall"
                    ? error
                      ? ERRORS[error]
                      : candidate
                        ? "ここで離すと配置して交代。盤面の外へ戻すと取消"
                        : "盤面へ引っ張って、置きたい場所で離そう"
                    : state.error
                      ? ERRORS[state.error]
                      : `光るマスへ進もう。ゴールまで最短 ${shortestPath(match, match.turn)}マス`}
              </Text>
            </View>
            <View style={s.row}>
              {match.winner ? (
                <>
                  {button(UI_TEXT.retry, start, false, true)}
                  {button(UI_TEXT.home, goHome)}
                </>
              ) : (
                <>
                  <WallTray
                    key={`${state.revision}-${help}`}
                    boardRef={boardRef}
                    count={match.remaining[match.turn]}
                    color={accent}
                    disabled={help || !!match.winner}
                    onPreview={preview}
                    onDrop={(wall) => act({ type: "wall", wall })}
                  />
                  <View style={{ width: 88 }}>
                    {button(
                      "1手戻す",
                      () => {
                        dispatch({ type: "undo", revision: state.revision });
                        resetMode();
                      },
                      !state.previous || mode === "wall",
                    )}
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 6,
  },
  home: { minHeight: 44, minWidth: 64, justifyContent: "center" },
  intro: {
    padding: 20,
    gap: 18,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  game: { flex: 1, paddingHorizontal: "2.5%", paddingBottom: 8, gap: 4 },
  hud: { height: 48, flexDirection: "row", gap: 8 },
  player: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 9,
    justifyContent: "center",
    gap: 2,
  },
  turn: {
    height: 34,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  boardArea: {
    flex: 1,
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  goal: { height: 18, fontSize: 11, textAlign: "center" },
  controls: { height: 86, gap: 4 },
  message: { height: 34, justifyContent: "center" },
  row: { height: 48, flexDirection: "row", alignItems: "center", gap: 6 },
  button: {
    flex: 1,
    height: 48,
    minWidth: 44,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
});
