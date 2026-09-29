import { Screen, Heading, EmptyState } from "@/components/ui";
export default function Favorites() {
  return (
    <Screen>
      <Heading
        eyebrow="YOUR COLLECTION"
        title="お気に入り"
        detail="また遊びたい、を集めよう。"
      />
      <EmptyState
        icon="heart-outline"
        title="とっておきの遊びを、ここに。"
        description="お気に入り機能は準備中です。ゲーム公開後、好きな遊びをすぐに見つけられるようになります。"
      />
    </Screen>
  );
}
