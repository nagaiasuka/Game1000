import { useCallback, useState } from "react";
import {
  AppState,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Icon, Tap, s } from "@/components/ui";
import { colors as c } from "@/theme";
import { useDeveloperMode } from "./DeveloperMode";
import { DEVELOPER_HOLD_MS } from "./access";

export function DeveloperAccess() {
  const mode = useDeveloperMode();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const close = useCallback(() => {
    setOpen(false);
    setPassword("");
    setError(false);
  }, []);
  useFocusEffect(
    useCallback(() => {
      const sub = AppState.addEventListener("change", (next) => {
        if (next !== "active") close();
      });
      return () => {
        sub.remove();
        close();
      };
    }, [close]),
  );
  const submit = () => {
    if (mode.unlock(password)) close();
    else {
      setError(true);
      setPassword("");
    }
  };
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          mode.enabled ? "開発者モード設定" : "開発者モードを開く"
        }
        accessibilityHint="5秒長押し"
        delayLongPress={DEVELOPER_HOLD_MS}
        onLongPress={() => {
          setPassword("");
          setError(false);
          setOpen(true);
        }}
        onPress={() => {
          if (mode.enabled) setOpen(true);
        }}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.5 : 1,
        })}
      >
        <Icon
          name="sparkles-outline"
          size={18}
          color={mode.enabled ? c.pink : c.cyan}
        />
        {mode.enabled && (
          <Text style={{ color: c.pink, fontSize: 8, fontWeight: "800" }}>
            DEV
          </Text>
        )}
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.backdrop}
        >
          <View style={styles.dialog}>
            <Text style={s.eyebrow}>開発者モード</Text>
            <Text accessibilityRole="header" style={s.subtitle}>
              {mode.enabled ? "開発者モード ON" : "パスワードを入力"}
            </Text>
            <Text style={s.body}>
              BLOCK
              BREAKの全ステージを選択できます。テストプレイの記録は保存しません。
            </Text>
            {mode.enabled ? (
              <Tap
                label="開発者モードを終了"
                onPress={() => {
                  mode.disable();
                  close();
                }}
                style={styles.primary}
              >
                <Text style={styles.buttonText}>開発者モードを終了</Text>
              </Tap>
            ) : (
              <>
                <TextInput
                  accessibilityLabel="開発者パスワード"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setError(false);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={submit}
                  style={styles.input}
                  placeholder="パスワード"
                  placeholderTextColor={c.muted}
                />
                {error && (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={{ color: c.pink }}
                  >
                    パスワードが違います
                  </Text>
                )}
                <Tap
                  label="開発者モードを有効にする"
                  onPress={submit}
                  style={styles.primary}
                >
                  <Text style={styles.buttonText}>
                    開発者モードを有効にする
                  </Text>
                </Tap>
              </>
            )}
            <Tap label="閉じる" onPress={close} style={styles.close}>
              <Text style={s.body}>閉じる</Text>
            </Tap>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#000000CC",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.cyan,
    borderRadius: 20,
    padding: 22,
    gap: 16,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    color: c.text,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: c.background,
  },
  primary: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: c.cyan,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  buttonText: { color: c.background, fontWeight: "800", fontSize: 13 },
  close: { minHeight: 44, justifyContent: "center", alignItems: "center" },
});
