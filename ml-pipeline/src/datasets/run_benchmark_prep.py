# SIH 2026 — Public Benchmark Dataset Preparation (Authoritative Run Script)
#
# This script orchestrates the full benchmark preparation with fixes for the
# three issues identified during the audit of prepare_public_benchmark.py:
#
#   FIX-1: Class authority — class_labels_public.json is the authoritative 28-class
#           list. Potato___healthy (no PlantDoc test counterpart) is included in
#           train/val with zero test_field entries. The original PV∩PD intersection
#           logic would have silently dropped it.
#
#   FIX-2: Active leakage removal — SHA-256 duplicates detected between
#           test_field and train/val are *removed* from test_field (not merely
#           logged), and all removals are recorded with full provenance.
#
#   FIX-3: Report output — produces the three canonical report files:
#             ml-pipeline/data/public_benchmark_report.json
#             ml-pipeline/data/public_benchmark_class_counts.csv
#             ml-pipeline/data/public_benchmark_leakage_report.json
#
# Usage (from repo root):
#   cd "d:\AgriSmart AI"
#   .\ml-pipeline\venv\Scripts\python.exe ml-pipeline\src\datasets\run_benchmark_prep.py
#
# All paths are resolved relative to the repository root automatically.

import os
import sys
import re
import json
import shutil
import hashlib
import random
import datetime
from collections import defaultdict

import numpy as np
import pandas as pd
import cv2
from sklearn.model_selection import train_test_split

# ---------------------------------------------------------------------------
# Path bootstrap — works whether invoked from repo root or src/datasets/
# ---------------------------------------------------------------------------
_THIS_FILE = os.path.abspath(__file__)
_SRC_DIR   = os.path.dirname(_THIS_FILE)           # src/datasets/
_ML_DIR    = os.path.dirname(os.path.dirname(_SRC_DIR))  # ml-pipeline/
_REPO_ROOT = os.path.dirname(_ML_DIR)              # repo root

sys.path.insert(0, _ML_DIR)

# Reuse the audited mapping table from prepare_public_benchmark.py
from src.datasets.prepare_public_benchmark import (
    PLANTDOC_TO_PLANTVILLAGE_MAP,
    normalize_name,
    scan_plantvillage_classes,
    scan_plantdoc_classes,
    compute_file_hash,
)

# ---------------------------------------------------------------------------
# Configuration — all paths relative to repo root
# ---------------------------------------------------------------------------
PV_DIR          = os.path.join(_REPO_ROOT, "ml-pipeline", "data", "raw", "plantvillage")
PD_TEST_DIR     = os.path.join(_REPO_ROOT, "ml-pipeline", "data", "raw", "plantdoc_recovered", "test")
PROCESSED_DIR   = os.path.join(_REPO_ROOT, "ml-pipeline", "data", "processed")
LABELS_PATH     = os.path.join(_REPO_ROOT, "backend", "src", "models", "class_labels_public.json")
DATA_DIR        = os.path.join(_REPO_ROOT, "ml-pipeline", "data")

REPORT_PATH        = os.path.join(DATA_DIR, "public_benchmark_report.json")
CLASS_COUNTS_CSV   = os.path.join(DATA_DIR, "public_benchmark_class_counts.csv")
LEAKAGE_REPORT     = os.path.join(DATA_DIR, "public_benchmark_leakage_report.json")

TRAIN_RATIO = 0.80
SEED        = 42
IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp', '.bmp')

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_class_labels(path):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Class labels JSON not found: {path}")
    with open(path, 'r', encoding='utf-8') as f:
        labels = json.load(f)
    assert isinstance(labels, list) and len(labels) > 0, "class_labels_public.json must be a non-empty list"
    return labels


def verify_image_readable(path):
    """Returns (ok: bool, reason: str)."""
    if os.path.getsize(path) == 0:
        return False, "zero-byte file"
    img = cv2.imread(path)
    if img is None:
        return False, "OpenCV could not decode image"
    return True, "ok"


def safe_copy(src, dst):
    """Copy src -> dst; raise on failure."""
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)
    if not os.path.exists(dst):
        raise RuntimeError(f"Copy failed silently: {src} -> {dst}")


# ---------------------------------------------------------------------------
# Main preparation routine
# ---------------------------------------------------------------------------

def run_benchmark_preparation():
    random.seed(SEED)
    np.random.seed(SEED)

    timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    print("=" * 60)
    print("AGRISMART AI — PUBLIC BENCHMARK DATASET PREPARATION")
    print(f"Timestamp : {timestamp}")
    print(f"Seed      : {SEED}")
    print(f"Train/Val : {int(TRAIN_RATIO*100)}/{int((1-TRAIN_RATIO)*100)}")
    print("=" * 60)
    print(f"[Config] PlantVillage source : {PV_DIR}")
    print(f"[Config] PlantDoc test source: {PD_TEST_DIR}")
    print(f"[Config] Processed output    : {PROCESSED_DIR}")
    print(f"[Config] Class labels        : {LABELS_PATH}")

    # ------------------------------------------------------------------
    # 0. Validate source directories exist
    # ------------------------------------------------------------------
    for label, path in [("PlantVillage", PV_DIR), ("PlantDoc test", PD_TEST_DIR), ("Class labels", LABELS_PATH)]:
        if not os.path.exists(path):
            print(f"\n[FATAL] {label} path does not exist: {path}")
            sys.exit(1)

    # ------------------------------------------------------------------
    # 1. Load authoritative 28-class list
    # ------------------------------------------------------------------
    canonical_classes = load_class_labels(LABELS_PATH)
    num_classes = len(canonical_classes)
    canonical_set = set(canonical_classes)
    print(f"\n[Labels] Loaded {num_classes} canonical benchmark classes from class_labels_public.json")

    # ------------------------------------------------------------------
    # 2. Scan PlantVillage — restrict to canonical classes only
    # ------------------------------------------------------------------
    pv_all_classes, pv_all_files = scan_plantvillage_classes(PV_DIR)

    pv_classes = {}
    pv_files   = {}
    pv_excluded_classes = []
    for cls in canonical_classes:
        if cls in pv_all_classes:
            pv_classes[cls] = pv_all_classes[cls]
            pv_files[cls]   = pv_all_files[cls]
        else:
            pv_excluded_classes.append(cls)

    pv_total = sum(pv_classes.values())
    print(f"\n[PlantVillage] {len(pv_classes)} canonical classes found, {pv_total} images")
    if pv_excluded_classes:
        print(f"[PlantVillage] WARNING — canonical classes missing from PV: {pv_excluded_classes}")

    # ------------------------------------------------------------------
    # 3. Scan PlantDoc test — map to canonical, report unmapped
    # ------------------------------------------------------------------
    pd_raw_classes, pd_mapped_files, pd_unmapped, _ = scan_plantdoc_classes(PD_TEST_DIR)

    # Filter pd_mapped_files to canonical classes only
    pd_canonical_files  = {}
    pd_noncanonical     = {}
    for mapped_cls, files in pd_mapped_files.items():
        if mapped_cls in canonical_set:
            pd_canonical_files[mapped_cls] = files
        else:
            pd_noncanonical[mapped_cls] = files

    pd_total = sum(len(v) for v in pd_canonical_files.values())
    print(f"\n[PlantDoc] {len(pd_raw_classes)} raw folders scanned")
    print(f"[PlantDoc] {len(pd_canonical_files)} folders mapped to canonical classes, {pd_total} images")
    if pd_unmapped:
        print(f"[PlantDoc] Unmapped (excluded): {[u[0] for u in pd_unmapped]}")
    if pd_noncanonical:
        print(f"[PlantDoc] Mapped to non-canonical (excluded): {list(pd_noncanonical.keys())}")

    # Classes present only in PV (no PlantDoc test counterpart) — train/val only
    pv_only_classes = sorted([c for c in canonical_classes if c not in pd_canonical_files])
    print(f"\n[Policy] Classes with NO PlantDoc test split (train/val only): {pv_only_classes}")

    # ------------------------------------------------------------------
    # 4. Create output directories
    # ------------------------------------------------------------------
    train_dir      = os.path.join(PROCESSED_DIR, "train")
    val_dir        = os.path.join(PROCESSED_DIR, "val")
    test_field_dir = os.path.join(PROCESSED_DIR, "test_field")

    for d in [train_dir, val_dir, test_field_dir]:
        os.makedirs(d, exist_ok=True)

    # ------------------------------------------------------------------
    # 5. PlantVillage → stratified 80/20 train/val split
    # ------------------------------------------------------------------
    print("\n--- STEP 1: PlantVillage Train/Val Split ---")
    train_count = 0
    val_count   = 0
    # hash -> (split_name, class_name, dst_path)
    all_train_val_hashes = {}
    per_class_train = {}
    per_class_val   = {}

    for cls in canonical_classes:
        files = pv_files.get(cls, [])
        if len(files) == 0:
            print(f"  [SKIP] {cls} — no PlantVillage images")
            per_class_train[cls] = 0
            per_class_val[cls]   = 0
            continue

        n         = len(files)
        val_size  = max(1, int(round((1.0 - TRAIN_RATIO) * n)))
        trn_size  = n - val_size

        # Stratification is not applicable within a single class; use plain split
        trn_idx, val_idx = train_test_split(
            list(range(n)), train_size=trn_size, test_size=val_size,
            random_state=SEED, shuffle=True
        )

        cls_train_dir = os.path.join(train_dir, cls)
        cls_val_dir   = os.path.join(val_dir,   cls)
        os.makedirs(cls_train_dir, exist_ok=True)
        os.makedirs(cls_val_dir,   exist_ok=True)

        for i, idx in enumerate(trn_idx):
            src      = files[idx]
            ext      = os.path.splitext(src)[1].lower()
            dst_name = f"pv_train_{i:05d}{ext}"
            dst      = os.path.join(cls_train_dir, dst_name)
            safe_copy(src, dst)
            h = compute_file_hash(dst)
            all_train_val_hashes[h] = ("train", cls, dst)
            train_count += 1

        for i, idx in enumerate(val_idx):
            src      = files[idx]
            ext      = os.path.splitext(src)[1].lower()
            dst_name = f"pv_val_{i:05d}{ext}"
            dst      = os.path.join(cls_val_dir, dst_name)
            safe_copy(src, dst)
            h = compute_file_hash(dst)
            all_train_val_hashes[h] = ("val", cls, dst)
            val_count += 1

        per_class_train[cls] = trn_size
        per_class_val[cls]   = val_size
        print(f"  {cls}: {n} total -> {trn_size} train / {val_size} val")

    print(f"\n[Split] Train: {train_count}  Val: {val_count}  Total PV used: {train_count + val_count}")

    # ------------------------------------------------------------------
    # 6. PlantDoc test → test_field (with active leakage removal)
    # ------------------------------------------------------------------
    print("\n--- STEP 2: PlantDoc Field Test Set (with leakage audit) ---")

    field_count        = 0
    field_hashes       = {}          # hash -> dst_path
    leakage_removed    = []          # records of removed files
    per_class_field    = {}
    field_copy_records = []          # (canonical_cls, raw_folder, src, dst, hash)

    for cls in canonical_classes:
        files = pd_canonical_files.get(cls, [])
        per_class_field[cls] = 0
        if len(files) == 0:
            continue

        cls_field_dir = os.path.join(test_field_dir, cls)
        os.makedirs(cls_field_dir, exist_ok=True)

        for i, src in enumerate(files):
            ext      = os.path.splitext(src)[1].lower()
            dst_name = f"pd_field_{i:05d}{ext}"
            dst      = os.path.join(cls_field_dir, dst_name)
            safe_copy(src, dst)
            h = compute_file_hash(dst)

            # FIX-2: Active leakage removal
            if h in all_train_val_hashes:
                conflict_split, conflict_cls, conflict_path = all_train_val_hashes[h]
                leakage_removed.append({
                    "removed_from"      : "test_field",
                    "test_field_class"  : cls,
                    "test_field_src"    : src,
                    "test_field_dst"    : dst,
                    "hash"              : h,
                    "also_in_split"     : conflict_split,
                    "also_in_class"     : conflict_cls,
                    "also_in_path"      : conflict_path,
                    "action"            : "removed_from_test_field"
                })
                os.remove(dst)
                print(f"  [LEAKAGE REMOVED] {cls} / {os.path.basename(src)} "
                      f"— hash also in {conflict_split}/{conflict_cls}")
                continue

            field_hashes[h] = dst
            field_count += 1
            per_class_field[cls] += 1
            field_copy_records.append((cls, dst, h))

    print(f"\n[Field] Copied: {field_count}  Leakage removed: {len(leakage_removed)}")

    # Also check for internal test_field SHA-256 duplicates (within test_field itself)
    hash_to_field_paths = defaultdict(list)
    for cls, dst, h in field_copy_records:
        hash_to_field_paths[h].append((cls, dst))
    intra_field_dupes = {h: paths for h, paths in hash_to_field_paths.items() if len(paths) > 1}
    if intra_field_dupes:
        print(f"  [WARNING] {len(intra_field_dupes)} intra-test_field hash collision groups — keeping first occurrence")
        for h, paths in intra_field_dupes.items():
            for cls, dst in paths[1:]:
                os.remove(dst)
                per_class_field[cls] -= 1
                field_count -= 1
                leakage_removed.append({
                    "removed_from"    : "test_field",
                    "test_field_class": cls,
                    "test_field_dst"  : dst,
                    "hash"            : h,
                    "action"          : "intra_test_field_duplicate_removed"
                })

    # ------------------------------------------------------------------
    # 7. Final cross-split SHA-256 verification (train+val vs test_field)
    # ------------------------------------------------------------------
    print("\n--- STEP 3: Final Cross-Split Leakage Verification ---")
    residual_leakage = set(all_train_val_hashes.keys()) & set(field_hashes.keys())
    if residual_leakage:
        print(f"[FATAL] {len(residual_leakage)} residual leakage hashes remain after removal — aborting!")
        for h in residual_leakage:
            print(f"  Hash: {h}")
        sys.exit(2)
    else:
        print(f"[PASSED] Zero cross-split SHA-256 collisions between train/val and test_field.")

    # ------------------------------------------------------------------
    # 8. Per-class count consolidation and imbalance stats
    # ------------------------------------------------------------------
    summary_rows = []
    for cls in canonical_classes:
        t = per_class_train.get(cls, 0)
        v = per_class_val.get(cls, 0)
        f = per_class_field.get(cls, 0)
        summary_rows.append({
            "class_name"            : cls,
            "plantvillage_total"    : pv_classes.get(cls, 0),
            "train_count"           : t,
            "val_count"             : v,
            "test_field_count"      : f,
            "has_test_field"        : f > 0,
            "total_benchmark"       : t + v + f,
        })

    df = pd.DataFrame(summary_rows)

    train_counts_per_class = [r["train_count"] for r in summary_rows if r["train_count"] > 0]
    imbalance_ratio = round(max(train_counts_per_class) / min(train_counts_per_class), 2) if train_counts_per_class else 0.0
    classes_with_no_test   = [r["class_name"] for r in summary_rows if not r["has_test_field"]]
    classes_with_no_train  = [r["class_name"] for r in summary_rows if r["train_count"] == 0]

    print(f"\n[Imbalance] Train class count range: "
          f"{min(train_counts_per_class)} – {max(train_counts_per_class)} "
          f"(ratio {imbalance_ratio}x)")
    print(f"[Coverage] Classes with no test_field split: {classes_with_no_test}")

    # ------------------------------------------------------------------
    # 9. Save reports
    # ------------------------------------------------------------------
    os.makedirs(DATA_DIR, exist_ok=True)

    # --- A. Main benchmark report ---
    final_train    = sum(per_class_train.values())
    final_val      = sum(per_class_val.values())
    final_field    = sum(per_class_field.values())
    total_excluded = len(leakage_removed)

    benchmark_report = {
        "benchmark_name"            : "AgriSmart AI Public Benchmark (PlantVillage Lab + PlantDoc Field)",
        "creation_timestamp"        : timestamp,
        "seed"                      : SEED,
        "train_ratio"               : TRAIN_RATIO,
        "val_ratio"                 : round(1.0 - TRAIN_RATIO, 2),
        "source_directories"        : {
            "plantvillage"          : PV_DIR,
            "plantdoc_test"         : PD_TEST_DIR,
            "processed_output"      : PROCESSED_DIR,
        },
        "class_labels_path"         : LABELS_PATH,
        "num_canonical_classes"     : num_classes,
        "canonical_classes"         : canonical_classes,
        "classes_with_no_test_field": classes_with_no_test,
        "classes_with_no_train"     : classes_with_no_train,
        "plantvillage_source_count" : pv_total,
        "plantdoc_test_source_count": pd_total,
        "final_train_count"         : final_train,
        "final_val_count"           : final_val,
        "final_test_field_count"    : final_field,
        "total_benchmark_images"    : final_train + final_val + final_field,
        "excluded_images_total"     : total_excluded,
        "cross_split_leakage_removed": len([r for r in leakage_removed
                                            if r["action"] == "removed_from_test_field"]),
        "intra_test_field_dupes_removed": len([r for r in leakage_removed
                                               if r["action"] == "intra_test_field_duplicate_removed"]),
        "plantdoc_unmapped_raw_folders" : [u[0] for u in pd_unmapped],
        "leakage_audit_result"      : "PASSED — zero residual cross-split SHA-256 collisions",
        "imbalance_stats"           : {
            "min_train_count"       : int(min(train_counts_per_class)) if train_counts_per_class else 0,
            "max_train_count"       : int(max(train_counts_per_class)) if train_counts_per_class else 0,
            "imbalance_ratio_max_min": imbalance_ratio,
        },
        "per_class_counts"          : {
            r["class_name"]: {
                "pv_source"    : r["plantvillage_total"],
                "train"        : r["train_count"],
                "val"          : r["val_count"],
                "test_field"   : r["test_field_count"],
            } for r in summary_rows
        },
    }

    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(benchmark_report, f, indent=2)
    print(f"\n[Report] Saved: {REPORT_PATH}")

    # --- B. Per-class CSV ---
    df.to_csv(CLASS_COUNTS_CSV, index=False)
    print(f"[Report] Saved: {CLASS_COUNTS_CSV}")

    # --- C. Leakage report ---
    leakage_report = {
        "audit_timestamp"           : timestamp,
        "hash_algorithm"            : "SHA-256",
        "total_exclusions"          : total_excluded,
        "cross_split_leakage_count" : len([r for r in leakage_removed
                                           if r["action"] == "removed_from_test_field"]),
        "intra_test_field_dupe_count": len([r for r in leakage_removed
                                            if r["action"] == "intra_test_field_duplicate_removed"]),
        "residual_leakage_after_removal": 0,
        "final_audit_result"        : "PASSED",
        "removed_records"           : leakage_removed,
    }
    with open(LEAKAGE_REPORT, 'w', encoding='utf-8') as f:
        json.dump(leakage_report, f, indent=2)
    print(f"[Report] Saved: {LEAKAGE_REPORT}")

    print("\n" + "=" * 60)
    print("BENCHMARK PREPARATION COMPLETE")
    print(f"  Train       : {final_train}")
    print(f"  Val         : {final_val}")
    print(f"  Test Field  : {final_field}")
    print(f"  Classes     : {num_classes}")
    print(f"  Excluded    : {total_excluded}")
    print("=" * 60)

    return benchmark_report, leakage_report


if __name__ == "__main__":
    run_benchmark_preparation()
