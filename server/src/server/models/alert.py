from datetime import datetime
from sqlalchemy import Column, Float, String, Text
from server.db import Base


class HazardAlert(Base):
    __tablename__ = "hazard_alerts"

    id = Column(String, primary_key=True, index=True)
    kind = Column(String, nullable=False)
    hazard = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    headline = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    areas = Column(String, nullable=False)  # JSON array of area names
    issued_at = Column(String, nullable=False)
    valid_until = Column(String, nullable=False)
    source = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    acknowledged = Column(String, nullable=True)
