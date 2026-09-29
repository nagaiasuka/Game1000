import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBestStore } from "./best-store";
export const bestStore = createBestStore(AsyncStorage);
