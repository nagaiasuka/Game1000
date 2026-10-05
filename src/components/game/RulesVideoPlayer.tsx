import { useEffect, useRef } from "react";
import { AppState, Text, View, useWindowDimensions } from "react-native";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useAudio } from "@/audio/AudioProvider";
import { useColors } from "@/theme/ThemeProvider";
import { GameButton } from "./common";

export default function RulesVideoPlayer() {
  const c = useColors();
  const { settings, loaded } = useAudio();
  const { height } = useWindowDimensions();
  const view = useRef<VideoView>(null);
  const player = useVideoPlayer(
    require("../../../assets/videos/neon-push-rules.mp4"),
    (p) => {
      p.loop = false;
      p.muted = true;
      p.staysActiveInBackground = false;
      p.audioMixingMode = "mixWithOthers";
    },
  );
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });
  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });
  useEffect(() => {
    // expo-video exposes writable native-player properties, as documented by Expo.
    // eslint-disable-next-line react-hooks/immutability
    player.muted = !loaded || !settings.se;
    player.volume = loaded && settings.se ? settings.seVolume : 0;
  }, [player, loaded, settings.se, settings.seVolume]);
  useEffect(() => {
    if (AppState.currentState === "active") player.play();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") player.pause();
    });
    return () => subscription.remove();
  }, [player]);
  return (
    <View style={{ gap: 12, width: "100%" }}>
      <Text
        accessibilityRole="header"
        style={{ color: c.text, fontSize: 17, fontWeight: "800" }}
      >
        動画で見る（15秒）
      </Text>
      <View
        style={{
          height: Math.min(480, height * 0.55),
          aspectRatio: 9 / 16,
          maxWidth: "100%",
          alignSelf: "center",
          backgroundColor: c.background,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <VideoView
          ref={view}
          player={player}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
          nativeControls
          fullscreenOptions={{ enable: true }}
          accessibilityLabel="NEON PUSHの15秒ルール説明動画"
        />
      </View>
      {status === "error" ? (
        <Text accessibilityLiveRegion="polite" style={{ color: c.yellow }}>
          動画を再生できませんでした。下の説明をご覧ください。
        </Text>
      ) : (
        <>
          <GameButton
            title={isPlaying ? "動画を一時停止" : "▶ ルール動画を再生"}
            onPress={() => {
              if (isPlaying) player.pause();
              else {
                if (
                  player.duration > 0 &&
                  player.currentTime >= player.duration - 0.15
                ) {
                  // Seeking uses the writable native-player currentTime property.
                  // eslint-disable-next-line react-hooks/immutability
                  player.currentTime = 0;
                }
                player.play();
              }
            }}
          />
          <GameButton
            secondary
            title="動画を大きく見る"
            onPress={() => {
              void view.current?.enterFullscreen().catch(() => {});
            }}
          />
        </>
      )}
      <Text style={{ color: c.muted, fontSize: 14 }}>
        音なしでも字幕で分かります。
      </Text>
    </View>
  );
}
