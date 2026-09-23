import numpy as np
from datetime import datetime

class LiveSubsidenceEKF:
    def __init__(self, depth_H=180.0, beta_deg=58.5):
        self.H = depth_H
        self.beta = np.radians(beta_deg)
        self.R = self.H / np.tan(self.beta)

        self.x = np.array([[0.0], [-1.08]])
        self.P = np.array([[4.0, 0.0], [0.0, 0.5]])
        self.Q = np.array([[0.010, 0.002], [0.002, 0.005]])
        self.R_insar = np.array([[5.5]])
        self.R_imu = np.array([[1.8]])
        self.last_update_time = datetime.now()

    def process_incoming_iot(self, pitch_deg: float, roll_deg: float):
        now = datetime.now()
        dt_days = (now - self.last_update_time).total_seconds() / 86400.0
        self.last_update_time = now

        if dt_days <= 0:
            dt_days = 1.0 / 86400.0

        F = np.array([[1.0, dt_days], [0.0, 1.0]])
        self.x = np.dot(F, self.x)
        self.P = np.dot(np.dot(F, self.P), F.T) + self.Q

        tilt_total = np.sqrt(pitch_deg**2 + roll_deg**2)
        r = 0.65 * self.R
        scale = (2.0 * np.pi * r) / (self.R**2) * (180.0 / np.pi) / 1000.0
        H = np.array([[scale, 0.0]])

        z = np.array([[tilt_total]])
        y = z - np.dot(H, self.x)
        S = np.dot(np.dot(H, self.P), H.T) + self.R_imu
        K = np.dot(np.dot(self.P, H.T), np.linalg.inv(S))

        self.x = self.x + np.dot(K, y)
        self.P = self.P - np.dot(np.dot(K, H), self.P)

        sigma_cm = np.sqrt(self.P[0, 0]) / 10.0
        return {
            "fused_displacement_cm": round(float(self.x[0, 0] / 10.0), 2),
            "fused_velocity_mm_day": round(float(abs(self.x[1, 0])), 3),
            "uncertainty_sigma_cm": round(float(sigma_cm), 2)
        }