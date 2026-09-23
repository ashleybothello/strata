import sys
import os
import subprocess
import pandas as pd
import optuna
from prophet import Prophet
from prophet.diagnostics import cross_validation, performance_metrics

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def run_pipeline():
    print("\n--- STEP 1: Extracting Real Time-Series from InSAR GeoTIFFs ---")
    subprocess.run([sys.executable, "src/extract_real_insar.py"])

    timeseries_csv = "data/processed/real_insar_timeseries.csv"
    if not os.path.exists(timeseries_csv):
        print(f"\n[ERROR] {timeseries_csv} not found.")
        return

    print("\n--- STEP 2: Running Bayesian-Optimized Prophet on Real Satellite Data ---")
    df = pd.read_csv(timeseries_csv)
    df['ds'] = pd.to_datetime(df['ds'])
    
    # Custom Optuna objective for our ~100-day real satellite dataset
    def custom_objective(trial):
        params = {
            'changepoint_prior_scale': trial.suggest_float('changepoint_prior_scale', 0.001, 0.5, log=True),
            'seasonality_prior_scale': trial.suggest_float('seasonality_prior_scale', 0.01, 10, log=True),
            'changepoint_range': trial.suggest_float('changepoint_range', 0.8, 0.95),
            'seasonality_mode': trial.suggest_categorical('seasonality_mode', ['additive', 'multiplicative'])
        }
        # Disable yearly/weekly seasonality since we only have ~3 months of data
        model = Prophet(**params, yearly_seasonality=False, weekly_seasonality=False, daily_seasonality=False)
        model.fit(df)
        
        # Scale down cross-validation to fit within 103 days
        df_cv = cross_validation(model, initial='50 days', period='12 days', horizon='24 days', parallel=None)
        df_p = performance_metrics(df_cv)
        return df_p['rmse'].mean()

    # Run 10 optimization trials
    study = optuna.create_study(direction="minimize")
    study.optimize(custom_objective, n_trials=10)

    print("\n" + "="*50)
    print(f"Optimal Hyperparameters: {study.best_params}")
    print(f"Best Real-Data RMSE: {study.best_value:.3f} mm")
    print("="*50)

    # Train final model on best parameters
    best_model = Prophet(**study.best_params, yearly_seasonality=False, weekly_seasonality=False, daily_seasonality=False)
    best_model.fit(df)
    
    # Forecast forward 6 satellite revisit cycles (~72 days)
    future = best_model.make_future_dataframe(periods=6, freq='12D')
    forecast = best_model.predict(future)
    
    output_forecast_csv = "data/processed/real_prophet_forecast.csv"
    forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_csv(output_forecast_csv, index=False)
    print(f"\n[SUCCESS] Real InSAR BO-Prophet forecast saved to: {output_forecast_csv}")

if __name__ == "__main__":
    run_pipeline()