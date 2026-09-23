import os
import zipfile

def extract_all_zips(raw_dir="data/raw/insar_outputs"):
    zip_files = [f for f in os.listdir(raw_dir) if f.endswith(".zip")]
    print(f"Found {len(zip_files)} zip archives to unpack.")

    for zf_name in zip_files:
        zip_path = os.path.join(raw_dir, zf_name)
        # Target folder without redundant nested naming
        target_dir = os.path.join(raw_dir, zf_name.replace(".zip", ""))
        os.makedirs(target_dir, exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            for member in zip_ref.infolist():
                # Extract only tif files to avoid path limits and junk xml/png files
                if member.filename.endswith(".tif"):
                    filename = os.path.basename(member.filename)
                    if filename:
                        dest = os.path.join(target_dir, filename)
                        with open(dest, "wb") as f_out:
                            f_out.write(zip_ref.read(member.filename))
        print(f"  Unpacked GeoTIFFs: {zf_name}")

    print("\n[OK] All InSAR GeoTIFFs extracted cleanly.")

if __name__ == "__main__":
    extract_all_zips()