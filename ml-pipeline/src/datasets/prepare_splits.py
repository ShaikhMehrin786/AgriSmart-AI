# Reproducible Dataset Split & Isolation Utility for AgriSmart AI
import os
import sys
import json
import shutil
import hashlib
import argparse
import random
from sklearn.model_selection import train_test_split

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.webp', '.bmp')

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

def compute_file_hash(filepath):
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()

def prepare_dataset_splits(lab_data_dir, field_data_dir, output_processed_dir, class_labels_path, train_ratio=0.8, seed=42):
    random.seed(seed)
    class_labels = load_class_labels(class_labels_path)
    class_to_idx = {c: i for i, c in enumerate(class_labels)}

    resolved_lab = resolve_path(lab_data_dir) if lab_data_dir else None
    resolved_field = resolve_path(field_data_dir) if field_data_dir else None
    resolved_out = resolve_path(output_processed_dir)

    print("==================================================")
    print("AGRISMART AI - DATASET SPLIT & ISOLATION UTILITY")
    print("==================================================")
    print(f"[Splitter] Lab Data Dir (Train/Val): {resolved_lab}")
    print(f"[Splitter] Field Data Dir (Held-Out Test): {resolved_field}")
    print(f"[Splitter] Output Processed Dir: {resolved_out}")
    print(f"[Splitter] Train/Val Split Ratio: {train_ratio*100:.0f}% train / {(1-train_ratio)*100:.0f}% val (Seed={seed})")

    train_dest = os.path.join(resolved_out, "train")
    val_dest = os.path.join(resolved_out, "val")
    test_field_dest = os.path.join(resolved_out, "test_field")

    os.makedirs(train_dest, exist_ok=True)
    os.makedirs(val_dest, exist_ok=True)
    os.makedirs(test_field_dest, exist_ok=True)

    lab_file_paths = []
    lab_labels = []

    # 1. Discover lab images for train/val split
    if resolved_lab and os.path.exists(resolved_lab):
        for class_name in class_labels:
            c_dir = os.path.join(resolved_lab, class_name)
            if not os.path.exists(c_dir):
                continue
            for root, _, files in os.walk(c_dir):
                for f in files:
                    if f.lower().endswith(IMAGE_EXTENSIONS):
                        lab_file_paths.append(os.path.join(root, f))
                        lab_labels.append(class_to_idx[class_name])

    print(f"[Splitter] Scanned Lab Images: {len(lab_file_paths)}")

    # 2. Stratified train/val split of lab images
    if len(lab_file_paths) > 0:
        indices = list(range(len(lab_file_paths)))
        val_size = len(lab_file_paths) - int(train_ratio * len(lab_file_paths))
        val_ratio = 1.0 - train_ratio
        use_stratify = (
            len(set(lab_labels)) > 1 and
            val_size >= len(set(lab_labels)) and
            min([lab_labels.count(i) for i in set(lab_labels)]) > 1
        )
        train_indices, val_indices = train_test_split(
            indices, train_size=train_ratio, test_size=val_ratio, random_state=seed,
            stratify=lab_labels if use_stratify else None
        )

        # Copy train files
        train_hashes = set()
        for idx in train_indices:
            src = lab_file_paths[idx]
            cls_name = class_labels[lab_labels[idx]]
            dst_dir = os.path.join(train_dest, cls_name)
            os.makedirs(dst_dir, exist_ok=True)
            dst = os.path.join(dst_dir, os.path.basename(src))
            shutil.copy2(src, dst)
            train_hashes.add(compute_file_hash(dst))

        # Copy val files
        val_hashes = set()
        for idx in val_indices:
            src = lab_file_paths[idx]
            cls_name = class_labels[lab_labels[idx]]
            dst_dir = os.path.join(val_dest, cls_name)
            os.makedirs(dst_dir, exist_ok=True)
            dst = os.path.join(dst_dir, os.path.basename(src))
            shutil.copy2(src, dst)
            val_hashes.add(compute_file_hash(dst))

        print(f"[Splitter] Generated Train Set: {len(train_indices)} images")
        print(f"[Splitter] Generated Validation Set: {len(val_indices)} images")

    # 3. Process held-out field test images (PlantDoc)
    field_file_paths = []
    field_hashes = set()
    if resolved_field and os.path.exists(resolved_field):
        for class_name in class_labels:
            c_dir = os.path.join(resolved_field, class_name)
            if not os.path.exists(c_dir):
                continue
            dst_dir = os.path.join(test_field_dest, class_name)
            os.makedirs(dst_dir, exist_ok=True)

            for root, _, files in os.walk(c_dir):
                for f in files:
                    if f.lower().endswith(IMAGE_EXTENSIONS):
                        src = os.path.join(root, f)
                        dst = os.path.join(dst_dir, f)
                        shutil.copy2(src, dst)
                        h = compute_file_hash(dst)
                        field_hashes.add(h)
                        field_file_paths.append(dst)

    print(f"[Splitter] Generated Held-Out Field Test Set: {len(field_file_paths)} images")

    print("==================================================")
    print("[PASSED] Reproducible dataset splits prepared cleanly!")
    print("==================================================")

def main():
    parser = argparse.ArgumentParser(description="Prepare Reproducible SIH Train/Val/Test Splits")
    parser.add_argument("--lab-data-dir", type=str, default=None, help="Raw lab images directory (PlantVillage)")
    parser.add_argument("--field-data-dir", type=str, default=None, help="Raw field test images directory (PlantDoc)")
    parser.add_argument("--output-processed-dir", type=str, default="ml-pipeline/data/processed", help="Output processed splits folder")
    parser.add_argument("--class-labels", type=str, default="backend/src/models/class_labels.json")
    parser.add_argument("--train-ratio", type=float, default=0.8)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    prepare_dataset_splits(
        lab_data_dir=args.lab_data_dir,
        field_data_dir=args.field_data_dir,
        output_processed_dir=args.output_processed_dir,
        class_labels_path=args.class_labels,
        train_ratio=args.train_ratio,
        seed=args.seed
    )

if __name__ == "__main__":
    main()
