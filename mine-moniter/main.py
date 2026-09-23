from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import TelemetryDB


# =====================================================
# Create database tables
# =====================================================

Base.metadata.create_all(bind=engine)


# =====================================================
# FastAPI
# =====================================================

app = FastAPI(
    title="Mine Subsidence Monitoring API",
    description="Real-time mine subsidence monitoring system",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# Telemetry input model
# =====================================================

class Telemetry(BaseModel):

    node: str

    # MPU6050
    ax: Optional[int] = None
    ay: Optional[int] = None
    az: Optional[int] = None

    gx: Optional[int] = None
    gy: Optional[int] = None
    gz: Optional[int] = None

    tilt_x: Optional[float] = None
    tilt_y: Optional[float] = None

    # VL53L0X
    distance_mm: Optional[int] = None
    dist: Optional[float] = None
    dist_baseline: Optional[float] = None

    # KY-020
    tilt_switch: Optional[int] = None

    # SW-420
    vibration: Optional[int] = None
    vibration_critical: Optional[int] = None

    # MQ-9
    gas_raw: Optional[int] = None
    gas: Optional[float] = None
    gas_baseline: Optional[float] = None

    # Copper tape
    crack: Optional[int] = None

    # Strain gauge + HX711
    strain_raw: Optional[int] = None

    # General / Status
    status: Optional[str] = None

    # Timestamp
    timestamp: Optional[datetime] = None


# =====================================================
# ROOT
# =====================================================

@app.get("/")
def root():

    return {
        "message": "Mine Subsidence Monitoring API is running"
    }


# =====================================================
# RECEIVE TELEMETRY
# =====================================================

@app.get("/telemetry")
def get_telemetry_browser_fallback(
    db: Session = Depends(get_db)
):
    """Browser GET fallback: returns latest telemetry record"""
    return get_latest_telemetry(db)

@app.post("/telemetry")
def receive_telemetry(
    data: Telemetry,
    db: Session = Depends(get_db)
):

    # Create database record

    record = TelemetryDB(

        node=data.node,

        ax=data.ax,
        ay=data.ay,
        az=data.az,

        gx=data.gx,
        gy=data.gy,
        gz=data.gz,

        tilt_x=data.tilt_x,
        tilt_y=data.tilt_y,

        distance_mm=data.distance_mm if data.distance_mm is not None else (int(data.dist) if data.dist is not None else None),

        tilt_switch=data.tilt_switch,

        vibration=data.vibration,

        gas_raw=data.gas_raw if data.gas_raw is not None else (int(data.gas) if data.gas is not None else None),

        crack=data.crack,

        strain_raw=data.strain_raw,

        timestamp=data.timestamp or datetime.utcnow()
    )


    # Save to PostgreSQL

    db.add(record)

    db.commit()

    db.refresh(record)


    # =================================================
    # Display in terminal
    # =================================================

    print()
    print("====================================")
    print("      TELEMETRY SAVED")
    print("====================================")

    print("Database ID:", record.id)

    print("Node:", record.node)

    if record.ax is not None:
        print("AX:", record.ax)

    if record.ay is not None:
        print("AY:", record.ay)

    if record.az is not None:
        print("AZ:", record.az)

    if record.tilt_x is not None:
        print("Tilt X:", record.tilt_x)

    if record.tilt_y is not None:
        print("Tilt Y:", record.tilt_y)

    if record.distance_mm is not None:
        print(
            "Distance:",
            record.distance_mm,
            "mm"
        )

    if record.tilt_switch is not None:
        print(
            "Tilt Switch:",
            record.tilt_switch
        )

    if record.vibration is not None:
        print(
            "Vibration:",
            record.vibration
        )

    if record.gas_raw is not None:
        print(
            "Gas Raw:",
            record.gas_raw
        )

    if record.strain_raw is not None:
        print(
            "Strain Raw:",
            record.strain_raw
        )

    print("====================================")


    return {

        "status": "saved",

        "database_id": record.id,

        "node": record.node
    }


# =====================================================
# GET LATEST TELEMETRY
# =====================================================

@app.get("/telemetry/latest")
def get_latest_telemetry(
    db: Session = Depends(get_db)
):

    record = (
        db.query(TelemetryDB)
        .order_by(TelemetryDB.id.desc())
        .first()
    )


    if record is None:

        return {
            "message": "No telemetry available"
        }


    return {

        "id": record.id,

        "node": record.node,

        "ax": record.ax,
        "ay": record.ay,
        "az": record.az,

        "gx": record.gx,
        "gy": record.gy,
        "gz": record.gz,

        "tilt_x": record.tilt_x,
        "tilt_y": record.tilt_y,

        "distance_mm": record.distance_mm,

        "tilt_switch": record.tilt_switch,

        "vibration": record.vibration,

        "gas_raw": record.gas_raw,

        "crack": record.crack,

        "strain_raw": record.strain_raw,

        "timestamp": record.timestamp
    }


# =====================================================
# GET TELEMETRY FOR JADEN / DASHBOARD
# =====================================================

@app.get("/telemetry/all")
@app.get("/api/hardware_telemetry")
def get_all_telemetry(
    db: Session = Depends(get_db)
):

    records = (
        db.query(TelemetryDB)
        .order_by(TelemetryDB.id.asc())
        .all()
    )

    return [
        {
            "id": record.id,
            "node": record.node,

            "ax": record.ax,
            "ay": record.ay,
            "az": record.az,

            "gx": record.gx,
            "gy": record.gy,
            "gz": record.gz,

            "tilt_x": record.tilt_x,
            "tilt_y": record.tilt_y,

            "distance_mm": record.distance_mm,

            "tilt_switch": record.tilt_switch,

            "vibration": record.vibration,

            "gas_raw": record.gas_raw,

            "crack": record.crack,

            "strain_raw": record.strain_raw,

            "timestamp": record.timestamp
        }
        for record in records
    ]