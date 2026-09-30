import { Pressable, Text, View } from "react-native";
import { Icon, Tap } from "@/components/ui";
import { useColors } from "@/theme/ThemeProvider";
import { audio } from "@/audio/native";
import * as Haptics from "expo-haptics";
import { useFavorites } from "./FavoritesProvider";
export function FavoriteButton({ id, title }: { id: string; title: string }) {
  const { ids, loaded, toggle } = useFavorites(),
    c = useColors(),
    selected = ids.includes(id);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}をお気に入り${selected ? "から外す" : "に追加"}`}
      accessibilityState={{ selected, disabled: !loaded }}
      disabled={!loaded}
      onPress={() => {
        audio.play("ui");
        void Haptics.selectionAsync().catch(() => {});
        toggle(id);
      }}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        opacity: !loaded ? 0.4 : pressed ? 0.65 : 1,
      })}
    >
      <Icon
        name={selected ? "heart" : "heart-outline"}
        color={selected ? c.pink : c.muted}
      />
      <Text style={{ color: selected ? c.pink : c.text, fontSize: 13 }}>
        {selected ? "お気に入りに登録済み" : "お気に入りに追加"}
      </Text>
    </Pressable>
  );
}
export function FavoriteStatus() {
  const { loaded, error, retry } = useFavorites(),
    c = useColors();
  if (!error)
    return loaded ? null : (
      <Text style={{ color: c.muted }}>お気に入りを読み込み中…</Text>
    );
  return (
    <View accessibilityLiveRegion="polite" style={{ gap: 8 }}>
      <Text style={{ color: c.yellow }}>{error}</Text>
      <Tap
        label="お気に入りの読み書きを再試行"
        onPress={retry}
        style={{ justifyContent: "center" }}
      >
        <Text style={{ color: c.cyan }}>再試行</Text>
      </Tap>
    </View>
  );
}
