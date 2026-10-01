import { useColors, useThemedStyles } from "@/theme/ThemeProvider";
import { Text, View } from "react-native";
import { router } from "expo-router";
import {
  Screen,
  Tap,
  Icon,
  Heading,
  s as baseSharedStyles,
} from "@/components/ui";
import { ProjectProgress } from "@/components/project-progress";
import { BRAND } from "@/data/brand";
import { CHALLENGE } from "@/data/challenge";

export default function Project() {
  const colors = useColors();
  const s = useThemedStyles(baseSharedStyles);

  return (
    <Screen>
      <View style={s.row}>
        <Tap
          label="戻る"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          style={{ minWidth: 44, minHeight: 44, justifyContent: "center" }}
        >
          <Icon name="arrow-back" color={colors.cyan} />
        </Tap>
        <Text style={s.eyebrow}>ASOBIT CHALLENGE</Text>
      </View>
      <Heading
        eyebrow={BRAND.displayName}
        title={"100 DAYS\n30 GAMES"}
      />
      <ProjectProgress />
      <View style={{ gap: 12 }}>
        <Text style={[s.eyebrow, { color: colors.pink }]}>
          あなたの声が、次のゲームに
        </Text>
        <Text style={s.subtitle}>遊ぶ人も、この企画の一員。</Text>
        <Text style={s.body}>
          「こんなゲームで遊びたい」「次はみんなで対戦したい」。利用者のみなさんの声をヒントに、次に作るゲームを決めていきます。
        </Text>
        <Text style={s.body}>
          ひとりでも、みんなでも。遊んで感じたことや、新しいアイデアが、次の1本につながるゲームセンターです。
        </Text>
      </View>
      <View style={{ gap: 16 }}>
        <Text style={s.subtitle}>本業のあとに、もうひとつの挑戦。</Text>
        <Text style={s.body}>
          ゲーム制作未経験の会社員が、{CHALLENGE.durationDays}日間で
          {CHALLENGE.targetGames}個のゲーム制作に挑戦します。
        </Text>
        <Text style={s.body}>
          ひとりで遊べるゲームから、友達との2人対戦、みんなで遊べるゲームまで。1本ずつASOBITに追加していきます。
        </Text>
        <Text style={s.body}>
          100日後、このゲームセンターはどこまで大きくなっているのか。ぜひ一緒に見届けてください。
        </Text>
        <Text style={[s.subtitle, { color: colors.cyan }]}>
          まずは30本。その先へ。
        </Text>
        <Text style={[s.body, { fontSize: 12 }]}>
          100日間の企画が終わっても、ASOBITは続きます。DAYは日本時間の日付を基準にしています。
        </Text>
      </View>
      <View style={{ gap: 8 }}>
        <Text style={s.subtitle}>ASOBI + BIT</Text>
        <Text style={s.body}>デジタルな遊びを、スマホひとつに。</Text>
      </View>
      <Tap
        label="公開中のゲームを探す"
        onPress={() => router.navigate("/games")}
        style={{
          minHeight: 52,
          borderRadius: 14,
          backgroundColor: colors.cyan,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: colors.background, fontWeight: "800" }}>
          ゲームを遊ぶ →
        </Text>
      </Tap>
    </Screen>
  );
}
