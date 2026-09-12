# Authoritative PlantDoc Dataset Validation and Class Mapping Auditor
# Audits ONLY the 2,579 officially recovered Git image blobs
import os
import sys
import re
import json
import hashlib
from collections import defaultdict
from PIL import Image
import pandas as pd

IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.bmp', '.webp')

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

def to_windows_extended_path(path):
    abs_path = os.path.abspath(path)
    if os.name == 'nt' and not abs_path.startswith('\\\\?\\'):
        return '\\\\?\\' + abs_path
    return abs_path

def compute_sha256(filepath):
    h = hashlib.sha256()
    with open(to_windows_extended_path(filepath), 'rb') as f:
        buf = f.read(65536)
        while len(buf) > 0:
            h.update(buf)
            buf = f.read(65536)
    return h.hexdigest()

def normalize_name(s):
    s = s.lower().replace('_', ' ').replace('-', ' ')
    s = re.sub(r'\s+', ' ', s).strip()
    return s

# Audited Ground-Truth Mapping Dictionary
EXPLICIT_PLANTDOC_MAP = {
    "apple scab leaf": ("Apple___Apple_scab", "Apple", "Apple Scab", "Disease", "DirectMatch"),
    "apple scab": ("Apple___Apple_scab", "Apple", "Apple Scab", "Disease", "DirectMatch"),
    "apple rust leaf": ("Apple___Cedar_apple_rust", "Apple", "Cedar Apple Rust", "Disease", "DirectMatch"),
    "apple rust": ("Apple___Cedar_apple_rust", "Apple", "Cedar Apple Rust", "Disease", "DirectMatch"),
    "apple leaf": ("Apple___healthy", "Apple", "Healthy Foliage", "Healthy", "DirectMatch"),
    "bell pepper leaf spot": ("Pepper_bell___Bacterial_spot", "Pepper Bell", "Bacterial Spot", "Disease", "DirectMatch"),
    "bell_pepper leaf spot": ("Pepper_bell___Bacterial_spot", "Pepper Bell", "Bacterial Spot", "Disease", "DirectMatch"),
    "bell pepper leaf": ("Pepper_bell___healthy", "Pepper Bell", "Healthy Foliage", "Healthy", "DirectMatch"),
    "bell_pepper leaf": ("Pepper_bell___healthy", "Pepper Bell", "Healthy Foliage", "Healthy", "DirectMatch"),
    "blueberry leaf": ("Blueberry___healthy", "Blueberry", "Healthy Foliage", "Healthy", "DirectMatch"),
    "cherry leaf": ("Cherry___healthy", "Cherry", "Healthy Foliage", "Healthy", "DirectMatch"),
    "corn gray leaf spot": ("Corn___Cercospora_leaf_spot", "Corn", "Cercospora Leaf Spot / Gray Leaf Spot", "Disease", "DirectMatch"),
    "corn grey leaf spot": ("Corn___Cercospora_leaf_spot", "Corn", "Cercospora Leaf Spot / Gray Leaf Spot", "Disease", "DirectMatch"),
    "corn leaf blight": ("Corn___Northern_Leaf_Blight", "Corn", "Northern Leaf Blight", "Disease", "DirectMatch"),
    "corn northern leaf blight": ("Corn___Northern_Leaf_Blight", "Corn", "Northern Leaf Blight", "Disease", "DirectMatch"),
    "corn rust leaf": ("Corn___Common_rust", "Corn", "Common Rust", "Disease", "DirectMatch"),
    "corn rust": ("Corn___Common_rust", "Corn", "Common Rust", "Disease", "DirectMatch"),
    "grape leaf black rot": ("Grape___Black_rot", "Grape", "Black Rot", "Disease", "DirectMatch"),
    "grape black rot": ("Grape___Black_rot", "Grape", "Black Rot", "Disease", "DirectMatch"),
    "grape leaf": ("Grape___healthy", "Grape", "Healthy Foliage", "Healthy", "DirectMatch"),
    "peach leaf": ("Peach___healthy", "Peach", "Healthy Foliage", "Healthy", "DirectMatch"),
    "potato leaf early blight": ("Potato___Early_blight", "Potato", "Early Blight", "Disease", "DirectMatch"),
    "potato early blight": ("Potato___Early_blight", "Potato", "Early Blight", "Disease", "DirectMatch"),
    "potato leaf late blight": ("Potato___Late_blight", "Potato", "Late Blight", "Disease", "DirectMatch"),
    "potato late blight": ("Potato___Late_blight", "Potato", "Late Blight", "Disease", "DirectMatch"),
    "potato leaf": ("Potato___healthy", "Potato", "Healthy Foliage", "Healthy", "DirectMatch"),
    "raspberry leaf": ("Raspberry___healthy", "Raspberry", "Healthy Foliage", "Healthy", "DirectMatch"),
    "soyabean leaf": ("Soybean___healthy", "Soybean", "Healthy Foliage", "Healthy", "DirectMatch"),
    "soybean leaf": ("Soybean___healthy", "Soybean", "Healthy Foliage", "Healthy", "DirectMatch"),
    "squash powdery mildew leaf": ("Squash___Powdery_mildew", "Squash", "Powdery Mildew", "Disease", "DirectMatch"),
    "squash powdery mildew": ("Squash___Powdery_mildew", "Squash", "Powdery Mildew", "Disease", "DirectMatch"),
    "strawberry leaf": ("Strawberry___healthy", "Strawberry", "Healthy Foliage", "Healthy", "DirectMatch"),
    "tomato early blight leaf": ("Tomato___Early_blight", "Tomato", "Early Blight", "Disease", "DirectMatch"),
    "tomato early blight": ("Tomato___Early_blight", "Tomato", "Early Blight", "Disease", "DirectMatch"),
    "tomato leaf early blight": ("Tomato___Early_blight", "Tomato", "Early Blight", "Disease", "DirectMatch"),
    "tomato leaf late blight": ("Tomato___Late_blight", "Tomato", "Late Blight", "Disease", "DirectMatch"),
    "tomato late blight leaf": ("Tomato___Late_blight", "Tomato", "Late Blight", "Disease", "DirectMatch"),
    "tomato late blight": ("Tomato___Late_blight", "Tomato", "Late Blight", "Disease", "DirectMatch"),
    "tomato leaf bacterial spot": ("Tomato___Bacterial_spot", "Tomato", "Bacterial Spot", "Disease", "DirectMatch"),
    "tomato bacterial spot leaf": ("Tomato___Bacterial_spot", "Tomato", "Bacterial Spot", "Disease", "DirectMatch"),
    "tomato bacterial spot": ("Tomato___Bacterial_spot", "Tomato", "Bacterial Spot", "Disease", "DirectMatch"),
    "tomato leaf mosaic virus": ("Tomato___Tomato_mosaic_virus", "Tomato", "Mosaic Virus", "Disease", "DirectMatch"),
    "tomato mosaic virus leaf": ("Tomato___Tomato_mosaic_virus", "Tomato", "Mosaic Virus", "Disease", "DirectMatch"),
    "tomato leaf yellow virus": ("Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato", "Yellow Leaf Curl Virus", "Disease", "DirectMatch"),
    "tomato yellow leaf curl virus": ("Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato", "Yellow Leaf Curl Virus", "Disease", "DirectMatch"),
    "tomato mold leaf": ("Tomato___Leaf_Mold", "Tomato", "Leaf Mold", "Disease", "DirectMatch"),
    "tomato leaf mold": ("Tomato___Leaf_Mold", "Tomato", "Leaf Mold", "Disease", "DirectMatch"),
    "tomato two spotted spider mites leaf": ("Tomato___Spider_mites", "Tomato", "Two-Spotted Spider Mites", "Disease", "DirectMatch"),
    "tomato spider mites": ("Tomato___Spider_mites", "Tomato", "Two-Spotted Spider Mites", "Disease", "DirectMatch"),
    "tomato septoria leaf spot": ("Tomato___Septoria_leaf_spot", "Tomato", "Septoria Leaf Spot", "Disease", "DirectMatch"),
    "tomato septoria leaf spot leaf": ("Tomato___Septoria_leaf_spot", "Tomato", "Septoria Leaf Spot", "Disease", "DirectMatch"),
    "tomato leaf": ("Tomato___healthy", "Tomato", "Healthy Foliage", "Healthy", "DirectMatch")
}

def audit_authoritative_plantdoc(dataset_dir, manifest_path, public_labels_path, val_report_path, mapping_report_path, counts_csv_path):
    resolved_dir = resolve_path(dataset_dir)
    resolved_manifest = resolve_path(manifest_path)
    resolved_labels = resolve_path(public_labels_path)
    resolved_val_rep = resolve_path(val_report_path)
    resolved_map_rep = resolve_path(mapping_report_path)
    resolved_counts_csv = resolve_path(counts_csv_path)

    print("==================================================")
    print("AGRISMART AI - AUTHORITATIVE PLANTDOC DATASET AUDIT")
    print("==================================================")
    print(f"[Audit] Recovered Directory: {resolved_dir}")
    print(f"[Audit] Manifest Source:     {resolved_manifest}")
    print(f"[Audit] Target Labels:       {resolved_labels}")

    # Load Manifest
    with open(resolved_manifest, 'r', encoding='utf-8') as f:
        manifest_entries = json.load(f)

    with open(resolved_labels, 'r', encoding='utf-8') as f:
        benchmark_classes = json.load(f)

    authoritative_count = len(manifest_entries)
    print(f"[Audit] Authoritative Git image count: {authoritative_count}")

    # Process authoritative entries only
    records = []
    hash_to_paths = defaultdict(list)
    train_hashes = defaultdict(list)
    test_hashes = defaultdict(list)
    corrupt_files = []
    zero_byte_files = []

    train_class_counts = defaultdict(int)
    test_class_counts = defaultdict(int)
    all_raw_classes = set()

    train_count = 0
    test_count = 0
    other_count = 0

    for item in manifest_entries:
        raw_p = item['raw_path']
        dest_rel = item['dest_rel_path']
        full_dest = os.path.join(resolved_dir, dest_rel)

        if not os.path.exists(to_windows_extended_path(full_dest)):
            corrupt_files.append({"path": dest_rel, "error": "File does not exist on disk"})
            continue

        size = os.path.getsize(to_windows_extended_path(full_dest))
        if size == 0:
            zero_byte_files.append(dest_rel)
            continue

        # PIL Decoding Check
        is_valid = True
        try:
            with Image.open(to_windows_extended_path(full_dest)) as im:
                im.verify()
        except Exception as e:
            is_valid = False
            corrupt_files.append({"path": dest_rel, "error": str(e)})

        # SHA-256 Hash
        h = compute_sha256(full_dest)

        # Parse split and class from raw path
        norm_raw = raw_p.replace('\\', '/').strip('/')
        parts = norm_raw.split('/')

        split_type = "other"
        raw_cls = None

        if len(parts) >= 3 and parts[0].lower() in ['train', 'test']:
            split_type = parts[0].lower()
            raw_cls = parts[1]
        elif len(parts) == 2 and parts[0].lower() in ['train', 'test']:
            split_type = parts[0].lower()
            raw_cls = parts[1]
        else:
            split_type = "other"
            raw_cls = "root_metadata"

        if split_type == "train":
            train_count += 1
            train_class_counts[raw_cls] += 1
            train_hashes[h].append(dest_rel)
            all_raw_classes.add(raw_cls)
        elif split_type == "test":
            test_count += 1
            test_class_counts[raw_cls] += 1
            test_hashes[h].append(dest_rel)
            all_raw_classes.add(raw_cls)
        else:
            other_count += 1

        records.append({
            "raw_path": raw_p,
            "dest_rel_path": dest_rel,
            "split": split_type,
            "raw_class": raw_cls,
            "size_bytes": size,
            "sha256": h,
            "is_valid": is_valid
        })
        hash_to_paths[h].append(dest_rel)

    # Calculate exact duplicates
    duplicate_groups = {h: paths for h, paths in hash_to_paths.items() if len(paths) > 1}
    duplicate_files_count = sum(len(paths) for paths in duplicate_groups.values())

    intra_train_duplicate_groups = {h: paths for h, paths in train_hashes.items() if len(paths) > 1}
    intra_train_duplicate_files_count = sum(len(paths) for paths in intra_train_duplicate_groups.values())

    intra_test_duplicate_groups = {h: paths for h, paths in test_hashes.items() if len(paths) > 1}
    intra_test_duplicate_files_count = sum(len(paths) for paths in intra_test_duplicate_groups.values())

    # Calculate Train-Test Leakage
    train_test_leakage_groups = {}
    leaked_test_files_count = 0
    for h, t_paths in test_hashes.items():
        if h in train_hashes:
            train_test_leakage_groups[h] = {
                "train_occurrences": train_hashes[h],
                "test_occurrences": t_paths
            }
            leaked_test_files_count += len(t_paths)

    # Class Mapping Analysis
    mapping_table = []
    mapped_canonical_classes = set()
    unmapped_raw_classes = []

    for raw_cls in sorted(list(all_raw_classes)):
        norm = normalize_name(raw_cls)
        mapping_info = EXPLICIT_PLANTDOC_MAP.get(norm)

        if mapping_info is None:
            for k, v in EXPLICIT_PLANTDOC_MAP.items():
                if k == norm or k in norm or norm in k:
                    mapping_info = v
                    break

        t_c = train_class_counts.get(raw_cls, 0)
        v_c = test_class_counts.get(raw_cls, 0)
        tot_c = t_c + v_c

        if mapping_info:
            canon_name, crop, condition, cat_type, status = mapping_info
            mapped_canonical_classes.add(canon_name)
            mapping_table.append({
                "raw_plantdoc_class": raw_cls,
                "normalized_name": norm,
                "mapped_benchmark_class": canon_name,
                "crop": crop,
                "condition": condition,
                "category_type": cat_type,
                "confidence_status": status,
                "train_count": t_c,
                "test_count": v_c,
                "total_count": tot_c
            })
        else:
            unmapped_raw_classes.append(raw_cls)
            mapping_table.append({
                "raw_plantdoc_class": raw_cls,
                "normalized_name": norm,
                "mapped_benchmark_class": None,
                "crop": "Unknown",
                "condition": "Unknown",
                "category_type": "Unmapped",
                "confidence_status": "Unmapped",
                "train_count": t_c,
                "test_count": v_c,
                "total_count": tot_c
            })

    # Intersection checks
    shared_classes = sorted(list(set(benchmark_classes) & mapped_canonical_classes))
    plantvillage_only_classes = sorted(list(set(benchmark_classes) - mapped_canonical_classes))
    plantdoc_only_classes = sorted(list(mapped_canonical_classes - set(benchmark_classes)))

    shared_disease = [c for c in shared_classes if 'healthy' not in c.lower()]
    shared_healthy = [c for c in shared_classes if 'healthy' in c.lower()]

    # Generate CSV
    df_counts = pd.DataFrame(mapping_table)
    os.makedirs(os.path.dirname(resolved_counts_csv), exist_ok=True)
    df_counts.to_csv(resolved_counts_csv, index=False)

    # Generate Validation Report JSON
    val_report = {
        "dataset_name": "PlantDoc",
        "dataset_path": resolved_dir,
        "authoritative_image_count": authoritative_count,
        "total_images_scanned": len(records),
        "total_train_images": train_count,
        "total_test_images": test_count,
        "total_other_images": other_count,
        "unique_raw_classes_count": len(all_raw_classes),
        "train_classes_count": len(train_class_counts),
        "test_classes_count": len(test_class_counts),
        "corrupt_images_count": len(corrupt_files),
        "zero_byte_files_count": len(zero_byte_files),
        "duplicate_groups_total": len(duplicate_groups),
        "duplicate_files_total": duplicate_files_count,
        "intra_train_duplicate_groups": len(intra_train_duplicate_groups),
        "intra_train_duplicate_files_count": intra_train_duplicate_files_count,
        "intra_test_duplicate_groups": len(intra_test_duplicate_groups),
        "intra_test_duplicate_files_count": intra_test_duplicate_files_count,
        "train_test_leakage_groups": len(train_test_leakage_groups),
        "train_test_leakage_files": leaked_test_files_count,
        "validation_status": "PASSED" if len(corrupt_files) == 0 else "FAILED",
        "per_class_counts": {
            "train": dict(train_class_counts),
            "test": dict(test_class_counts)
        },
        "train_test_leakage_samples": list(train_test_leakage_groups.items())[:10],
        "corrupt_files": corrupt_files
    }

    os.makedirs(os.path.dirname(resolved_val_rep), exist_ok=True)
    with open(resolved_val_rep, 'w', encoding='utf-8') as f:
        json.dump(val_report, f, indent=2)

    # Generate Class Mapping Report JSON
    mapping_report = {
        "benchmark_labels_path": resolved_labels,
        "authoritative_image_count": authoritative_count,
        "total_benchmark_classes_target": len(benchmark_classes),
        "unique_raw_plantdoc_classes_found": len(all_raw_classes),
        "mapped_canonical_classes_count": len(mapped_canonical_classes),
        "shared_classes_count": len(shared_classes),
        "shared_disease_classes_count": len(shared_disease),
        "shared_healthy_classes_count": len(shared_healthy),
        "shared_classes_list": shared_classes,
        "shared_disease_classes_list": shared_disease,
        "shared_healthy_classes_list": shared_healthy,
        "plantvillage_only_classes": plantvillage_only_classes,
        "plantdoc_only_classes": plantdoc_only_classes,
        "unmapped_raw_classes": unmapped_raw_classes,
        "mapping_details": mapping_table
    }

    os.makedirs(os.path.dirname(resolved_map_rep), exist_ok=True)
    with open(resolved_map_rep, 'w', encoding='utf-8') as f:
        json.dump(mapping_report, f, indent=2)

    # Print Report Summary
    print("\n--- AUTHORITATIVE AUDIT SUMMARY ---")
    print(f"Authoritative Image Count:      {authoritative_count}")
    print(f"Train Images:                   {train_count}")
    print(f"Test Images:                    {test_count}")
    print(f"Other/Root Images:              {other_count}")
    print(f"Unique Raw PlantDoc Classes:    {len(all_raw_classes)}")
    print(f"Corrupt Images:                 {len(corrupt_files)}")
    print(f"Zero-byte Files:                {len(zero_byte_files)}")
    print(f"Total Duplicate Groups:         {len(duplicate_groups)} ({duplicate_files_count} files)")
    print(f"  -> Intra-Train Duplicates:    {len(intra_train_duplicate_groups)} groups ({intra_train_duplicate_files_count} files)")
    print(f"  -> Intra-Test Duplicates:     {len(intra_test_duplicate_groups)} groups ({intra_test_duplicate_files_count} files)")
    print(f"Train/Test Leaked Hashes:       {len(train_test_leakage_groups)} groups ({leaked_test_files_count} test files)")
    print(f"Total Shared Classes:           {len(shared_classes)} ({len(shared_disease)} disease + {len(shared_healthy)} healthy)")
    print(f"PlantVillage-Only Classes:      {len(plantvillage_only_classes)}")
    print(f"PlantDoc-Only Classes:          {len(plantdoc_only_classes)}")
    print(f"Unmapped Classes:               {len(unmapped_raw_classes)}")
    print(f"Validation Status:              {val_report['validation_status']}")
    print("==================================================")

    return val_report, mapping_report

if __name__ == "__main__":
    audit_authoritative_plantdoc(
        dataset_dir="ml-pipeline/data/raw/plantdoc_recovered",
        manifest_path="ml-pipeline/data/plantdoc_manifest.json",
        public_labels_path="backend/src/models/class_labels_public.json",
        val_report_path="ml-pipeline/data/plantdoc_validation_report.json",
        mapping_report_path="ml-pipeline/data/plantdoc_class_mapping_report.json",
        counts_csv_path="ml-pipeline/data/plantdoc_class_counts.csv"
    )
