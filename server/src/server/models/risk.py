from sqlalchemy import Column, Float, Integer, String, Text
from server.db import Base


class RiskSnapshot(Base):
    __tablename__ = "risk_snapshots"

    id = Column(String, primary_key=True, index=True)
    location_id = Column(String, nullable=False)
    overall = Column(String, nullable=False)
    overall_summary = Column(Text, nullable=False)
    updated_at = Column(String, nullable=False)
    hazards_json = Column(Text, nullable=False)  # JSON array of HazardRisk


class RiskZone(Base):
    __tablename__ = "risk_zones"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    district = Column(String, nullable=False)
    state = Column(String, nullable=False)
    layer = Column(String, nullable=False)
    level = Column(String, nullable=False)
    polygon = Column(Text, nullable=False)  # JSON array of coordinates
    centroid = Column(Text, nullable=False)  # JSON array [lat, lon]
    population = Column(Integer, nullable=False)
    area_km2 = Column(Float, nullable=False)
    why = Column(Text, nullable=False)
    factors_json = Column(Text, nullable=False)  # JSON array of RiskFactor
    recommended_action = Column(Text, nullable=False)
    source = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
