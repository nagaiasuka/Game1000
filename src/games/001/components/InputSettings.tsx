import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors as c } from "@/theme";
export function InputSettings({
  buttons,
  onChange,
}: {
  buttons: boolean;
  onChange: (buttons: boolean) => void;
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>操作方法</Text>
      <View style={styles.options}>
        {[
          { label: "タッチ", value: false },
          { label: "ボタン", value: true },
        ].map((option) => (
          <Pressable
            key={option.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: buttons === option.value }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              buttons === option.value && styles.selected,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text
              style={[
                styles.optionText,
                buttons === option.value && { color: c.cyan },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.help}>
        {buttons
          ? "← → ↓ は長押しで連続操作\n↻ で回転 · DROPで一気に落下"
          : "タップで回転 · 左右ドラッグで移動\n下ドラッグで落下 · 0.5秒長押しでDROP"}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  panel: { width: "100%", gap: 8, paddingVertical: 10 },
  title: { color: c.muted, fontSize: 12 },
  options: { flexDirection: "row", gap: 8 },
  option: {
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  selected: { borderColor: c.cyan },
  optionText: { color: c.muted, fontSize: 14, fontWeight: "700" },
  help: { color: c.muted, fontSize: 11, lineHeight: 18, textAlign: "center" },
});
