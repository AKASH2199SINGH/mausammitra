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
  buildInitialChat,
  defaultLocationId,
  suggestedPrompts,
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
  status: "/system/status",
  live: "/live",
  locations: "/locations",
} as const;

export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "/api/v1";

const REQUEST_TIMEOUT_MS = 15_000;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Build an absolute API URL, encoding query parameters safely. */
const apiUrl = (path: string, params?: Record<string, string | undefined>) => {
  const url = `${API_BASE_URL}${path}`;
  if (!params) return url;
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
  const qs = query.toString();
  return qs ? `${url}?${qs}` : url;
};

/**
 * Fetch a JSON API path.
 *
 * Failures throw an `Error` that carries the status and a snippet of the response
 * body, so callers (and error toasts) can say *why* something failed rather than
 * just "undefined failed".
 */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
      signal: init?.signal ?? timeout,
    });
  } catch (cause) {
    const timedOut = (cause as Error)?.name === "TimeoutError";
    throw new Error(
      timedOut
        ? `${path} timed out after ${REQUEST_TIMEOUT_MS / 1000}s — is the API reachable?`
        : `${path} is unreachable — start the API server and check CORS/origin settings`,
    );
  }

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 200).trim();
    throw new Error(`${path} failed with ${res.status}${detail ? ` — ${detail}` : ""}`);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`${path} returned a malformed JSON response`);
  }
}

export const mausamApi = {
  listLocations: async (): Promise<LocationRef[]> => {
    return await http<LocationRef[]>(ENDPOINTS.locations);
  },

  /** GET /weather/current */
  getCurrentWeather: async (locationId = defaultLocationId): Promise<CurrentWeather> => {
    return await http<CurrentWeather>(
      apiUrl(ENDPOINTS.currentWeather, { location_id: locationId }),
    );
  },

  /** GET /weather/forecast */
  getForecast: async (locationId = defaultLocationId): Promise<WeatherForecast> => {
    return await http<WeatherForecast>(apiUrl(ENDPOINTS.forecast, { location_id: locationId }));
  },

  /** GET /alerts */
  getAlerts: async (locationId?: string): Promise<HazardAlert[]> => {
    return await http<HazardAlert[]>(apiUrl(ENDPOINTS.alerts, { location_id: locationId }));
  },

  /** GET /risk */
  getRisk: async (locationId = defaultLocationId): Promise<RiskSnapshot> => {
    return await http<RiskSnapshot>(apiUrl(ENDPOINTS.risk, { location_id: locationId }));
  },

  /** GET /risk/zones */
  getRiskZones: async (): Promise<RiskZone[]> => {
    return await http<RiskZone[]>(ENDPOINTS.riskZones);
  },

  /** GET /advisory */
  getAdvisory: async (mode: UserMode, locationId = defaultLocationId): Promise<Advisory> => {
    return await http<Advisory>(apiUrl(ENDPOINTS.advisory, { mode, location_id: locationId }));
  },

  /** GET /authority/overview */
  getAuthorityMetrics: async (): Promise<AuthorityMetrics> => {
    return await http<AuthorityMetrics>(ENDPOINTS.authorityOverview);
  },

  /** GET /status */
  getSystemStatus: async (): Promise<SystemStatus> => {
    return await http<SystemStatus>(ENDPOINTS.status);
  },

  /** Opening assistant greeting, addressed to the active location. */
  getInitialChat: (locationLabel?: string): ChatMessage[] => clone(buildInitialChat(locationLabel)),

  getSuggestedPrompts: (mode: UserMode): string[] => clone(suggestedPrompts[mode]!),

  getSampleUtterances: (language: Language): string[] => clone(voiceSampleUtterances[language]!),

  /** POST /chat — grounded advisory answer */
  postChat: async (req: ChatRequest): Promise<ChatMessage> => {
    return await http<ChatMessage>(ENDPOINTS.chat, {
      method: "POST",
      body: JSON.stringify(req),
    });
  },

  /**
   * POST /voice/transcribe — server-side ASR.
   *
   * If the backend is unreachable we fall back to the bundled sample utterances so the
   * voice flow still completes instead of leaving the console stuck on "processing".
   */
  transcribeVoice: async (language: Language): Promise<TranscriptionResult> => {
    try {
      return await http<TranscriptionResult>(ENDPOINTS.voiceTranscribe, {
        method: "POST",
        body: JSON.stringify({ language }),
      });
    } catch (cause) {
      console.warn("Voice transcription fell back to local samples:", cause);
      await new Promise((r) => setTimeout(r, 1100));
      const samples = voiceSampleUtterances[language]!;
      return {
        text: samples[Math.floor(Math.random() * samples.length)]!,
        language,
        confidence: 0.91,
        durationMs: 2400,
      };
    }
  },

  /**
   * WS /live — real socket subscription.
   *
   * Returns an unsubscribe function. Ticks only arrive when the backend is
   * genuinely pushing them (no fabricated data), and the socket reconnects with
   * capped backoff so a backend restart doesn't leave the UI on "connecting…"
   * forever. Teardown defers closing a still-connecting socket: closing during
   * the handshake logs a spurious console warning and is what React's StrictMode
   * double-mount used to produce.
   */
  subscribeLive: (onTick: (payload: { at: string; latencyMs: number }) => void) => {
    if (typeof WebSocket === "undefined") return () => {};

    let socket: WebSocket | null = null;
    let disposed = false;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRetry = () => {
      if (disposed || retryTimer) return;
      const delay = Math.min(15_000, 1000 * 2 ** Math.min(attempt, 4));
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connect();
      }, delay);
    };

    const connect = () => {
      if (disposed) return;
      try {
        const s = new WebSocket(liveSocketUrl());
        socket = s;

        s.onopen = () => {
          if (disposed) s.close();
          else attempt = 0;
        };
        s.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string) as {
              at?: string;
              latencyMs?: number;
            };
            onTick({ at: data.at ?? new Date().toISOString(), latencyMs: data.latencyMs ?? 0 });
          } catch {
            // Ignore malformed frames rather than tearing the stream down.
          }
        };
        s.onerror = () => {
          // `onclose` always follows and is the single retry path.
        };
        s.onclose = () => {
          if (socket === s) socket = null;
          if (disposed) return;
          attempt += 1;
          scheduleRetry();
        };
      } catch {
        socket = null;
        scheduleRetry();
      }
    };

    connect();

    return () => {
      disposed = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      const s = socket;
      socket = null;
      if (!s) return;
      if (s.readyState === WebSocket.CONNECTING) {
        // Never close mid-handshake; close as soon as it finishes (or is
        // rejected by the peer, which resolves on its own).
        s.onopen = () => s.close();
        s.onclose = null;
        s.onmessage = null;
      } else if (s.readyState === WebSocket.OPEN) {
        s.close();
      }
    };
  },
};

/** ws:// URL for the live feed, derived from the configured HTTP API base. */
function liveSocketUrl(): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  if (/^https?:\/\//.test(base)) return `${base.replace(/^http/, "ws")}${ENDPOINTS.live}`;
  const protocol =
    typeof window !== "undefined" && window.location.protocol === "https:" ? "wss" : "ws";
  const host = typeof window !== "undefined" ? window.location.host : "localhost";
  return `${protocol}://${host}${base}${ENDPOINTS.live}`;
}

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
