import os
import glob
import pandas as pd
import rasterio
from rasterio.warp import transform
from datetime import datetime
import numpy as np

def extract_time_series_from_insar(
    insar_folder="data/raw/insar_outputs", 
    target_lat=23.7485, 
    target_lon=86.4225,
    output_csv="data/processed/real_insar_timeseries.csv"
):
    # Search for unwrapped phase or displacement GeoTIFFs
    tif_files = glob.glob(os.path.join(insar_folder, "**", "*_unw_phase.tif"), recursive=True)
    if not tif_files:
        tif_files = glob.glob(os.path.join(insar_folder, "**", "*_disp.tif"), recursive=True)

    if not tif_files:
        print(f"No GeoTIFF files found in {insar_folder}.")
        return

    print(f"Found {len(tif_files)} InSAR scenes. Extracting deformation at Lat: {target_lat}, Lon: {target_lon}...")
    
    records = []

    for tif_path in tif_files:
        filename = os.path.basename(tif_path)
        
        # Parse secondary date from HyP3 filename pattern
        try:
            parts = filename.split("_")
            date_str = parts[2][:8]
            date_obj = datetime.strptime(date_str, "%Y%m%d")
        except Exception:
            continue

        with rasterio.open(tif_path) as src:
            # Reproject WGS-84 (EPSG:4326) Lat/Lon to the GeoTIFF's native coordinate reference system
            xs, ys = transform({'init': 'EPSG:4326'}, src.crs, [target_lon], [target_lat])
            target_x, target_y = xs[0], ys[0]

            # Convert map coordinates to image matrix indices
            row, col = src.index(target_x, target_y)

            # Check raster bounds
            if not (0 <= row < src.height and 0 <= col < src.width):
                continue

            raw_val = src.read(1)[row, col]
            
            # Filter NoData or NaN values
            if np.isnan(raw_val) or raw_val == src.nodata:
                continue

            # Convert radians to mm: (phase * wavelength 55.46 mm) / (-4 * pi)
            if "unw_phase" in filename:
                disp_mm = (raw_val * 55.46) / (-4 * np.pi)
            else:
                disp_mm = raw_val * 1000.0  # Already in meters

            records.append({
                "ds": date_obj.strftime("%Y-%m-%d"),
                "y": round(float(disp_mm), 2)
            })

    if not records:
        print("Could not extract points. Ensure target coordinates are within scene coverage.")
        return

    df = pd.DataFrame(records).sort_values("ds").drop_duplicates(subset=["ds"]).reset_index(drop=True)
    
    # Baseline correction (set initial observation to 0 mm)
    df["y"] = np.round(df["y"] - df["y"].iloc[0], 2)
    
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    df.to_csv(output_csv, index=False)
    
    print("\n" + "="*50)
    print(f"EXTRACTED REAL InSAR TIME-SERIES ({len(df)} Points):")
    print(df.to_string(index=False))
    print("="*50)
    print(f"[OK] Saved to: {output_csv}")

if __name__ == "__main__":
    extract_time_series_from_insar()