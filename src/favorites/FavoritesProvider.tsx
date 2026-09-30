import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { games } from "@/data/catalog";
import { FavoritesStore } from "./store";
type Value = {
  ids: string[];
  loaded: boolean;
  error: string | null;
  toggle: (id: string) => void;
  retry: () => void;
};
const Context = createContext<Value | null>(null);
export function FavoritesProvider({ children }: PropsWithChildren) {
  const [store] = useState(() => new FavoritesStore(AsyncStorage));
  const [ids, setIds] = useState<string[]>([]),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState<string | null>(null);
  const current = useRef<string[]>([]),
    revision = useRef(0),
    alive = useRef(false),
    generation = useRef(0);
  const read = useCallback(() => {
    const request = ++generation.current;
    return store
      .load()
      .then((saved) => {
        if (alive.current && request === generation.current) {
          current.current = saved;
          setIds(saved);
          setLoaded(true);
          setError(null);
        }
      })
      .catch(() => {
        if (alive.current && request === generation.current)
          setError("お気に入りを読み込めませんでした。再試行してください。");
      });
  }, [store]);
  useEffect(() => {
    alive.current = true;
    void read();
    return () => {
      alive.current = false;
    };
  }, [read]);
  const persist = useCallback(
    (next: string[]) => {
      const version = ++revision.current;
      void store
        .save(next)
        .then(() => {
          if (alive.current && version === revision.current) setError(null);
        })
        .catch(() => {
          if (alive.current && version === revision.current) {
            setError("お気に入りを保存できませんでした。再試行してください。");
            Alert.alert(
              "保存できませんでした",
              "今回の変更はまだ端末に保存されていません。お気に入り画面から再試行できます。",
            );
          }
        });
    },
    [store],
  );
  const toggle = (id: string) => {
    if (!loaded || !games.some((g) => g.id === id && g.status === "available"))
      return;
    const next = current.current.includes(id)
      ? current.current.filter((value) => value !== id)
      : [...current.current, id];
    current.current = next;
    setIds(next);
    persist(next);
  };
  return (
    <Context.Provider
      value={{
        ids,
        loaded,
        error,
        toggle,
        retry: () => {
          if (loaded) persist(current.current);
          else void read();
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useFavorites() {
  const value = useContext(Context);
  if (!value) throw new Error("FavoritesProvider is required");
  return value;
}
