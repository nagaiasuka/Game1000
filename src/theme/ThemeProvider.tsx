import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "./index";
import {
  MAIN_COLORS,
  THEME_KEY,
  readMainColor,
  tintStyles,
  type MainColor,
} from "./preferences";
const Context = createContext({
  mainColor: "cyan" as MainColor,
  loaded: false,
  error: "",
  select: (_id: MainColor) => {},
});
export function AppThemeProvider({ children }: PropsWithChildren) {
  const [mainColor, setMainColor] = useState<MainColor>("cyan");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let alive = true;
    void AsyncStorage.getItem(THEME_KEY)
      .then((raw) => {
        if (alive) setMainColor(readMainColor(raw));
      })
      .catch(() => {
        if (alive)
          setError(
            "テーマを読み込めませんでした。もう一度色を選んで保存できます。",
          );
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  const select = (id: MainColor) => {
    if (!loaded) return;
    setMainColor(id);
    writes.current = writes.current
      .catch(() => {})
      .then(() =>
        AsyncStorage.setItem(THEME_KEY, JSON.stringify({ mainColor: id })),
      )
      .then(() => setError(""))
      .catch(() =>
        setError("テーマを保存できませんでした。もう一度色を選んでください。"),
      );
  };
  return (
    <Context.Provider value={{ mainColor, loaded, error, select }}>
      {children}
    </Context.Provider>
  );
}
export const useAppTheme = () => useContext(Context);
export function useColors() {
  const { mainColor } = useAppTheme();
  return useMemo(
    () => ({
      ...colors,
      cyan: MAIN_COLORS.find((c) => c.id === mainColor)!.color as string,
    }),
    [mainColor],
  );
}
/** Cache themed copies of existing styles without mutating shared StyleSheets. */
export function useThemedStyles<T>(styles: T): T {
  const { cyan } = useColors();
  return useMemo(() => tintStyles(styles, cyan), [styles, cyan]);
}
