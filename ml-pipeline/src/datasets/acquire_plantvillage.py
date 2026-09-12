# PlantVillage Dataset Acquisition and Selective Extraction Pipeline
# Official Source: spMohanty/PlantVillage-Dataset (GitHub / CrowdAI)
import os
import sys
import re
import json
import time
import zipfile
import urllib.request
import shutil
import argparse
from collections import defaultdict
from datetime import datetime, timezone
from PIL import Image

IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.bmp', '.webp')

# Canonical Mapping Table for PlantVillage raw repository folder variants
PV_RAW_TO_CANONICAL_MAP = {
    # Apple
    "apple apple scab": "Apple___Apple_scab",
    "apple black rot": "Apple___Black_rot",
    "apple cedar apple rust": "Apple___Cedar_apple_rust",
    "apple healthy": "Apple___healthy",

    # Blueberry
    "blueberry healthy": "Blueberry___healthy",

    # Cherry
    "cherry including sour healthy": "Cherry___healthy",
    "cherry healthy": "Cherry___healthy",
    "cherry including sour powdery mildew": "Cherry___Powdery_mildew",
    "cherry powdery mildew": "Cherry___Powdery_mildew",

    # Corn
    "corn maize cercospora leaf spot gray leaf spot": "Corn___Cercospora_leaf_spot",
    "corn cercospora leaf spot": "Corn___Cercospora_leaf_spot",
    "corn maize common rust": "Corn___Common_rust",
    "corn common rust": "Corn___Common_rust",
    "corn maize northern leaf blight": "Corn___Northern_Leaf_Blight",
    "corn northern leaf blight": "Corn___Northern_Leaf_Blight",
    "corn maize healthy": "Corn___healthy",
    "corn healthy": "Corn___healthy",

    # Grape
    "grape black rot": "Grape___Black_rot",
    "grape esca black measles": "Grape___Esca",
    "grape leaf blight isariopsis leaf spot": "Grape___Leaf_blight",
    "grape healthy": "Grape___healthy",

    # Orange
    "orange haunglongbing citrus greening": "Orange___Haunglongbing",

    # Peach
    "peach bacterial spot": "Peach___Bacterial_spot",
    "peach healthy": "Peach___healthy",

    # Pepper Bell
    "pepper bell bacterial spot": "Pepper_bell___Bacterial_spot",
    "pepper bell healthy": "Pepper_bell___healthy",

    # Potato
    "potato early blight": "Potato___Early_blight",
    "potato late blight": "Potato___Late_blight",
    "potato healthy": "Potato___healthy",

    # Raspberry
    "raspberry healthy": "Raspberry___healthy",

    # Soybean
    "soybean healthy": "Soybean___healthy",

    # Squash
    "squash powdery mildew": "Squash___Powdery_mildew",

    # Strawberry
    "strawberry leaf scorch": "Strawberry___Leaf_scorch",
    "strawberry healthy": "Strawberry___healthy",

    # Tomato
    "tomato bacterial spot": "Tomato___Bacterial_spot",
    "tomato early blight": "Tomato___Early_blight",
    "tomato late blight": "Tomato___Late_blight",
    "tomato leaf mold": "Tomato___Leaf_Mold",
    "tomato septoria leaf spot": "Tomato___Septoria_leaf_spot",
    "tomato spider mites two spotted spider mite": "Tomato___Spider_mites",
    "tomato spider mites": "Tomato___Spider_mites",
    "tomato target spot": "Tomato___Target_Spot",
    "tomato tomato yellow leaf curl virus": "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "tomato tomato mosaic virus": "Tomato___Tomato_mosaic_virus",
    "tomato healthy": "Tomato___healthy"
}

def resolve_path(path):
    if os.path.isabs(path) and os.path.exists(path):
        return path
    candidates = [
        path,
        os.path.abspath(path),
        os.path.join(os.path.dirname(__file__), "..", "..", path),
        os.path.join(os.path.dirname(__file__), "..", "..", "..", path)
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)
    return os.path.abspath(path)

def normalize_name(s):
    s = s.lower().replace('___', ' ').replace('__', ' ').replace('_', ' ').replace(',', ' ').replace('(', ' ').replace(')', ' ')
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def map_folder_to_canonical(folder_name):
    norm = normalize_name(folder_name)
    if norm in PV_RAW_TO_CANONICAL_MAP:
        return PV_RAW_TO_CANONICAL_MAP[norm]
    for k, v in PV_RAW_TO_CANONICAL_MAP.items():
        if k == norm or k in norm or norm in k:
            return v
    return None

def download_with_progress(url, dest_path):
    """Downloads a remote file with real-time transfer rate and progress reporting."""
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    temp_dest = dest_path + ".tmp"

    print(f"[Download] Source URL: {url}")
    print(f"[Download] Saving to:   {dest_path}")

    req = urllib.request.Request(url, headers={'User-Agent': 'AgriSmartAI-Downloader/1.0'})
    start_time = time.time()
    last_print = 0

    with urllib.request.urlopen(req) as resp, open(temp_dest, 'wb') as out_f:
        total_size = int(resp.getheader('Content-Length', 0))
        downloaded = 0
        block_size = 1048576  # 1MB blocks

        while True:
            chunk = resp.read(block_size)
            if not chunk:
                break
            out_f.write(chunk)
            downloaded += len(chunk)

            now = time.time()
            if now - last_print > 1.0 or (total_size and downloaded >= total_size):
                last_print = now
                mb_down = downloaded / (1024 * 1024)
                if total_size > 0:
                    mb_total = total_size / (1024 * 1024)
                    pct = (downloaded / total_size) * 100
                    speed = mb_down / max(0.1, now - start_time)
                    sys.stdout.write(f"\r  -> Progress: {mb_down:.1f} / {mb_total:.1f} MB ({pct:.1f}%) @ {speed:.2f} MB/s")
                else:
                    sys.stdout.write(f"\r  -> Progress: {mb_down:.1f} MB downloaded")
                sys.stdout.flush()

    print()
    if os.path.exists(dest_path):
        os.remove(dest_path)
    os.rename(temp_dest, dest_path)
    elapsed = time.time() - start_time
    final_mb = os.path.getsize(dest_path) / (1024 * 1024)
    print(f"[Download] Complete! {final_mb:.1f} MB in {elapsed:.1f} seconds")

def acquire_plantvillage(
    dest_dir,
    target_labels_path,
    cache_dir,
    report_path,
    clean_cache=False
):
    start_time = time.time()
    resolved_dest = resolve_path(dest_dir)
    resolved_labels = resolve_path(target_labels_path)
    resolved_cache = resolve_path(cache_dir)
    resolved_report = resolve_path(report_path)

    print("==================================================")
    print("AGRISMART AI - PLANTVILLAGE DATASET ACQUISITION")
    print("==================================================")
    print(f"[Config] Target Directory:   {resolved_dest}")
    print(f"[Config] Target Labels:      {resolved_labels}")
    print(f"[Config] Cache Directory:    {resolved_cache}")

    # Load Target 28 Canonical Benchmark Classes
    with open(resolved_labels, 'r', encoding='utf-8') as f:
        target_classes = json.load(f)

    target_class_set = set(target_classes)
    print(f"[Config] Required Target Classes ({len(target_class_set)}):")
    for tc in sorted(target_class_set):
        print(f"  - {tc}")

    # Official spMohanty GitHub Archive URL
    url = "https://github.com/spMohanty/PlantVillage-Dataset/archive/refs/heads/master.zip"
    zip_path = os.path.join(resolved_cache, "PlantVillage-Dataset-master.zip")

    # 1. Download Master Archive if not in cache
    if not os.path.exists(zip_path):
        print("\n--- DOWNLOADING OFFICIAL PLANTVILLAGE DATASET ---")
        download_with_progress(url, zip_path)
    else:
        cached_mb = os.path.getsize(zip_path) / (1024 * 1024)
        print(f"\n[Cache] Found cached archive: {zip_path} ({cached_mb:.1f} MB)")

    # 2. Inspect Zip Structure and Selectively Extract ONLY Color Images for Target Classes
    print("\n--- SELECTIVE EXTRACTION OF COLOR BENCHMARK CLASSES ---")
    os.makedirs(resolved_dest, exist_ok=True)

    extracted_counts = defaultdict(int)
    skipped_non_target = 0
    skipped_non_color = 0
    extraction_errors = []

    with zipfile.ZipFile(zip_path, 'r') as zf:
        namelist = zf.namelist()
        total_entries = len(namelist)
        print(f"[Zip] Total archive entries: {total_entries}")

        # Find entries matching raw/color
        for idx, member in enumerate(namelist, 1):
            if member.endswith('/'):
                continue

            parts = member.replace('\\', '/').split('/')
            # Look for color folder structure: e.g. .../raw/color/<class_folder>/<image.jpg>
            # or .../raw/Color/<class_folder>/<image.jpg>
            color_idx = -1
            for i, p in enumerate(parts):
                if p.lower() == 'color':
                    color_idx = i
                    break

            if color_idx == -1 or len(parts) <= color_idx + 2:
                skipped_non_color += 1
                continue

            raw_folder = parts[color_idx + 1]
            filename = parts[color_idx + 2]

            ext = os.path.splitext(filename)[1].lower()
            if ext not in IMAGE_EXTENSIONS:
                continue

            # Map raw folder to canonical class name
            canonical_cls = map_folder_to_canonical(raw_folder)
            if canonical_cls is None or canonical_cls not in target_class_set:
                skipped_non_target += 1
                continue

            # Target extraction path
            cls_dir = os.path.join(resolved_dest, canonical_cls)
            os.makedirs(cls_dir, exist_ok=True)
            dst_file = os.path.join(cls_dir, filename)

            try:
                with zf.open(member) as src_f, open(dst_file, 'wb') as dst_f:
                    shutil.copyfileobj(src_f, dst_f)
                extracted_counts[canonical_cls] += 1
            except Exception as ex:
                extraction_errors.append({"member": member, "error": str(ex)})

            if idx % 10000 == 0 or idx == total_entries:
                pct = (idx / total_entries) * 100
                total_ext = sum(extracted_counts.values())
                print(f"  -> Scanned {idx}/{total_entries} entries ({pct:.1f}%) | Extracted {total_ext} images...")

    total_extracted = sum(extracted_counts.values())
    print(f"\n[Extraction] Complete! Extracted {total_extracted} images across {len(extracted_counts)} classes")
    print(f"[Extraction] Skipped {skipped_non_color} grayscale/segmented entries")
    print(f"[Extraction] Skipped {skipped_non_target} non-target class color images")

    # 3. Basic Integrity & Decoding Validation (PIL)
    print("\n--- POST-ACQUISITION INTEGRITY & DECODING AUDIT ---")
    valid_images = 0
    corrupt_images = []
    zero_byte_files = []
    class_scanned = defaultdict(int)

    for root, _, files in os.walk(resolved_dest):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in IMAGE_EXTENSIONS:
                f_path = os.path.join(root, f)
                size = os.path.getsize(f_path)
                cls_name = os.path.basename(root)

                if size == 0:
                    zero_byte_files.append(os.path.relpath(f_path, resolved_dest))
                    continue

                try:
                    with Image.open(f_path) as im:
                        im.verify()
                    valid_images += 1
                    class_scanned[cls_name] += 1
                except Exception as ex:
                    corrupt_images.append({"file": os.path.relpath(f_path, resolved_dest), "error": str(ex)})

    print(f"[Audit] Total Valid Images Decoded: {valid_images}")
    print(f"[Audit] Classes Acquired:           {len(class_scanned)} / {len(target_class_set)}")
    print(f"[Audit] Corrupt/Unreadable Files:   {len(corrupt_images)}")
    print(f"[Audit] Zero-Byte Files:            {len(zero_byte_files)}")

    # Calculate Disk Usage
    total_bytes = 0
    for root, _, files in os.walk(resolved_dest):
        for f in files:
            total_bytes += os.path.getsize(os.path.join(root, f))
    disk_mb = total_bytes / (1024 * 1024)
    print(f"[Storage] Disk Space Used:          {disk_mb:.1f} MB ({disk_mb/1024:.2f} GB)")

    # Optional cache cleanup
    if clean_cache and os.path.exists(zip_path):
        os.remove(zip_path)
        print("[Cache] Cleaned up temporary zip archive.")

    # 4. Generate Acquisition Report
    total_elapsed = time.time() - start_time
    report = {
        "dataset_name": "PlantVillage",
        "source": "spMohanty/PlantVillage-Dataset (Official GitHub)",
        "source_url": url,
        "acquisition_method": "Selective extraction of target color classes from official master zip archive",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "total_images_acquired": valid_images,
        "classes_acquired_count": len(class_scanned),
        "target_classes_requested_count": len(target_class_set),
        "disk_space_mb": round(disk_mb, 2),
        "disk_space_gb": round(disk_mb / 1024, 3),
        "corrupt_images_count": len(corrupt_images),
        "zero_byte_files_count": len(zero_byte_files),
        "extraction_errors_count": len(extraction_errors),
        "elapsed_seconds": round(total_elapsed, 2),
        "classes_acquired": sorted(list(class_scanned.keys())),
        "missing_target_classes": sorted(list(target_class_set - set(class_scanned.keys()))),
        "per_class_image_counts": dict(sorted(class_scanned.items())),
        "reproducibility_instructions": "python ml-pipeline/src/datasets/acquire_plantvillage.py --dest-dir ml-pipeline/data/raw/plantvillage --labels-path backend/src/models/class_labels_public.json",
        "is_ready_for_cross_dataset_audit": (len(corrupt_images) == 0 and len(class_scanned) == len(target_class_set))
    }

    os.makedirs(os.path.dirname(resolved_report), exist_ok=True)
    with open(resolved_report, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

    print(f"\n==================================================")
    print(f"Acquisition Report: {resolved_report}")
    print(f"Total Time Elapsed: {total_elapsed:.2f} seconds")
    print(f"Ready for Cross-Dataset Audit: {report['is_ready_for_cross_dataset_audit']}")
    print("==================================================")

    return report

def main():
    parser = argparse.ArgumentParser(description="PlantVillage Selective Acquisition Utility")
    parser.add_argument("--dest-dir", type=str, default="ml-pipeline/data/raw/plantvillage", help="Target raw directory")
    parser.add_argument("--labels-path", type=str, default="backend/src/models/class_labels_public.json", help="Target benchmark classes")
    parser.add_argument("--cache-dir", type=str, default="ml-pipeline/data/raw/.cache", help="Download cache directory")
    parser.add_argument("--report-path", type=str, default="ml-pipeline/data/plantvillage_acquisition_report.json", help="Acquisition report path")
    parser.add_argument("--clean-cache", action="store_true", help="Remove zip archive after extraction")
    args = parser.parse_args()

    acquire_plantvillage(
        dest_dir=args.dest_dir,
        target_labels_path=args.labels_path,
        cache_dir=args.cache_dir,
        report_path=args.report_path,
        clean_cache=args.clean_cache
    )

if __name__ == "__main__":
    main()
