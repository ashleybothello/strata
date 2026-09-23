import os
import json
import numpy as np
import pandas as pd

class MultiRateSubsidenceEKF:
    """
    Multi-Rate Extended Kalman Filter with dynamic uncertainty covariance propagation.
    - Tightens sharply on Sentinel-1 InSAR radar epochs (low observation variance)
    - Expands smoothly during 12-day dead-reckoning intervals (process noise accumulation)
    """
    def __init__(self, depth_H=180.0, beta_deg=58.5):
        self.H = depth_H
        self.beta = np.radians(beta_deg)
        self.R = self.H / np.tan(self.beta)  # ~110.3 m

        # State: [Displacement (mm), Velocity (mm/day)]^T
        self.x = np.array([[0.0], [-1.04]])

        # Covariance Matrix P
        self.P = np.array([
            [0.8, 0.0],
            [0.0, 0.15]
        ])

        # Daily Process Noise Q (strata kinematics + IMU acceleration drift)
        self.Q = np.array([
            [0.45, 0.02],
            [0.02, 0.05]
        ])

        # Measurement Variances
        self.R_insar = np.array([[2.2]])   # Radar phase noise floor (~1.48 mm)
        self.R_imu = np.array([[3.8]])     # High-frequency tilt variance

    def predict(self, dt_days=1.0):
        F = np.array([
            [1.0, dt_days],
            [0.0, 1.0]
        ])
        self.x = np.dot(F, self.x)
        # Covariance grows quadratically with time between satellite passes
        self.P = np.dot(np.dot(F, self.P), F.T) + self.Q
        return self.x

    def update_imu_tilt(self, tilt_deg: float):
        r = 0.65 * self.R
        scale = (2.0 * np.pi * r) / (self.R**2) * (180.0 / np.pi) / 1000.0
        H = np.array([[scale, 0.0]])

        z = np.array([[tilt_deg]])
        y = z - np.dot(H, self.x)
        S = np.dot(np.dot(H, self.P), H.T) + self.R_imu
        K = np.dot(np.dot(self.P, H.T), np.linalg.inv(S))

        self.x = self.x + np.dot(K, y)
        self.P = self.P - np.dot(np.dot(K, H), self.P)

    def update_insar(self, displacement_mm: float):
        """Absolute radar anchor update: resets drift and collapses P"""
        H = np.array([[1.0, 0.0]])
        z = np.array([[displacement_mm]])
        y = z - np.dot(H, self.x)
        S = np.dot(np.dot(H, self.P), H.T) + self.R_insar
        K = np.dot(np.dot(self.P, H.T), np.linalg.inv(S))

        self.x = self.x + np.dot(K, y)
        # Joseph-form stabilized covariance collapse
        I_KH = np.eye(2) - np.dot(K, H)
        self.P = np.dot(np.dot(I_KH, self.P), I_KH.T) + np.dot(np.dot(K, self.R_insar), K.T)

def run_fusion_generation():
    os.makedirs("data/processed", exist_ok=True)
    np.random.seed(42)

    # 10 Canonical 12-day Sentinel-1 InSAR measurements (in cm)
    insar_schedule = [
        {"day": 0,   "date": "2026-05-08", "y_cm": 0.0},
        {"day": 12,  "date": "2026-05-20", "y_cm": -1.4},
        {"day": 24,  "date": "2026-06-01", "y_cm": -2.6},
        {"day": 36,  "date": "2026-06-13", "y_cm": -4.1},
        {"day": 48,  "date": "2026-06-25", "y_cm": -5.5},
        {"day": 60,  "date": "2026-07-07", "y_cm": -6.8},
        {"day": 72,  "date": "2026-07-19", "y_cm": -8.0},
        {"day": 84,  "date": "2026-07-31", "y_cm": -9.3},
        {"day": 96,  "date": "2026-08-12", "y_cm": -10.2},
        {"day": 104, "date": "2026-08-20", "y_cm": -10.8}
    ]
    insar_lookup = {item["date"]: item["y_cm"] * 10.0 for item in insar_schedule}  # in mm

    start_date = pd.to_datetime("2026-05-08")
    total_days = 105
    dates = [start_date + pd.Timedelta(days=i) for i in range(total_days)]

    ekf = MultiRateSubsidenceEKF()
    records = []
    raw_imu_accum_mm = 0.0

    for day_idx, current_dt in enumerate(dates):
        date_str = current_dt.strftime("%Y-%m-%d")
        
        # 1. State Prediction (Covariance P widens)
        ekf.predict(dt_days=1.0)

        # 2. Raw uncorrected IMU integration (drifts steadily)
        true_sub_mm = -1.04 * day_idx
        measured_tilt = abs(true_sub_mm) * 0.022 + np.random.normal(0, 0.04)
        raw_imu_accum_mm += (-measured_tilt * 0.38) + np.random.normal(-0.06, 0.09)

        # High-frequency tilt update
        ekf.update_imu_tilt(measured_tilt)

        # 3. Sentinel-1 Observation Arrival (Covariance P collapses)
        insar_val_cm = None
        if date_str in insar_lookup:
            insar_mm = insar_lookup[date_str]
            insar_val_cm = insar_mm / 10.0
            ekf.update_insar(insar_mm)

        # Extract 2-sigma (95% CI) uncertainty bounds in cm
        sigma_mm = np.sqrt(ekf.P[0, 0])
        sigma_cm = sigma_mm / 10.0
        displacement_cm = ekf.x[0, 0] / 10.0

        records.append({
            "date": date_str,
            "raw_insar_cm": insar_val_cm,
            "raw_imu_drift_cm": round(float(raw_imu_accum_mm / 10.0), 2),
            "fused_ekf_cm": round(float(displacement_cm), 2),
            "fused_velocity_mm_day": round(float(abs(ekf.x[1, 0])), 3),
            "confidence_upper_cm": round(float(displacement_cm + 1.96 * sigma_cm), 2),
            "confidence_lower_cm": round(float(displacement_cm - 1.96 * sigma_cm), 2)
        })

    out_json = "data/processed/sensor_fusion_fused_trajectory.json"
    with open(out_json, "w") as f:
        json.dump(records, f, indent=2)

    print(f"[OK] EKF Fusion with dynamic breathing ribbon generated: {out_json}")

if __name__ == "__main__":
    run_fusion_generation()