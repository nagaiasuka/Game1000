import { Keyboard, Text, TextInput, View } from "react-native";
import { useColors } from "@/theme/ThemeProvider";

type PlayerSlot = { id: number; color: string; detail?: string };
/** Optional names for any multiplayer game; player numbers remain the identity. */
export function PlayerNameInputs({
  players,
  names,
  onChange,
}: {
  players: readonly PlayerSlot[];
  names: Readonly<Record<number, string>>;
  onChange: (player: number, value: string) => void;
}) {
  const c = useColors();
  return (
    <View style={{ width: "100%", gap: 12 }}>
      <Text style={{ color: c.muted, fontSize: 14 }}>
        名前を入れて遊べます（入力しなくてもOK）
      </Text>
      {players.map(({ id, color, detail }) => (
        <View key={id} style={{ gap: 6 }}>
          <Text style={{ color, fontSize: 14 }}>
            プレイヤー{id}
            {detail ? ` · ${detail}` : ""}
          </Text>
          <TextInput
            accessibilityLabel={`プレイヤー${id}の名前`}
            value={names[id] ?? ""}
            onChangeText={(value) => onChange(id, value)}
            placeholder={`プレイヤー${id}`}
            placeholderTextColor={c.muted}
            maxLength={12}
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            style={{
              minHeight: 48,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 12,
              padding: 12,
              fontSize: 16,
              color: c.text,
              backgroundColor: c.surface,
            }}
          />
        </View>
      ))}
    </View>
  );
}
