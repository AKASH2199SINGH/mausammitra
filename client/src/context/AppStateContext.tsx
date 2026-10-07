import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { defaultLocationId } from "@/services/mockData";
import type { ChatMessage, Language, UserMode } from "@/types/mausam";

interface AppState {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  locationId: string;
  setLocationId: (id: string) => void;
  /** Assistant transcript, kept above the route so navigating away doesn't drop it. */
  chatMessages: ChatMessage[];
  setChatMessages: (update: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  voiceOpen: boolean;
  openVoice: () => void;
  closeVoice: () => void;
}

const AppStateContext = createContext<AppState | null>(null);

/**
 * Selections survive a reload: picking a location or mode and then refreshing
 * (or following a full-page link) used to silently reset both, so the user kept
 * looking at Patna data after explicitly switching to Gaya.
 */
const STORAGE_KEY = "mausammitra.prefs.v1";

/**
 * Ids retired when the catalogue moved from ``loc-00N`` to state slugs.
 * Translating on read means the very first query after a reload already targets
 * a live id, instead of one round-trip for a location that no longer exists.
 */
const LEGACY_LOCATION_IDS: Record<string, string> = {
  "loc-001": "loc-bihar",
  "loc-002": "loc-bihar-muzaffarpur",
  "loc-003": "loc-bihar-gaya",
};

type StoredPrefs = Partial<Pick<AppState, "mode" | "language" | "locationId">>;

const isMode = (v: unknown): v is UserMode =>
  v === "citizen" || v === "farmer" || v === "authority";
const isLanguage = (v: unknown): v is Language => v === "en" || v === "hi";

/** Never trust persisted values: an older/stale id is healed by LocationSelector. */
function readPrefs(): StoredPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const prefs: StoredPrefs = {};
    if (isMode(parsed["mode"])) prefs.mode = parsed["mode"];
    if (isLanguage(parsed["language"])) prefs.language = parsed["language"];
    if (typeof parsed["locationId"] === "string" && parsed["locationId"]) {
      prefs.locationId = LEGACY_LOCATION_IDS[parsed["locationId"]] ?? parsed["locationId"];
    }
    return prefs;
  } catch {
    // Corrupted or unavailable storage must not break boot.
    return {};
  }
}

function writePrefs(prefs: StoredPrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Private-mode/quota failures are non-fatal; the session just won't persist.
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  // SSR and the first client render must agree (both defaults) or React reports a
  // hydration mismatch; stored prefs are applied in an effect right after mount.
  const [mode, setMode] = useState<UserMode>("citizen");
  const [language, setLanguage] = useState<Language>("en");
  const [locationId, setLocationId] = useState<string>(defaultLocationId);
  const [prefsHydrated, setPrefsHydrated] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [chatMessages, setChatMessagesRaw] = useState<ChatMessage[]>([]);

  const setChatMessages = useCallback(
    (update: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) =>
      setChatMessagesRaw((prev) => (typeof update === "function" ? update(prev) : update)),
    [],
  );

  useEffect(() => {
    const stored = readPrefs();
    if (stored.mode) setMode(stored.mode);
    if (stored.language) setLanguage(stored.language);
    if (stored.locationId) setLocationId(stored.locationId);
    setPrefsHydrated(true);
  }, []);

  useEffect(() => {
    // Never write before the stored values are loaded, or the defaults would
    // overwrite the very preferences we are trying to restore.
    if (!prefsHydrated) return;
    writePrefs({ mode, language, locationId });
  }, [prefsHydrated, mode, language, locationId]);

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
      chatMessages,
      setChatMessages,
      voiceOpen,
      openVoice,
      closeVoice,
    }),
    [mode, language, locationId, chatMessages, setChatMessages, voiceOpen, openVoice, closeVoice],
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
