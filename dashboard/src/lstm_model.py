import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import matplotlib.pyplot as plt
import os

class SubsidenceLSTM(nn.Module):
    def __init__(self, input_size=1, hidden_size=64, num_layers=2, output_size=1):
        super(SubsidenceLSTM, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])
        return out

def create_sliding_windows(data, window_size=8):
    X, y = [], []
    for i in range(len(data) - window_size):
        X.append(data[i : i + window_size])
        y.append(data[i + window_size])
    return np.array(X), np.array(y)

def run_lstm_pipeline(csv_path="data/processed/synthetic_insar.csv", window_size=8, epochs=120):
    df = pd.read_csv(csv_path)
    values = df['y'].values.reshape(-1, 1)

    scaler = MinMaxScaler(feature_range=(-1, 1))
    scaled_values = scaler.fit_transform(values)

    X, y = create_sliding_windows(scaled_values, window_size=window_size)

    # 80% Train, 20% Test split
    split_idx = int(len(X) * 0.8)
    X_train, y_train = torch.FloatTensor(X[:split_idx]), torch.FloatTensor(y[:split_idx])
    X_test, y_test = torch.FloatTensor(X[split_idx:]), torch.FloatTensor(y[split_idx:])

    model = SubsidenceLSTM()
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.008)

    print(f"Training PyTorch LSTM on {len(X_train)} samples across {epochs} epochs...")
    for epoch in range(epochs):
        model.train()
        optimizer.zero_grad()
        output = model(X_train)
        loss = criterion(output, y_train)
        loss.backward()
        optimizer.step()

        if (epoch + 1) % 40 == 0:
            print(f"  Epoch [{epoch+1}/{epochs}] Loss: {loss.item():.5f}")

    # Evaluate on Test Set
    model.eval()
    with torch.no_grad():
        test_preds = model(X_test).numpy()
        test_preds_actual = scaler.inverse_transform(test_preds)
        y_test_actual = scaler.inverse_transform(y_test.numpy())

    rmse = np.sqrt(np.mean((test_preds_actual - y_test_actual) ** 2))
    mae = np.mean(np.abs(test_preds_actual - y_test_actual))
    print("\n" + "="*50)
    print(f"LSTM Test RMSE: {rmse:.3f} mm | MAE: {mae:.3f} mm")
    print("="*50)

    # Save model weights & predictions
    os.makedirs("models", exist_ok=True)
    torch.save(model.state_dict(), "models/lstm_subsidence.pt")
    
    # Save test predictions with dates
    test_dates = df['ds'].values[window_size + split_idx :]
    pred_df = pd.DataFrame({
        "ds": test_dates,
        "actual_mm": y_test_actual.flatten(),
        "lstm_pred_mm": test_preds_actual.flatten()
    })
    pred_df.to_csv("data/processed/lstm_predictions.csv", index=False)
    print("[OK] LSTM predictions saved to: data/processed/lstm_predictions.csv")

if __name__ == "__main__":
    run_lstm_pipeline()