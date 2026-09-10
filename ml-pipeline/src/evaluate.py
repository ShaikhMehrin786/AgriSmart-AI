# Evaluation Script for AgriSmart AI Plant Disease Classification Model
import os
import sys
import json
import argparse
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)
import matplotlib.pyplot as plt

# Ensure ml-pipeline root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.model import create_model
from src.datasets.dataset import CropLeafDataset, discover_dataset, create_synthetic_smoke_dataset
from src.augmentations.transforms import get_val_transforms

def resolve_path(path):
    if os.path.isabs(path) and os.path.exists(path):
        return path
    candidates = [
        path,
        os.path.abspath(path),
        os.path.join(os.path.dirname(__file__), "..", path),
        os.path.join(os.path.dirname(__file__), "..", "..", path)
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

@torch.no_grad()
def evaluate_model(model, dataloader, device):
    model.eval()
    all_preds = []
    all_targets = []
    all_probs = []

    for images, targets in dataloader:
        images = images.to(device)
        outputs = model(images)
        probs = torch.softmax(outputs, dim=1)
        preds = torch.argmax(probs, dim=1)

        all_preds.extend(preds.cpu().numpy())
        all_targets.extend(targets.numpy())
        all_probs.extend(probs.cpu().numpy())

    return np.array(all_targets), np.array(all_preds), np.array(all_probs)

def plot_confusion_matrix(cm, class_names, output_path):
    plt.figure(figsize=(12, 10))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Crop Disease Classification - Confusion Matrix')
    plt.colorbar()

    tick_marks = np.arange(len(class_names))
    plt.xticks(tick_marks, class_names, rotation=90, fontsize=6)
    plt.yticks(tick_marks, class_names, fontsize=6)

    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, dpi=200)
    plt.close()
    print(f"[Eval] Saved confusion matrix plot to '{output_path}'")

def run_evaluation(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Eval] Execution device: {device}")

    # 1. Load class labels
    class_labels = load_class_labels(args.class_labels)
    num_classes = len(class_labels)

    # 2. Discover dataset files or handle smoke test mode
    if args.smoke_test or not os.path.exists(args.data_dir):
        smoke_dir = os.path.join(args.output_dir, "synthetic_smoke_eval_data")
        file_paths, labels, _ = create_synthetic_smoke_dataset(smoke_dir, class_labels, samples_per_class=3)
        is_smoke_test = True
    else:
        file_paths, labels, _ = discover_dataset(args.data_dir, class_labels)
        is_smoke_test = False

    if len(file_paths) == 0:
        print(f"[ERROR] No valid images found in '{args.data_dir}' for evaluation.")
        sys.exit(1)

    print(f"[Eval] Evaluating on dataset size: {len(file_paths)} samples (Smoke test: {is_smoke_test})")

    val_dataset = CropLeafDataset(file_paths, labels, transform=get_val_transforms(args.image_size))
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)

    # 3. Load model checkpoint
    checkpoint_path = resolve_path(args.checkpoint)
    model = create_model(args.model, num_classes=num_classes, pretrained=False).to(device)

    if os.path.exists(checkpoint_path):
        state_dict = torch.load(checkpoint_path, map_location=device)
        model.load_state_dict(state_dict)
        print(f"[Eval] Loaded checkpoint weights from '{checkpoint_path}'")
    else:
        print(f"[WARNING] Checkpoint '{checkpoint_path}' not found. Evaluating randomly initialized model...")

    # 4. Perform evaluation
    targets, preds, probs = evaluate_model(model, val_loader, device)

    # 5. Compute metrics
    acc = float(accuracy_score(targets, preds))
    macro_prec = float(precision_score(targets, preds, average='macro', zero_division=0))
    macro_rec = float(recall_score(targets, preds, average='macro', zero_division=0))
    macro_f1 = float(f1_score(targets, preds, average='macro', zero_division=0))

    per_class_prec = precision_score(targets, preds, average=None, labels=range(num_classes), zero_division=0)
    per_class_rec = recall_score(targets, preds, average=None, labels=range(num_classes), zero_division=0)
    per_class_f1 = f1_score(targets, preds, average=None, labels=range(num_classes), zero_division=0)

    cm = confusion_matrix(targets, preds, labels=range(num_classes))

    # 6. Save results
    output_dir = resolve_path(args.output_dir)
    os.makedirs(output_dir, exist_ok=True)

    report_data = {
        "is_smoke_test": is_smoke_test,
        "evaluation_dataset_size": len(file_paths),
        "overall_accuracy": acc,
        "macro_precision": macro_prec,
        "macro_recall": macro_rec,
        "macro_f1": macro_f1,
        "num_classes": num_classes,
        "model_architecture": args.model
    }

    report_path = os.path.join(output_dir, "evaluation_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)

    # Save per-class metrics CSV
    df_metrics = pd.DataFrame({
        "class_index": list(range(num_classes)),
        "class_name": class_labels,
        "precision": per_class_prec,
        "recall": per_class_rec,
        "f1_score": per_class_f1
    })
    csv_path = os.path.join(output_dir, "per_class_metrics.csv")
    df_metrics.to_csv(csv_path, index=False)

    # Save visual confusion matrix PNG
    cm_plot_path = os.path.join(output_dir, "confusion_matrix.png")
    plot_confusion_matrix(cm, class_labels, cm_plot_path)

    print("==================================================")
    print("EVALUATION SUMMARY")
    print("==================================================")
    print(f"Accuracy:        {acc:.4f}")
    print(f"Macro Precision: {macro_prec:.4f}")
    print(f"Macro Recall:    {macro_rec:.4f}")
    print(f"Macro F1:        {macro_f1:.4f}")
    print(f"Report saved:    {report_path}")
    print(f"CSV saved:       {csv_path}")
    print(f"Plot saved:      {cm_plot_path}")
    print("==================================================")

    return report_data

def main():
    parser = argparse.ArgumentParser(description="AgriSmart AI Model Evaluation")
    parser.add_argument("--checkpoint", type=str, default="ml-pipeline/checkpoints/best_model.pth")
    parser.add_argument("--data-dir", type=str, default="./ml-pipeline/data")
    parser.add_argument("--class-labels", type=str, default="backend/src/models/class_labels.json")
    parser.add_argument("--model", type=str, default="efficientnet_b0")
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--image-size", type=int, default=224)
    parser.add_argument("--output-dir", type=str, default="ml-pipeline/evaluation_results")
    parser.add_argument("--smoke-test", action="store_true")
    args = parser.parse_args()

    run_evaluation(args)

if __name__ == "__main__":
    main()
