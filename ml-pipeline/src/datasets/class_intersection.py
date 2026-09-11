# Class Intersection Analyzer for PlantVillage and PlantDoc
# Discovers shared classes, normalizes names, and produces a mapping report
import os
import sys
import json
import re
import argparse

IMAGE_EXTENSIONS = ('.jpg', '.jpeg', '.png', '.bmp', '.webp')

def resolve_path(path):
    if os.path.isabs(path) and os.path.exists(path):
        return path
    candidates = [
        path, os.path.abspath(path),
        os.path.join(os.path.dirname(__file__), "..", "..", path),
        os.path.join(os.path.dirname(__file__), "..", "..", "..", path)
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)
    return os.path.abspath(path)

def count_images_in_dir(d):
    count = 0
    if not os.path.isdir(d):
        return 0
    for root, _, files in os.walk(d):
        for f in files:
            if f.lower().endswith(IMAGE_EXTENSIONS):
                count += 1
    return count

def enumerate_classes(dataset_dir):
    """Returns dict of {folder_name: image_count} for class subdirectories."""
    resolved = resolve_path(dataset_dir)
    classes = {}
    if not os.path.exists(resolved):
        return classes
    for item in sorted(os.listdir(resolved)):
        item_path = os.path.join(resolved, item)
        if os.path.isdir(item_path) and not item.startswith('.') and item != '__MACOSX':
            count = count_images_in_dir(item_path)
            if count > 0:
                classes[item] = count
    return classes

def normalize_class_name(name):
    """Normalize a class name for fuzzy matching.
    
    Converts to lowercase, replaces separators with spaces, strips extra whitespace.
    Examples:
        'Apple___Apple_scab' -> 'apple apple scab'
        'Apple scab leaf'    -> 'apple scab leaf'
        'Tomato___Late_blight' -> 'tomato late blight'
        'Tomato leaf late blight' -> 'tomato leaf late blight'
    """
    s = name.lower()
    s = s.replace('___', ' ').replace('__', ' ').replace('_', ' ')
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def extract_crop_disease(normalized):
    """Try to extract (crop, disease_or_healthy) from a normalized name."""
    # Common crops to look for
    crops = [
        'apple', 'blueberry', 'cherry', 'corn', 'grape', 'orange',
        'peach', 'pepper bell', 'pepper', 'potato', 'raspberry',
        'soybean', 'squash', 'strawberry', 'tomato', 'bell pepper'
    ]
    for crop in sorted(crops, key=len, reverse=True):
        if normalized.startswith(crop):
            remainder = normalized[len(crop):].strip()
            if remainder:
                return crop, remainder
            return crop, 'unspecified'
    return None, normalized

def build_class_mapping(pv_classes, pd_classes):
    """Build a mapping between PlantVillage and PlantDoc class names.
    
    Returns list of mapping entries with match confidence.
    """
    # Normalize all names
    pv_normalized = {}
    for name in pv_classes:
        pv_normalized[name] = normalize_class_name(name)

    pd_normalized = {}
    for name in pd_classes:
        pd_normalized[name] = normalize_class_name(name)

    # Build crop+disease keys for PV
    pv_keys = {}
    for name, norm in pv_normalized.items():
        crop, disease = extract_crop_disease(norm)
        key = f"{crop}|{disease}" if crop else norm
        pv_keys[name] = (crop, disease, key)

    # Build crop+disease keys for PD
    pd_keys = {}
    for name, norm in pd_normalized.items():
        crop, disease = extract_crop_disease(norm)
        key = f"{crop}|{disease}" if crop else norm
        pd_keys[name] = (crop, disease, key)

    # Define known manual mappings for PlantDoc -> PlantVillage naming
    # These are based on documented PlantDoc class names vs PlantVillage conventions
    MANUAL_MAP = {
        # PlantDoc name -> PlantVillage name (exact match after normalization)
        'apple scab': 'apple apple scab',
        'apple black rot': 'apple black rot',
        'apple rust': 'apple cedar apple rust',
        'apple leaf': 'apple healthy',  # PlantDoc "Apple leaf" = healthy apple
        'bell pepper leaf': 'pepper bell healthy',
        'bell pepper leaf spot': 'pepper bell bacterial spot',
        'blueberry leaf': 'blueberry healthy',
        'cherry leaf': 'cherry healthy',
        'corn leaf blight': 'corn northern leaf blight',
        'corn rust leaf': 'corn common rust',
        'grape leaf': 'grape healthy',
        'grape leaf blight': 'grape leaf blight',
        'grape black rot': 'grape black rot',
        'peach leaf': 'peach healthy',
        'potato leaf': 'potato healthy',
        'potato leaf early blight': 'potato early blight',
        'potato leaf late blight': 'potato late blight',
        'raspberry leaf': 'raspberry healthy',
        'soybean leaf': 'soybean healthy',
        'squash powdery mildew': 'squash powdery mildew',
        'strawberry leaf': 'strawberry healthy',
        'tomato leaf': 'tomato healthy',
        'tomato leaf bacterial spot': 'tomato bacterial spot',
        'tomato leaf late blight': 'tomato late blight',
        'tomato leaf mosaic virus': 'tomato tomato mosaic virus',
        'tomato leaf yellow virus': 'tomato tomato yellow leaf curl virus',
        'tomato early blight': 'tomato early blight',
        'tomato early blight leaf': 'tomato early blight',
        'tomato septoria leaf spot': 'tomato septoria leaf spot',
        'tomato mold leaf': 'tomato leaf mold',
        'tomato two spotted spider mite': 'tomato spider mites',
    }

    mappings = []
    matched_pv = set()
    matched_pd = set()

    # Phase 1: Exact normalized match
    pv_by_norm = {}
    for name, norm in pv_normalized.items():
        pv_by_norm[norm] = name

    for pd_name, pd_norm in pd_normalized.items():
        if pd_norm in pv_by_norm:
            pv_name = pv_by_norm[pd_norm]
            mappings.append({
                "plantvillage_class": pv_name,
                "plantdoc_class": pd_name,
                "match_method": "exact_normalized",
                "pv_normalized": pd_norm,
                "pd_normalized": pd_norm,
                "pv_count": pv_classes[pv_name],
                "pd_count": pd_classes[pd_name]
            })
            matched_pv.add(pv_name)
            matched_pd.add(pd_name)

    # Phase 2: Manual mapping
    for pd_name, pd_norm in pd_normalized.items():
        if pd_name in matched_pd:
            continue
        if pd_norm in MANUAL_MAP:
            target_norm = MANUAL_MAP[pd_norm]
            if target_norm in pv_by_norm:
                pv_name = pv_by_norm[target_norm]
                if pv_name not in matched_pv:
                    mappings.append({
                        "plantvillage_class": pv_name,
                        "plantdoc_class": pd_name,
                        "match_method": "manual_mapping",
                        "pv_normalized": target_norm,
                        "pd_normalized": pd_norm,
                        "pv_count": pv_classes[pv_name],
                        "pd_count": pd_classes[pd_name]
                    })
                    matched_pv.add(pv_name)
                    matched_pd.add(pd_name)

    # Phase 3: Crop + disease substring match for remaining
    for pd_name, pd_norm in pd_normalized.items():
        if pd_name in matched_pd:
            continue
        pd_crop, pd_disease = extract_crop_disease(pd_norm)
        if pd_crop is None:
            continue
        for pv_name, pv_norm in pv_normalized.items():
            if pv_name in matched_pv:
                continue
            pv_crop, pv_disease = extract_crop_disease(pv_norm)
            if pv_crop == pd_crop:
                # Check if disease terms overlap significantly
                pd_words = set(pd_disease.split())
                pv_words = set(pv_disease.split())
                overlap = pd_words & pv_words
                if len(overlap) >= 1 and ('healthy' in overlap or 'blight' in overlap or
                    'rot' in overlap or 'scab' in overlap or 'rust' in overlap or
                    'mildew' in overlap or 'spot' in overlap or 'mold' in overlap or
                    'virus' in overlap or 'mite' in overlap):
                    mappings.append({
                        "plantvillage_class": pv_name,
                        "plantdoc_class": pd_name,
                        "match_method": "crop_disease_overlap",
                        "pv_normalized": pv_norm,
                        "pd_normalized": pd_norm,
                        "overlap_words": list(overlap),
                        "pv_count": pv_classes[pv_name],
                        "pd_count": pd_classes[pd_name]
                    })
                    matched_pv.add(pv_name)
                    matched_pd.add(pd_name)
                    break

    # Unmatched classes
    pv_only = sorted([n for n in pv_classes if n not in matched_pv])
    pd_only = sorted([n for n in pd_classes if n not in matched_pd])

    return mappings, pv_only, pd_only

def run_intersection_analysis(plantvillage_dir, plantdoc_dir, output_path):
    print("==================================================")
    print("AGRISMART AI - CLASS INTERSECTION ANALYZER")
    print("==================================================")

    pv_classes = enumerate_classes(plantvillage_dir)
    pd_classes = enumerate_classes(plantdoc_dir)

    print(f"[Analysis] PlantVillage classes: {len(pv_classes)}")
    print(f"[Analysis] PlantDoc classes:     {len(pd_classes)}")
    print(f"[Analysis] PlantVillage total images: {sum(pv_classes.values())}")
    print(f"[Analysis] PlantDoc total images:     {sum(pd_classes.values())}")

    if len(pv_classes) == 0:
        print("[ERROR] No PlantVillage classes found. Download the dataset first.")
        return None
    if len(pd_classes) == 0:
        print("[ERROR] No PlantDoc classes found. Download the dataset first.")
        return None

    print("\n--- PlantVillage Classes ---")
    for name, count in sorted(pv_classes.items()):
        print(f"  {name}: {count} images")

    print("\n--- PlantDoc Classes ---")
    for name, count in sorted(pd_classes.items()):
        print(f"  {name}: {count} images")

    mappings, pv_only, pd_only = build_class_mapping(pv_classes, pd_classes)

    print(f"\n--- INTERSECTION RESULTS ---")
    print(f"Shared/Mapped Classes: {len(mappings)}")
    print(f"PlantVillage-Only Classes: {len(pv_only)}")
    print(f"PlantDoc-Only Classes: {len(pd_only)}")

    print("\n--- MATCHED CLASS PAIRS ---")
    for m in mappings:
        print(f"  PV: {m['plantvillage_class']:40s} <-> PD: {m['plantdoc_class']:40s}  ({m['match_method']})")

    if pv_only:
        print("\n--- PlantVillage-ONLY (no PlantDoc match) ---")
        for n in pv_only:
            print(f"  {n}: {pv_classes[n]} images")

    if pd_only:
        print("\n--- PlantDoc-ONLY (no PlantVillage match) ---")
        for n in pd_only:
            print(f"  {n}: {pd_classes[n]} images")

    # Build canonical class label list from shared classes (using PV naming convention)
    shared_class_labels = sorted([m['plantvillage_class'] for m in mappings])

    # Check healthy class availability
    healthy_classes = [c for c in shared_class_labels if 'healthy' in c.lower()]
    print(f"\n--- HEALTHY CLASS AVAILABILITY ---")
    print(f"Shared healthy classes: {len(healthy_classes)}")
    for h in healthy_classes:
        print(f"  {h}")

    report = {
        "plantvillage_class_count": len(pv_classes),
        "plantdoc_class_count": len(pd_classes),
        "plantvillage_total_images": sum(pv_classes.values()),
        "plantdoc_total_images": sum(pd_classes.values()),
        "shared_class_count": len(mappings),
        "plantvillage_only_count": len(pv_only),
        "plantdoc_only_count": len(pd_only),
        "shared_class_labels_pv_naming": shared_class_labels,
        "healthy_classes_in_shared": healthy_classes,
        "mappings": mappings,
        "plantvillage_only": pv_only,
        "plantdoc_only": pd_only,
        "plantvillage_classes": pv_classes,
        "plantdoc_classes": pd_classes
    }

    out_path = resolve_path(output_path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

    # Also generate the public class labels JSON
    labels_dir = os.path.dirname(out_path)
    public_labels_path = os.path.join(labels_dir, "class_labels_public.json")
    with open(public_labels_path, 'w', encoding='utf-8') as f:
        json.dump(shared_class_labels, f, indent=2)

    print(f"\n==================================================")
    print(f"Intersection Report: {out_path}")
    print(f"Public Class Labels: {public_labels_path}")
    print(f"Shared Classes for Training: {len(shared_class_labels)}")
    print(f"==================================================")

    return report

def main():
    parser = argparse.ArgumentParser(description="Analyze class intersection between PlantVillage and PlantDoc")
    parser.add_argument("--plantvillage-dir", type=str, default="ml-pipeline/data/raw/plantvillage")
    parser.add_argument("--plantdoc-dir", type=str, default="ml-pipeline/data/raw/plantdoc")
    parser.add_argument("--output", type=str, default="ml-pipeline/data/class_intersection_report.json")
    args = parser.parse_args()

    run_intersection_analysis(args.plantvillage_dir, args.plantdoc_dir, args.output)

if __name__ == "__main__":
    main()
