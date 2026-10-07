"""Mock data service for demo mode. Can be replaced with database/external API calls.

All timestamps are timezone-aware UTC (``datetime.now(UTC)``). Naive ISO-8601 strings
carry no offset, so browsers parse them as local time and every "updated N min ago"
label comes out wrong for clients outside UTC.
"""
from datetime import UTC, datetime, timedelta
from typing import Any

from server.schemas.weather import (
    Coordinates,
    CurrentWeather,
    ForecastSlot,
    LocationRef,
    Provenance,
    WeatherForecast,
)
from server.schemas.alert import HazardAlert
from server.schemas.risk import HazardRisk, RiskFactor, RiskSnapshot, RiskZone
from server.schemas.advisory import Advisory, AdvisoryItem
from server.schemas.chat import ChatMessage, ChatRequest
from server.schemas.authority import AuthorityMetrics
from server.schemas.system import ServiceStatus, SystemStatus


# Mock Locations
#
# One entry per Indian state and union territory (the state capital), plus the
# two non-capital Bihar districts the prototype shipped with. IDs are slugs of
# the *state* name -- ``loc-bihar`` is Patna, the state's capital -- so they read
# clearly in URLs, logs and saved preferences. Any further city in the same
# state qualifies the slug with the city name (``loc-bihar-gaya``).
#
# Rows are ordered by state name and then by city name, so a state's entries
# stay together in the selector.
LOCATIONS = [
    LocationRef(
        id="loc-andaman-and-nicobar-islands",
        name="Port Blair",
        district="Port Blair",
        state="Andaman and Nicobar Islands",
        coords=Coordinates(lat=11.6234, lon=92.7265),
    ),
    LocationRef(
        id="loc-andhra-pradesh",
        name="Amaravati",
        district="Amaravati",
        state="Andhra Pradesh",
        coords=Coordinates(lat=16.5062, lon=80.6480),
    ),
    LocationRef(
        id="loc-arunachal-pradesh",
        name="Itanagar",
        district="Itanagar",
        state="Arunachal Pradesh",
        coords=Coordinates(lat=27.0844, lon=93.6053),
    ),
    LocationRef(
        id="loc-assam",
        name="Dispur",
        district="Dispur",
        state="Assam",
        coords=Coordinates(lat=26.1445, lon=91.7362),
    ),
    LocationRef(
        id="loc-bihar-gaya",
        name="Gaya",
        district="Gaya",
        state="Bihar",
        coords=Coordinates(lat=24.7914, lon=85.0002),
    ),
    LocationRef(
        id="loc-bihar-muzaffarpur",
        name="Muzaffarpur",
        district="Muzaffarpur",
        state="Bihar",
        coords=Coordinates(lat=26.1196, lon=85.3905),
    ),
    LocationRef(
        id="loc-bihar",
        name="Patna",
        district="Patna",
        state="Bihar",
        coords=Coordinates(lat=25.5941, lon=85.1376),
    ),
    LocationRef(
        id="loc-chandigarh",
        name="Chandigarh",
        district="Chandigarh",
        state="Chandigarh",
        coords=Coordinates(lat=30.7333, lon=76.7794),
    ),
    LocationRef(
        id="loc-chhattisgarh",
        name="Raipur",
        district="Raipur",
        state="Chhattisgarh",
        coords=Coordinates(lat=21.2514, lon=81.6296),
    ),
    LocationRef(
        id="loc-dadra-and-nagar-haveli-and-daman-and-diu",
        name="Daman",
        district="Daman",
        state="Dadra and Nagar Haveli and Daman and Diu",
        coords=Coordinates(lat=20.3970, lon=72.8328),
    ),
    LocationRef(
        id="loc-delhi",
        name="New Delhi",
        district="New Delhi",
        state="Delhi",
        coords=Coordinates(lat=28.6139, lon=77.2090),
    ),
    LocationRef(
        id="loc-goa",
        name="Panaji",
        district="Panaji",
        state="Goa",
        coords=Coordinates(lat=15.4909, lon=73.8278),
    ),
    LocationRef(
        id="loc-gujarat",
        name="Gandhinagar",
        district="Gandhinagar",
        state="Gujarat",
        coords=Coordinates(lat=23.2156, lon=72.6369),
    ),
    LocationRef(
        id="loc-haryana",
        name="Chandigarh",
        district="Chandigarh",
        state="Haryana",
        coords=Coordinates(lat=30.7333, lon=76.7794),
    ),
    LocationRef(
        id="loc-himachal-pradesh",
        name="Shimla",
        district="Shimla",
        state="Himachal Pradesh",
        coords=Coordinates(lat=31.1048, lon=77.1734),
    ),
    LocationRef(
        id="loc-jammu-and-kashmir",
        name="Srinagar",
        district="Srinagar",
        state="Jammu and Kashmir",
        coords=Coordinates(lat=34.0837, lon=74.7973),
    ),
    LocationRef(
        id="loc-jharkhand",
        name="Ranchi",
        district="Ranchi",
        state="Jharkhand",
        coords=Coordinates(lat=23.3441, lon=85.3096),
    ),
    LocationRef(
        id="loc-karnataka",
        name="Bengaluru",
        district="Bengaluru",
        state="Karnataka",
        coords=Coordinates(lat=12.9716, lon=77.5946),
    ),
    LocationRef(
        id="loc-kerala",
        name="Thiruvananthapuram",
        district="Thiruvananthapuram",
        state="Kerala",
        coords=Coordinates(lat=8.5241, lon=76.9366),
    ),
    LocationRef(
        id="loc-ladakh",
        name="Leh",
        district="Leh",
        state="Ladakh",
        coords=Coordinates(lat=34.1526, lon=77.5771),
    ),
    LocationRef(
        id="loc-lakshadweep",
        name="Kavaratti",
        district="Kavaratti",
        state="Lakshadweep",
        coords=Coordinates(lat=10.5669, lon=72.6420),
    ),
    LocationRef(
        id="loc-madhya-pradesh",
        name="Bhopal",
        district="Bhopal",
        state="Madhya Pradesh",
        coords=Coordinates(lat=23.2599, lon=77.4126),
    ),
    LocationRef(
        id="loc-maharashtra",
        name="Mumbai",
        district="Mumbai",
        state="Maharashtra",
        coords=Coordinates(lat=19.0760, lon=72.8777),
    ),
    LocationRef(
        id="loc-manipur",
        name="Imphal",
        district="Imphal",
        state="Manipur",
        coords=Coordinates(lat=24.8170, lon=93.9368),
    ),
    LocationRef(
        id="loc-meghalaya",
        name="Shillong",
        district="Shillong",
        state="Meghalaya",
        coords=Coordinates(lat=25.5788, lon=91.8933),
    ),
    LocationRef(
        id="loc-mizoram",
        name="Aizawl",
        district="Aizawl",
        state="Mizoram",
        coords=Coordinates(lat=23.7271, lon=92.7176),
    ),
    LocationRef(
        id="loc-nagaland",
        name="Kohima",
        district="Kohima",
        state="Nagaland",
        coords=Coordinates(lat=25.6751, lon=94.1086),
    ),
    LocationRef(
        id="loc-odisha",
        name="Bhubaneswar",
        district="Bhubaneswar",
        state="Odisha",
        coords=Coordinates(lat=20.2961, lon=85.8245),
    ),
    LocationRef(
        id="loc-puducherry",
        name="Puducherry",
        district="Puducherry",
        state="Puducherry",
        coords=Coordinates(lat=11.9416, lon=79.8083),
    ),
    LocationRef(
        id="loc-punjab",
        name="Chandigarh",
        district="Chandigarh",
        state="Punjab",
        coords=Coordinates(lat=30.7333, lon=76.7794),
    ),
    LocationRef(
        id="loc-rajasthan",
        name="Jaipur",
        district="Jaipur",
        state="Rajasthan",
        coords=Coordinates(lat=26.9124, lon=75.7873),
    ),
    LocationRef(
        id="loc-sikkim",
        name="Gangtok",
        district="Gangtok",
        state="Sikkim",
        coords=Coordinates(lat=27.3314, lon=88.6138),
    ),
    LocationRef(
        id="loc-tamil-nadu",
        name="Chennai",
        district="Chennai",
        state="Tamil Nadu",
        coords=Coordinates(lat=13.0827, lon=80.2707),
    ),
    LocationRef(
        id="loc-telangana",
        name="Hyderabad",
        district="Hyderabad",
        state="Telangana",
        coords=Coordinates(lat=17.3850, lon=78.4867),
    ),
    LocationRef(
        id="loc-tripura",
        name="Agartala",
        district="Agartala",
        state="Tripura",
        coords=Coordinates(lat=23.8315, lon=91.2868),
    ),
    LocationRef(
        id="loc-uttar-pradesh",
        name="Lucknow",
        district="Lucknow",
        state="Uttar Pradesh",
        coords=Coordinates(lat=26.8467, lon=80.9462),
    ),
    LocationRef(
        id="loc-uttarakhand",
        name="Dehradun",
        district="Dehradun",
        state="Uttarakhand",
        coords=Coordinates(lat=30.3165, lon=78.0322),
    ),
    LocationRef(
        id="loc-west-bengal",
        name="Kolkata",
        district="Kolkata",
        state="West Bengal",
        coords=Coordinates(lat=22.5726, lon=88.3639),
    ),
]

DEFAULT_LOCATION_ID = "loc-bihar"

_BY_ID = {loc.id: loc for loc in LOCATIONS}

#: Ids retired when the catalogue renumbered to state slugs, mapped onto their
#: replacements. Saved preferences and bookmarked URLs from before the change
#: must keep resolving to the same city rather than quietly landing elsewhere.
RETIRED_LOCATION_IDS = {
    "loc-001": "loc-bihar",
    "loc-002": "loc-bihar-muzaffarpur",
    "loc-003": "loc-bihar-gaya",
}


def resolve_location_id(location_id: str | None) -> str | None:
    """Map a retired id onto its replacement; pass anything else through."""
    if not location_id:
        return location_id
    return RETIRED_LOCATION_IDS.get(location_id, location_id)


def get_location(location_id: str | None) -> LocationRef:
    """Resolve a location id, falling back to the default for unknown ids.

    Falling back to ``LOCATIONS[0]`` would silently send an unknown id to
    whichever entry happens to sort first (Port Blair) -- a confusing place to
    land. The default is stable and documented instead.
    """
    resolved = resolve_location_id(location_id)
    if resolved in _BY_ID:
        return _BY_ID[resolved]
    return _BY_ID[DEFAULT_LOCATION_ID]


def alert_area_filter(location_id: str | None) -> tuple[str, str] | None:
    """District and city name the alert feed should be filtered on.

    ``None`` means "show everything": either no location was asked for, or the
    id names no location we could identify. Suppressing warnings because we
    failed to recognise where the request came from would be the wrong way round.

    The database path calls this too, so both sources filter row for row the
    same way -- the ``locations`` table is seeded from this catalogue, so
    querying it for the same two strings would only give them a chance to drift.
    """
    resolved = resolve_location_id(location_id)
    loc = _BY_ID.get(resolved) if resolved else None
    return (loc.district, loc.name) if loc else None


def get_current_weather(location_id: str = DEFAULT_LOCATION_ID) -> CurrentWeather:
    loc = get_location(location_id)
    now = datetime.now(UTC)
    
    return CurrentWeather(
        location=loc,
        observedAt=now.isoformat(),
        condition="Partly Cloudy",
        temperatureC=32.5,
        feelsLikeC=36.2,
        rainfallMm=0.0,
        rainfall24hMm=2.5,
        windKph=12.4,
        windDirection="NE",
        humidityPct=68,
        pressureHpa=1008,
        visibilityKm=8.5,
        provenance=Provenance(
            source="IMD Regional Centre",
            issuedAt=now.isoformat(),
            validUntil=(now + timedelta(hours=1)).isoformat(),
            confidence=0.92,
            model="WRF-4km",
        ),
    )


def get_forecast(location_id: str = DEFAULT_LOCATION_ID) -> WeatherForecast:
    now = datetime.now(UTC)
    slots = []
    
    for i in range(24):
        slot_time = now + timedelta(hours=i)
        slots.append(
            ForecastSlot(
                time=slot_time.isoformat(),
                label=f"{i}h",
                temperatureC=32.5 + (i % 5) - 2,
                rainfallMm=0.0 if i < 6 else 5.2 if i < 12 else 0.5,
                rainChancePct=10 if i < 6 else 75 if i < 12 else 20,
                windKph=12.4 + (i % 3),
                condition="Partly Cloudy" if i < 6 else "Rain" if i < 12 else "Clear",
                dominantRisk="flood" if 6 <= i < 12 else None,
                riskLevel="moderate" if 6 <= i < 12 else "low",
            )
        )
    
    return WeatherForecast(
        locationId=location_id,
        issuedAt=now.isoformat(),
        slots=slots,
        provenance=Provenance(
            source="IMD Forecast Model",
            issuedAt=now.isoformat(),
            validUntil=(now + timedelta(hours=24)).isoformat(),
            confidence=0.85,
            model="NCUM-G",
        ),
    )


def get_alerts(location_id: str | None = None) -> list[HazardAlert]:
    now = datetime.now(UTC)
    
    alerts = [
        HazardAlert(
            id="alert-001",
            kind="official",
            hazard="flood",
            severity="warning",
            headline="Heavy Rainfall Warning",
            body="Heavy to very heavy rainfall likely at isolated places over Patna and Muzaffarpur districts. Low-lying areas may experience waterlogging.",
            areas=["Patna", "Muzaffarpur"],
            issuedAt=(now - timedelta(hours=2)).isoformat(),
            validUntil=(now + timedelta(hours=12)).isoformat(),
            source="IMD",
            confidence=0.88,
        ),
        HazardAlert(
            id="alert-002",
            kind="mausammitra",
            hazard="heat",
            severity="advisory",
            headline="Heat Advisory",
            body="Maximum temperatures likely to be above normal by 2-3°C. Stay hydrated and avoid direct sunlight during peak hours.",
            areas=["Gaya", "Patna"],
            issuedAt=(now - timedelta(hours=6)).isoformat(),
            validUntil=(now + timedelta(hours=24)).isoformat(),
            source="MausamMitra AI",
            confidence=0.76,
        ),
        HazardAlert(
            id="alert-003",
            kind="official",
            hazard="storm",
            severity="warning",
            headline="Cyclonic Storm Alert — Eastern Coast",
            body="A deep depression over the Bay of Bengal is likely to intensify and cross the eastern coast within 48 hours. Fishermen are advised to stay in port; coastal low-lying areas should be ready for evacuation.",
            areas=["Kolkata", "Bhubaneswar", "Amaravati", "Chennai", "Port Blair", "Puducherry"],
            issuedAt=(now - timedelta(hours=5)).isoformat(),
            validUntil=(now + timedelta(hours=36)).isoformat(),
            source="IMD",
            confidence=0.84,
        ),
        HazardAlert(
            id="alert-004",
            kind="official",
            hazard="heat",
            severity="warning",
            headline="Severe Heat Wave — North and Central India",
            body="Day temperatures are likely to be 4-6°C above normal over many parts of north and central India. Avoid outdoor exposure between 12:00 and 16:00, and keep oral rehydration salts available.",
            areas=["New Delhi", "Jaipur", "Lucknow", "Chandigarh", "Bhopal", "Hyderabad", "Gandhinagar", "Raipur"],
            issuedAt=(now - timedelta(hours=8)).isoformat(),
            validUntil=(now + timedelta(hours=48)).isoformat(),
            source="IMD",
            confidence=0.9,
        ),
        HazardAlert(
            id="alert-005",
            kind="mausammitra",
            hazard="storm",
            severity="watch",
            headline="Severe Thunderstorm Watch — Himalayan States",
            body="A western disturbance is expected to bring thunderstorms, hail and gusty winds to the hill states. Loose slate and debris on slopes may move; avoid stopping under overhangs.",
            areas=["Shimla", "Srinagar", "Leh", "Dehradun", "Gangtok", "Itanagar"],
            issuedAt=(now - timedelta(hours=3)).isoformat(),
            validUntil=(now + timedelta(hours=18)).isoformat(),
            source="MausamMitra AI",
            confidence=0.79,
        ),
        HazardAlert(
            id="alert-006",
            kind="official",
            hazard="storm",
            severity="watch",
            headline="Squally Winds — West and Peninsular India",
            body="Squally winds gusting to 55 km/h with thunderstorms are likely at isolated places. Secure loose roofing, temporarily suspend construction work and avoid sheltering under trees.",
            areas=["Mumbai", "Bengaluru", "Thiruvananthapuram", "Panaji", "Daman", "Kavaratti"],
            issuedAt=(now - timedelta(hours=4)).isoformat(),
            validUntil=(now + timedelta(hours=24)).isoformat(),
            source="IMD",
            confidence=0.81,
        ),
        HazardAlert(
            id="alert-007",
            kind="mausammitra",
            hazard="flood",
            severity="advisory",
            headline="Active Monsoon Spell — Northeast India",
            body="Heavy rainfall is likely at many places over the northeast and adjoining plateau. River levels may rise quickly; do not attempt to cross swollen streams or waterlogged roads.",
            areas=["Dispur", "Ranchi", "Imphal", "Shillong", "Aizawl", "Kohima", "Agartala"],
            issuedAt=(now - timedelta(hours=7)).isoformat(),
            validUntil=(now + timedelta(hours=30)).isoformat(),
            source="MausamMitra AI",
            confidence=0.77,
        ),
    ]

    if location_id:
        areas_filter = alert_area_filter(location_id)
        if areas_filter is not None:
            district, name = areas_filter
            alerts = [
                a for a in alerts if district in a.areas or name in a.areas
            ]

    return alerts


def get_risk_snapshot(location_id: str = DEFAULT_LOCATION_ID) -> RiskSnapshot:
    now = datetime.now(UTC)
    
    return RiskSnapshot(
        locationId=location_id,
        overall="moderate",
        overallSummary="Moderate risk due to expected heavy rainfall in the next 6-12 hours. Flood risk elevated in low-lying areas.",
        hazards=[
            HazardRisk(
                hazard="flood",
                level="moderate",
                score=65,
                trend="rising",
                summary="Flood risk increasing due to forecast heavy rainfall",
                factors=[
                    RiskFactor(label="Rainfall Forecast", value="High (75% chance)", weight=0.4),
                    RiskFactor(label="Soil Saturation", value="Moderate", weight=0.3),
                    RiskFactor(label="Drainage Capacity", value="Limited", weight=0.3),
                ],
                recommendedActions=[
                    "Monitor water levels in nearby rivers",
                    "Prepare for potential evacuation",
                    "Avoid low-lying areas",
                ],
                provenance={
                    "source": "MausamMitra Risk Engine",
                    "issuedAt": now.isoformat(),
                    "validUntil": (now + timedelta(hours=6)).isoformat(),
                    "confidence": 0.72,
                },
            ),
            HazardRisk(
                hazard="heat",
                level="low",
                score=25,
                trend="steady",
                summary="Heat risk low due to cloud cover and expected rainfall",
                factors=[
                    RiskFactor(label="Temperature", value="32.5°C", weight=0.5),
                    RiskFactor(label="Humidity", value="68%", weight=0.3),
                    RiskFactor(label="Wind", value="12 km/h NE", weight=0.2),
                ],
                recommendedActions=["Stay hydrated", "Wear light clothing"],
                provenance={
                    "source": "MausamMitra Risk Engine",
                    "issuedAt": now.isoformat(),
                    "validUntil": (now + timedelta(hours=6)).isoformat(),
                    "confidence": 0.85,
                },
            ),
        ],
        updatedAt=now.isoformat(),
    )


def get_risk_zones() -> list[RiskZone]:
    now = datetime.now(UTC)
    
    return [
        RiskZone(
            id="zone-001",
            name="Patna City Center",
            district="Patna",
            state="Bihar",
            layer="flood",
            level="moderate",
            polygon=[(10, 10), (30, 10), (30, 30), (10, 30)],
            centroid=(20, 20),
            population=150000,
            areaKm2=25.5,
            why="Low-lying area with limited drainage capacity",
            factors=[
                RiskFactor(label="Elevation", value="Low (<5m)", weight=0.4),
                RiskFactor(label="Drainage", value="Poor", weight=0.4),
                RiskFactor(label="Population Density", value="High", weight=0.2),
            ],
            recommendedAction="Monitor and prepare contingency plans",
            provenance={
                "source": "MausamMitra GIS Engine",
                "issuedAt": now.isoformat(),
                "validUntil": (now + timedelta(hours=12)).isoformat(),
                "confidence": 0.78,
            },
        ),
        RiskZone(
            id="zone-002",
            name="Muzaffarpur Rural",
            district="Muzaffarpur",
            state="Bihar",
            layer="rainfall",
            level="high",
            polygon=[(40, 40), (60, 40), (60, 60), (40, 60)],
            centroid=(50, 50),
            population=80000,
            areaKm2=45.2,
            why="Expected heavy rainfall in forecast path",
            factors=[
                RiskFactor(label="Rainfall Forecast", value="Very High", weight=0.6),
                RiskFactor(label="Soil Type", value="Clay (low permeability)", weight=0.4),
            ],
            recommendedAction="Issue flood warning to residents",
            provenance={
                "source": "MausamMitra GIS Engine",
                "issuedAt": now.isoformat(),
                "validUntil": (now + timedelta(hours=12)).isoformat(),
                "confidence": 0.82,
            },
        ),
    ]


def get_advisory(mode: str, location_id: str = DEFAULT_LOCATION_ID) -> Advisory:
    now = datetime.now(UTC)

    # Unknown modes fall back to the citizen set, and report the mode actually used
    # rather than echoing an unsupported value back to the client.
    if mode not in {"farmer", "authority"}:
        mode = "citizen"

    if mode == "farmer":
        items = [
            AdvisoryItem(
                id="adv-001",
                priority="critical",
                title="Protect Standing Crops",
                detail="Ensure proper drainage in fields. Consider harvesting mature crops if heavy rain is imminent.",
                window="Next 12 hours",
                hazard="flood",
            ),
            AdvisoryItem(
                id="adv-002",
                priority="high",
                title="Delay Irrigation",
                detail="With expected rainfall, postpone scheduled irrigation to avoid waterlogging.",
                window="Next 24 hours",
                hazard="flood",
            ),
        ]
    elif mode == "authority":
        items = [
            AdvisoryItem(
                id="adv-003",
                priority="critical",
                title="Deploy Response Teams",
                detail="Position NDRF teams in Patna and Muzaffarpur districts for quick response.",
                window="Immediately",
                hazard="flood",
            ),
            AdvisoryItem(
                id="adv-004",
                priority="high",
                title="Monitor River Levels",
                detail="Increase monitoring frequency for Ganga and Gandak river levels.",
                window="Next 24 hours",
                hazard="flood",
            ),
        ]
    else:  # citizen
        items = [
            AdvisoryItem(
                id="adv-005",
                priority="high",
                title="Avoid Waterlogged Areas",
                detail="Stay away from low-lying areas and flooded roads. Do not attempt to walk or drive through floodwaters.",
                window="Next 12 hours",
                hazard="flood",
            ),
            AdvisoryItem(
                id="adv-006",
                priority="routine",
                title="Keep Emergency Kit Ready",
                detail="Ensure you have essential supplies including water, food, medications, and important documents.",
                window="Ongoing",
                hazard=None,
            ),
        ]
    
    return Advisory(
        mode=mode,
        locationId=location_id,
        headline=f"{'Advisory for Farmers' if mode == 'farmer' else 'Authority Alert' if mode == 'authority' else 'Public Advisory'}",
        items=items,
        provenance={
            "source": "MausamMitra Advisory Engine",
            "issuedAt": now.isoformat(),
            "validUntil": (now + timedelta(hours=12)).isoformat(),
            "confidence": 0.84,
        },
    )


def location_label(location_id: str) -> str:
    """Human-readable place for a location id, falling back to the raw id.

    Chat facts used to surface ``loc-001`` verbatim, which means nothing to a
    citizen reading the reply. A retired id is mapped onto its replacement
    first; an id that names no location keeps its raw value rather than being
    labelled with somewhere the user never asked about.
    """
    resolved = resolve_location_id(location_id)
    loc = _BY_ID.get(resolved) if resolved else None
    if loc is None:
        return location_id
    return f"{loc.name}, {loc.state}"


def process_chat(req: ChatRequest) -> ChatMessage:
    now = datetime.now(UTC)
    message_lower = req.message.lower()
    place = location_label(req.locationId)
    
    # Simple keyword-based response logic
    if "rain" in message_lower or "flood" in message_lower:
        text = f"Based on current forecasts, there is a 75% chance of heavy rainfall in the next 6-12 hours in your area. Flood risk is currently at MODERATE level. I recommend avoiding low-lying areas and staying updated on official alerts."
        risk_level = "moderate"
        hazard = "flood"
        actions = ["Monitor weather updates", "Avoid waterlogged areas", "Prepare emergency kit"]
    elif "heat" in message_lower or "temperature" in message_lower:
        text = f"Current temperature is 32.5°C with feels-like temperature of 36.2°C. Heat risk is LOW at this time due to expected cloud cover and rainfall. Stay hydrated and avoid direct sunlight during peak hours."
        risk_level = "low"
        hazard = "heat"
        actions = ["Stay hydrated", "Wear light clothing", "Avoid peak sun hours"]
    elif "alert" in message_lower or "warning" in message_lower:
        # Count the alerts that actually apply to this location. The feed is
        # filtered per location, so a hardcoded national total would claim two
        # Bihar alerts to someone standing in Mumbai.
        active = get_alerts(req.locationId)
        if active:
            headlines = " and ".join(a.headline for a in active[:2])
            text = (
                f"There are currently {len(active)} active alert(s) for {place}: "
                f"{headlines}. Please follow official guidance and stay prepared."
            )
        else:
            text = (
                f"There are no active alerts for {place} right now. I will keep "
                "watching conditions and tell you if that changes."
            )
        risk_level = "moderate"
        hazard = None
        actions = ["Monitor official alerts", "Follow evacuation orders if issued"]
    else:
        text = f"I can help you with weather information, risk assessments, and advisories for your area. Current conditions show partly cloudy skies with moderate flood risk expected in the coming hours. What specific information do you need?"
        risk_level = "moderate"
        hazard = None
        actions = ["Ask about rainfall", "Ask about heat risk", "Request advisory"]
    
    return ChatMessage(
        id=f"msg-{now.timestamp()}",
        role="assistant",
        text=text,
        createdAt=now.isoformat(),
        facts=[
            {"label": "Location", "value": place},
            {"label": "Current Risk", "value": risk_level.upper()},
        ],
        riskLevel=risk_level,
        hazard=hazard,
        actions=actions,
        provenance={
            "source": "MausamMitra Advisory Engine",
            "issuedAt": now.isoformat(),
            "validUntil": (now + timedelta(hours=3)).isoformat(),
            "confidence": 0.82,
            "model": "advisory-llm v0.5",
        },
    )


def get_authority_metrics() -> AuthorityMetrics:
    now = datetime.now(UTC)
    
    return AuthorityMetrics(
        activeWarnings=2,
        highRiskZones=1,
        criticalZones=0,
        affectedPopulation=230000,
        affectedAreaKm2=70.7,
        responseTeamsDeployed=3,
        hazardTrend=[
            {"time": (now - timedelta(hours=24)).isoformat(), "flood": 30, "heat": 45, "storm": 10},
            {"time": (now - timedelta(hours=18)).isoformat(), "flood": 40, "heat": 42, "storm": 12},
            {"time": (now - timedelta(hours=12)).isoformat(), "flood": 55, "heat": 38, "storm": 15},
            {"time": (now - timedelta(hours=6)).isoformat(), "flood": 65, "heat": 35, "storm": 18},
            {"time": now.isoformat(), "flood": 72, "heat": 32, "storm": 20},
        ],
        priorityLocations=[
            {
                "id": "loc-bihar",
                "name": "Patna",
                "district": "Patna",
                "level": "moderate",
                "hazard": "flood",
                "population": 150000,
                "action": "Monitor and prepare contingency plans",
            },
            {
                "id": "loc-bihar-muzaffarpur",
                "name": "Muzaffarpur",
                "district": "Muzaffarpur",
                "level": "high",
                "hazard": "flood",
                "population": 80000,
                "action": "Issue flood warning to residents",
            },
        ],
    )


def get_system_status() -> SystemStatus:
    now = datetime.now(UTC)
    
    return SystemStatus(
        overall="online",
        lastSync=now.isoformat(),
        latencyMs=180,
        offlineCacheReady=True,
        services=[
            ServiceStatus(name="Weather API", health="online", detail="IMD feed active"),
            ServiceStatus(name="Risk Engine", health="online", detail="Processing normally"),
            ServiceStatus(
                name="Alert Service",
                health="online",
                detail=f"{len(get_alerts())} active alerts",
            ),
            ServiceStatus(name="Database", health="online", detail="Connected"),
        ],
    )
