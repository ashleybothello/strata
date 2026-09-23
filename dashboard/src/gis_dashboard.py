import folium
from folium.plugins import HeatMap
import numpy as np
import pandas as pd
import json

def generate_gis_map(output_html="dashboard/mine_subsidence_map.html"):
    # Center over Jharia Coalfield, Dhanbad, Jharkhand
    mine_center = [23.7500, 86.4200]
    m = folium.Map(location=mine_center, zoom_start=14, tiles="OpenStreetMap")

    # 1. Overlay underground coal extraction boundary (Polygon)
    panel_coords = [
        [23.7550, 86.4150],
        [23.7550, 86.4300],
        [23.7420, 86.4300],
        [23.7420, 86.4150]
    ]
    folium.Polygon(
        locations=panel_coords,
        color="#d9534f",
        weight=3,
        fill=True,
        fill_color="#d9534f",
        fill_opacity=0.15,
        popup="<b>Underground Panel: Jharia Block 4</b><br>Active Extraction Depth: 180m"
    ).add_to(m)

    # 2. Add InSAR cumulative subsidence heatmap layer
    np.random.seed(42)
    heat_data = []
    for _ in range(80):
        lat = np.random.uniform(23.744, 23.753)
        lon = np.random.uniform(86.417, 86.428)
        # Intensity simulates high deformation towards panel center
        intensity = np.random.uniform(0.6, 1.0)
        heat_data.append([lat, lon, intensity])

    HeatMap(heat_data, radius=25, blur=18, max_zoom=1).add_to(m)

    # 3. Add MPU6050 Surface Mesh Sensor Nodes
    nodes = [
        {"id": "Node-01 (Gateway)", "lat": 23.7540, "lon": 86.4180, "status": "Normal", "tilt": "0.12°", "color": "green"},
        {"id": "Node-02 (Relay)", "lat": 23.7490, "lon": 86.4220, "status": "Warning (High Tilt)", "tilt": "1.84°", "color": "orange"},
        {"id": "Node-03 (Edge)", "lat": 23.7460, "lon": 86.4260, "status": "Critical (Subsidence Active)", "tilt": "3.21°", "color": "red"}
    ]

    for node in nodes:
        folium.CircleMarker(
            location=[node["lat"], node["lon"]],
            radius=9,
            color=node["color"],
            fill=True,
            fill_color=node["color"],
            fill_opacity=0.9,
            popup=f"<b>{node['id']}</b><br>Status: {node['status']}<br>Current Tilt: {node['tilt']}<br>Network: LoRa Mesh Link OK"
        ).add_to(m)

    # 4. Save interactive web map
    m.save(output_html)
    print(f"[OK] GIS Map Dashboard generated: {output_html}")

if __name__ == "__main__":
    generate_gis_map()