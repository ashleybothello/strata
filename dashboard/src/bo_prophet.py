import pandas as pd
import numpy as np
import optuna
from prophet import Prophet
from prophet.diagnostics import cross_validation, performance_metrics
import matplotlib.pyplot as plt
import os
import logging

# Suppress verbose stan/prophet logs
logging.getLogger("cmdstanpy").setLevel(logging.WARNING)
optuna.logging.set_verbosity(optuna.logging.WARNING)

def load_data(filepath="data/processed/synthetic_insar.csv") -> pd.DataFrame:
    df = pd.read_csv(filepath)
    df['ds'] = pd.to_datetime(df['ds'])
    return df

def objective(trial, df: pd.DataFrame):
    """
    Optuna objective function for tuning Prophet hyperparameters.
    """
    params = {
        'changepoint_prior_scale': trial.suggest_float('changepoint_prior_scale', 0.001, 0.5, log=True),
        'seasonality_prior_scale': trial.suggest_float('seasonality_prior_scale', 0.01, 10.0, log=True),
        'changepoint_range': trial.suggest_float('changepoint_range', 0.8, 0.95),
        'seasonality_mode': trial.suggest_categorical('seasonality_mode', ['additive', 'multiplicative']),
    }

    model = Prophet(
        changepoint_prior_scale=params['changepoint_prior_scale'],
        seasonality_prior_scale=params['seasonality_prior_scale'],
        changepoint_range=params['changepoint_range'],
        seasonality_mode=params['seasonality_mode'],
        daily_seasonality=False,
        weekly_seasonality=False,
        yearly_seasonality=True
    )
    model.fit(df)

    # Time-series cross validation: 365-day initial window, 60-day horizon
    df_cv = cross_validation(
        model, 
        initial='365 days', 
        period='30 days', 
        horizon='60 days', 
        parallel=None
    )
    
    df_p = performance_metrics(df_cv, rolling_window=1)
    return df_p['rmse'].mean()

def run_bo_prophet():
    df = load_data()
    print(f"Loaded {len(df)} InSAR points. Starting Bayesian Optimization (30 trials)...")

    # 1. Run Bayesian Optimization with Optuna
    study = optuna.create_study(direction="minimize")
    study.optimize(lambda trial: objective(trial, df), n_trials=30)

    print("\n" + "="*50)
    print("OPTUNA BEST HYPERPARAMETERS:")
    for k, v in study.best_params.items():
        print(f"  - {k}: {v}")
    print(f"Best Cross-Validation RMSE: {study.best_value:.3f} mm")
    print("="*50)

    # 2. Train final Prophet model with best parameters
    best_model = Prophet(
        **study.best_params,
        daily_seasonality=False,
        weekly_seasonality=False,
        yearly_seasonality=True
    )
    best_model.fit(df)

    # 3. Forecast 180 days (6 months) into the future
    future = best_model.make_future_dataframe(periods=15, freq='12D')
    forecast = best_model.predict(future)

    # Save forecast results
    os.makedirs("data/processed", exist_ok=True)
    forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_csv("data/processed/prophet_forecast.csv", index=False)
    print("[OK] Forecast saved to: data/processed/prophet_forecast.csv")

    # 4. Plot and save visualization
    fig = best_model.plot(forecast)
    plt.title("BO-Prophet Mine Subsidence Forecast (Sentinel-1 Simulation)", fontsize=12)
    plt.xlabel("Date")
    plt.ylabel("Cumulative Subsidence (mm)")
    plt.axhline(0, color='gray', linestyle='--', alpha=0.5)
    plt.tight_layout()
    plt.savefig("data/processed/prophet_forecast_plot.png", dpi=300)
    print("[OK] Forecast plot saved to: data/processed/prophet_forecast_plot.png")

if __name__ == "__main__":
    run_bo_prophet()