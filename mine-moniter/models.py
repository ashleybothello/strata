from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime

from database import Base


class TelemetryDB(Base):

    __tablename__ = "telemetry"

    # Unique record ID
    id = Column(Integer, primary_key=True, index=True)

    # Node ID
    node = Column(String, nullable=False)

    # =============================
    # MPU6050 - Node 1
    # =============================

    ax = Column(Integer, nullable=True)
    ay = Column(Integer, nullable=True)
    az = Column(Integer, nullable=True)

    gx = Column(Integer, nullable=True)
    gy = Column(Integer, nullable=True)
    gz = Column(Integer, nullable=True)

    tilt_x = Column(Float, nullable=True)
    tilt_y = Column(Float, nullable=True)

    # =============================
    # VL53L0X - Node 2
    # =============================

    distance_mm = Column(Integer, nullable=True)

    # =============================
    # KY-020 - Node 2
    # =============================

    tilt_switch = Column(Integer, nullable=True)

    # =============================
    # SW-420 - Node 2
    # =============================

    vibration = Column(Integer, nullable=True)

    # =============================
    # MQ-9 - Node 2
    # =============================

    gas_raw = Column(Integer, nullable=True)

    # =============================
    # Copper tape crack sensor
    # Currently not connected
    # =============================

    crack = Column(Integer, nullable=True)

    # =============================
    # BF350 + HX711 - Node 1
    # =============================

    strain_raw = Column(Integer, nullable=True)

    # =============================
    # Timestamp
    # =============================

    timestamp = Column(
        DateTime,
        default=datetime.utcnow
    )