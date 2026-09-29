import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors as c, mono } from "@/theme";
import type { Action, HeldAction } from "../logic/engine";
type Props = {
  enabled: boolean;
  input: (action: Action) => void;
  press: (action: HeldAction) => void;
  release: (action: HeldAction) => void;
};
const buttons: {
  action: Action;
  text: string;
  hint: string;
  repeat?: HeldAction;
}[][] = [
  [
    { action: "rotate", text: "↻", hint: "右回転" },
    {
      action: "soft",
      text: "↓",
      hint: "ソフトドロップ、長押しで速く落下",
      repeat: "soft",
    },
  ],
  [
    {
      action: "left",
      text: "←",
      hint: "左移動、長押しで連続移動",
      repeat: "left",
    },
    { action: "drop", text: "DROP", hint: "ハードドロップ、着地点に固定" },
    {
      action: "right",
      text: "→",
      hint: "右移動、長押しで連続移動",
      repeat: "right",
    },
  ],
];
export function Controls({ enabled, input, press, release }: Props) {
  return (
    <View style={styles.controls}>
      {buttons.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((button) => {
            const disabled = !enabled;
            return (
              <Pressable
                key={button.action}
                testID={`control-${button.action}`}
                accessibilityRole="button"
                accessibilityLabel={button.hint}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPressIn={
                  button.repeat ? () => press(button.repeat!) : undefined
                }
                onPressOut={
                  button.repeat ? () => release(button.repeat!) : undefined
                }
                onPress={
                  !button.repeat ? () => input(button.action) : undefined
                }
                style={({ pressed }) => [
                  styles.button,
                  button.action === "drop" && styles.drop,
                  disabled && { opacity: 0.35 },
                  pressed && { backgroundColor: c.border },
                ]}
              >
                <Text
                  maxFontSizeMultiplier={1.2}
                  style={[
                    styles.label,
                    button.text.length > 1 && { fontSize: 14 },
                    button.action === "drop" && { color: c.cyan },
                  ]}
                >
                  {button.text}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  controls: { gap: 8, width: "100%", maxWidth: 420, alignSelf: "center" },
  row: { flexDirection: "row", gap: 10 },
  button: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  drop: { borderColor: c.cyan, backgroundColor: "#082328" },
  label: { color: c.text, fontSize: 28, fontFamily: mono, fontWeight: "700" },
});
