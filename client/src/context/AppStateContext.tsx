import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { defaultLocationId } from "@/services/mockData";
import type { Language, UserMode } from "@/types/mausam";

interface AppState {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  locationId: string;
  setLocationId: (id: string) => void;
  voiceOpen: boolean;
  openVoice: () => void;
  closeVoice: () => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<UserMode>("citizen");
  const [language, setLanguage] = useState<Language>("en");
  const [locationId, setLocationId] = useState<string>(defaultLocationId);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const openVoice = useCallback(() => setVoiceOpen(true), []);
  const closeVoice = useCallback(() => setVoiceOpen(false), []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      language,
      setLanguage,
      locationId,
      setLocationId,
      voiceOpen,
      openVoice,
      closeVoice,
    }),
    [mode, language, locationId, voiceOpen, openVoice, closeVoice],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}

export const modeLabels: Record<UserMode, { label: string; hint: string }> = {
  citizen: { label: "Citizen", hint: "Personal safety & travel" },
  farmer: { label: "Farmer", hint: "Crop & field operations" },
  authority: { label: "Authority", hint: "Operational command" },
};
