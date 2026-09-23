import os
import zipfile
from hyp3_sdk import HyP3

def download_and_extract_insar(download_dir="data/raw/insar_outputs"):
    os.makedirs(download_dir, exist_ok=True)
    
    print("Authenticating with NASA Earthdata...")
    # prompt='password' tells hyp3 to ask for Earthdata username/password in terminal
    hyp3 = HyP3(prompt='password')
    
    print("Fetching submitted HyP3 InSAR jobs...")
    my_jobs = hyp3.find_jobs()
    
    if not my_jobs:
        print("No jobs found in this account.")
        return
        
    succeeded = [j for j in my_jobs if j.succeeded()]
    running = [j for j in my_jobs if j.running()]
    pending = [j for j in my_jobs if j.pending()]
    
    print("\n" + "="*45)
    print(f"HYP3 QUEUE STATUS:")
    print(f"  • Succeeded / Ready: {len(succeeded)}")
    print(f"  • Running:           {len(running)}")
    print(f"  • Pending in Queue:  {len(pending)}")
    print("="*45)
    
    if len(succeeded) == 0:
        print("\nJobs are still processing in the cloud. Check again in 10-15 minutes.")
        return

    # Download succeeded jobs
    print(f"\nDownloading {len(succeeded)} completed InSAR packages...")
    my_jobs.filter_jobs(succeeded=True).download_files(download_dir)
    
    # Unzip all downloaded files
    print("\nExtracting GeoTIFF products...")
    for item in os.listdir(download_dir):
        if item.endswith(".zip"):
            zip_path = os.path.join(download_dir, item)
            extract_folder = os.path.join(download_dir, item.replace(".zip", ""))
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_folder)
            os.remove(zip_path)  # Clean up zip archive
            print(f"  Extracted: {item}")
            
    print(f"\n[OK] All ready! Files stored in: {download_dir}")

if __name__ == "__main__":
    download_and_extract_insar()