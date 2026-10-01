import { Alert, Text, View } from "react-native";
import * as Linking from "expo-linking";
import { BRAND } from "@/data/brand";
import { useColors } from "@/theme/ThemeProvider";
import { Icon, Tap } from "./ui";

export function TikTokLink() {
  const colors = useColors();

  async function openProfile() {
    try {
      await Linking.openURL(BRAND.tikTokUrl);
    } catch {
      Alert.alert(
        "TikTokを開けませんでした",
        `時間をおいてもう一度お試しください。TikTokで「${BRAND.tikTokHandle}」を検索しても見つかります。`,
      );
    }
  }

  return (
    <Tap
      label={`TikTokで制作の様子を見る。${BRAND.tikTokHandle}。外部アプリまたはブラウザで開きます`}
      onPress={() => void openProfile()}
      style={{
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.pink + "80",
        backgroundColor: colors.surface,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Icon name="logo-tiktok" size={26} color={colors.pink} />
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>
          TikTokで制作の様子を見る
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
          次に遊びたいゲームを、コメントで教えてください。
        </Text>
        <Text style={{ color: colors.cyan, fontSize: 13 }}>
          {BRAND.tikTokHandle}
        </Text>
      </View>
      <Icon name="open-outline" size={20} color={colors.cyan} />
    </Tap>
  );
}
