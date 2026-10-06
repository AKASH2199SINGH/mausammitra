# MausamMitra backend

Python FastAPI service for SIH 26068. Full weather-to-action intelligence API.

## Status

- ✅ Implemented: All core endpoints
  - `GET /api/v1/health` - Health check
  - `GET /api/v1/locations` - List available locations
  - `GET /api/v1/weather/current` - Current weather
  - `GET /api/v1/weather/forecast` - Weather forecast
  - `GET /api/v1/alerts` - Hazard alerts
  - `GET /api/v1/risk` - Risk snapshot
  - `GET /api/v1/risk/zones` - Risk zones map
  - `GET /api/v1/advisory` - User-specific advisories
  - `POST /api/v1/chat` - AI-powered chat
  - `GET /api/v1/authority/overview` - Authority dashboard
  - `GET /api/v1/system/status` - System status
- 🔄 Database: Infrastructure ready (SQLAlchemy models), currently using mock data service
- 🔄 External APIs: Ready for OpenWeather/IMD integration

The React app in `../client` is now connected to this backend via real HTTP calls.

## Run

```bash
cd server
uv sync --group dev
uv run uvicorn server.main:app --reload --app-dir src
```

Server will start on http://127.0.0.1:8000

API Documentation: http://127.0.0.1:8000/docs

## Tests

```bash
cd server
uv run pytest
```

## Config

Copy `.env.example` to `.env`. 

**Database Setup:**
- For development: Uses SQLite by default (`DATABASE_URL=sqlite:///./mausammitra.db`)
- For production: Update to PostgreSQL (`DATABASE_URL=postgresql://user:pass@host:port/db`)

**External API Keys:**
- Add `OPENWEATHER_API_KEY` and `IMD_API_KEY` when ready for live weather data
- Currently runs in demo mode with mock data

## Database Models

Available models (ready for migration):
- `Location` - Geographic locations
- `CurrentWeather` - Real-time weather data
- `ForecastSlot` - Forecast data points
- `HazardAlert` - Weather alerts and warnings
- `RiskSnapshot` - Risk assessments
- `RiskZone` - Geographic risk zones

To create migrations (when ready to use database):
```bash
uv run alembic init migrations
uv run alembic revision --autogenerate -m "Initial migration"
uv run alembic upgrade head
```
