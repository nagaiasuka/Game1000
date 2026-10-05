import { Component, type ReactNode } from "react";
import { Text } from "react-native";
import { useColors } from "@/theme/ThemeProvider";

// Require only when the help screen mounts. Metro resolves the module synchronously,
// avoiding a lazy import that can resolve without its default export after refresh.
function NativePlayer() {
  // The native video module is intentionally loaded only when this screen mounts.
  const Player: typeof import("./RulesVideoPlayer").default =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("./RulesVideoPlayer").default;
  return <Player />;
}
class PlaybackBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export function RulesVideo() {
  const c = useColors();
  return (
    <PlaybackBoundary
      fallback={
        <Text style={{ color: c.muted, fontSize: 14 }}>
          動画を再生できませんでした。下の説明をご覧ください。
        </Text>
      }
    >
      <NativePlayer />
    </PlaybackBoundary>
  );
}
