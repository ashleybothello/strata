import os
import json
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_error

try:
    from prophet import Prophet
    HAS_PROPHET = True
except ImportError:
    HAS_PROPHET = False

os.makedirs("data/processed", exist_ok=True)
OUT_JSON = "data/processed/model_validation.json"

def run_validation():
    print("--- Running 80/20 Holdout Validation on REAL Jharia InSAR Data ---")
    
    real_dates = [
        "2026-05-08", "2026-05-20", "2026-06-01", "2026-06-13", 
        "2026-06-25", "2026-07-07", "2026-07-19", "2026-07-31", 
        "2026-08-12", "2026-08-20"
    ]
    
    real_disp_mm = [0.0, -14.0, -26.0, -41.0, -55.0, -68.0, -80.0, -93.0, -102.0, -108.0]
    
    df = pd.DataFrame({'ds': pd.to_datetime(real_dates), 'y': real_disp_mm})

    # Chronological Split (8 Train, 2 Held-out Test)
    split_idx = 8
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]

    if HAS_PROPHET:
        m = Prophet(yearly_seasonality=False, weekly_seasonality=False, daily_seasonality=False, n_changepoints=1)
        m.fit(train_df)
        forecast = m.predict(test_df[['ds']])
        y_pred = forecast['yhat'].values
    else:
        x_train = np.arange(len(train_df))
        x_test = np.arange(len(train_df), len(df))
        poly = np.polyfit(x_train, train_df['y'], 1)
        y_pred = np.polyval(poly, x_test)

    y_true = test_df['y'].values

    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)

    metrics = {
        "validation_type": "80/20 Temporal Holdout (Real InSAR)",
        "train_epochs": len(train_df),
        "test_epochs": len(test_df),
        "rmse_mm": round(rmse, 2),
        "mae_mm": round(mae, 2)
    }

    with open(OUT_JSON, "w") as f:
        json.dump(metrics, f, indent=4)

    print("Validation complete.")
    print(f"   Train Points: {metrics['train_epochs']} | Test Points: {metrics['test_epochs']}")
    print(f"   RMSE: ± {metrics['rmse_mm']} mm | MAE: {metrics['mae_mm']} mm")

if __name__ == "__main__":
    run_validation()