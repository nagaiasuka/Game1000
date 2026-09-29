import type { PropsWithChildren, ComponentProps } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type ColorValue,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { colors as c, mono, space } from "@/theme";
export type IconName = ComponentProps<typeof Ionicons>["name"];
export function Icon({
  name,
  color = c.text,
  size = 22,
}: {
  name: IconName;
  color?: ColorValue;
  size?: number;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Tap({
  children,
  onPress,
  label,
  style,
  selected,
}: PropsWithChildren<{
  onPress: () => void;
  label: string;
  style?: StyleProp<ViewStyle>;
  selected?: boolean;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={() => {
        void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        style,
        pressed && { opacity: 0.72, transform: [{ scale: 0.98 }] },
      ]}
    >
      {children}
    </Pressable>
  );
}
export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={s.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Heading({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.eyebrow}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={s.title}>
        {title}
      </Text>
      {detail && <Text style={s.body}>{detail}</Text>}
    </View>
  );
}
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Icon name={icon} color={c.cyan} size={42} />
      </View>
      <Text style={s.eyebrow}>COMING SOON</Text>
      <Text style={s.subtitle}>{title}</Text>
      <Text style={[s.body, { textAlign: "center" }]}>{description}</Text>
    </View>
  );
}
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
    gap: space.xl,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  eyebrow: {
    color: c.muted,
    fontFamily: mono,
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: "700",
  },
  title: { color: c.text, fontSize: 29, fontWeight: "800" },
  subtitle: { color: c.text, fontSize: 18, fontWeight: "700" },
  body: { color: c.muted, fontSize: 13, lineHeight: 22 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  empty: {
    paddingVertical: 44,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 18,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 20,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: c.elevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
});
