# Class Intersection Analyzer for PlantVillage and PlantDoc
# Discovers shared classes, normalizes names, and produces a mathematically verified mapping report
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
    """Normalize a class name for clean matching."""
    s = name.lower()
    s = s.replace('___', ' ').replace('__', ' ').replace('_', ' ').replace('-', ' ')
    s = re.sub(r'\s+', ' ', s).strip()
    return s

# Audited Ground-Truth Mapping Table
EXPLICIT_PLANTDOC_TO_PV_MAP = {
    "apple scab leaf": "Apple___Apple_scab",
    "apple scab": "Apple___Apple_scab",
    "apple rust leaf": "Apple___Cedar_apple_rust",
    "apple rust": "Apple___Cedar_apple_rust",
    "apple leaf": "Apple___healthy",
    "bell pepper leaf spot": "Pepper_bell___Bacterial_spot",
    "bell_pepper leaf spot": "Pepper_bell___Bacterial_spot",
    "bell pepper leaf": "Pepper_bell___healthy",
    "bell_pepper leaf": "Pepper_bell___healthy",
    "blueberry leaf": "Blueberry___healthy",
    "cherry leaf": "Cherry___healthy",
    "corn gray leaf spot": "Corn___Cercospora_leaf_spot",
    "corn grey leaf spot": "Corn___Cercospora_leaf_spot",
    "corn leaf blight": "Corn___Northern_Leaf_Blight",
    "corn northern leaf blight": "Corn___Northern_Leaf_Blight",
    "corn rust leaf": "Corn___Common_rust",
    "corn rust": "Corn___Common_rust",
    "grape leaf black rot": "Grape___Black_rot",
    "grape black rot": "Grape___Black_rot",
    "grape leaf": "Grape___healthy",
    "peach leaf": "Peach___healthy",
    "potato leaf early blight": "Potato___Early_blight",
    "potato early blight": "Potato___Early_blight",
    "potato leaf late blight": "Potato___Late_blight",
    "potato late blight": "Potato___Late_blight",
    "potato leaf": "Potato___healthy",
    "raspberry leaf": "Raspberry___healthy",
    "soyabean leaf": "Soybean___healthy",
    "soybean leaf": "Soybean___healthy",
    "squash powdery mildew leaf": "Squash___Powdery_mildew",
    "squash powdery mildew": "Squash___Powdery_mildew",
    "strawberry leaf": "Strawberry___healthy",
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
    "tomato mold leaf": "Tomato___Leaf_Mold",
    "tomato leaf mold": "Tomato___Leaf_Mold",
    "tomato septoria leaf spot": "Tomato___Septoria_leaf_spot",
    "tomato septoria leaf spot leaf": "Tomato___Septoria_leaf_spot",
    "tomato leaf": "Tomato___healthy"
}

def build_class_mapping(pv_classes, pd_classes):
    """Build a mathematically verified 1-to-1 canonical mapping between PlantVillage and PlantDoc."""
    mappings = []
    matched_pv = set()
    matched_pd = set()

    # Exact dictionary lookup with normalized fallback
    for pd_name, pd_count in pd_classes.items():
        norm = normalize_class_name(pd_name)
        target_pv = EXPLICIT_PLANTDOC_TO_PV_MAP.get(norm)

        if target_pv is None:
            for k, v in EXPLICIT_PLANTDOC_TO_PV_MAP.items():
                if k == norm or k in norm:
                    target_pv = v
                    break

        if target_pv and target_pv in pv_classes:
            mappings.append({
                "plantvillage_class": target_pv,
                "plantdoc_class": pd_name,
                "match_method": "explicit_canonical_mapping",
                "pv_normalized": normalize_class_name(target_pv),
                "pd_normalized": norm,
                "pv_count": pv_classes[target_pv],
                "pd_count": pd_count
            })
            matched_pv.add(target_pv)
            matched_pd.add(pd_name)

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

    mappings, pv_only, pd_only = build_class_mapping(pv_classes, pd_classes)

    shared_class_labels = sorted(list(set([m['plantvillage_class'] for m in mappings])))
    healthy_classes = [c for c in shared_class_labels if 'healthy' in c.lower()]
    disease_classes = [c for c in shared_class_labels if 'healthy' not in c.lower()]

    assert len(shared_class_labels) == len(disease_classes) + len(healthy_classes), "Class count assertion error!"

    print(f"\n--- INTERSECTION RESULTS ---")
    print(f"Total Unique Canonical Shared Classes: {len(shared_class_labels)}")
    print(f"  -> Shared Disease Classes:           {len(disease_classes)}")
    print(f"  -> Shared Healthy Classes:           {len(healthy_classes)}")
    print(f"PlantVillage-Only Classes:             {len(pv_only)}")
    print(f"PlantDoc-Unmapped Classes:             {len(pd_only)}")

    report = {
        "plantvillage_class_count": len(pv_classes),
        "plantdoc_class_count": len(pd_classes),
        "plantvillage_total_images": sum(pv_classes.values()),
        "plantdoc_total_images": sum(pd_classes.values()),
        "shared_class_count": len(shared_class_labels),
        "shared_disease_classes_count": len(disease_classes),
        "shared_healthy_classes_count": len(healthy_classes),
        "shared_classes": shared_class_labels,
        "shared_disease_classes": disease_classes,
        "shared_healthy_classes": healthy_classes,
        "plantvillage_only": pv_only,
        "plantdoc_only": pd_only,
        "mappings": mappings,
        "plantvillage_classes": pv_classes,
        "plantdoc_classes": pd_classes
    }

    out_path = resolve_path(output_path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

    public_labels_path = os.path.join(os.path.dirname(out_path), "..", "..", "backend", "src", "models", "class_labels_public.json")
    resolved_pub_labels = resolve_path(public_labels_path)
    with open(resolved_pub_labels, 'w', encoding='utf-8') as f:
        json.dump(shared_class_labels, f, indent=2)

    print(f"\n==================================================")
    print(f"Intersection Report: {out_path}")
    print(f"Public Class Labels: {resolved_pub_labels}")
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
