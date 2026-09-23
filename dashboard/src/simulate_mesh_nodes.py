import requests
import time
import random

API_URL = "http://127.0.0.1:8000/api/telemetry"

nodes = [
    {"node_id": "ESP32-Node-01 (Gateway)", "latitude": 23.7540, "longitude": 86.4180, "hops": 0},
    {"node_id": "ESP32-Node-02 (Relay)", "latitude": 23.7505, "longitude": 86.4220, "hops": 1},
    {"node_id": "ESP32-Node-03 (Edge)", "latitude": 23.7475, "longitude": 86.4245, "hops": 2},
]

print("Simulating live LoRa mesh packets being sent to backend...")

try:
    while True:
        for node in nodes:
            # Simulate slight normal noise vs sudden tilt spike on Node-03
            if node["node_id"] == "ESP32-Node-03 (Edge)":
                pitch = round(random.uniform(2.8, 3.8), 2)  # High tilt near center
                vib = round(random.uniform(1.5, 3.0), 2)
            else:
                pitch = round(random.uniform(0.05, 0.45), 2)
                vib = round(random.uniform(0.02, 0.2), 2)

            payload = {
                "node_id": node["node_id"],
                "latitude": node["latitude"],
                "longitude": node["longitude"],
                "pitch_deg": pitch,
                "roll_deg": round(random.uniform(0.01, 0.3), 2),
                "vibration_g": vib,
                "hop_count": node["hops"],
                "battery_v": 3.95
            }

            resp = requests.post(API_URL, json=payload)
            print(f"Sent {node['node_id']}: Tilt={pitch}° -> Server: {resp.status_code}")

        time.sleep(4)
except KeyboardInterrupt:
    print("\nSimulation stopped.")