/**
 * MausamMitra domain models.
 * These interfaces mirror the future FastAPI response contracts, so the
 * service layer can be swapped from mock -> HTTP without UI changes.
 */

export type UserMode = "citizen" | "farmer" | "authority";
export type Language = "en" | "hi";

export type RiskLevel = "low" | "moderate" | "high" | "severe";
export type HazardType = "flood" | "heat" | "storm";

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface LocationRef {
  id: string;
  name: string;
  district: string;
  state: string;
  coords: Coordinates;
}

/** Provenance block attached to every advisory/risk/answer surface. */
export interface Provenance {
  source: string;
  issuedAt: string;
  validUntil: string;
  confidence: number; // 0..1
  model?: string;
}

export interface CurrentWeather {
  location: LocationRef;
  observedAt: string;
  condition: string;
  temperatureC: number;
  feelsLikeC: number;
  rainfallMm: number;
  rainfall24hMm: number;
  windKph: number;
  windDirection: string;
  humidityPct: number;
  pressureHpa: number;
  visibilityKm: number;
  provenance: Provenance;
}

export interface ForecastSlot {
  time: string;
  label: string;
  temperatureC: number;
  rainfallMm: number;
  rainChancePct: number;
  windKph: number;
  condition: string;
  dominantRisk: HazardType | null;
  riskLevel: RiskLevel;
}

export interface WeatherForecast {
  locationId: string;
  issuedAt: string;
  slots: ForecastSlot[];
  provenance: Provenance;
}

export type AlertSeverity = "advisory" | "watch" | "warning" | "emergency";
export type AlertKind = "official" | "mausammitra";

export interface HazardAlert {
  id: string;
  kind: AlertKind;
  hazard: HazardType;
  severity: AlertSeverity;
  headline: string;
  body: string;
  areas: string[];
  issuedAt: string;
  validUntil: string;
  source: string;
  confidence: number;
  acknowledged?: boolean;
}

export interface RiskFactor {
  label: string;
  value: string;
  weight: number; // 0..1 contribution
}

export interface HazardRisk {
  hazard: HazardType;
  level: RiskLevel;
  score: number; // 0..100
  trend: "rising" | "steady" | "falling";
  summary: string;
  /** Explainability: "Why this risk?" */
  factors: RiskFactor[];
  recommendedActions: string[];
  provenance: Provenance;
}

export interface RiskSnapshot {
  locationId: string;
  overall: RiskLevel;
  overallSummary: string;
  hazards: HazardRisk[];
  updatedAt: string;
}

export type ZoneLayer = "rainfall" | "flood" | "heat" | "storm" | "warning" | "emergency";

export interface RiskZone {
  id: string;
  name: string;
  district: string;
  state: string;
  layer: ZoneLayer;
  level: RiskLevel;
  /** Normalized map-space polygon (0..100 in both axes) for the GIS canvas. */
  polygon: Array<[number, number]>;
  centroid: [number, number];
  population: number;
  areaKm2: number;
  why: string;
  factors: RiskFactor[];
  recommendedAction: string;
  provenance: Provenance;
}

export interface AdvisoryItem {
  id: string;
  priority: "critical" | "high" | "routine";
  title: string;
  detail: string;
  window: string;
  hazard: HazardType | null;
}

export interface Advisory {
  mode: UserMode;
  locationId: string;
  headline: string;
  items: AdvisoryItem[];
  provenance: Provenance;
}

export interface ChatCitation {
  label: string;
  detail: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  facts?: Array<{ label: string; value: string }>;
  riskLevel?: RiskLevel;
  hazard?: HazardType | null;
  actions?: string[];
  officialWarningRef?: string;
  citations?: ChatCitation[];
  provenance?: Provenance;
}

export interface ChatRequest {
  message: string;
  mode: UserMode;
  language: Language;
  locationId: string;
}

export interface TranscriptionResult {
  text: string;
  language: Language;
  confidence: number;
  durationMs: number;
}

export interface AuthorityMetrics {
  activeWarnings: number;
  highRiskZones: number;
  criticalZones: number;
  affectedPopulation: number;
  affectedAreaKm2: number;
  responseTeamsDeployed: number;
  hazardTrend: Array<{ time: string; flood: number; heat: number; storm: number }>;
  priorityLocations: Array<{
    id: string;
    name: string;
    district: string;
    level: RiskLevel;
    hazard: HazardType;
    population: number;
    action: string;
  }>;
}

export type ServiceHealth = "online" | "degraded" | "offline";

export interface SystemStatus {
  overall: ServiceHealth;
  lastSync: string;
  latencyMs: number;
  offlineCacheReady: boolean;
  services: Array<{
    name: string;
    health: ServiceHealth;
    detail: string;
  }>;
}
