/**
 * Centralized mock dataset. This is the ONLY place literal prototype data lives.
 * Replacing it with FastAPI responses requires no component changes.
 */
import type {
  Advisory,
  AuthorityMetrics,
  ChatMessage,
  CurrentWeather,
  HazardAlert,
  LocationRef,
  RiskSnapshot,
  RiskZone,
  SystemStatus,
  UserMode,
  WeatherForecast,
} from "@/types/mausam";

const now = new Date("2026-09-02T13:10:00+05:30");

const iso = (minutesOffset: number) =>
  new Date(now.getTime() + minutesOffset * 60_000).toISOString();

export const locations: LocationRef[] = [
  {
    id: "loc-patna",
    name: "Kurji, Patna",
    district: "Patna",
    state: "Bihar",
    coords: { lat: 25.6207, lon: 85.1234 },
  },
  {
    id: "loc-guwahati",
    name: "Jalukbari, Guwahati",
    district: "Kamrup",
    state: "Assam",
    coords: { lat: 26.1512, lon: 91.6602 },
  },
  {
    id: "loc-nagpur",
    name: "Kalmeshwar, Nagpur",
    district: "Nagpur",
    state: "Maharashtra",
    coords: { lat: 21.2333, lon: 78.9167 },
  },
  {
    id: "loc-puri",
    name: "Konark Belt, Puri",
    district: "Puri",
    state: "Odisha",
    coords: { lat: 19.8135, lon: 85.8312 },
  },
];

export const defaultLocationId = "loc-patna";

export const currentWeather: Record<string, CurrentWeather> = {
  "loc-patna": {
    location: locations[0],
    observedAt: iso(-12),
    condition: "Heavy rain, overcast",
    temperatureC: 29.4,
    feelsLikeC: 34.1,
    rainfallMm: 18.6,
    rainfall24hMm: 96.2,
    windKph: 32,
    windDirection: "ESE",
    humidityPct: 89,
    pressureHpa: 996,
    visibilityKm: 2.8,
    provenance: {
      source: "IMD AWS Patna + MausamMitra fusion",
      issuedAt: iso(-12),
      validUntil: iso(48),
      confidence: 0.93,
      model: "nowcast-fusion v0.9",
    },
  },
  "loc-guwahati": {
    location: locations[1],
    observedAt: iso(-9),
    condition: "Intermittent showers",
    temperatureC: 27.8,
    feelsLikeC: 32.4,
    rainfallMm: 7.2,
    rainfall24hMm: 61.4,
    windKph: 21,
    windDirection: "SE",
    humidityPct: 92,
    pressureHpa: 999,
    visibilityKm: 4.5,
    provenance: {
      source: "IMD AWS Guwahati + CWC gauge",
      issuedAt: iso(-9),
      validUntil: iso(48),
      confidence: 0.9,
    },
  },
  "loc-nagpur": {
    location: locations[2],
    observedAt: iso(-15),
    condition: "Clear, dry heat",
    temperatureC: 41.6,
    feelsLikeC: 45.2,
    rainfallMm: 0,
    rainfall24hMm: 0,
    windKph: 14,
    windDirection: "NW",
    humidityPct: 22,
    pressureHpa: 1003,
    visibilityKm: 9.5,
    provenance: {
      source: "IMD AWS Nagpur",
      issuedAt: iso(-15),
      validUntil: iso(48),
      confidence: 0.95,
    },
  },
  "loc-puri": {
    location: locations[3],
    observedAt: iso(-6),
    condition: "Squally winds, rough sea",
    temperatureC: 28.1,
    feelsLikeC: 33.8,
    rainfallMm: 11.4,
    rainfall24hMm: 42.8,
    windKph: 68,
    windDirection: "SW",
    humidityPct: 86,
    pressureHpa: 991,
    visibilityKm: 3.2,
    provenance: {
      source: "IMD Cyclone Warning Centre, Bhubaneswar",
      issuedAt: iso(-6),
      validUntil: iso(36),
      confidence: 0.88,
    },
  },
};

export const forecasts: Record<string, WeatherForecast> = {
  "loc-patna": {
    locationId: "loc-patna",
    issuedAt: iso(-12),
    provenance: {
      source: "IMD GFS downscale + MausamMitra ML",
      issuedAt: iso(-12),
      validUntil: iso(720),
      confidence: 0.82,
      model: "hyperlocal-lstm v0.6",
    },
    slots: [
      { time: iso(0), label: "Now", temperatureC: 29.4, rainfallMm: 18.6, rainChancePct: 96, windKph: 32, condition: "Heavy rain", dominantRisk: "flood", riskLevel: "high" },
      { time: iso(180), label: "16:00", temperatureC: 28.6, rainfallMm: 22.4, rainChancePct: 92, windKph: 38, condition: "Heavy rain", dominantRisk: "flood", riskLevel: "severe" },
      { time: iso(360), label: "19:00", temperatureC: 27.5, rainfallMm: 14.1, rainChancePct: 78, windKph: 30, condition: "Rain, gusty", dominantRisk: "storm", riskLevel: "high" },
      { time: iso(540), label: "22:00", temperatureC: 26.8, rainfallMm: 6.2, rainChancePct: 54, windKph: 22, condition: "Light rain", dominantRisk: "flood", riskLevel: "moderate" },
      { time: iso(720), label: "01:00", temperatureC: 26.1, rainfallMm: 2.4, rainChancePct: 38, windKph: 16, condition: "Cloudy", dominantRisk: null, riskLevel: "moderate" },
      { time: iso(900), label: "04:00", temperatureC: 25.7, rainfallMm: 0.8, rainChancePct: 24, windKph: 12, condition: "Cloudy", dominantRisk: null, riskLevel: "low" },
      { time: iso(1080), label: "07:00", temperatureC: 27.2, rainfallMm: 0.4, rainChancePct: 18, windKph: 14, condition: "Partly cloudy", dominantRisk: null, riskLevel: "low" },
      { time: iso(1260), label: "10:00", temperatureC: 30.4, rainfallMm: 1.2, rainChancePct: 30, windKph: 18, condition: "Humid, cloudy", dominantRisk: "heat", riskLevel: "moderate" },
    ],
  },
};

const fallbackForecast = (locationId: string): WeatherForecast => ({
  ...forecasts["loc-patna"],
  locationId,
});

export const getForecastFor = (locationId: string): WeatherForecast =>
  forecasts[locationId] ?? fallbackForecast(locationId);

export const alerts: HazardAlert[] = [
  {
    id: "alr-001",
    kind: "official",
    hazard: "flood",
    severity: "warning",
    headline: "Orange alert: heavy to very heavy rainfall over north Bihar",
    body: "Rainfall of 115–160 mm expected in the next 24 hours. Ganga at Digha Ghat is 0.4 m below the danger mark and rising at 3 cm/hr. Low-lying wards may see waterlogging.",
    areas: ["Patna", "Vaishali", "Saran", "Muzaffarpur"],
    issuedAt: iso(-95),
    validUntil: iso(1345),
    source: "IMD Regional Met Centre, Patna",
    confidence: 0.94,
  },
  {
    id: "alr-002",
    kind: "mausammitra",
    hazard: "flood",
    severity: "watch",
    headline: "Urban waterlogging likely in Kurji–Digha corridor after 16:00",
    body: "Drain capacity in the Kurji corridor is saturated. Modelled surface water depth 25–45 cm on Ashiana–Digha Road between 16:00 and 21:00.",
    areas: ["Kurji", "Digha", "Rajapur Pul"],
    issuedAt: iso(-38),
    validUntil: iso(420),
    source: "MausamMitra hydro-nowcast",
    confidence: 0.79,
  },
  {
    id: "alr-003",
    kind: "official",
    hazard: "storm",
    severity: "warning",
    headline: "Squally weather warning for Odisha coast, wind 60–70 kmph",
    body: "Fishermen advised not to venture into the sea off Puri and Ganjam coast until tomorrow 18:00 IST.",
    areas: ["Puri", "Ganjam", "Khordha"],
    issuedAt: iso(-160),
    validUntil: iso(1160),
    source: "IMD Cyclone Warning Centre, Bhubaneswar",
    confidence: 0.91,
  },
  {
    id: "alr-004",
    kind: "official",
    hazard: "heat",
    severity: "advisory",
    headline: "Heatwave conditions persisting over Vidarbha",
    body: "Maximum temperature 41–43 °C, 3.5 °C above normal. Outdoor exposure between 11:00 and 16:00 should be avoided.",
    areas: ["Nagpur", "Wardha", "Chandrapur"],
    issuedAt: iso(-320),
    validUntil: iso(1000),
    source: "IMD Nagpur",
    confidence: 0.87,
  },
  {
    id: "alr-005",
    kind: "mausammitra",
    hazard: "storm",
    severity: "advisory",
    headline: "Lightning cluster tracking towards Vaishali, ETA 45 min",
    body: "Cloud-to-ground strike density rising over Hajipur. Avoid open fields and metal implements for the next hour.",
    areas: ["Hajipur", "Vaishali"],
    issuedAt: iso(-14),
    validUntil: iso(120),
    source: "MausamMitra lightning nowcast",
    confidence: 0.72,
  },
];

export const riskSnapshots: Record<string, RiskSnapshot> = {
  "loc-patna": {
    locationId: "loc-patna",
    overall: "high",
    overallSummary:
      "Compound flood and storm risk. Official orange rainfall warning in force; urban drainage saturated.",
    updatedAt: iso(-8),
    hazards: [
      {
        hazard: "flood",
        level: "high",
        score: 78,
        trend: "rising",
        summary: "Urban waterlogging and riverine rise combining through this evening.",
        factors: [
          { label: "24 h rainfall", value: "96.2 mm (2.4× normal)", weight: 0.34 },
          { label: "Ganga level at Digha Ghat", value: "49.6 m, +3 cm/hr", weight: 0.27 },
          { label: "Soil saturation", value: "94% field capacity", weight: 0.21 },
          { label: "Drain discharge capacity", value: "Kurji pump at 82% load", weight: 0.18 },
        ],
        recommendedActions: [
          "Avoid Ashiana–Digha Road between 16:00 and 21:00",
          "Move vehicles and documents above 0.5 m ground level",
          "Keep 12 hours of drinking water stored",
        ],
        provenance: {
          source: "CWC gauge + IMD rainfall + MausamMitra hydro model",
          issuedAt: iso(-8),
          validUntil: iso(360),
          confidence: 0.86,
          model: "flood-risk-gbm v0.8",
        },
      },
      {
        hazard: "storm",
        level: "moderate",
        score: 54,
        trend: "rising",
        summary: "Gusts to 55 kmph and lightning clusters possible between 18:00 and 21:00.",
        factors: [
          { label: "CAPE", value: "2,180 J/kg", weight: 0.35 },
          { label: "Lightning strike density", value: "14 strikes / 5 min, rising", weight: 0.3 },
          { label: "Wind gust forecast", value: "52–58 kmph", weight: 0.2 },
          { label: "Radar echo top", value: "12.4 km", weight: 0.15 },
        ],
        recommendedActions: [
          "Secure hoardings, scaffolding and rooftop items",
          "Stay indoors during the 18:00–21:00 window",
          "Unplug sensitive electronics during lightning activity",
        ],
        provenance: {
          source: "Doppler radar Patna + IMD nowcast",
          issuedAt: iso(-8),
          validUntil: iso(300),
          confidence: 0.74,
        },
      },
      {
        hazard: "heat",
        level: "low",
        score: 21,
        trend: "falling",
        summary: "Cloud cover and rainfall suppressing heat stress; humidity discomfort remains.",
        factors: [
          { label: "Max temperature", value: "29.4 °C (−3.1 °C vs normal)", weight: 0.4 },
          { label: "Heat index", value: "34.1 °C", weight: 0.35 },
          { label: "Night-time minimum", value: "25.7 °C", weight: 0.25 },
        ],
        recommendedActions: [
          "Maintain normal hydration",
          "No heat-specific restriction in force",
        ],
        provenance: {
          source: "IMD AWS Patna",
          issuedAt: iso(-8),
          validUntil: iso(720),
          confidence: 0.92,
        },
      },
    ],
  },
};

const fallbackSnapshot = (locationId: string): RiskSnapshot => ({
  ...riskSnapshots["loc-patna"],
  locationId,
});

export const getRiskFor = (locationId: string): RiskSnapshot =>
  riskSnapshots[locationId] ?? fallbackSnapshot(locationId);

export const riskZones: RiskZone[] = [
  {
    id: "zone-kurji",
    name: "Kurji–Digha corridor",
    district: "Patna",
    state: "Bihar",
    layer: "flood",
    level: "severe",
    polygon: [
      [12, 24],
      [30, 19],
      [37, 32],
      [26, 42],
      [13, 38],
    ],
    centroid: [24, 30],
    population: 184000,
    areaKm2: 21.4,
    why: "Saturated soil plus 96 mm of rain in 24 h against a drainage network already at 82% pump load.",
    factors: [
      { label: "Rainfall 24 h", value: "96.2 mm", weight: 0.35 },
      { label: "Pump load", value: "82%", weight: 0.25 },
      { label: "Ground elevation", value: "2.1 m below embankment", weight: 0.22 },
      { label: "Ganga backwater", value: "Rising 3 cm/hr", weight: 0.18 },
    ],
    recommendedAction:
      "Restrict vehicle movement on Ashiana–Digha Road 16:00–21:00; pre-position two dewatering pumps at Rajapur Pul.",
    provenance: {
      source: "CWC + PMC drainage telemetry",
      issuedAt: iso(-8),
      validUntil: iso(360),
      confidence: 0.85,
    },
  },
  {
    id: "zone-vaishali",
    name: "Vaishali floodplain",
    district: "Vaishali",
    state: "Bihar",
    layer: "flood",
    level: "high",
    polygon: [
      [40, 14],
      [59, 12],
      [64, 26],
      [48, 33],
      [39, 26],
    ],
    centroid: [50, 21],
    population: 96500,
    areaKm2: 58.9,
    why: "Gandak tributary inflow with embankment seepage reported at two chainages.",
    factors: [
      { label: "Tributary inflow", value: "+18% over 6 h", weight: 0.3 },
      { label: "Embankment seepage", value: "2 reported points", weight: 0.3 },
      { label: "Rainfall 24 h", value: "71 mm", weight: 0.25 },
      { label: "Crop stage", value: "Paddy tillering, submergence-sensitive", weight: 0.15 },
    ],
    recommendedAction:
      "Alert 6 panchayats, keep boats on standby, advise farmers to drain field bunds partially.",
    provenance: {
      source: "Water Resources Dept. Bihar + MausamMitra",
      issuedAt: iso(-20),
      validUntil: iso(480),
      confidence: 0.78,
    },
  },
  {
    id: "zone-rain-patna",
    name: "North Bihar rain band",
    district: "Multiple",
    state: "Bihar",
    layer: "rainfall",
    level: "high",
    polygon: [
      [8, 8],
      [72, 6],
      [78, 24],
      [44, 30],
      [10, 22],
    ],
    centroid: [42, 15],
    population: 2400000,
    areaKm2: 4120,
    why: "Active monsoon trough with an embedded low over the Gangetic plain producing sustained 20–30 mm/hr cells.",
    factors: [
      { label: "Radar reflectivity", value: "48–54 dBZ cells", weight: 0.4 },
      { label: "Trough position", value: "Axis over 26° N", weight: 0.3 },
      { label: "Moisture flux", value: "Strong Bay of Bengal feed", weight: 0.3 },
    ],
    recommendedAction: "Expect 115–160 mm accumulation in 24 h; plan field work outside this band.",
    provenance: {
      source: "IMD Doppler radar mosaic",
      issuedAt: iso(-12),
      validUntil: iso(360),
      confidence: 0.89,
    },
  },
  {
    id: "zone-vidarbha-heat",
    name: "Vidarbha heat core",
    district: "Nagpur",
    state: "Maharashtra",
    layer: "heat",
    level: "high",
    polygon: [
      [22, 58],
      [46, 54],
      [52, 72],
      [30, 80],
      [18, 70],
    ],
    centroid: [34, 66],
    population: 1310000,
    areaKm2: 2260,
    why: "Persistent subsidence, dry westerlies and 3.5 °C positive temperature anomaly for four consecutive days.",
    factors: [
      { label: "Max temperature", value: "41.6 °C", weight: 0.35 },
      { label: "Anomaly", value: "+3.5 °C", weight: 0.25 },
      { label: "Night minimum", value: "28.9 °C (no relief)", weight: 0.22 },
      { label: "Humidity", value: "22%", weight: 0.18 },
    ],
    recommendedAction:
      "Open cooling shelters 11:00–17:00; shift outdoor labour and MGNREGA works to early morning.",
    provenance: {
      source: "IMD Nagpur + NDMA heat action plan",
      issuedAt: iso(-40),
      validUntil: iso(900),
      confidence: 0.88,
    },
  },
  {
    id: "zone-odisha-storm",
    name: "Puri coastal squall zone",
    district: "Puri",
    state: "Odisha",
    layer: "storm",
    level: "severe",
    polygon: [
      [62, 60],
      [86, 56],
      [92, 74],
      [72, 84],
      [60, 74],
    ],
    centroid: [76, 69],
    population: 428000,
    areaKm2: 1180,
    why: "Deep convection along the coast with 68 kmph sustained wind and rough sea state 5.",
    factors: [
      { label: "Sustained wind", value: "68 kmph", weight: 0.35 },
      { label: "Sea state", value: "State 5, 3.1 m swell", weight: 0.28 },
      { label: "Pressure fall", value: "−4 hPa / 3 h", weight: 0.22 },
      { label: "Convective cluster", value: "Organizing, moving NNW", weight: 0.15 },
    ],
    recommendedAction:
      "Enforce fishing ban, secure beach installations, keep ODRAF team at Konark on 30-minute readiness.",
    provenance: {
      source: "IMD CWC Bhubaneswar + INCOIS",
      issuedAt: iso(-6),
      validUntil: iso(1160),
      confidence: 0.9,
    },
  },
  {
    id: "zone-warning-northbihar",
    name: "Orange warning zone — North Bihar",
    district: "Multiple",
    state: "Bihar",
    layer: "warning",
    level: "high",
    polygon: [
      [10, 10],
      [66, 8],
      [70, 34],
      [30, 44],
      [8, 30],
    ],
    centroid: [38, 24],
    population: 3100000,
    areaKm2: 6400,
    why: "IMD orange alert for heavy to very heavy rainfall valid for 24 hours.",
    factors: [
      { label: "Alert class", value: "Orange (be prepared)", weight: 0.5 },
      { label: "Districts covered", value: "4", weight: 0.25 },
      { label: "Validity", value: "24 hours", weight: 0.25 },
    ],
    recommendedAction: "District control rooms on 24×7 duty; verify shelter and pump readiness.",
    provenance: {
      source: "IMD Regional Met Centre, Patna",
      issuedAt: iso(-95),
      validUntil: iso(1345),
      confidence: 0.94,
    },
  },
  {
    id: "zone-emergency-digha",
    name: "Emergency staging — Digha Ghat",
    district: "Patna",
    state: "Bihar",
    layer: "emergency",
    level: "moderate",
    polygon: [
      [16, 44],
      [32, 42],
      [34, 54],
      [20, 57],
    ],
    centroid: [24, 49],
    population: 21000,
    areaKm2: 6.2,
    why: "Designated NDRF staging and relief shelter cluster for the Kurji–Digha flood corridor.",
    factors: [
      { label: "Shelter capacity", value: "4,200 persons", weight: 0.4 },
      { label: "NDRF teams", value: "2 on site", weight: 0.35 },
      { label: "Access route status", value: "Passable", weight: 0.25 },
    ],
    recommendedAction: "Maintain shelter stock for 72 hours; keep two boats water-ready.",
    provenance: {
      source: "District Disaster Management Authority, Patna",
      issuedAt: iso(-60),
      validUntil: iso(1440),
      confidence: 0.82,
    },
  },
];

export const advisories: Record<UserMode, Advisory> = {
  citizen: {
    mode: "citizen",
    locationId: defaultLocationId,
    headline: "Avoid the Kurji–Digha corridor after 16:00 today",
    provenance: {
      source: "MausamMitra advisory engine (grounded on IMD + CWC)",
      issuedAt: iso(-8),
      validUntil: iso(420),
      confidence: 0.84,
      model: "advisory-llm v0.5",
    },
    items: [
      {
        id: "adv-c1",
        priority: "critical",
        title: "Do not travel through Ashiana–Digha Road between 16:00 and 21:00",
        detail:
          "Modelled water depth of 25–45 cm makes two-wheelers and small cars unsafe. Use Bailey Road as the alternate route.",
        window: "16:00 – 21:00 IST today",
        hazard: "flood",
      },
      {
        id: "adv-c2",
        priority: "high",
        title: "Store 12 hours of drinking water before 18:00",
        detail: "Waterlogging near Kurji pump house may interrupt supply for 6–10 hours.",
        window: "Before 18:00 IST",
        hazard: "flood",
      },
      {
        id: "adv-c3",
        priority: "high",
        title: "Stay indoors during the 18:00–21:00 lightning window",
        detail: "Strike density is rising over Hajipur and moving towards Patna.",
        window: "18:00 – 21:00 IST",
        hazard: "storm",
      },
      {
        id: "adv-c4",
        priority: "routine",
        title: "Keep phone charged and enable offline alerts",
        detail: "MausamMitra caches the last advisory so it works during network outages.",
        window: "Today",
        hazard: null,
      },
    ],
  },
  farmer: {
    mode: "farmer",
    locationId: defaultLocationId,
    headline: "Skip irrigation for 48 hours and drain paddy bunds partially",
    provenance: {
      source: "MausamMitra agro-advisory (IMD Agromet + soil moisture)",
      issuedAt: iso(-8),
      validUntil: iso(2880),
      confidence: 0.81,
      model: "agro-advisory v0.4",
    },
    items: [
      {
        id: "adv-f1",
        priority: "critical",
        title: "Do not irrigate — 115–160 mm rainfall expected in 24 hours",
        detail:
          "Soil moisture is already at 94% of field capacity. Additional irrigation risks root-zone submergence in paddy at tillering stage.",
        window: "Next 48 hours",
        hazard: "flood",
      },
      {
        id: "adv-f2",
        priority: "high",
        title: "Open field bunds by 10–15 cm to control submergence",
        detail: "Paddy tolerates 5–10 cm standing water; beyond 3 days of deep submergence yield loss rises sharply.",
        window: "Before 16:00 IST today",
        hazard: "flood",
      },
      {
        id: "adv-f3",
        priority: "high",
        title: "Postpone spraying and fertilizer top-dressing",
        detail: "Wash-off risk is near total with 92% rain probability. Resume once 24 h rainfall drops below 5 mm.",
        window: "Until 04 Sep",
        hazard: null,
      },
      {
        id: "adv-f4",
        priority: "routine",
        title: "Move harvested produce and fodder to raised storage",
        detail: "Keep stock at least 0.5 m above ground and covered with tarpaulin.",
        window: "Today",
        hazard: "flood",
      },
    ],
  },
  authority: {
    mode: "authority",
    locationId: defaultLocationId,
    headline: "Pre-position dewatering capacity in Kurji ward before 16:00",
    provenance: {
      source: "MausamMitra operations advisory (DDMA-aligned)",
      issuedAt: iso(-8),
      validUntil: iso(720),
      confidence: 0.87,
      model: "ops-advisory v0.3",
    },
    items: [
      {
        id: "adv-a1",
        priority: "critical",
        title: "Deploy 2 dewatering pumps to Rajapur Pul",
        detail:
          "Kurji pump house is at 82% load. Modelled surcharge begins around 16:20 IST at current rainfall rate.",
        window: "Before 16:00 IST",
        hazard: "flood",
      },
      {
        id: "adv-a2",
        priority: "critical",
        title: "Issue targeted SMS/IVR to 184,000 residents in the flood corridor",
        detail: "Use Hindi voice broadcast for wards 12–18; include the alternate route advisory.",
        window: "Immediate",
        hazard: "flood",
      },
      {
        id: "adv-a3",
        priority: "high",
        title: "Verify shelter readiness at Digha Ghat staging area",
        detail: "Capacity 4,200 persons; confirm 72-hour ration, medical and lighting stock.",
        window: "Next 4 hours",
        hazard: "flood",
      },
      {
        id: "adv-a4",
        priority: "high",
        title: "Coordinate with Vaishali DDMA on embankment seepage",
        detail: "Two seepage points reported; schedule engineering inspection before nightfall.",
        window: "Before 19:00 IST",
        hazard: "flood",
      },
    ],
  },
};

export const authorityMetrics: AuthorityMetrics = {
  activeWarnings: 3,
  highRiskZones: 5,
  criticalZones: 2,
  affectedPopulation: 3712000,
  affectedAreaKm2: 8420,
  responseTeamsDeployed: 11,
  hazardTrend: [
    { time: "06:00", flood: 38, heat: 30, storm: 22 },
    { time: "08:00", flood: 44, heat: 34, storm: 26 },
    { time: "10:00", flood: 52, heat: 41, storm: 31 },
    { time: "12:00", flood: 64, heat: 46, storm: 38 },
    { time: "14:00", flood: 72, heat: 44, storm: 46 },
    { time: "16:00", flood: 78, heat: 39, storm: 54 },
    { time: "18:00", flood: 81, heat: 32, storm: 58 },
  ],
  priorityLocations: [
    {
      id: "zone-kurji",
      name: "Kurji–Digha corridor",
      district: "Patna",
      level: "severe",
      hazard: "flood",
      population: 184000,
      action: "Dewatering pumps + traffic restriction",
    },
    {
      id: "zone-odisha-storm",
      name: "Puri coastal squall zone",
      district: "Puri",
      level: "severe",
      hazard: "storm",
      population: 428000,
      action: "Fishing ban enforcement, ODRAF readiness",
    },
    {
      id: "zone-vaishali",
      name: "Vaishali floodplain",
      district: "Vaishali",
      level: "high",
      hazard: "flood",
      population: 96500,
      action: "Embankment inspection, boat standby",
    },
    {
      id: "zone-vidarbha-heat",
      name: "Vidarbha heat core",
      district: "Nagpur",
      level: "high",
      hazard: "heat",
      population: 1310000,
      action: "Cooling shelters, labour hour shift",
    },
  ],
};

export const systemStatus: SystemStatus = {
  overall: "degraded",
  lastSync: iso(-2),
  latencyMs: 218,
  offlineCacheReady: true,
  services: [
    { name: "IMD ingest", health: "online", detail: "AWS + radar mosaic, 3-min cadence" },
    { name: "CWC gauge feed", health: "online", detail: "12 stations, 15-min cadence" },
    { name: "Risk inference (ML)", health: "online", detail: "flood-risk-gbm v0.8" },
    { name: "LLM advisory", health: "degraded", detail: "Elevated latency, fallback templates active" },
    { name: "Voice (ASR/TTS)", health: "online", detail: "hi-IN / en-IN" },
    { name: "Live socket", health: "online", detail: "WS /live, 41 subscribers" },
  ],
};

export const suggestedPrompts: Record<UserMode, string[]> = {
  citizen: [
    "Will it rain today?",
    "Can I travel at 6 PM?",
    "What should I do during this warning?",
    "Is my area safe tonight?",
  ],
  farmer: [
    "Should I irrigate my field?",
    "Will it rain today?",
    "Can I spray pesticide tomorrow?",
    "Is my paddy at submergence risk?",
  ],
  authority: [
    "Which zones need evacuation first?",
    "What is the affected population estimate?",
    "What should I do during this warning?",
    "Show me the flood trend for today",
  ],
};

export const initialChat: ChatMessage[] = [
  {
    id: "msg-seed",
    role: "assistant",
    text: "Namaste. I am MausamMitra. I read IMD and CWC feeds for Kurji, Patna and explain what they mean for you. Ask me in Hindi or English, by text or voice.",
    createdAt: iso(-3),
    provenance: {
      source: "MausamMitra advisory engine",
      issuedAt: iso(-3),
      validUntil: iso(240),
      confidence: 0.9,
      model: "advisory-llm v0.5",
    },
  },
];

interface AnswerTemplate {
  match: RegExp;
  build: (mode: UserMode) => Omit<ChatMessage, "id" | "role" | "createdAt">;
}

export const answerTemplates: AnswerTemplate[] = [
  {
    match: /rain|barish|बारिश|बरसात/i,
    build: () => ({
      text: "Yes — heavy rain is already falling in Kurji and it intensifies after 16:00. Expect 115–160 mm over the next 24 hours, with the strongest cells between 16:00 and 19:00 IST.",
      facts: [
        { label: "Rain now", value: "18.6 mm/hr" },
        { label: "24 h total", value: "96.2 mm" },
        { label: "Rain chance 16:00", value: "92%" },
        { label: "Wind", value: "32 kmph ESE" },
      ],
      riskLevel: "high",
      hazard: "flood",
      actions: [
        "Finish outdoor work before 16:00",
        "Keep low-lying roads out of your route plan tonight",
      ],
      officialWarningRef: "alr-001",
      citations: [
        { label: "IMD Regional Met Centre, Patna", detail: "Orange alert, issued 11:35 IST" },
        { label: "Doppler radar Patna", detail: "48–54 dBZ cells over 26° N" },
      ],
    }),
  },
  {
    match: /travel|travelling|6 ?pm|road|nikal|यात्रा|सफर/i,
    build: () => ({
      text: "Travel at 18:00 is not advised on the Kurji–Digha corridor. Modelled surface water is 25–45 cm there between 16:00 and 21:00, and a lightning cluster is tracking in from Hajipur. If you must move, use Bailey Road and leave before 15:30.",
      facts: [
        { label: "Water depth 18:00", value: "25–45 cm" },
        { label: "Gusts", value: "52–58 kmph" },
        { label: "Visibility", value: "2.8 km" },
        { label: "Safe window", value: "Before 15:30 IST" },
      ],
      riskLevel: "severe",
      hazard: "flood",
      actions: [
        "Avoid Ashiana–Digha Road 16:00–21:00",
        "Prefer Bailey Road; avoid underpasses",
        "Do not drive through moving water above 15 cm",
      ],
      officialWarningRef: "alr-002",
      citations: [
        { label: "MausamMitra hydro-nowcast", detail: "Kurji drainage surcharge model, 12:32 IST" },
        { label: "MausamMitra lightning nowcast", detail: "Strike cluster ETA 45 min" },
      ],
    }),
  },
  {
    match: /irrigat|sinchai|सिंचाई|field|khet|खेत|spray|fertil/i,
    build: () => ({
      text: "Do not irrigate for the next 48 hours. Soil moisture is at 94% of field capacity and 115–160 mm of rain is expected. Instead, open your field bunds by 10–15 cm so paddy at tillering stage does not stay submerged, and postpone spraying until 24 h rainfall drops below 5 mm.",
      facts: [
        { label: "Soil moisture", value: "94% field capacity" },
        { label: "Expected rain 24 h", value: "115–160 mm" },
        { label: "Safe standing water", value: "5–10 cm" },
        { label: "Spray wash-off risk", value: "Very high" },
      ],
      riskLevel: "high",
      hazard: "flood",
      actions: [
        "Skip irrigation for 48 hours",
        "Drain bunds partially before 16:00",
        "Move harvested produce to raised, covered storage",
      ],
      officialWarningRef: "alr-001",
      citations: [
        { label: "IMD Agromet Advisory, Patna", detail: "Bulletin 02 Sep, Bihar plains" },
        { label: "MausamMitra soil-moisture model", detail: "94% FC at 0–30 cm" },
      ],
    }),
  },
  {
    match: /warning|alert|chetavni|चेतावनी|what should i do|karna chahiye/i,
    build: (mode) => ({
      text:
        mode === "authority"
          ? "The IMD orange alert covers four districts for 24 hours. Priority actions: pre-position dewatering pumps at Rajapur Pul before 16:00, push Hindi IVR to wards 12–18 covering 184,000 residents, and confirm 72-hour stock at the Digha Ghat shelter cluster."
          : "The orange alert means be prepared, not evacuate. Practically: stay off low-lying roads after 16:00, store 12 hours of drinking water, keep documents and electronics above 0.5 m, and stay indoors during the 18:00–21:00 lightning window.",
      facts: [
        { label: "Alert class", value: "Orange — be prepared" },
        { label: "Valid until", value: "03 Sep, 12:00 IST" },
        { label: "Districts", value: "Patna, Vaishali, Saran, Muzaffarpur" },
        { label: "Hazard", value: "Flood + lightning" },
      ],
      riskLevel: "high",
      hazard: "flood",
      actions:
        mode === "authority"
          ? [
              "Deploy 2 pumps to Rajapur Pul before 16:00",
              "Trigger targeted IVR for wards 12–18",
              "Verify Digha Ghat shelter readiness",
            ]
          : [
              "Store 12 hours of drinking water",
              "Avoid low-lying roads after 16:00",
              "Stay indoors 18:00–21:00",
            ],
      officialWarningRef: "alr-001",
      citations: [
        { label: "IMD Regional Met Centre, Patna", detail: "Orange alert, valid 24 h" },
        { label: "NDMA flood do's and don'ts", detail: "Household preparedness checklist" },
      ],
    }),
  },
  {
    match: /zone|evacuat|population|affected|trend/i,
    build: () => ({
      text: "Two zones are critical: the Kurji–Digha corridor (184,000 residents, severe flood) and the Puri coastal squall zone (428,000 residents, severe storm). Flood risk in Patna has climbed from 38 to 78 since 06:00 and keeps rising through 18:00. Total affected-area estimate is 8,420 km² across 3.71 million people.",
      facts: [
        { label: "Critical zones", value: "2" },
        { label: "High-risk zones", value: "5" },
        { label: "Affected population", value: "3.71 million" },
        { label: "Flood index 18:00", value: "81 (rising)" },
      ],
      riskLevel: "severe",
      hazard: "flood",
      actions: [
        "Sequence evacuation: Kurji wards 14–16 first",
        "Hold ODRAF at Konark on 30-minute readiness",
        "Escalate Vaishali embankment seepage to engineering wing",
      ],
      officialWarningRef: "alr-001",
      citations: [
        { label: "MausamMitra zone model", detail: "Zonal aggregation, 13:02 IST" },
        { label: "DDMA Patna", detail: "Shelter and team deployment register" },
      ],
    }),
  },
];

export const fallbackAnswer: Omit<ChatMessage, "id" | "role" | "createdAt"> = {
  text: "Right now Kurji, Patna is under an IMD orange rainfall alert with high flood risk and moderate storm risk. I can tell you about rainfall, travel safety, irrigation timing, or what the current warning means for you.",
  facts: [
    { label: "Temperature", value: "29.4 °C" },
    { label: "Rain 24 h", value: "96.2 mm" },
    { label: "Flood risk", value: "High (78)" },
    { label: "Storm risk", value: "Moderate (54)" },
  ],
  riskLevel: "high",
  hazard: "flood",
  actions: ["Ask me about travel, rainfall, irrigation or the active warning"],
  officialWarningRef: "alr-001",
  citations: [{ label: "IMD + CWC fusion", detail: "Latest observation 12:58 IST" }],
};

export const voiceSampleUtterances: Record<Language, string[]> = {
  en: [
    "Will it rain in Kurji this evening?",
    "Can I travel at 6 PM today?",
    "Should I irrigate my field tomorrow?",
  ],
  hi: [
    "आज शाम कुर्जी में बारिश होगी क्या?",
    "क्या मैं शाम छह बजे निकल सकता हूँ?",
    "कल खेत में सिंचाई करनी चाहिए?",
  ],
};
