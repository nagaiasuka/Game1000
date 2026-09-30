import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";
import { usePathname } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { audio, prepareAudio } from "./native";
import {
  AUDIO_KEY,
  DEFAULT_AUDIO,
  readSettings,
  type AudioSettings,
} from "./types";
const Context = createContext({
  settings: DEFAULT_AUDIO,
  loaded: false,
  error: "",
  update: (_key: "bgm" | "se", _value: boolean) => {},
});
export const useAudio = () => useContext(Context);
export function AudioProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState(DEFAULT_AUDIO);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [audioError, setAudioError] = useState("");
  const current = useRef(settings);
  const writes = useRef(Promise.resolve());
  const path = usePathname();
  useEffect(() => {
    let alive = true;
    void Promise.all([
      AsyncStorage.getItem(AUDIO_KEY).catch(() => {
        if (alive) setError("サウンド設定を読み込めませんでした。");
        return null;
      }),
      prepareAudio(),
    ]).then(([raw, available]) => {
      if (!alive) return;
      const saved = readSettings(raw);
      current.current = saved;
      setSettings(saved);
      audio.configure(saved);
      audio.setActive(AppState.currentState === "active");
      if (available) audio.initialize();
      else
        setAudioError(
          "音声を準備できませんでした。Expo Goの再起動・更新、または開発ビルドの更新が必要です。音なしでも遊べます。",
        );
      setLoaded(true);
    });
    const change = AppState.addEventListener("change", (state) =>
      audio.setActive(state === "active"),
    );
    const blur = AppState.addEventListener("blur", () =>
      audio.setActive(false),
    );
    const focus = AppState.addEventListener("focus", () =>
      audio.setActive(AppState.currentState === "active"),
    );
    return () => {
      alive = false;
      change.remove();
      blur.remove();
      focus.remove();
      audio.dispose();
    };
  }, []);
  useEffect(() => {
    if (!path.startsWith("/play/")) audio.setScene("home");
  }, [path]);
  const update = (key: "bgm" | "se", value: boolean) => {
    if (!loaded) return;
    const next: AudioSettings = { ...current.current, [key]: value };
    current.current = next;
    setSettings(next);
    audio.configure(next);
    writes.current = writes.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(AUDIO_KEY, JSON.stringify(next)))
      .then(() => setError(""))
      .catch(() =>
        setError("設定を保存できませんでした。もう一度切り替えてください。"),
      );
  };
  return (
    <Context.Provider
      value={{ settings, loaded, error: audioError || error, update }}
    >
      {children}
    </Context.Provider>
  );
}
