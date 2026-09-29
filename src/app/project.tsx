import { Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, Tap, Icon, Heading, s } from "@/components/ui";
import { ProjectProgress } from "@/components/project-progress";
import { BRAND } from "@/data/brand";
import { japaneseDate } from "@/utils/project";
import { colors } from "@/theme";

export default function Project() {
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
        <Text style={s.eyebrow}>PROJECT / ABOUT</Text>
      </View>
      <Heading
        eyebrow={BRAND.displayName}
        title={"みんなの声で、\n育つゲームセンター。"}
      />
      <ProjectProgress />
      <View style={{ gap: 12 }}>
        <Text style={[s.eyebrow, { color: colors.pink }]}>
          YOUR VOICE, THE NEXT GAME
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
          本業をしながら、{japaneseDate(BRAND.deadline)}までにゲーム
          {BRAND.targetGames}本を作るプロジェクトです。
        </Text>
        <Text style={s.body}>
          1人で遊べるゲームから、2人対戦、みんなで遊べるパーティーゲームまで。GAME
          #001から、1本ずつ追加していきます。
        </Text>
        <Text style={s.body}>
          作って、遊んでもらって、声を聞いて、また作る。新しいゲームが増えるたび、みなさんと一緒にこのゲームセンターを育てていきます。
        </Text>
        <Text style={[s.subtitle, { color: colors.cyan }]}>
          {BRAND.targetGames}本。その先へ。
        </Text>
        <Text style={[s.body, { fontSize: 10 }]}>
          残り日数は日本時間の日付を基準にしています。
        </Text>
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
