# SIH 2026 Public Benchmark Preparation & Class Intersection Pipeline
# Merges PlantVillage (Lab train/val) and PlantDoc (Field held-out test)
import os
import sys
import re
import json
import shutil
import hashlib
import argparse
import random
from collections import defaultdict
import numpy as np
import pandas as pd
import cv2
from sklearn.model_selection import train_test_split

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp', '.bmp')

# Canonical Mapping Table: PlantDoc Folder Name / Variant -> PlantVillage Canonical Class Name
PLANTDOC_TO_PLANTVILLAGE_MAP = {
    # Apple
    "apple scab leaf": "Apple___Apple_scab",
    "apple scab": "Apple___Apple_scab",
    "apple rust leaf": "Apple___Cedar_apple_rust",
    "apple rust": "Apple___Cedar_apple_rust",
    "apple leaf": "Apple___healthy",
    "apple black rot": "Apple___Black_rot",

    # Bell Pepper / Pepper Bell
    "bell pepper leaf spot": "Pepper_bell___Bacterial_spot",
    "bell_pepper leaf spot": "Pepper_bell___Bacterial_spot",
    "pepper leaf spot": "Pepper_bell___Bacterial_spot",
    "bell pepper leaf": "Pepper_bell___healthy",
    "bell_pepper leaf": "Pepper_bell___healthy",
    "pepper leaf": "Pepper_bell___healthy",

    # Blueberry
    "blueberry leaf": "Blueberry___healthy",

    # Cherry
    "cherry leaf": "Cherry___healthy",

    # Corn / Maize
    "corn gray leaf spot": "Corn___Cercospora_leaf_spot",
    "corn grey leaf spot": "Corn___Cercospora_leaf_spot",
    "corn cercospora leaf spot": "Corn___Cercospora_leaf_spot",
    "corn leaf blight": "Corn___Northern_Leaf_Blight",
    "corn northern leaf blight": "Corn___Northern_Leaf_Blight",
    "corn rust leaf": "Corn___Common_rust",
    "corn rust": "Corn___Common_rust",
    "corn leaf": "Corn___healthy",

    # Grape
    "grape leaf black rot": "Grape___Black_rot",
    "grape black rot": "Grape___Black_rot",
    "grape leaf": "Grape___healthy",
    "grape leaf blight": "Grape___Leaf_blight",

    # Peach
    "peach leaf": "Peach___healthy",

    # Potato
    "potato leaf early blight": "Potato___Early_blight",
    "potato early blight": "Potato___Early_blight",
    "potato leaf late blight": "Potato___Late_blight",
    "potato late blight": "Potato___Late_blight",
    "potato leaf": "Potato___healthy",

    # Raspberry
    "raspberry leaf": "Raspberry___healthy",

    # Soybean
    "soyabean leaf": "Soybean___healthy",
    "soybean leaf": "Soybean___healthy",

    # Squash
    "squash powdery mildew leaf": "Squash___Powdery_mildew",
    "squash powdery mildew": "Squash___Powdery_mildew",

    # Strawberry
    "strawberry leaf": "Strawberry___healthy",

    # Tomato
    "tomato early blight leaf": "Tomato___Early_blight",
    "tomato early blight": "Tomato___Early_blight",
    "tomato leaf early blight": "Tomato___Early_blight",
    "tomato leaf late blight": "Tomato___Late_blight",
    "tomato late blight leaf": "Tomato___Late_blight",
    "tomato late blight": "Tomato___Late_blight",
    "tomato leaf bacterial spot": "Tomato___Bacterial_spot",
    "tomato bacterial spot leaf": "Tomato___Bacterial_spot",
    "tomato bacterial spot": "Tomato___Bacterial_spot",
    "tomato leaf mosaic virus": "Tomato___Tomato_mosaic_virus",
    "tomato mosaic virus leaf": "Tomato___Tomato_mosaic_virus",
    "tomato leaf yellow virus": "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "tomato yellow leaf curl virus": "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "tomato leaf": "Tomato___healthy",
    "tomato mold leaf": "Tomato___Leaf_Mold",
    "tomato leaf mold": "Tomato___Leaf_Mold",
    "tomato septoria leaf spot": "Tomato___Septoria_leaf_spot",
    "tomato septoria leaf spot leaf": "Tomato___Septoria_leaf_spot",
    "tomato two spotted spider mites leaf": "Tomato___Spider_mites",
    "tomato spider mites": "Tomato___Spider_mites",
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

def compute_file_hash(filepath):
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()

def normalize_name(s):
    s = s.lower().replace('_', ' ').replace('-', ' ')
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def scan_plantvillage_classes(pv_dir):
    """Scans PlantVillage directory and counts images per class."""
    pv_classes = {}
    pv_files = defaultdict(list)
    if not os.path.exists(pv_dir):
        return pv_classes, pv_files

    for item in sorted(os.listdir(pv_dir)):
        item_path = os.path.join(pv_dir, item)
        if os.path.isdir(item_path) and not item.startswith('.') and item != '__MACOSX':
            files = []
            for root, _, f_list in os.walk(item_path):
                for f in f_list:
                    if f.lower().endswith(IMAGE_EXTENSIONS):
                        files.append(os.path.join(root, f))
            if len(files) > 0:
                pv_classes[item] = len(files)
                pv_files[item] = files

    return pv_classes, pv_files

def scan_plantdoc_classes(pd_dir):
    """Scans PlantDoc directory, maps to canonical classes, and detects Windows filename collisions."""
    pd_raw_classes = {}
    pd_mapped_files = defaultdict(list)
    pd_unmapped = []
    case_collisions = defaultdict(list)

    if not os.path.exists(pd_dir):
        return pd_raw_classes, pd_mapped_files, pd_unmapped, case_collisions

    for root, dirs, files in os.walk(pd_dir):
        # Avoid traversing root if it only has subfolders
        folder_name = os.path.basename(root)
        if folder_name.startswith('.') or folder_name == '__MACOSX':
            continue

        image_files = [os.path.join(root, f) for f in files if f.lower().endswith(IMAGE_EXTENSIONS)]
        if len(image_files) == 0:
            continue

        pd_raw_classes[folder_name] = len(image_files)
        norm = normalize_name(folder_name)

        target_pv_class = PLANTDOC_TO_PLANTVILLAGE_MAP.get(norm)
        if target_pv_class is None:
            # Try fuzzy matching
            for k, v in PLANTDOC_TO_PLANTVILLAGE_MAP.items():
                if k in norm or norm in k:
                    target_pv_class = v
                    break

        if target_pv_class:
            for f in image_files:
                base_lower = os.path.basename(f).lower()
                case_collisions[base_lower].append(f)
                pd_mapped_files[target_pv_class].append(f)
        else:
            pd_unmapped.append((folder_name, len(image_files)))

    return pd_raw_classes, pd_mapped_files, pd_unmapped, case_collisions

def prepare_public_benchmark(
    pv_dir,
    pd_dir,
    output_processed_dir,
    output_labels_path,
    output_report_path,
    output_summary_path,
    train_ratio=0.8,
    seed=42
):
    random.seed(seed)
    np.random.seed(seed)

    resolved_pv = resolve_path(pv_dir)
    resolved_pd = resolve_path(pd_dir)
    resolved_processed = resolve_path(output_processed_dir)

    print("==================================================")
    print("AGRISMART AI - PUBLIC BENCHMARK DATASET PREPARATION")
    print("==================================================")
    print(f"[Prep] PlantVillage Source: {resolved_pv}")
    print(f"[Prep] PlantDoc Source:     {resolved_pd}")
    print(f"[Prep] Target Processed:    {resolved_processed}")

    pv_classes, pv_files = scan_plantvillage_classes(resolved_pv)
    pd_raw_classes, pd_mapped_files, pd_unmapped, case_collisions = scan_plantdoc_classes(resolved_pd)

    print(f"\n[Scan] PlantVillage: Found {len(pv_classes)} classes, {sum(pv_classes.values())} images")
    print(f"[Scan] PlantDoc:     Found {len(pd_raw_classes)} raw folders, {sum(len(v) for v in pd_mapped_files.values())} mapped images")

    # Determine Shared Classes (Classes present in BOTH datasets)
    shared_classes = sorted(list(set(pv_classes.keys()) & set(pd_mapped_files.keys())))
    pv_only_classes = sorted(list(set(pv_classes.keys()) - set(pd_mapped_files.keys())))
    pd_only_classes = [u[0] for u in pd_unmapped]

    # Check healthy classes
    healthy_in_shared = [c for c in shared_classes if 'healthy' in c.lower()]
    disease_in_shared = [c for c in shared_classes if 'healthy' not in c.lower()]

    print(f"\n--- CLASS INTERSECTION SUMMARY ---")
    print(f"Total Shared Classes:       {len(shared_classes)} ({len(disease_in_shared)} diseases + {len(healthy_in_shared)} healthy)")
    print(f"PlantVillage-Only Classes:  {len(pv_only_classes)}")
    print(f"PlantDoc-Unmapped Folders:  {len(pd_only_classes)}")

    # Save Class Intersection Report
    report_data = {
        "benchmark_name": "AgriSmart AI Public Benchmark (PlantVillage Lab + PlantDoc Field)",
        "train_val_source": "PlantVillage (spMohanty/PlantVillage-Dataset)",
        "field_test_source": "PlantDoc (pratikkayal/PlantDoc-Dataset)",
        "shared_class_count": len(shared_classes),
        "disease_classes_count": len(disease_in_shared),
        "healthy_classes_count": len(healthy_in_shared),
        "shared_classes": shared_classes,
        "disease_classes": disease_in_shared,
        "healthy_classes": healthy_in_shared,
        "plantvillage_only_classes": pv_only_classes,
        "plantdoc_unmapped_folders": pd_only_classes,
        "class_mapping_table": {k: v for k, v in PLANTDOC_TO_PLANTVILLAGE_MAP.items() if v in shared_classes}
    }

    resolved_report_path = resolve_path(output_report_path)
    os.makedirs(os.path.dirname(resolved_report_path), exist_ok=True)
    with open(resolved_report_path, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2)
    print(f"[Output] Saved class intersection report: {resolved_report_path}")

    # Save public class labels JSON
    resolved_labels_path = resolve_path(output_labels_path)
    os.makedirs(os.path.dirname(resolved_labels_path), exist_ok=True)
    with open(resolved_labels_path, 'w', encoding='utf-8') as f:
        json.dump(shared_classes, f, indent=2)
    print(f"[Output] Saved public target class labels ({len(shared_classes)} classes): {resolved_labels_path}")

    # Prepare directories
    train_dir = os.path.join(resolved_processed, "train")
    val_dir = os.path.join(resolved_processed, "val")
    test_field_dir = os.path.join(resolved_processed, "test_field")

    os.makedirs(train_dir, exist_ok=True)
    os.makedirs(val_dir, exist_ok=True)
    os.makedirs(test_field_dir, exist_ok=True)

    # Process PlantVillage (Train / Val Split) for Shared Classes Only
    train_count = 0
    val_count = 0
    all_train_val_hashes = {}
    summary_rows = []

    print("\n--- PROCESSING PLANTVILLAGE (TRAIN / VAL SPLIT) ---")
    for cls in shared_classes:
        files = pv_files.get(cls, [])
        if len(files) == 0:
            continue

        indices = list(range(len(files)))
        val_size = max(1, int((1.0 - train_ratio) * len(files)))
        train_size = len(files) - val_size

        train_idx, val_idx = train_test_split(indices, train_size=train_size, test_size=val_size, random_state=seed)

        cls_train_dir = os.path.join(train_dir, cls)
        cls_val_dir = os.path.join(val_dir, cls)
        os.makedirs(cls_train_dir, exist_ok=True)
        os.makedirs(cls_val_dir, exist_ok=True)

        for i, idx in enumerate(train_idx):
            src = files[idx]
            dst_name = f"pv_train_{cls}_{i:05d}{os.path.splitext(src)[1]}"
            dst = os.path.join(cls_train_dir, dst_name)
            shutil.copy2(src, dst)
            h = compute_file_hash(dst)
            all_train_val_hashes[h] = ("train", cls, dst)
            train_count += 1

        for i, idx in enumerate(val_idx):
            src = files[idx]
            dst_name = f"pv_val_{cls}_{i:05d}{os.path.splitext(src)[1]}"
            dst = os.path.join(cls_val_dir, dst_name)
            shutil.copy2(src, dst)
            h = compute_file_hash(dst)
            all_train_val_hashes[h] = ("val", cls, dst)
            val_count += 1

    print(f"[PlantVillage] Processed {train_count} train images and {val_count} val images across {len(shared_classes)} shared classes")

    # Process PlantDoc (Field Test Set)
    field_count = 0
    field_hashes = {}
    leakage_detected = []

    print("\n--- PROCESSING PLANTDOC (HELD-OUT FIELD TEST SET) ---")
    for cls in shared_classes:
        files = pd_mapped_files.get(cls, [])
        if len(files) == 0:
            continue

        cls_field_dir = os.path.join(test_field_dir, cls)
        os.makedirs(cls_field_dir, exist_ok=True)

        for i, src in enumerate(files):
            dst_name = f"pd_field_{cls}_{i:05d}{os.path.splitext(src)[1]}"
            dst = os.path.join(cls_field_dir, dst_name)
            shutil.copy2(src, dst)
            h = compute_file_hash(dst)

            if h in all_train_val_hashes:
                leakage_detected.append((cls, dst, all_train_val_hashes[h]))

            field_hashes[h] = dst
            field_count += 1

    print(f"[PlantDoc] Processed {field_count} held-out field test images across {len(shared_classes)} shared classes")

    # Leakage Audit Result
    print(f"\n--- DATA LEAKAGE AUDIT ---")
    if len(leakage_detected) == 0:
        print("[PASSED] Zero data leakage detected between PlantVillage train/val and PlantDoc field test sets!")
    else:
        print(f"[WARNING] {len(leakage_detected)} potential cross-dataset duplicate hashes detected!")

    # Summary Generation
    for cls in shared_classes:
        t_c = len(os.listdir(os.path.join(train_dir, cls))) if os.path.exists(os.path.join(train_dir, cls)) else 0
        v_c = len(os.listdir(os.path.join(val_dir, cls))) if os.path.exists(os.path.join(val_dir, cls)) else 0
        f_c = len(os.listdir(os.path.join(test_field_dir, cls))) if os.path.exists(os.path.join(test_field_dir, cls)) else 0

        summary_rows.append({
            "class_name": cls,
            "plantvillage_total": pv_classes.get(cls, 0),
            "train_count": t_c,
            "val_count": v_c,
            "plantdoc_field_count": f_c,
            "total_benchmark_samples": t_c + v_c + f_c
        })

    df_summary = pd.DataFrame(summary_rows)
    resolved_summary_csv = resolve_path(output_summary_path)
    df_summary.to_csv(resolved_summary_csv, index=False)

    resolved_summary_json = os.path.splitext(resolved_summary_csv)[0] + ".json"
    with open(resolved_summary_json, 'w', encoding='utf-8') as f:
        json.dump(summary_rows, f, indent=2)

    print(f"\n[Summary] Saved summary CSV: {resolved_summary_csv}")
    print(f"[Summary] Saved summary JSON: {resolved_summary_json}")
    print("==================================================")

    return shared_classes, summary_rows

def main():
    parser = argparse.ArgumentParser(description="Prepare Public PlantVillage + PlantDoc Benchmark")
    parser.add_argument("--pv-dir", type=str, default="ml-pipeline/data/raw/plantvillage")
    parser.add_argument("--pd-dir", type=str, default="ml-pipeline/data/raw/plantdoc")
    parser.add_argument("--processed-dir", type=str, default="ml-pipeline/data/processed")
    parser.add_argument("--labels-output", type=str, default="backend/src/models/class_labels_public.json")
    parser.add_argument("--report-output", type=str, default="ml-pipeline/data/class_intersection_report.json")
    parser.add_argument("--summary-output", type=str, default="ml-pipeline/data/dataset_summary_public.csv")
    parser.add_argument("--train-ratio", type=float, default=0.8)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    prepare_public_benchmark(
        pv_dir=args.pv_dir,
        pd_dir=args.pd_dir,
        output_processed_dir=args.processed_dir,
        output_labels_path=args.labels_output,
        output_report_path=args.report_output,
        output_summary_path=args.summary_output,
        train_ratio=args.train_ratio,
        seed=args.seed
    )

if __name__ == "__main__":
    main()
