import AsyncStorage from "@react-native-async-storage/async-storage";
import { createRecordStore } from "./records";
export const recordStore = createRecordStore(AsyncStorage);
