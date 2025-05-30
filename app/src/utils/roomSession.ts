import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const ROOM_KEY = "roomId";

export async function saveLocal(id: string, key: string = ROOM_KEY) {
  if (Platform.OS === "web") {
    localStorage.setItem(key, id);
  } else {
    await SecureStore.setItemAsync(key, id);
  }
}

export async function getLocal(key: string = ROOM_KEY): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error("Erro ao acessar localStorage:", e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

export async function clearLocal(key: string = ROOM_KEY) {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}
