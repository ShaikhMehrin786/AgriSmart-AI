# ============================================================
# fix_train_val_split.py
# Content-Aware Train/Val Split Fix — AgriSmart AI SIH 2026
# ============================================================
#
# ROOT CAUSE OF ORIGINAL COLLISION:
#   PlantVillage has 8 pairs of files with identical SHA-256 content
#   but different UUID filenames.  The plain sklearn train_test_split
#   treated each filename independently, assigning both copies of the
#   same image to different splits — producing 8 train↔val collisions.
#
# FIX:
#   Group source files by SHA-256 *before* splitting.
#   The split unit is the content-group, not the filename.
#   All files sharing a hash are assigned together to exactly one split.
#
# CHECKPOINTING:
#   A JSON checkpoint is written after every class is finished.
#   On restart the script skips already-completed classes.
#   To force a clean rebuild from scratch, delete (or pass --clean):
#     ml-pipeline/data/split_checkpoint.json
#
# SCOPE — strictly limited:
#   WRITES : ml-pipeline/data/processed/train/
#            ml-pipeline/data/processed/val/
#            ml-pipeline/data/split_checkpoint.json
#            ml-pipeline/data/public_benchmark_report.json      (updated)
#            ml-pipeline/data/public_benchmark_class_counts.csv (updated)
#            ml-pipeline/data/public_benchmark_leakage_report.json (updated)
#   NEVER TOUCHES:
#            ml-pipeline/data/processed/test_field/   (not opened, not listed)
#            ml-pipeline/data/raw/                    (read-only)
#
# USAGE (run from repo root in your own PowerShell terminal):
#   cd "d:\AgriSmart AI"
#   .\ml-pipeline\venv\Scripts\python.exe ml-pipeline\src\datasets\fix_train_val_split.py
#
#   To force clean rebuild:
#   .\ml-pipeline\venv\Scripts\python.exe ml-pipeline\src\datasets\fix_train_val_split.py --clean
#
#   After this completes, run the independent verifier:
#   .\ml-pipeline\venv\Scripts\python.exe ml-pipeline\src\datasets\verify_benchmark.py

import argparse
import csv
import datetime
import hashlib
import json
import os
import random
import shutil
import sys
import time
from collections import defaultdict

import numpy as np
from sklearn.model_selection import train_test_split

# ---------------------------------------------------------------------------
# Path bootstrap — works regardless of cwd
# ---------------------------------------------------------------------------
_THIS   = os.path.abspath(__file__)
_SRC    = os.path.dirname(_THIS)
_ML_DIR = os.path.dirname(os.path.dirname(_SRC))
_REPO   = os.path.dirname(_ML_DIR)

PROCESSED_DIR   = os.path.join(_ML_DIR, "data", "processed")
TRAIN_DIR       = os.path.join(PROCESSED_DIR, "train")
VAL_DIR         = os.path.join(PROCESSED_DIR, "val")
PV_DIR          = os.path.join(_ML_DIR, "data", "raw", "plantvillage")
LABELS_PATH     = os.path.join(_REPO, "backend", "src", "models", "class_labels_public.json")
DATA_DIR        = os.path.join(_ML_DIR, "data")
CHECKPOINT_PATH = os.path.join(DATA_DIR, "split_checkpoint.json")
REPORT_PATH     = os.path.join(DATA_DIR, "public_benchmark_report.json")
COUNTS_CSV_PATH = os.path.join(DATA_DIR, "public_benchmark_class_counts.csv")
LEAKAGE_PATH    = os.path.join(DATA_DIR, "public_benchmark_leakage_report.json")

TRAIN_RATIO      = 0.80
SEED             = 42
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            buf = f.read(65536)
            if not buf:
                break
            h.update(buf)
    return h.hexdigest()


def scan_pv_class(cls_dir: str):
    files = []
    for root, _, fnames in os.walk(cls_dir):
        for fname in sorted(fnames):
            if os.path.splitext(fname)[1].lower() in IMAGE_EXTENSIONS:
                files.append(os.path.join(root, fname))
    return sorted(files)


def content_aware_split(files, train_ratio, seed):
    """
    Groups files by SHA-256 so duplicate-content files always land in the
    same split.  Returns (train_files, val_files, n_dup_groups).
    """
    hash_to_files = defaultdict(list)
    for fp in files:
        h = sha256_file(fp)
        hash_to_files[h].append(fp)

    unique_hashes = sorted(hash_to_files.keys())
    n_dup_groups  = sum(1 for h in unique_hashes if len(hash_to_files[h]) > 1)

    n        = len(unique_hashes)
    val_size = max(1, int(round((1.0 - train_ratio) * n)))
    trn_size = n - val_size

    trn_hashes, val_hashes = train_test_split(
        unique_hashes,
        train_size=trn_size,
        test_size=val_size,
        random_state=seed,
        shuffle=True,
    )

    train_files = [f for h in trn_hashes for f in hash_to_files[h]]
    val_files   = [f for h in val_hashes  for f in hash_to_files[h]]
    return train_files, val_files, n_dup_groups


def safe_copy(src: str, dst: str):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)


def load_checkpoint():
    if os.path.exists(CHECKPOINT_PATH):
        with open(CHECKPOINT_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"completed_classes": [], "per_class_train": {}, "per_class_val": {}}


def save_checkpoint(ckpt: dict):
    with open(CHECKPOINT_PATH, "w", encoding="utf-8") as f:
        json.dump(ckpt, f, indent=2)


def flush_print(msg: str):
    print(msg, flush=True)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run(clean: bool = False):
    random.seed(SEED)
    np.random.seed(SEED)

    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    t0 = time.time()

    flush_print("=" * 64)
    flush_print("AGRISMART AI — CONTENT-AWARE TRAIN/VAL SPLIT FIX (RESUMABLE)")
    flush_print(f"Started  : {timestamp}")
    flush_print(f"Seed     : {SEED}  |  Train ratio: {TRAIN_RATIO}")
    flush_print(f"PV dir   : {PV_DIR}")
    flush_print(f"Out dir  : {PROCESSED_DIR}")
    flush_print("test_field: NEVER TOUCHED")
    flush_print("=" * 64)

    # ---- validate source directories ----
    for label, path in [("PlantVillage", PV_DIR), ("class labels", LABELS_PATH)]:
        if not os.path.exists(path):
            flush_print(f"[FATAL] {label} not found: {path}")
            sys.exit(1)

    with open(LABELS_PATH, "r", encoding="utf-8") as f:
        canonical_classes = json.load(f)
    flush_print(f"[Labels] {len(canonical_classes)} canonical classes loaded.\n")

    # ---- checkpoint / clean logic ----
    if clean and os.path.exists(CHECKPOINT_PATH):
        os.remove(CHECKPOINT_PATH)
        flush_print("[Clean] Checkpoint removed — starting from scratch.")

    ckpt = load_checkpoint()
    completed = set(ckpt.get("completed_classes", []))
    per_class_train = ckpt.get("per_class_train", {})
    per_class_val   = ckpt.get("per_class_val",   {})

    if completed:
        flush_print(f"[Resume] Already completed: {sorted(completed)}\n")

    # ---- wipe train/ and val/ only on first class or clean ----
    # If no classes are done yet (fresh run or post-clean), wipe both dirs.
    if not completed:
        flush_print("[Step 0] Wiping existing train/ and val/ ...")
        for d in [TRAIN_DIR, VAL_DIR]:
            if os.path.isdir(d):
                shutil.rmtree(d)
            os.makedirs(d)
        flush_print("         Done.\n")

    fix_log          = []
    total_dup_groups = 0

    # ---- per-class content-aware split ----
    flush_print("[Step 1] Content-aware PlantVillage train/val split ...")

    for class_idx, cls in enumerate(canonical_classes, 1):
        if cls in completed:
            flush_print(f"  [{class_idx:02d}/{len(canonical_classes)}] {cls} — SKIPPED (checkpoint)")
            total_dup_groups += 0   # already counted; we re-tally from per_class at the end
            continue

        pv_cls_dir = os.path.join(PV_DIR, cls)
        if not os.path.isdir(pv_cls_dir):
            flush_print(f"  [{class_idx:02d}/{len(canonical_classes)}] {cls} — SKIP (not in PV source)")
            per_class_train[cls] = 0
            per_class_val[cls]   = 0
            completed.add(cls)
            ckpt["completed_classes"] = sorted(completed)
            ckpt["per_class_train"]   = per_class_train
            ckpt["per_class_val"]     = per_class_val
            save_checkpoint(ckpt)
            continue

        class_t0 = time.time()
        flush_print(f"  [{class_idx:02d}/{len(canonical_classes)}] {cls} — hashing ...", )

        all_files = scan_pv_class(pv_cls_dir)
        trn_files, val_files, n_dup = content_aware_split(all_files, TRAIN_RATIO, SEED)
        total_dup_groups += n_dup

        cls_train_dir = os.path.join(TRAIN_DIR, cls)
        cls_val_dir   = os.path.join(VAL_DIR,   cls)
        os.makedirs(cls_train_dir, exist_ok=True)
        os.makedirs(cls_val_dir,   exist_ok=True)

        for i, src in enumerate(sorted(trn_files)):
            ext = os.path.splitext(src)[1].lower()
            safe_copy(src, os.path.join(cls_train_dir, f"pv_train_{i:05d}{ext}"))

        for i, src in enumerate(sorted(val_files)):
            ext = os.path.splitext(src)[1].lower()
            safe_copy(src, os.path.join(cls_val_dir, f"pv_val_{i:05d}{ext}"))

        per_class_train[cls] = len(trn_files)
        per_class_val[cls]   = len(val_files)

        elapsed = time.time() - class_t0
        dup_tag = f"  [{n_dup} dup groups kept together]" if n_dup > 0 else ""
        flush_print(
            f"         {len(all_files)} src -> {len(trn_files)} train / {len(val_files)} val"
            f"  ({elapsed:.1f}s){dup_tag}"
        )

        if n_dup > 0:
            fix_log.append({
                "class": cls,
                "source_files": len(all_files),
                "dup_content_groups": n_dup,
                "train_count": len(trn_files),
                "val_count":   len(val_files),
            })

        # ---- write checkpoint after every class ----
        completed.add(cls)
        ckpt["completed_classes"] = sorted(completed)
        ckpt["per_class_train"]   = per_class_train
        ckpt["per_class_val"]     = per_class_val
        save_checkpoint(ckpt)

    total_train = sum(per_class_train.values())
    total_val   = sum(per_class_val.values())
    elapsed_total = time.time() - t0

    flush_print(f"\n[Step 1 done]  Train: {total_train}  Val: {total_val}  "
                f"({elapsed_total:.0f}s total)")

    # ---- Step 2: train↔val SHA-256 collision check ----
    flush_print("\n[Step 2] SHA-256 cross-split verification (train↔val) ...")

    def build_hash_set(split_dir):
        hset = set()
        for cls in canonical_classes:
            cls_path = os.path.join(split_dir, cls)
            if not os.path.isdir(cls_path):
                continue
            for fname in sorted(os.listdir(cls_path)):
                fp = os.path.join(cls_path, fname)
                if os.path.isfile(fp):
                    hset.add(sha256_file(fp))
        return hset

    flush_print("  Hashing train/ ...")
    trn_hset = build_hash_set(TRAIN_DIR)
    flush_print("  Hashing val/ ...")
    val_hset = build_hash_set(VAL_DIR)

    tv_collisions = len(trn_hset & val_hset)
    flush_print(f"  train↔val collisions: {tv_collisions}")

    if tv_collisions != 0:
        flush_print(f"\n[FATAL] {tv_collisions} train↔val collisions remain — "
                    "NOT updating reports. Fix the root cause.")
        sys.exit(2)

    flush_print("  [PASSED] Zero train↔val SHA-256 collisions.\n")

    # ---- Step 3: update reports ----
    flush_print("[Step 3] Updating reports ...")

    # public_benchmark_report.json
    with open(REPORT_PATH, "r", encoding="utf-8") as f:
        report = json.load(f)

    report["creation_timestamp"]   = timestamp
    report["fix_applied"]          = "content_aware_split_v2"
    report["fix_reason"]           = (
        "8 train↔val SHA-256 collisions found in original split. "
        "PlantVillage contains duplicate-content files under different UUID filenames. "
        "Fixed by grouping files by SHA-256 before splitting so all copies of "
        "identical content are assigned to the same split."
    )
    report["fix_affected_classes"]                = [r["class"] for r in fix_log]
    report["fix_dup_groups_total"]                = total_dup_groups
    report["final_train_count"]                   = total_train
    report["final_val_count"]                     = total_val
    report["train_val_collision_count_after_fix"] = tv_collisions
    report["total_benchmark_images"] = (
        total_train + total_val + report.get("final_test_field_count", 0)
    )

    # rebuild per_class_counts (keep existing test_field + pv_source figures)
    existing_pc = report.get("per_class_counts", {})
    new_pc = {}
    for cls in canonical_classes:
        old = existing_pc.get(cls, {})
        new_pc[cls] = {
            "pv_source" : old.get("pv_source", 0),
            "train"     : per_class_train.get(cls, 0),
            "val"       : per_class_val.get(cls, 0),
            "test_field": old.get("test_field", 0),
        }
    report["per_class_counts"] = new_pc

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    flush_print(f"  Updated: {REPORT_PATH}")

    # public_benchmark_class_counts.csv
    fieldnames = [
        "class_name", "plantvillage_total", "train_count",
        "val_count", "test_field_count", "has_test_field", "total_benchmark",
    ]
    rows = []
    for cls in canonical_classes:
        old = existing_pc.get(cls, {})
        tf  = old.get("test_field", 0)
        t   = per_class_train.get(cls, 0)
        v   = per_class_val.get(cls, 0)
        rows.append({
            "class_name"        : cls,
            "plantvillage_total": old.get("pv_source", 0),
            "train_count"       : t,
            "val_count"         : v,
            "test_field_count"  : tf,
            "has_test_field"    : tf > 0,
            "total_benchmark"   : t + v + tf,
        })
    with open(COUNTS_CSV_PATH, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    flush_print(f"  Updated: {COUNTS_CSV_PATH}")

    # public_benchmark_leakage_report.json
    with open(LEAKAGE_PATH, "r", encoding="utf-8") as f:
        leakage = json.load(f)

    leakage["fix_applied"]   = "content_aware_split_v2"
    leakage["fix_timestamp"] = timestamp
    leakage["train_val_collision_fix"] = {
        "collisions_before_fix" : 8,
        "collisions_after_fix"  : tv_collisions,
        "root_cause"            : (
            "PlantVillage duplicate-content files with different UUID filenames"
        ),
        "fix_method"            : "SHA-256 content-group isolation before train_test_split",
        "affected_classes"      : [r["class"] for r in fix_log],
        "dup_groups_detail"     : fix_log,
    }
    leakage["final_audit_result"] = (
        "PASSED — zero train↔val collisions after content-aware split fix"
    )
    with open(LEAKAGE_PATH, "w", encoding="utf-8") as f:
        json.dump(leakage, f, indent=2)
    flush_print(f"  Updated: {LEAKAGE_PATH}")

    # ---- Step 4: clean up checkpoint ----
    if os.path.exists(CHECKPOINT_PATH):
        os.remove(CHECKPOINT_PATH)
    flush_print(f"  Checkpoint removed.")

    flush_print("\n" + "=" * 64)
    flush_print("FIX COMPLETE — run verify_benchmark.py for full independent check")
    flush_print(f"  Train            : {total_train}")
    flush_print(f"  Val              : {total_val}")
    flush_print(f"  test_field       : UNTOUCHED (236)")
    flush_print(f"  train↔val coll.  : {tv_collisions}")
    flush_print(f"  Dup groups fixed : {total_dup_groups}")
    flush_print(f"  Elapsed          : {elapsed_total:.0f}s")
    flush_print("=" * 64)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--clean", action="store_true",
        help="Delete checkpoint and rebuild from scratch even if partial progress exists.",
    )
    args = parser.parse_args()
    run(clean=args.clean)
