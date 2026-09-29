import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors as c } from "@/theme";
import { GAME_HELP, UI_TEXT, type GameHelpId } from "@/data/ui-text";

export function GameButton({
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
        { opacity: disabled ? 0.4 : pressed ? 0.65 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: c.text }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function HelpButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={UI_TEXT.howToPlay}
      onPress={onPress}
      style={styles.helpButton}
    >
      <Text maxFontSizeMultiplier={1.3} style={styles.helpText}>
        ？ 遊び方
      </Text>
    </Pressable>
  );
}
export function GameInstructions({
  gameId,
  compact = false,
}: {
  gameId: GameHelpId;
  compact?: boolean;
}) {
  return (
    <View style={styles.instructions}>
      <Text accessibilityRole="header" style={styles.subtitle}>
        {UI_TEXT.howToPlay}
      </Text>
      {(compact ? GAME_HELP[gameId].quick : GAME_HELP[gameId].steps).map(
        (step, index) => (
          <Text key={step} style={styles.body}>
            {index + 1}. {step}
          </Text>
        ),
      )}
    </View>
  );
}
export function HowToPlayModal({
  gameId,
  visible,
  onClose,
}: {
  gameId: GameHelpId;
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text accessibilityRole="header" style={styles.title}>
            {GAME_HELP[gameId].title}
          </Text>
          <GameInstructions gameId={gameId} />
          <GameButton title={UI_TEXT.close} onPress={onClose} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
export function confirmGameAction(
  kind: "restart" | "quit",
  onConfirm: () => void,
  stage = false,
) {
  Alert.alert(
    kind === "quit" ? "ホームに戻りますか？" : "最初からやり直しますか？",
    kind === "quit"
      ? "現在のゲームは終了します。"
      : stage
        ? "このステージ開始時のスコアとハートに戻ります。"
        : "今回のスコアは0に戻ります。最高記録は残ります。",
    [
      { text: UI_TEXT.cancel, style: "cancel" },
      {
        text: kind === "quit" ? "ホームへ戻る" : "やり直す",
        onPress: onConfirm,
      },
    ],
    { cancelable: true },
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  content: {
    padding: 24,
    gap: 24,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  title: { fontSize: 24, fontWeight: "800", color: c.cyan },
  subtitle: { fontSize: 17, fontWeight: "800", color: c.text },
  instructions: { width: "100%", gap: 12 },
  body: { color: c.text, fontSize: 15, lineHeight: 24 },
  button: {
    minHeight: 48,
    minWidth: 44,
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.cyan,
    borderRadius: 12,
  },
  secondary: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "800",
    color: c.background,
    textAlign: "center",
  },
  helpButton: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  helpText: { color: c.cyan, fontSize: 13, fontWeight: "700" },
});
