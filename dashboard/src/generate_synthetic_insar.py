import numpy as np
import pandas as pd
import os

def generate_insar_time_series(
    start_date="2023-01-01", 
    num_points=120, 
    step_days=12, 
    output_path="data/processed/synthetic_insar.csv"
):
    """
    Simulates cumulative InSAR line-of-sight (LOS) subsidence time-series in mm over a coal mine panel.
    - S-curve extraction subsidence profile
    - Monsoon / Seasonal variation
    - Radar phase noise
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    np.random.seed(42)
    dates = pd.date_range(start=start_date, periods=num_points, freq=f"{step_days}D")
    t = np.linspace(0, 10, num_points)

    # 1. Non-linear mining extraction collapse trend (Logistic / S-curve)
    subsidence_trend = - (180 / (1 + np.exp(-1.2 * (t - 4.5))))

    # 2. Seasonal cyclicity (monsoon vs dry season moisture)
    seasonality = 8 * np.sin(2 * np.pi * t / (365 / (step_days * (num_points / 10))))

    # 3. Satellite phase noise
    noise = np.random.normal(0, 1.8, size=num_points)

    # Cumulative displacement (mm)
    displacement_mm = subsidence_trend + seasonality + noise

    df = pd.DataFrame({
        "ds": dates.strftime("%Y-%m-%d"),
        "y": np.round(displacement_mm, 2)
    })

    df.to_csv(output_path, index=False)
    print(f"[OK] InSAR time-series generated: {output_path}")
    print(df.head(5))
    return df

if __name__ == "__main__":
    generate_insar_time_series()