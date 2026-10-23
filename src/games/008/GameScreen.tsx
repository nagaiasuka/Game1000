import { useCallback, useState } from "react";
import {
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  GameButton,
  GameInstructions,
  HelpButton,
  HowToPlayModal,
} from "@/components/game/common";
import { NeonCascadeArtwork } from "@/components/game-artwork";
import { SoundControls } from "@/audio/SoundSettings";
import { useColors } from "@/theme/ThemeProvider";
import { UI_TEXT } from "@/data/ui-text";
import { STAGES } from "./stages";
import { useNeonCascade } from "./useNeonCascade";
import { Field } from "./components/Field";
function ToolbarButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: 44,
        minWidth: 44,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 7,
      }}
    >
      <Text
        maxFontSizeMultiplier={1.2}
        style={{ color: c.cyan, fontSize: 13, fontWeight: "700" }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export default function GameScreen() {
  const c = useColors(),
    game = useNeonCascade(),
    s = game.hud;
  const [help, setHelp] = useState(false),
    [confirm, setConfirm] = useState<"restart" | "quit" | "select" | null>(
      null,
    );
  const result = s.phase === "stage_clear" || s.phase === "game_over",
    canAim = s.phase === "ready" || s.phase === "aiming";
  const { started, pause } = game;
  const quit = useCallback(() => {
    if (started && !result) {
      pause();
      setConfirm("quit");
    } else router.replace("/games");
  }, [started, pause, result]);
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        quit();
        return true;
      });
      return () => sub.remove();
    }, [quit]),
  );
  const openHelp = () => {
    if (game.started && !result) game.pause();
    setHelp(true);
  };
  const body = { color: c.text, fontSize: 15 } as const;
  const pauseVisible = (s.phase === "paused" || !!confirm) && !help;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 8,
        }}
      >
        <ToolbarButton title="‹ 一覧" onPress={quit} />
        <Text
          maxFontSizeMultiplier={1.1}
          style={{ color: c.muted, fontSize: 12, flex: 1, fontWeight: "800" }}
        >
          GAME #008
        </Text>
        {game.started && !result && (
          <ToolbarButton title={UI_TEXT.paused} onPress={game.pause} />
        )}
        <HelpButton onPress={openHelp} />
      </View>
      {!game.started ? (
        <ScrollView
          contentContainerStyle={{
            padding: 18,
            gap: 18,
            width: "100%",
            maxWidth: 660,
            alignSelf: "center",
          }}
        >
          <NeonCascadeArtwork />
          <Text
            accessibilityRole="header"
            style={{ color: c.text, fontSize: 28, fontWeight: "900" }}
          >
            NEON CASCADE
          </Text>
          <Text style={body}>増やして、つないで、崩しきれ。</Text>
          <Text style={{ color: c.muted, fontSize: 14 }}>
            1人で遊ぶ · 10ステージ＋エンドレス
          </Text>
          <Text style={{ color: c.cyan, fontSize: 18, fontWeight: "800" }}>
            ステージを選ぶ
          </Text>
          {!!game.storageError && (
            <Text
              accessibilityLiveRegion="polite"
              style={{ color: c.yellow, fontSize: 14 }}
            >
              {game.storageError}
            </Text>
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {STAGES.map((stage) => {
              const locked = stage.id > game.records.highest,
                record = game.records.stages[stage.id];
              return (
                <Pressable
                  key={stage.id}
                  accessibilityRole="button"
                  accessibilityLabel={`ステージ${stage.id} ${stage.title}${locked ? "、未解放" : `、星${record?.stars ?? 0}個`}`}
                  accessibilityState={{ disabled: locked || !game.loaded }}
                  disabled={locked || !game.loaded}
                  onPress={() => game.start(stage.id)}
                  style={{
                    width: "48%",
                    minHeight: 112,
                    padding: 13,
                    gap: 6,
                    borderWidth: 1,
                    borderRadius: 15,
                    borderColor: locked ? c.border : c.cyan + "88",
                    backgroundColor: c.surface,
                    opacity: locked ? 0.5 : 1,
                  }}
                >
                  <Text
                    style={{
                      color: locked ? c.muted : c.cyan,
                      fontSize: 12,
                      fontWeight: "800",
                    }}
                  >
                    {locked
                      ? "未解放"
                      : `ステージ ${String(stage.id).padStart(2, "0")}`}
                  </Text>
                  <Text
                    style={{ color: c.text, fontSize: 15, fontWeight: "800" }}
                  >
                    {stage.title}
                  </Text>
                  <Text
                    accessibilityLabel={`最高星数${record?.stars ?? 0}`}
                    style={{ color: c.yellow, fontSize: 16, letterSpacing: 2 }}
                  >
                    {"★".repeat(record?.stars ?? 0)}
                    {"☆".repeat(3 - (record?.stars ?? 0))}
                  </Text>
                  {!locked && (
                    <Text style={{ color: c.muted, fontSize: 11 }}>
                      {stage.shots}回まで · 最高{" "}
                      {(record?.score ?? 0).toLocaleString("ja-JP")}点
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
          <GameButton
            title="エンドレスで遊ぶ"
            disabled={!game.loaded}
            onPress={() => game.start(1, "endless")}
          />
          <Text style={{ color: c.muted, fontSize: 14 }}>
            エンドレス最高 {game.records.endlessBest.toLocaleString("ja-JP")}点
            · 第{game.records.endlessWave}波
          </Text>
          <GameInstructions gameId="008" compact />
        </ScrollView>
      ) : result ? (
        <ScrollView
          contentContainerStyle={{
            padding: 24,
            gap: 22,
            width: "100%",
            maxWidth: 640,
            alignSelf: "center",
          }}
        >
          <Text style={{ color: c.cyan, fontSize: 14, fontWeight: "800" }}>
            {s.mode === "endless"
              ? `エンドレス 第${s.stage.id}波`
              : `ステージ ${s.stage.id} · ${s.stage.title}`}
          </Text>
          <Text
            accessibilityRole="header"
            style={{
              color: s.phase === "stage_clear" ? c.cyan : c.pink,
              fontSize: 30,
              fontWeight: "900",
            }}
          >
            {s.phase === "game_over"
              ? "ゲーム終了"
              : s.mode === "stages" && s.stage.id === 10
                ? "全10ステージクリア！"
                : "クリア！"}
          </Text>
          {s.phase === "stage_clear" && s.mode === "stages" && (
            <Text
              accessibilityLabel={`星${s.stars}個`}
              style={{ color: c.yellow, fontSize: 48, letterSpacing: 8 }}
            >
              {"★".repeat(s.stars)}
              {"☆".repeat(3 - s.stars)}
            </Text>
          )}
          <View
            style={{
              padding: 20,
              gap: 14,
              borderWidth: 1,
              borderColor: c.cyan + "77",
              borderRadius: 18,
              backgroundColor: c.surface,
            }}
          >
            <Text style={{ color: c.text, fontSize: 30, fontWeight: "900" }}>
              {s.score.toLocaleString("ja-JP")}
              <Text style={{ fontSize: 15 }}> 点</Text>
            </Text>
            <Text style={body}>
              使ったショット {s.used} / {s.stage.shots}回
            </Text>
            <Text style={body}>
              最大 {s.maxCombo}連鎖 · 最大 {s.peakBalls}球
            </Text>
          </View>
          {!!game.storageError && (
            <Text style={{ color: c.yellow, fontSize: 14 }}>
              {game.storageError}
            </Text>
          )}
          {s.phase === "game_over" && (
            <Text style={body}>作戦のヒント：{s.stage.hint}</Text>
          )}
          {s.phase === "stage_clear" &&
            (s.mode === "endless" || s.stage.id < 10) && (
              <GameButton
                title={s.mode === "endless" ? "次の波へ" : "次のステージへ"}
                onPress={game.next}
              />
            )}
          <GameButton title={UI_TEXT.retry} onPress={game.restart} />
          <GameButton title="ステージ選択へ" secondary onPress={game.select} />
          <GameButton
            title="ゲーム一覧へ"
            secondary
            onPress={() => router.replace("/games")}
          />
        </ScrollView>
      ) : (
        <View
          style={{ flex: 1, paddingHorizontal: 10, paddingBottom: 6, gap: 6 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.15}
              style={{
                color: c.text,
                fontSize: 17,
                fontWeight: "900",
                flex: 1,
              }}
            >
              {s.mode === "endless"
                ? `第${s.stage.id}波`
                : `${String(s.stage.id).padStart(2, "0")}`}{" "}
              · {s.stage.title}
            </Text>
            <Text
              maxFontSizeMultiplier={1.15}
              style={{ color: c.cyan, fontSize: 12 }}
            >
              残り {s.shotsLeft}発
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: c.surface,
                borderRadius: 10,
                padding: 7,
              }}
            >
              <Text
                maxFontSizeMultiplier={1.1}
                style={{ color: c.muted, fontSize: 11 }}
              >
                スコア
              </Text>
              <Text
                maxFontSizeMultiplier={1.1}
                style={{ color: c.text, fontSize: 20, fontWeight: "900" }}
              >
                {s.score.toLocaleString("ja-JP")}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: c.surface,
                borderRadius: 10,
                padding: 7,
              }}
            >
              <Text
                maxFontSizeMultiplier={1.1}
                style={{ color: c.muted, fontSize: 11 }}
              >
                連鎖 / 残り目標
              </Text>
              <Text
                maxFontSizeMultiplier={1.1}
                style={{ color: c.pink, fontSize: 20, fontWeight: "900" }}
              >
                {s.combo}
                <Text style={{ fontSize: 12, color: c.text }}>
                  {" "}
                  / {s.remaining}個
                </Text>
              </Text>
            </View>
            <View
              style={{
                width: 64,
                backgroundColor: c.surface,
                borderRadius: 10,
                padding: 7,
              }}
            >
              <Text
                maxFontSizeMultiplier={1.1}
                style={{ color: c.muted, fontSize: 11 }}
              >
                球の数
              </Text>
              <Text
                maxFontSizeMultiplier={1.1}
                style={{ color: c.cyan, fontSize: 20, fontWeight: "900" }}
              >
                {s.activeBalls}
                <Text style={{ fontSize: 10 }}> /64</Text>
              </Text>
            </View>
          </View>
          <View
            accessibilityLabel={
              s.feverLeft > 0 ? "フィーバー中" : "フィーバーゲージ"
            }
            style={{
              height: 5,
              backgroundColor: c.border,
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 5,
                width: `${Math.min(100, s.feverLeft > 0 ? (s.feverLeft / 8) * 100 : (s.fever / 10) * 100)}%`,
                backgroundColor: s.feverLeft > 0 ? c.pink : c.cyan,
              }}
            />
          </View>
          <Field
            hud={s}
            frame={game.frame}
            reducedEffects={game.records.reducedEffects}
            onAim={game.aim}
            onLaunch={game.launch}
            onCancel={game.cancelAim}
          />
          <Text
            numberOfLines={2}
            maxFontSizeMultiplier={1.15}
            style={{
              color: c.muted,
              fontSize: 12,
              textAlign: "center",
              minHeight: 30,
            }}
          >
            {canAim
              ? s.stage.hint
              : s.phase === "resolving"
                ? "ショットを集計中…"
                : s.feverLeft > 0
                  ? "フィーバー！ 得点2倍"
                  : "球が戻るまで待ってね"}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ width: 64 }}>
              <GameButton
                secondary
                title="左へ"
                disabled={!canAim}
                onPress={() => game.aim(s.angle - 0.08)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <GameButton
                title={
                  canAim
                    ? "発射"
                    : s.phase === "resolving"
                      ? "集計中"
                      : "連鎖中"
                }
                disabled={!canAim}
                onPress={game.launch}
              />
            </View>
            <View style={{ width: 64 }}>
              <GameButton
                secondary
                title="右へ"
                disabled={!canAim}
                onPress={() => game.aim(s.angle + 0.08)}
              />
            </View>
          </View>
        </View>
      )}
      <HowToPlayModal
        gameId="008"
        visible={help}
        onClose={() => setHelp(false)}
      />
      <Modal
        visible={pauseVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirm(null)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 22,
            backgroundColor: "#000000CE",
          }}
        >
          <ScrollView
            style={{ maxHeight: "90%", flexGrow: 0 }}
            contentContainerStyle={{
              padding: 20,
              gap: 16,
              borderRadius: 18,
              backgroundColor: c.surface,
            }}
          >
            <Text style={{ color: c.text, fontSize: 24, fontWeight: "800" }}>
              {confirm
                ? confirm === "restart"
                  ? "最初からやり直しますか？"
                  : confirm === "select"
                    ? "ステージ選択へ戻りますか？"
                    : "ゲーム一覧へ戻りますか？"
                : UI_TEXT.paused}
            </Text>
            {confirm ? (
              <>
                <Text style={body}>
                  今回のプレイは終了します。保存済みの最高記録と星は残ります。
                </Text>
                <GameButton
                  title={
                    confirm === "restart"
                      ? "やり直す"
                      : confirm === "select"
                        ? "ステージ選択へ"
                        : "ゲーム一覧へ"
                  }
                  onPress={() => {
                    const action = confirm;
                    setConfirm(null);
                    if (action === "restart") game.restart();
                    else if (action === "select") game.select();
                    else router.replace("/games");
                  }}
                />
                <GameButton
                  title={UI_TEXT.cancel}
                  secondary
                  onPress={() => setConfirm(null)}
                />
              </>
            ) : (
              <>
                <GameButton title={UI_TEXT.resume} onPress={game.resume} />
                <GameButton
                  title={UI_TEXT.howToPlay}
                  secondary
                  onPress={() => setHelp(true)}
                />
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Text style={{ ...body, flex: 1 }}>演出を控えめにする</Text>
                  <Switch
                    accessibilityLabel="演出を控えめにする"
                    value={game.records.reducedEffects}
                    onValueChange={game.reducedEffects}
                    trackColor={{ true: c.cyan }}
                  />
                </View>
                <SoundControls />
                <GameButton
                  title={UI_TEXT.restart}
                  secondary
                  onPress={() => setConfirm("restart")}
                />
                <GameButton
                  title="ステージ選択へ"
                  secondary
                  onPress={() => setConfirm("select")}
                />
                <GameButton
                  title="ゲーム一覧へ"
                  secondary
                  onPress={() => setConfirm("quit")}
                />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
