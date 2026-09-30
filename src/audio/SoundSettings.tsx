import { useColors } from "@/theme/ThemeProvider";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useAudio } from "./AudioProvider";
import { audio } from "./native";
export function SoundControls() {
  const c = useColors();

  const { settings, loaded, error, update } = useAudio();
  return (
    <View style={{ gap: 12, width: "100%" }}>
      <Text style={{ color: c.text, fontSize: 18, fontWeight: "700" }}>
        サウンド
      </Text>
      {(["bgm", "se"] as const).map((key) => (
        <View
          key={key}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 48,
            gap: 12,
          }}
        >
          <Text style={{ color: c.text, fontSize: 16, flex: 1 }}>
            {key === "bgm" ? "BGM（背景の音楽）" : "効果音"}　
            {settings[key] ? "オン" : "オフ"}
          </Text>
          <Switch
            accessibilityLabel={key === "bgm" ? "BGM" : "効果音"}
            disabled={!loaded}
            value={settings[key]}
            onValueChange={(value) => {
              update(key, value);
              if (key === "se" && value) audio.play("ui");
            }}
            trackColor={{ true: c.cyan }}
          />
        </View>
      ))}
      <Text style={{ color: c.muted, fontSize: 14 }}>
        端末の消音設定に従います。音なしでも遊べます。
      </Text>
      {!!error && (
        <Text accessibilityLiveRegion="polite" style={{ color: c.yellow }}>
          {error}
        </Text>
      )}
    </View>
  );
}
export function SoundButton() {
  const c = useColors();

  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          audio.play("ui");
          setOpen(true);
        }}
        style={{
          minHeight: 44,
          justifyContent: "center",
          paddingHorizontal: 10,
        }}
      >
        <Text style={{ color: c.cyan, fontSize: 14, fontWeight: "700" }}>
          ♪ サウンド設定
        </Text>
      </Pressable>
      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
            <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
              <SoundControls />
              <Pressable
                accessibilityRole="button"
                onPress={() => setOpen(false)}
                style={{
                  minHeight: 48,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: c.cyan,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700" }}>閉じる</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}
