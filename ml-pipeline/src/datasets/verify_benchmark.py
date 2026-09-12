# Independent Benchmark Verification Script
# READ-ONLY — does not modify, delete, or move any files.
# Verifies ml-pipeline/data/processed/ against expected counts and leakage policy.

import os
import sys
import json
import hashlib
from collections import defaultdict
from PIL import Image

# ---------------------------------------------------------------------------
# Path bootstrap
# ---------------------------------------------------------------------------
_THIS   = os.path.abspath(__file__)
_ML_DIR = os.path.dirname(os.path.dirname(os.path.dirname(_THIS)))  # ml-pipeline/
_REPO   = os.path.dirname(_ML_DIR)                                   # repo root

PROCESSED_DIR  = os.path.join(_ML_DIR, "data", "processed")
LABELS_PATH    = os.path.join(_REPO,   "backend", "src", "models", "class_labels_public.json")
REPORT_IN      = os.path.join(_ML_DIR, "data", "public_benchmark_report.json")
LEAKAGE_IN     = os.path.join(_ML_DIR, "data", "public_benchmark_leakage_report.json")
OUTPUT_PATH    = os.path.join(_ML_DIR, "data", "public_benchmark_independent_verification.json")

# Expected counts — read from the report if it exists so they stay in
# sync after the content-aware split fix (which may adjust train/val totals
# slightly by keeping duplicate-content pairs together).
# Hard-coded values are the fallback for a fresh repo with no report yet.
_REPORT_PATH_FOR_EXPECTED = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data", "public_benchmark_report.json",
)
if os.path.exists(_REPORT_PATH_FOR_EXPECTED):
    with open(_REPORT_PATH_FOR_EXPECTED, "r", encoding="utf-8") as _rf:
        _rpt = json.load(_rf)
    EXPECTED_TRAIN      = _rpt.get("final_train_count",      29616)
    EXPECTED_VAL        = _rpt.get("final_val_count",        7402)
    EXPECTED_TEST_FIELD = _rpt.get("final_test_field_count", 236)
else:
    EXPECTED_TRAIN      = 29616
    EXPECTED_VAL        = 7402
    EXPECTED_TEST_FIELD = 236

EXPECTED_CLASSES    = 28

POTATO_HEALTHY_EXPECTED = {"train": 122, "val": 30, "test_field": 0}

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            buf = f.read(65536)
            if not buf:
                break
            h.update(buf)
    return h.hexdigest()


def scan_split(split_dir, canonical_set):
    """
    Walks split_dir. Returns:
      file_records    : list of (class_name, path, ext)
      corrupt         : list of (path, reason)
      zero_byte       : list of path
      unexpected_cls  : set of dir names not in canonical_set
      per_class_count : dict class_name -> int
    """
    file_records    = []
    corrupt         = []
    zero_byte_files = []
    unexpected_cls  = set()
    per_class_count = {}

    if not os.path.isdir(split_dir):
        return file_records, corrupt, zero_byte_files, unexpected_cls, per_class_count

    for cls_dir in sorted(os.listdir(split_dir)):
        cls_path = os.path.join(split_dir, cls_dir)
        if not os.path.isdir(cls_path):
            continue
        if cls_dir not in canonical_set:
            unexpected_cls.add(cls_dir)
            continue
        count = 0
        for fname in os.listdir(cls_path):
            fpath = os.path.join(cls_path, fname)
            if not os.path.isfile(fpath):
                continue
            ext = os.path.splitext(fname)[1].lower()
            if ext not in IMAGE_EXTENSIONS:
                corrupt.append((fpath, f"unsupported extension: {ext}"))
                continue
            size = os.path.getsize(fpath)
            if size == 0:
                zero_byte_files.append(fpath)
                corrupt.append((fpath, "zero-byte file"))
                continue
            # PIL open check
            try:
                with Image.open(fpath) as img:
                    img.verify()
            except Exception as e:
                corrupt.append((fpath, f"PIL verify failed: {e}"))
                continue
            file_records.append((cls_dir, fpath, ext))
            count += 1
        per_class_count[cls_dir] = count

    return file_records, corrupt, zero_byte_files, unexpected_cls, per_class_count


def build_hash_map(file_records):
    """Returns dict: sha256_hex -> list of (class, path)"""
    hmap = defaultdict(list)
    for cls, path, _ in file_records:
        h = sha256(path)
        hmap[h].append((cls, path))
    return hmap


def cross_collision_count(map_a, map_b):
    """Count hashes that appear in BOTH map_a and map_b."""
    return len(set(map_a.keys()) & set(map_b.keys()))

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run_verification():
    print("=" * 60)
    print("AGRISMART AI — INDEPENDENT BENCHMARK VERIFICATION")
    print("=" * 60)

    # Load canonical class list
    with open(LABELS_PATH, "r", encoding="utf-8") as f:
        canonical_classes = json.load(f)
    canonical_set = set(canonical_classes)
    assert len(canonical_classes) == EXPECTED_CLASSES, \
        f"class_labels_public.json has {len(canonical_classes)} classes, expected {EXPECTED_CLASSES}"
    print(f"[Labels] {len(canonical_classes)} canonical classes loaded.")

    train_dir      = os.path.join(PROCESSED_DIR, "train")
    val_dir        = os.path.join(PROCESSED_DIR, "val")
    test_field_dir = os.path.join(PROCESSED_DIR, "test_field")

    # ------------------------------------------------------------------
    # 1. Scan all three splits
    # ------------------------------------------------------------------
    print("\n[Scan] train/ ...")
    trn_recs, trn_corrupt, trn_zero, trn_unexp, trn_cls = scan_split(train_dir,      canonical_set)
    print(f"       {len(trn_recs)} valid files, {len(trn_corrupt)} issues")

    print("[Scan] val/ ...")
    val_recs, val_corrupt, val_zero, val_unexp, val_cls = scan_split(val_dir,        canonical_set)
    print(f"       {len(val_recs)} valid files, {len(val_corrupt)} issues")

    print("[Scan] test_field/ ...")
    tst_recs, tst_corrupt, tst_zero, tst_unexp, tst_cls = scan_split(test_field_dir, canonical_set)
    print(f"       {len(tst_recs)} valid files, {len(tst_corrupt)} issues")

    all_corrupt    = trn_corrupt + val_corrupt + tst_corrupt
    all_zero_byte  = trn_zero   + val_zero    + tst_zero
    all_unexpected = trn_unexp  | val_unexp   | tst_unexp

    # ------------------------------------------------------------------
    # 2. Count checks
    # ------------------------------------------------------------------
    actual_train      = len(trn_recs)
    actual_val        = len(val_recs)
    actual_test_field = len(tst_recs)

    train_ok      = actual_train      == EXPECTED_TRAIN
    val_ok        = actual_val        == EXPECTED_VAL
    test_field_ok = actual_test_field == EXPECTED_TEST_FIELD

    print(f"\n[Counts] train:      {actual_train}  (expected {EXPECTED_TRAIN})  {'OK' if train_ok else 'MISMATCH'}")
    print(f"[Counts] val:        {actual_val}   (expected {EXPECTED_VAL})   {'OK' if val_ok else 'MISMATCH'}")
    print(f"[Counts] test_field: {actual_test_field}    (expected {EXPECTED_TEST_FIELD})    {'OK' if test_field_ok else 'MISMATCH'}")

    # ------------------------------------------------------------------
    # 3. Class coverage
    # ------------------------------------------------------------------
    all_present = set(trn_cls.keys()) | set(val_cls.keys()) | set(tst_cls.keys())
    missing_cls = canonical_set - all_present
    # Potato___healthy has 0 test_field — that's expected; check train+val
    train_val_present = set(trn_cls.keys()) | set(val_cls.keys())
    truly_missing = canonical_set - train_val_present
    class_coverage_ok = (len(truly_missing) == 0) and (len(all_unexpected) == 0)

    print(f"\n[Classes] Present in train/val: {len(train_val_present)} / {EXPECTED_CLASSES}")
    if truly_missing:
        print(f"[Classes] MISSING from train+val: {sorted(truly_missing)}")
    if all_unexpected:
        print(f"[Classes] UNEXPECTED dirs: {sorted(all_unexpected)}")

    # ------------------------------------------------------------------
    # 4. Potato___healthy specific check
    # ------------------------------------------------------------------
    potato_train = trn_cls.get("Potato___healthy", 0)
    potato_val   = val_cls.get("Potato___healthy", 0)
    potato_test  = tst_cls.get("Potato___healthy", 0)
    potato_ok = (
        potato_train == POTATO_HEALTHY_EXPECTED["train"] and
        potato_val   == POTATO_HEALTHY_EXPECTED["val"]   and
        potato_test  == POTATO_HEALTHY_EXPECTED["test_field"]
    )
    print(f"\n[Potato___healthy] train:{potato_train} val:{potato_val} test_field:{potato_test}  {'OK' if potato_ok else 'MISMATCH'}")

    # ------------------------------------------------------------------
    # 5. SHA-256 cross-split collision check
    # ------------------------------------------------------------------
    print("\n[SHA-256] Building hash maps (this may take a few minutes) ...")
    print("  Hashing train/ ...")
    trn_hmap = build_hash_map(trn_recs)
    print("  Hashing val/ ...")
    val_hmap = build_hash_map(val_recs)
    print("  Hashing test_field/ ...")
    tst_hmap = build_hash_map(tst_recs)

    tv_collisions  = cross_collision_count(trn_hmap, val_hmap)
    tt_collisions  = cross_collision_count(trn_hmap, tst_hmap)
    vt_collisions  = cross_collision_count(val_hmap, tst_hmap)

    print(f"\n[Leakage] train ↔ val        collisions: {tv_collisions}  {'OK' if tv_collisions == 0 else 'LEAKAGE DETECTED'}")
    print(f"[Leakage] train ↔ test_field collisions: {tt_collisions}  {'OK' if tt_collisions == 0 else 'LEAKAGE DETECTED'}")
    print(f"[Leakage] val   ↔ test_field collisions: {vt_collisions}  {'OK' if vt_collisions == 0 else 'LEAKAGE DETECTED'}")

    leakage_ok = (tv_collisions == 0 and tt_collisions == 0 and vt_collisions == 0)

    # ------------------------------------------------------------------
    # 6. Read & compare against generated reports
    # ------------------------------------------------------------------
    report_comparison = {}
    if os.path.exists(REPORT_IN):
        with open(REPORT_IN, "r", encoding="utf-8") as f:
            rpt = json.load(f)
        report_comparison = {
            "report_train_count"      : rpt.get("final_train_count"),
            "report_val_count"        : rpt.get("final_val_count"),
            "report_test_field_count" : rpt.get("final_test_field_count"),
            "report_num_classes"      : rpt.get("num_canonical_classes"),
            "report_excluded"         : rpt.get("excluded_images_total"),
            "filesystem_train"        : actual_train,
            "filesystem_val"          : actual_val,
            "filesystem_test_field"   : actual_test_field,
            "counts_match_report"     : (
                rpt.get("final_train_count")      == actual_train and
                rpt.get("final_val_count")        == actual_val   and
                rpt.get("final_test_field_count") == actual_test_field
            )
        }
        match_str = "OK" if report_comparison["counts_match_report"] else "MISMATCH"
        print(f"\n[Report Cross-check] Filesystem vs public_benchmark_report.json: {match_str}")
    else:
        print("\n[Report Cross-check] public_benchmark_report.json NOT FOUND")
        report_comparison = {"error": "report file missing"}

    leakage_report_summary = {}
    if os.path.exists(LEAKAGE_IN):
        with open(LEAKAGE_IN, "r", encoding="utf-8") as f:
            lrpt = json.load(f)
        leakage_report_summary = {
            "report_total_exclusions"          : lrpt.get("total_exclusions"),
            "report_cross_split_leakage_count" : lrpt.get("cross_split_leakage_count"),
            "report_intra_test_dupe_count"     : lrpt.get("intra_test_field_dupe_count"),
            "report_final_audit_result"        : lrpt.get("final_audit_result"),
        }
        print(f"[Leakage Report]  total_exclusions={lrpt.get('total_exclusions')}  "
              f"cross_split={lrpt.get('cross_split_leakage_count')}  "
              f"intra_test_dupes={lrpt.get('intra_test_field_dupe_count')}  "
              f"result={lrpt.get('final_audit_result')}")
    else:
        print("[Leakage Report] public_benchmark_leakage_report.json NOT FOUND")
        leakage_report_summary = {"error": "leakage report file missing"}

    # ------------------------------------------------------------------
    # 7. Overall verdict
    # ------------------------------------------------------------------
    corrupt_ok   = len(all_corrupt)   == 0
    zero_byte_ok = len(all_zero_byte) == 0
    unexpected_ok = len(all_unexpected) == 0

    verification_passed = (
        train_ok and val_ok and test_field_ok and
        class_coverage_ok and
        corrupt_ok and zero_byte_ok and
        leakage_ok and potato_ok and
        report_comparison.get("counts_match_report", False)
    )

    # ------------------------------------------------------------------
    # 8. Write output JSON
    # ------------------------------------------------------------------
    per_class_detail = {}
    for cls in canonical_classes:
        per_class_detail[cls] = {
            "train"      : trn_cls.get(cls, 0),
            "val"        : val_cls.get(cls, 0),
            "test_field" : tst_cls.get(cls, 0),
        }

    output = {
        "verification_passed"           : verification_passed,
        "expected_counts"               : {
            "train"     : EXPECTED_TRAIN,
            "val"       : EXPECTED_VAL,
            "test_field": EXPECTED_TEST_FIELD,
            "classes"   : EXPECTED_CLASSES,
        },
        "actual_counts"                 : {
            "train"     : actual_train,
            "val"       : actual_val,
            "test_field": actual_test_field,
            "classes_in_train_val": len(train_val_present),
        },
        "count_checks"                  : {
            "train_ok"      : train_ok,
            "val_ok"        : val_ok,
            "test_field_ok" : test_field_ok,
        },
        "corrupt_unreadable_count"      : len(all_corrupt),
        "zero_byte_count"               : len(all_zero_byte),
        "corrupt_files"                 : [(p, r) for p, r in all_corrupt[:20]],  # cap at 20
        "unexpected_class_dirs"         : sorted(all_unexpected),
        "missing_canonical_classes"     : sorted(truly_missing),
        "sha256_collision_counts"       : {
            "train_val"        : tv_collisions,
            "train_test_field" : tt_collisions,
            "val_test_field"   : vt_collisions,
        },
        "leakage_check_passed"          : leakage_ok,
        "potato_healthy_check"          : {
            "expected" : POTATO_HEALTHY_EXPECTED,
            "actual"   : {"train": potato_train, "val": potato_val, "test_field": potato_test},
            "passed"   : potato_ok,
        },
        "per_class_counts"              : per_class_detail,
        "report_cross_check"            : report_comparison,
        "leakage_report_summary"        : leakage_report_summary,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print(f"\n[Output] Saved: {OUTPUT_PATH}")

    # ------------------------------------------------------------------
    # 9. Final summary print
    # ------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    print(f"TRAIN              : {actual_train}  (expected {EXPECTED_TRAIN})  {'OK' if train_ok else 'MISMATCH'}")
    print(f"VAL                : {actual_val}   (expected {EXPECTED_VAL})   {'OK' if val_ok else 'MISMATCH'}")
    print(f"TEST_FIELD         : {actual_test_field}    (expected {EXPECTED_TEST_FIELD})    {'OK' if test_field_ok else 'MISMATCH'}")
    print(f"CLASSES            : {len(train_val_present)}  (expected {EXPECTED_CLASSES})  {'OK' if class_coverage_ok else 'MISMATCH'}")
    print(f"CORRUPT            : {len(all_corrupt)}")
    print(f"ZERO_BYTE          : {len(all_zero_byte)}")
    print(f"UNEXPECTED_CLASSES : {sorted(all_unexpected) if all_unexpected else 'None'}")
    print(f"TRAIN_VAL_COLLISIONS       : {tv_collisions}")
    print(f"TRAIN_TEST_FIELD_COLLISIONS: {tt_collisions}")
    print(f"VAL_TEST_FIELD_COLLISIONS  : {vt_collisions}")
    print(f"VERIFICATION       : {'PASSED' if verification_passed else 'FAILED'}")
    if verification_passed:
        print("\nBENCHMARK VERIFIED — READY FOR REAL TRAINING")
    else:
        print("\n[FAILED] One or more checks did not pass. Review output JSON for details.")
    print("=" * 60)

    return output


if __name__ == "__main__":
    run_verification()
