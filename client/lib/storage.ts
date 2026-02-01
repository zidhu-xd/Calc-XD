import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";

const KEYS = {
  UNLOCK_CODE: "unlock_code",
  PAIRING_CODE: "pairing_code",
  PAIRED_WITH: "paired_with",
  DEVICE_ID: "device_id",
  MESSAGES: "messages",
  IS_SETUP_COMPLETE: "is_setup_complete",
};

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
  status: "sent" | "delivered" | "read";
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return await AsyncStorage.getItem(`secure_${key}`);
  }
  return await SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(`secure_${key}`, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(`secure_${key}`);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function getDeviceId(): Promise<string> {
  let deviceId = await secureGet(KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    await secureSet(KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

export async function setUnlockCode(code: string): Promise<void> {
  await secureSet(KEYS.UNLOCK_CODE, code);
}

export async function getUnlockCode(): Promise<string | null> {
  return await secureGet(KEYS.UNLOCK_CODE);
}

export async function verifyUnlockCode(code: string): Promise<boolean> {
  const storedCode = await getUnlockCode();
  return storedCode === code;
}

export async function generatePairingCode(): Promise<string> {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  await AsyncStorage.setItem(KEYS.PAIRING_CODE, code);
  return code;
}

export async function getPairingCode(): Promise<string | null> {
  return await AsyncStorage.getItem(KEYS.PAIRING_CODE);
}

export async function setPairedWith(partnerId: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.PAIRED_WITH, partnerId);
}

export async function getPairedWith(): Promise<string | null> {
  return await AsyncStorage.getItem(KEYS.PAIRED_WITH);
}

export async function unpair(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.PAIRED_WITH);
  await AsyncStorage.removeItem(KEYS.PAIRING_CODE);
  await AsyncStorage.removeItem(KEYS.MESSAGES);
}

export async function setSetupComplete(complete: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.IS_SETUP_COMPLETE, JSON.stringify(complete));
}

export async function isSetupComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEYS.IS_SETUP_COMPLETE);
  return value ? JSON.parse(value) : false;
}

export async function saveMessages(messages: Message[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.MESSAGES, JSON.stringify(messages));
}

export async function getMessages(): Promise<Message[]> {
  const data = await AsyncStorage.getItem(KEYS.MESSAGES);
  return data ? JSON.parse(data) : [];
}

export async function addMessage(message: Message): Promise<Message[]> {
  const messages = await getMessages();
  messages.push(message);
  await saveMessages(messages);
  return messages;
}

export async function clearAllData(): Promise<void> {
  await secureDelete(KEYS.UNLOCK_CODE);
  await secureDelete(KEYS.DEVICE_ID);
  await AsyncStorage.multiRemove([
    KEYS.PAIRING_CODE,
    KEYS.PAIRED_WITH,
    KEYS.MESSAGES,
    KEYS.IS_SETUP_COMPLETE,
  ]);
}
