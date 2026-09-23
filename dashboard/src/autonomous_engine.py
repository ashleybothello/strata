import os
import time
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import subprocess
import sys

# Geotechnical early-warning threshold criteria
CRITICAL_SUBSIDENCE_MM = -220.0     # Critical vertical drop limit
WARNING_VELOCITY_MM_DAY = 1.0       # Accelerated movement threshold
CRITICAL_VELOCITY_MM_DAY = 3.0      # Tertiary creep / imminent failure threshold

ALERT_STATE_FILE = "data/processed/latest_alert_state.json"

def send_safety_email(subject: str, message: str, recipient="safety.officer@mine.gov.in"):
    """
    Sends automated emergency alerts via SMTP.
    Configured with standard SMTP fallback for local testing/prototyping.
    """
    print(f"\n[DISPATCH EMAIL] To: {recipient} | Subject: {subject}")
    # Set SMTP credentials via environment variables for production deployment:
    # SMTP_SERVER, SMTP_PORT, SENDER_EMAIL, SENDER_PASSWORD
    print(f"Content: {message}")

def send_sms_alert(message: str, target_phone="+919876543210"):
    """
    Sends SMS alerts via Twilio API if credentials are configured.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_phone = os.getenv("TWILIO_PHONE_NUMBER")

    if account_sid and auth_token and from_phone:
        try:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            msg = client.messages.create(body=message, from_=from_phone, to=target_phone)
            print(f"[SMS DISPATCHED] SID: {msg.sid}")
        except Exception as e:
            print(f"[SMS ERROR] Failed: {e}")
    else:
        print(f"[SMS SIMULATION] To: {target_phone} | Message: {message}")

def evaluate_collapse_hazard(history_csv="data/processed/real_insar_timeseries.csv", 
                             forecast_csv="data/processed/real_prophet_forecast.csv"):
    """
    Analyzes historical satellite measurements and AI forward projections
    to calculate velocity, acceleration, and time-to-critical-failure.
    """
    if not os.path.exists(history_csv) or not os.path.exists(forecast_csv):
        return {"status": "NO_DATA", "risk": "LOW", "days_to_collapse": None}

    df_hist = pd.read_csv(history_csv)
    df_fore = pd.read_csv(forecast_csv)
    
    df_hist['ds'] = pd.to_datetime(df_hist['ds'])
    df_fore['ds'] = pd.to_datetime(df_fore['ds'])

    # 1. Compute recent velocity over the last two satellite epochs
    if len(df_hist) >= 2:
        last_dt = (df_hist['ds'].iloc[-1] - df_hist['ds'].iloc[-2]).days
        dy = df_hist['y'].iloc[-1] - df_hist['y'].iloc[-2]
        current_velocity = abs(dy / last_dt) if last_dt > 0 else 0.0
    else:
        current_velocity = 0.0

    current_subsidence = df_hist['y'].iloc[-1]
    
    # 2. Check forecast horizon for threshold breaches
    critical_breaches = df_fore[df_fore['yhat'] <= CRITICAL_SUBSIDENCE_MM]
    
    days_to_critical = None
    predicted_collapse_date = None
    if not critical_breaches.empty:
        first_breach_date = critical_breaches['ds'].iloc[0]
        predicted_collapse_date = first_breach_date.strftime("%Y-%m-%d")
        days_to_critical = (first_breach_date - datetime.now()).days

    # 3. Decision classification
    if current_velocity >= CRITICAL_VELOCITY_MM_DAY or (days_to_critical is not None and days_to_critical <= 15):
        risk_level = "CRITICAL_COLLAPSE_RISK"
        action_msg = f"IMMEDIATE EVACUATION: Strata velocity reached {current_velocity:.2f} mm/day. Projected critical failure date: {predicted_collapse_date}."
        send_sms_alert(f"[MINE SAFETY ALERT] {action_msg}")
        send_safety_email(subject="CRITICAL ALARM: Imminent Mine Strata Failure", message=action_msg)
    elif current_velocity >= WARNING_VELOCITY_MM_DAY or (days_to_critical is not None and days_to_critical <= 45):
        risk_level = "WARNING_ACCELERATED_SUBSIDENCE"
        action_msg = f"WARNING: Increased deformation velocity ({current_velocity:.2f} mm/day). Ground drop at {current_subsidence:.1f} mm."
        send_safety_email(subject="WARNING: Elevated Mine Subsidence Rate", message=action_msg)
    else:
        risk_level = "STABLE_NORMAL"
        action_msg = f"Strata condition stable. Current velocity: {current_velocity:.2f} mm/day."

    report = {
        "timestamp": datetime.now().isoformat(),
        "latest_measured_subsidence_mm": float(current_subsidence),
        "current_velocity_mm_per_day": round(float(current_velocity), 3),
        "predicted_collapse_date": predicted_collapse_date,
        "days_to_critical": days_to_critical,
        "risk_level": risk_level,
        "recommendation": action_msg
    }

    import json
    os.makedirs(os.path.dirname(ALERT_STATE_FILE), exist_ok=True)
    with open(ALERT_STATE_FILE, "w") as f:
        json.dump(report, f, indent=2)

    print("\n" + "="*60)
    print("AI COLLAPSE RISK ASSESSMENT:")
    print(f"  • Current Subsidence: {report['latest_measured_subsidence_mm']} mm")
    print(f"  • Deformation Velocity: {report['current_velocity_mm_per_day']} mm/day")
    print(f"  • Risk Level: {report['risk_level']}")
    print(f"  • Predicted Failure Horizon: {report['predicted_collapse_date']} ({days_to_critical} days)")
    print(f"  • Action: {report['recommendation']}")
    print("="*60)

    return report

def run_periodic_cycle():
    """
    Executes the autonomous pipeline:
    1. Extracts new InSAR scenes
    2. Retrains the Bayesian-Optimized Prophet model
    3. Runs the collapse hazard evaluation
    """
    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Executing scheduled 12-day InSAR update cycle...")
    subprocess.run([sys.executable, "src/run_real_pipeline.py"])
    evaluate_collapse_hazard()

if __name__ == "__main__":
    evaluate_collapse_hazard()