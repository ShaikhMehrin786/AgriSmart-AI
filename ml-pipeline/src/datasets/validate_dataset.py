# SIH 2026 Dataset Validation & Data Leakage Prevention Utility
import os
import sys
import json
import glob
import hashlib
import argparse
import numpy as np
import pandas as pd
import cv2

# Ensure ml-pipeline root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

VALID_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp', '.bmp')

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
    return path

def load_class_labels(class_labels_path):
    resolved = resolve_path(class_labels_path)
    if not os.path.exists(resolved):
        raise FileNotFoundError(f"Class labels JSON not found at: {class_labels_path}")
    with open(resolved, 'r', encoding='utf-8') as f:
        return json.load(f)

def compute_file_hash(filepath, block_size=65536):
    """Computes SHA-256 hash of a file for duplicate & leakage detection."""
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        buf = f.read(block_size)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(block_size)
    return hasher.hexdigest()

def scan_directory_split(split_dir, class_labels):
    """Scans a split directory (e.g. train, val, test_field) for images."""
    class_to_idx = {c: i for i, c in enumerate(class_labels)}
    records = []
    unexpected_classes = set()
    unreadable_files = []
    corrupt_files = []

    if not os.path.exists(split_dir):
        return records, unexpected_classes, unreadable_files, corrupt_files

    existing_subdirs = [d for d in os.listdir(split_dir) if os.path.isdir(os.path.join(split_dir, d))]
    for d in existing_subdirs:
        if d not in class_to_idx:
            unexpected_classes.add(d)

    for class_name in class_labels:
        class_dir = os.path.join(split_dir, class_name)
        if not os.path.exists(class_dir):
            continue

        for root, _, files in os.walk(class_dir):
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                full_path = os.path.join(root, file)
                if ext not in VALID_EXTENSIONS:
                    unreadable_files.append((full_path, "Invalid extension"))
                    continue

                # Verify image readability and dimensions
                try:
                    img = cv2.imread(full_path)
                    if img is None:
                        corrupt_files.append((full_path, "OpenCV returned None"))
                        continue
                    h, w, c = img.shape
                except Exception as e:
                    corrupt_files.append((full_path, str(e)))
                    continue

                file_hash = compute_file_hash(full_path)
                file_size = os.path.getsize(full_path)

                records.append({
                    "path": full_path,
                    "filename": file,
                    "class_name": class_name,
                    "class_index": class_to_idx[class_name],
                    "hash": file_hash,
                    "size_bytes": file_size,
                    "width": w,
                    "height": h,
                    "channels": c
                })

    return records, unexpected_classes, unreadable_files, corrupt_files

def validate_dataset(data_dir, class_labels_path, output_summary_path=None):
    print("==================================================")
    print("AGRISMART AI - SIH 2026 DATASET VALIDATOR")
    print("==================================================")

    class_labels = load_class_labels(class_labels_path)
    num_expected_classes = len(class_labels)
    resolved_data_dir = resolve_path(data_dir)

    print(f"[Validator] Target Data Directory: {resolved_data_dir}")
    print(f"[Validator] Expected Classes ({num_expected_classes}): {class_labels[:3]} ... {class_labels[-1]}")

    if not os.path.exists(resolved_data_dir):
        print(f"[ERROR] Target dataset directory '{resolved_data_dir}' does not exist.")
        print("Please prepare your dataset or run synthetic smoke test generator first.")
        return False, {"error": "Directory not found"}

    # Determine split structure
    subdirs = [d for d in os.listdir(resolved_data_dir) if os.path.isdir(os.path.join(resolved_data_dir, d))]
    has_explicit_splits = any(s in subdirs for s in ['train', 'val', 'test_field', 'processed'])

    split_records = {}
    all_unexpected_classes = set()
    all_corrupt_files = []
    all_unreadable_files = []

    if has_explicit_splits:
        target_splits = ['train', 'val', 'test_field']
        for s in target_splits:
            s_dir = os.path.join(resolved_data_dir, s)
            if not os.path.exists(s_dir) and os.path.exists(os.path.join(resolved_data_dir, 'processed', s)):
                s_dir = os.path.join(resolved_data_dir, 'processed', s)
            records, unexp, unread, corrupt = scan_directory_split(s_dir, class_labels)
            split_records[s] = records
            all_unexpected_classes.update(unexp)
            all_unreadable_files.extend(unread)
            all_corrupt_files.extend(corrupt)
    else:
        # Flat class subdirectories structure
        records, unexp, unread, corrupt = scan_directory_split(resolved_data_dir, class_labels)
        split_records['all'] = records
        all_unexpected_classes.update(unexp)
        all_unreadable_files.extend(unread)
        all_corrupt_files.extend(corrupt)

    # 1. Image Counts & Class Statistics
    total_images = sum(len(r) for r in split_records.values())
    print(f"[Validator] Total Valid Images Scanned: {total_images}")

    for s, recs in split_records.items():
        print(f"  -> Split '{s}': {len(recs)} images")

    if total_images == 0:
        print("[ERROR] Zero valid images found in dataset directory!")
        return False, {"error": "Zero images found"}

    # Combine records into DataFrame for analysis
    all_records = []
    for s, recs in split_records.items():
        for r in recs:
            r_copy = dict(r)
            r_copy['split'] = s
            all_records.append(r_copy)

    df = pd.DataFrame(all_records)

    # Class distribution analysis
    class_counts = df['class_name'].value_counts().to_dict()
    present_classes = set(class_counts.keys())
    missing_classes = set(class_labels) - present_classes

    print("\n--- CLASS DISTRIBUTION & COVERAGE ---")
    print(f"Classes Present: {len(present_classes)} / {num_expected_classes}")
    if len(missing_classes) > 0:
        print(f"[WARNING] Missing Classes ({len(missing_classes)}): {list(missing_classes)[:5]}...")
    if len(all_unexpected_classes) > 0:
        print(f"[ERROR] Unexpected Class Subdirectories ({len(all_unexpected_classes)}): {list(all_unexpected_classes)}")

    # Calculate class imbalance
    counts_list = [class_counts.get(c, 0) for c in class_labels if class_counts.get(c, 0) > 0]
    imbalance_ratio = (max(counts_list) / min(counts_list)) if len(counts_list) > 0 else 0.0
    print(f"Class Imbalance Ratio (Max/Min): {imbalance_ratio:.2f}")

    # 2. Corrupt / Unreadable Images Audit
    print("\n--- INTEGRITY & CORRUPTION AUDIT ---")
    print(f"Corrupt Files:   {len(all_corrupt_files)}")
    print(f"Invalid Format:  {len(all_unreadable_files)}")
    if len(all_corrupt_files) > 0:
        print(f"[ERROR] Corrupt images detected: {all_corrupt_files[:3]}")

    # 3. Data Leakage & Duplicate Detection
    print("\n--- DATA LEAKAGE & DUPLICATE AUDIT ---")
    train_val_hashes = set()
    test_field_hashes = set()
    leakage_hashes = set()

    for r in all_records:
        if r['split'] in ['train', 'val', 'all']:
            train_val_hashes.add(r['hash'])
        if r['split'] == 'test_field':
            test_field_hashes.add(r['hash'])

    if len(test_field_hashes) > 0:
        leakage_hashes = train_val_hashes.intersection(test_field_hashes)

    # Check internal duplicate hashes
    hash_counts = df['hash'].value_counts()
    duplicate_hashes = hash_counts[hash_counts > 1].to_dict()

    print(f"Unique Content Hashes: {df['hash'].nunique()}")
    print(f"Duplicate Image Hashes: {len(duplicate_hashes)}")
    print(f"Held-Out Field Test Leakage Count: {len(leakage_hashes)}")

    if len(leakage_hashes) > 0:
        print(f"[CRITICAL LEAKAGE ERROR] {len(leakage_hashes)} identical images found in BOTH training/validation AND held-out field test set!")

    # 4. Image Dimensions Summary
    print("\n--- IMAGE DIMENSIONS SUMMARY ---")
    print(f"Width:  Min={df['width'].min()}, Max={df['width'].max()}, Mean={df['width'].mean():.1f} px")
    print(f"Height: Min={df['height'].min()}, Max={df['height'].max()}, Mean={df['height'].mean():.1f} px")

    # Determine Validation Pass / Fail status
    has_critical_error = (
        len(all_corrupt_files) > 0 or
        len(all_unexpected_classes) > 0 or
        len(leakage_hashes) > 0
    )

    validation_passed = not has_critical_error

    # 5. Export Summary Reports
    summary_data = {
        "data_directory": resolved_data_dir,
        "validation_passed": validation_passed,
        "total_images": total_images,
        "split_counts": {s: len(recs) for s, recs in split_records.items()},
        "num_expected_classes": num_expected_classes,
        "num_present_classes": len(present_classes),
        "missing_classes": list(missing_classes),
        "unexpected_classes": list(all_unexpected_classes),
        "corrupt_file_count": len(all_corrupt_files),
        "duplicate_hash_count": len(duplicate_hashes),
        "leakage_hash_count": len(leakage_hashes),
        "imbalance_ratio": float(imbalance_ratio),
        "dimension_stats": {
            "mean_width": float(df['width'].mean()),
            "mean_height": float(df['height'].mean()),
            "min_width": int(df['width'].min()),
            "max_width": int(df['width'].max())
        }
    }

    if output_summary_path is None:
        output_summary_path = os.path.join(resolved_data_dir, "dataset_summary.json")

    os.makedirs(os.path.dirname(output_summary_path), exist_ok=True)
    with open(output_summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary_data, f, indent=2)

    csv_summary_path = os.path.splitext(output_summary_path)[0] + ".csv"
    df_class_summary = df.groupby(['split', 'class_name']).size().reset_index(name='image_count')
    df_class_summary.to_csv(csv_summary_path, index=False)

    print("\n==================================================")
    print(f"VALIDATION RESULT: {'[PASSED] SIH Compliant' if validation_passed else '[FAILED] Issues Detected'}")
    print(f"Summary JSON: {output_summary_path}")
    print(f"Summary CSV:  {csv_summary_path}")
    print("==================================================")

    return validation_passed, summary_data

def main():
    parser = argparse.ArgumentParser(description="AgriSmart AI Dataset Validator & Leakage Auditor")
    parser.add_argument("--data-dir", type=str, default="ml-pipeline/checkpoints/synthetic_smoke_data", help="Target dataset directory")
    parser.add_argument("--class-labels", type=str, default="backend/src/models/class_labels.json", help="Path to class labels JSON")
    parser.add_argument("--output-summary", type=str, default=None, help="Path for output JSON summary")
    args = parser.parse_args()

    passed, _ = validate_dataset(args.data_dir, args.class_labels, args.output_summary)
    if not passed:
        sys.exit(1)

if __name__ == "__main__":
    main()
