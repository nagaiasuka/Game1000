import { useColors, useThemedStyles } from "@/theme/ThemeProvider";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Keyboard,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import {
  GameButton,
  GameInstructions,
  HelpButton,
  HowToPlayModal,
} from "@/components/game/common";
import { UI_TEXT } from "@/data/ui-text";
import { colors as c } from "@/theme";
import { Board, Chip } from "./components/Board";
import { useNeonStack } from "./hooks/useNeonStack";
import {
  ERRORS,
  PLAYER,
  SIZE_LABEL,
  playerName as defaultPlayerName,
} from "./presentation";
import { SIZES } from "./logic/rules";

export default function GameScreen() {
  const c = useColors();
  const styles = useThemedStyles(baseStyles);

  const { state, dispatch, start } = useNeonStack();
  const match = state.match;
  const [names, setNames] = useState({ 1: "", 2: "" });
  const playerName = (player: 1 | 2) => defaultPlayerName(player, names);
  const begin = () => {
    Keyboard.dismiss();
    start();
  };
  const [helpOpen, setHelpOpen] = useState(false);
  const { fontScale } = useWindowDimensions();
  const [boardSize, setBoardSize] = useState(0);
  const goHome = useCallback(() => {
    if (match?.phase === "playing") {
      Alert.alert(
        "ホームに戻りますか？",
        "今の対戦と、この画面での勝利数はリセットされます。",
        [
          { text: UI_TEXT.cancel, style: "cancel" },
          { text: UI_TEXT.home, onPress: () => router.dismissTo("/") },
        ],
      );
    } else router.dismissTo("/");
  }, [match?.phase]);
  useFocusEffect(
    useCallback(() => {
      const back = BackHandler.addEventListener("hardwareBackPress", () => {
        goHome();
        return true;
      });
      return () => back.remove();
    }, [goHome]),
  );
  const [turnOpacity] = useState(() => new Animated.Value(1));
  const moveNumber = match?.moves;
  const firstPlayer = match?.first;
  useEffect(() => {
    turnOpacity.setValue(0.5);
    const animation = Animated.timing(turnOpacity, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [turnOpacity, moveNumber, firstPlayer]);
  const active = match?.phase === "playing";
  const current = match?.winner ?? match?.turn ?? 1;
  const accent = PLAYER[current].color;
  const restart = () =>
    Alert.alert(
      "この対戦を最初からやり直しますか？",
      "先攻を決め直します。これまでの勝利数は残ります。",
      [
        { text: UI_TEXT.cancel, style: "cancel" },
        { text: "やり直す", onPress: start },
      ],
    );
  return (
    <SafeAreaView style={styles.safe}>
      <HowToPlayModal
        gameId="003"
        visible={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={goHome}
          style={styles.headerButton}
        >
          <Text maxFontSizeMultiplier={1.3} style={styles.link}>
            ‹ ホーム
          </Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text maxFontSizeMultiplier={1.2} style={styles.number}>
            GAME #003
          </Text>
          <Text maxFontSizeMultiplier={1.2} style={styles.name}>
            NEON STACK
          </Text>
        </View>
        <HelpButton onPress={() => setHelpOpen(true)} />
      </View>
      {!match ? (
        <ScrollView
          key={`stack-${fontScale}`}
          contentContainerStyle={styles.content}
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.intro}>
            <Text style={styles.tag}>1台のスマホで、2人対戦</Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.hero}>
              NEON{"\n"}STACK<Text style={{ color: c.pink }}>.</Text>
            </Text>
            <View style={styles.demo}>
              <Chip player={1} size={1} diameter={75} />
              <Text style={styles.link}>＜</Text>
              <Chip player={2} size={3} diameter={90} />
            </View>
            <Text style={styles.subtitle}>上からかぶせる、三目並べ。</Text>
            <GameInstructions gameId="003" compact />
            <View style={{ width: "100%", gap: 12 }}>
              <Text style={styles.note}>
                名前を入れて遊べます（入力しなくてもOK）
              </Text>
              {([1, 2] as const).map((player) => (
                <View key={player} style={{ gap: 6 }}>
                  <Text
                    style={[styles.player, { color: PLAYER[player].color }]}
                  >
                    {PLAYER[player].label} · {PLAYER[player].symbol}
                  </Text>
                  <TextInput
                    accessibilityLabel={`${PLAYER[player].label}の名前`}
                    value={names[player]}
                    onChangeText={(value) =>
                      setNames((old) => ({ ...old, [player]: value }))
                    }
                    placeholder={PLAYER[player].label}
                    placeholderTextColor={c.muted}
                    maxLength={12}
                    returnKeyType="done"
                    autoCorrect={false}
                    style={styles.nameInput}
                  />
                </View>
              ))}
            </View>
            <GameButton title="2人でスタート" onPress={begin} />
            <Text style={styles.note}>先攻はランダムに決まります。</Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.game}>
          <View style={styles.hud}>
            <View style={styles.scoreRow}>
              {([1, 2] as const).map((player) => (
                <View
                  key={player}
                  style={[
                    styles.scoreBox,
                    { borderColor: PLAYER[player].color + "80" },
                  ]}
                >
                  <Chip player={player} size={3} diameter={32} />
                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      maxFontSizeMultiplier={1.2}
                      style={[styles.player, { color: PLAYER[player].color }]}
                    >
                      {playerName(player)}
                    </Text>
                    <Text maxFontSizeMultiplier={1.2} style={styles.smallNote}>
                      {PLAYER[player].symbol}
                    </Text>
                  </View>
                  <Text maxFontSizeMultiplier={1.2} style={styles.score}>
                    {state.wins[player]}勝
                  </Text>
                </View>
              ))}
            </View>
            <Animated.View
              accessibilityLiveRegion="polite"
              style={[
                styles.turn,
                { borderColor: accent, opacity: turnOpacity },
              ]}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                maxFontSizeMultiplier={1.2}
                style={[styles.turnText, { color: accent }]}
              >
                {match.phase === "won"
                  ? `${playerName(match.winner!)}の勝ち！`
                  : match.phase === "draw"
                    ? "引き分け！"
                    : `${playerName(match.turn)}の番`}
              </Text>
            </Animated.View>
          </View>
          <View
            style={styles.boardArea}
            onLayout={({ nativeEvent: { layout } }) =>
              setBoardSize(Math.floor(Math.min(layout.width, layout.height)))
            }
          >
            {boardSize > 0 && (
              <View style={{ width: boardSize, height: boardSize }}>
                <Board
                  match={match}
                  names={names}
                  selected={state.selected}
                  onCell={(cell) => {
                    if (!helpOpen && AppState.currentState === "active")
                      dispatch({
                        type: "place",
                        cell,
                        expectedMoves: match.moves,
                      });
                  }}
                />
              </View>
            )}
          </View>
          <View style={styles.controls}>
            <View accessibilityLiveRegion="polite" style={styles.message}>
              <Text
                numberOfLines={2}
                maxFontSizeMultiplier={1.2}
                style={[
                  styles.messageText,
                  { color: state.error ? c.yellow : c.text },
                ]}
              >
                {state.error
                  ? ERRORS[state.error]
                  : !active
                    ? `手数 ${match.moves}回 · かぶせ ${match.covers}回 · 対戦 ${state.rounds}回`
                    : state.selected
                      ? `${SIZE_LABEL[state.selected]}の駒：光るマスに置けます。`
                      : match.skipped
                        ? "相手は置けないため、もう一度あなたの番。"
                        : match.moves === 0
                          ? "先攻が決まりました。駒を選んでマスをタップ。"
                          : match.captured
                            ? "かぶせた！ 次の人が駒を選ぼう。"
                            : "① 駒を選ぶ → ② マスをタップ"}
              </Text>
            </View>
            <View style={styles.handArea}>
              {active ? (
                <View style={styles.hand}>
                  {SIZES.map((size) => {
                    const count = match.inventory[match.turn][size];
                    const selected = state.selected === size;
                    return (
                      <Pressable
                        key={size}
                        testID={`stack-size-${size}`}
                        accessibilityRole="button"
                        accessibilityLabel={`${playerName(match.turn)}の${SIZE_LABEL[size]}の駒、残り${count}個`}
                        accessibilityState={{ selected, disabled: count === 0 }}
                        disabled={count === 0}
                        onPress={() => dispatch({ type: "select", size })}
                        style={({ pressed }) => [
                          styles.choice,
                          {
                            borderColor: selected ? accent : c.border,
                            backgroundColor: selected
                              ? accent + "14"
                              : c.surface,
                            opacity: count === 0 ? 0.4 : pressed ? 0.6 : 1,
                          },
                        ]}
                      >
                        <Text
                          maxFontSizeMultiplier={1.2}
                          style={[
                            styles.sizeLabel,
                            { color: selected ? accent : c.text },
                          ]}
                        >
                          {selected ? "✓ " : ""}
                          {SIZE_LABEL[size]}
                        </Text>
                        <View style={styles.chipSlot}>
                          <Chip player={match.turn} size={size} diameter={42} />
                        </View>
                        <Text
                          maxFontSizeMultiplier={1.2}
                          style={styles.smallNote}
                        >
                          残り {count}個
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.result}>
                  <Text maxFontSizeMultiplier={1.2} style={styles.messageText}>
                    {match.phase === "draw"
                      ? "2人とも置ける駒がなくなりました。"
                      : "3つ、そろいました！"}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={start}
                    style={styles.rematch}
                  >
                    <Text
                      maxFontSizeMultiplier={1.2}
                      style={styles.rematchText}
                    >
                      もう一度対戦する
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: state.history.length === 0 }}
                disabled={state.history.length === 0}
                onPress={() =>
                  dispatch({ type: "undo", expectedMoves: match.moves })
                }
                style={[
                  styles.action,
                  { opacity: state.history.length === 0 ? 0.4 : 1 },
                ]}
              >
                <Text maxFontSizeMultiplier={1.2} style={styles.actionText}>
                  ↶ 1手戻す
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={active ? restart : goHome}
                style={styles.action}
              >
                <Text maxFontSizeMultiplier={1.2} style={styles.actionText}>
                  {active ? "最初から" : UI_TEXT.home}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
const baseStyles = StyleSheet.create({
  nameInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: c.text,
    backgroundColor: c.surface,
  },
  safe: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    minHeight: 52,
  },
  headerButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  link: { color: c.cyan, fontSize: 14, fontWeight: "700" },
  number: { color: c.muted, fontSize: 11 },
  name: { color: c.text, fontSize: 16, fontWeight: "900" },
  content: { paddingHorizontal: "2.5%", paddingBottom: 24, gap: 12 },
  intro: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 18,
    alignItems: "center",
  },
  tag: { color: c.pink, fontSize: 15, fontWeight: "700" },
  hero: {
    color: c.cyan,
    fontSize: 46,
    lineHeight: 48,
    fontStyle: "italic",
    fontWeight: "900",
    textAlign: "center",
  },
  demo: { flexDirection: "row", gap: 18, alignItems: "center", minHeight: 88 },
  subtitle: {
    color: c.text,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  note: { color: c.muted, fontSize: 14, lineHeight: 21, textAlign: "center" },
  game: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: "2.5%",
    paddingBottom: 8,
    gap: 6,
  },
  hud: { gap: 6 },
  scoreRow: { flexDirection: "row", gap: 8, height: 48 },
  scoreBox: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: c.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  player: { fontSize: 13, fontWeight: "700" },
  score: { color: c.text, fontSize: 14, fontWeight: "800" },
  smallNote: { color: c.muted, fontSize: 12, lineHeight: 16 },
  turn: {
    height: 36,
    justifyContent: "center",
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: c.surface,
  },
  turnText: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  boardArea: {
    flex: 1,
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  controls: { gap: 6 },
  message: { height: 42, justifyContent: "center", paddingHorizontal: 4 },
  messageText: {
    color: c.text,
    fontSize: 14,
    lineHeight: 18,
    textAlign: "center",
  },
  handArea: { height: 100 },
  hand: { flex: 1, flexDirection: "row", gap: 8 },
  choice: {
    flex: 1,
    minWidth: 44,
    borderWidth: 2,
    borderRadius: 12,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  chipSlot: { height: 38, alignItems: "center", justifyContent: "center" },
  sizeLabel: { fontSize: 14, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 8, height: 44 },
  action: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { color: c.text, fontSize: 14, fontWeight: "700" },
  result: { flex: 1, justifyContent: "center", gap: 8 },
  rematch: {
    minHeight: 48,
    backgroundColor: c.cyan,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rematchText: { color: c.background, fontSize: 16, fontWeight: "800" },
});
