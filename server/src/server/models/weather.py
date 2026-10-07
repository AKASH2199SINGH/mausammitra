from datetime import datetime
from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from server.db import Base


class CurrentWeather(Base):
    __tablename__ = "current_weather"

    id = Column(String, primary_key=True, index=True)
    location_id = Column(String, ForeignKey("locations.id"), nullable=False)
    observed_at = Column(String, nullable=False)
    condition = Column(String, nullable=False)
    temperature_c = Column(Float, nullable=False)
    feels_like_c = Column(Float, nullable=False)
    rainfall_mm = Column(Float, nullable=False)
    rainfall_24h_mm = Column(Float, nullable=False)
    wind_kph = Column(Float, nullable=False)
    wind_direction = Column(String, nullable=False)
    humidity_pct = Column(Float, nullable=False)
    pressure_hpa = Column(Float, nullable=False)
    visibility_km = Column(Float, nullable=False)
    source = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)


class ForecastSlot(Base):
    __tablename__ = "forecast_slots"

    id = Column(String, primary_key=True, index=True)
    location_id = Column(String, ForeignKey("locations.id"), nullable=False)
    time = Column(String, nullable=False)
    label = Column(String, nullable=False)
    temperature_c = Column(Float, nullable=False)
    rainfall_mm = Column(Float, nullable=False)
    rain_chance_pct = Column(Float, nullable=False)
    wind_kph = Column(Float, nullable=False)
    condition = Column(String, nullable=False)
    dominant_risk = Column(String, nullable=True)
    risk_level = Column(String, nullable=False)
