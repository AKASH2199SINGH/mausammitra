/**
 * Service layer / API abstraction.
 *
 * Every screen talks ONLY to this module. Each function maps 1:1 to a future
 * FastAPI endpoint (see ENDPOINTS below). To go live, replace the mock body
 * with `http<T>(ENDPOINTS.x, ...)` — signatures and return types stay identical.
 */
import type {
  Advisory,
  AuthorityMetrics,
  ChatMessage,
  ChatRequest,
  CurrentWeather,
  HazardAlert,
  Language,
  LocationRef,
  RiskSnapshot,
  RiskZone,
  SystemStatus,
  TranscriptionResult,
  UserMode,
  WeatherForecast,
} from "@/types/mausam";
import {
  advisories,
  alerts,
  answerTemplates,
  authorityMetrics,
  currentWeather,
  defaultLocationId,
  fallbackAnswer,
  getForecastFor,
  getRiskFor,
  initialChat,
  locations,
  riskZones,
  suggestedPrompts,
  systemStatus,
  voiceSampleUtterances,
} from "./mockData";

export const ENDPOINTS = {
  currentWeather: "/weather/current",
  forecast: "/weather/forecast",
  alerts: "/alerts",
  risk: "/risk",
  riskZones: "/risk/zones",
  chat: "/chat",
  voiceTranscribe: "/voice/transcribe",
  advisory: "/advisory",
  authorityOverview: "/authority/overview",
  status: "/status",
  live: "/live",
} as const;

export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "/api/v1";

const latency = (ms = 260) => new Promise((r) => setTimeout(r, ms));
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Reserved for the real backend. Kept here so call sites never change. */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${path} failed with ${res.status}`);
  return (await res.json()) as T;
}

export const mausamApi = {
  listLocations: async (): Promise<LocationRef[]> => {
    await latency(120);
    return clone(locations);
  },

  /** GET /weather/current */
  getCurrentWeather: async (locationId = defaultLocationId): Promise<CurrentWeather> => {
    await latency();
    return clone(currentWeather[locationId] ?? currentWeather[defaultLocationId]!);
  },

  /** GET /weather/forecast */
  getForecast: async (locationId = defaultLocationId): Promise<WeatherForecast> => {
    await latency(300);
    return clone(getForecastFor(locationId));
  },

  /** GET /alerts */
  getAlerts: async (locationId?: string): Promise<HazardAlert[]> => {
    await latency(200);
    const loc = locations.find((l) => l.id === locationId);
    const list = loc
      ? [
          ...alerts.filter((a) => a.areas.some((area) => area.includes(loc.district))),
          ...alerts.filter((a) => !a.areas.some((area) => area.includes(loc.district))),
        ]
      : alerts;
    return clone(list);
  },

  /** GET /risk */
  getRisk: async (locationId = defaultLocationId): Promise<RiskSnapshot> => {
    await latency(240);
    return clone(getRiskFor(locationId));
  },

  /** GET /risk/zones */
  getRiskZones: async (): Promise<RiskZone[]> => {
    await latency(320);
    return clone(riskZones);
  },

  /** GET /advisory */
  getAdvisory: async (mode: UserMode, locationId = defaultLocationId): Promise<Advisory> => {
    await latency(220);
    return { ...clone(advisories[mode]), locationId };
  },

  /** GET /authority/overview */
  getAuthorityMetrics: async (): Promise<AuthorityMetrics> => {
    await latency(280);
    return clone(authorityMetrics);
  },

  /** GET /status */
  getSystemStatus: async (): Promise<SystemStatus> => {
    await latency(140);
    return clone(systemStatus);
  },

  getInitialChat: (): ChatMessage[] => clone(initialChat),

  getSuggestedPrompts: (mode: UserMode): string[] => clone(suggestedPrompts[mode]!),

  getSampleUtterances: (language: Language): string[] => clone(voiceSampleUtterances[language]!),

  /** POST /chat — grounded advisory answer */
  postChat: async (req: ChatRequest): Promise<ChatMessage> => {
    await latency(900);
    const template = answerTemplates.find((t) => t.match.test(req.message));
    const payload = template ? template.build(req.mode) : clone(fallbackAnswer);
    const createdAt = new Date().toISOString();
    return {
      id: `msg-${Math.random().toString(36).slice(2, 9)}`,
      role: "assistant",
      createdAt,
      ...payload,
      provenance: {
        source: "MausamMitra advisory engine, grounded on IMD + CWC feeds",
        issuedAt: createdAt,
        validUntil: new Date(Date.now() + 3 * 3600_000).toISOString(),
        confidence: template ? 0.86 : 0.68,
        model: "advisory-llm v0.5",
      },
    };
  },

  /** POST /voice/transcribe — mock ASR for the prototype */
  transcribeVoice: async (language: Language): Promise<TranscriptionResult> => {
    await latency(1100);
    const samples = voiceSampleUtterances[language]!;
    return {
      text: samples[Math.floor(Math.random() * samples.length)]!,
      language,
      confidence: 0.91,
      durationMs: 2400,
    };
  },

  /**
   * WS /live — mocked as an interval push of the latest snapshot timestamp.
   * Returns an unsubscribe function, same as a real socket wrapper would.
   */
  subscribeLive: (onTick: (payload: { at: string; latencyMs: number }) => void) => {
    const id = setInterval(() => {
      onTick({ at: new Date().toISOString(), latencyMs: 180 + Math.round(Math.random() * 120) });
    }, 15_000);
    return () => clearInterval(id);
  },
};

export const queryKeys = {
  weather: (locationId: string) => ["weather", "current", locationId] as const,
  forecast: (locationId: string) => ["weather", "forecast", locationId] as const,
  alerts: (locationId: string) => ["alerts", locationId] as const,
  risk: (locationId: string) => ["risk", locationId] as const,
  zones: () => ["risk", "zones"] as const,
  advisory: (mode: UserMode, locationId: string) => ["advisory", mode, locationId] as const,
  authority: () => ["authority", "overview"] as const,
  status: () => ["system", "status"] as const,
  locations: () => ["locations"] as const,
};
