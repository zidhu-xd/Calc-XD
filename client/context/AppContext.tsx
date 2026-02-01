import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Storage from "@/lib/storage";

interface AppContextType {
  isUnlocked: boolean;
  isPaired: boolean;
  isSetupComplete: boolean;
  deviceId: string | null;
  pairedWith: string | null;
  messages: Storage.Message[];
  unlock: () => void;
  lock: () => void;
  setupComplete: (code: string) => Promise<void>;
  generatePairingCode: () => Promise<string>;
  joinWithCode: (code: string) => Promise<boolean>;
  unpair: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPaired, setIsPaired] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [pairedWith, setPairedWith] = useState<string | null>(null);
  const [messages, setMessages] = useState<Storage.Message[]>([]);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [isUnlocked]);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === "background" || nextAppState === "inactive") {
      setIsUnlocked(false);
    }
  }, []);

  const initializeApp = async () => {
    try {
      const id = await Storage.getDeviceId();
      setDeviceId(id);

      const setupComplete = await Storage.isSetupComplete();
      setIsSetupComplete(setupComplete);

      const paired = await Storage.getPairedWith();
      setIsPaired(!!paired);
      setPairedWith(paired);

      if (paired) {
        const msgs = await Storage.getMessages();
        setMessages(msgs);
      }
    } catch (error) {
      console.error("Error initializing app:", error);
    }
  };

  const unlock = useCallback(() => {
    setIsUnlocked(true);
  }, []);

  const lock = useCallback(() => {
    setIsUnlocked(false);
  }, []);

  const setupComplete = useCallback(async (code: string) => {
    await Storage.setUnlockCode(code);
    await Storage.setSetupComplete(true);
    setIsSetupComplete(true);
  }, []);

  const generatePairingCode = useCallback(async () => {
    const code = await Storage.generatePairingCode();
    return code;
  }, []);

  const joinWithCode = useCallback(async (code: string) => {
    await Storage.setPairedWith(code);
    setIsPaired(true);
    setPairedWith(code);
    return true;
  }, []);

  const unpairDevice = useCallback(async () => {
    await Storage.unpair();
    setIsPaired(false);
    setPairedWith(null);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!deviceId) return;

    const message: Storage.Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      senderId: deviceId,
      timestamp: Date.now(),
      status: "sent",
    };

    const updatedMessages = await Storage.addMessage(message);
    setMessages(updatedMessages);
  }, [deviceId]);

  const refreshMessages = useCallback(async () => {
    const msgs = await Storage.getMessages();
    setMessages(msgs);
  }, []);

  return (
    <AppContext.Provider
      value={{
        isUnlocked,
        isPaired,
        isSetupComplete,
        deviceId,
        pairedWith,
        messages,
        unlock,
        lock,
        setupComplete,
        generatePairingCode,
        joinWithCode,
        unpair: unpairDevice,
        sendMessage,
        refreshMessages,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
