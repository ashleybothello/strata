import pandas as pd
import matplotlib.pyplot as plt
import os

def plot_forecast():
    # Load the real satellite history and the AI forecast
    history_file = "data/processed/real_insar_timeseries.csv"
    forecast_file = "data/processed/real_prophet_forecast.csv"

    if not os.path.exists(history_file) or not os.path.exists(forecast_file):
        print("Data files not found. Run the pipeline first.")
        return

    history = pd.read_csv(history_file)
    forecast = pd.read_csv(forecast_file)

    history['ds'] = pd.to_datetime(history['ds'])
    forecast['ds'] = pd.to_datetime(forecast['ds'])

    # Setup the plot
    plt.figure(figsize=(12, 6))

    # 1. Plot the AI's Confidence Interval (Light Blue Band)
    plt.fill_between(forecast['ds'], forecast['yhat_lower'], forecast['yhat_upper'], 
                     color='#87CEFA', alpha=0.4, label='95% Confidence Bounds')
    
    # 2. Plot the AI's Future Trendline (Dashed Blue Line)
    plt.plot(forecast['ds'], forecast['yhat'], color='#0000CD', linestyle='--', 
             linewidth=2, label='BO-Prophet Forecast')
    
    # 3. Plot the Actual Satellite Measurements (Red Dots)
    plt.plot(history['ds'], history['y'], color='#DC143C', marker='o', 
             linestyle='-', linewidth=2, markersize=6, label='Actual Sentinel-1 InSAR Data')

    # Formatting
    plt.title('Mine Subsidence Forecast: Satellite InSAR + BO-Prophet (Jharia Panel)', fontsize=14, fontweight='bold')
    plt.xlabel('Date', fontsize=12)
    plt.ylabel('Cumulative Subsidence / Ground Drop (mm)', fontsize=12)
    plt.axhline(0, color='black', linewidth=1)
    plt.legend(loc='lower left')
    plt.grid(True, linestyle=':', alpha=0.7)
    
    # Save and show
    out_path = "data/processed/real_forecast_plot.png"
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    print(f"\n[OK] High-resolution forecast plot saved to: {out_path}")
    plt.show()

if __name__ == "__main__":
    plot_forecast()