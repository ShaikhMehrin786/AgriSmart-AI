# Offline Transfer Learning Model Training Loop for AgriSmart AI
import os
import sys
import json
import random
import argparse
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split

# Ensure ml-pipeline root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.model import create_model
from src.datasets.dataset import CropLeafDataset, discover_dataset, create_synthetic_smoke_dataset
from src.augmentations.transforms import get_train_transforms, get_val_transforms

def set_seed(seed=42):
    """Enforces deterministic reproducibility across random generators."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

def resolve_path(path):
    """Resolves path relative to current working directory or repository root."""
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
    """Loads single source of truth class labels list from JSON."""
    resolved = resolve_path(class_labels_path)
    if not os.path.exists(resolved):
        raise FileNotFoundError(f"Class labels JSON not found at: {class_labels_path} (resolved as: {resolved})")
    with open(resolved, 'r', encoding='utf-8') as f:
        labels = json.load(f)
    return labels

def train_one_epoch(model, dataloader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    all_preds = []
    all_targets = []

    for images, targets in dataloader:
        images, targets = images.to(device), targets.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        preds = torch.argmax(outputs, dim=1)
        all_preds.extend(preds.cpu().numpy())
        all_targets.extend(targets.cpu().numpy())

    total = len(dataloader.dataset)
    epoch_loss = running_loss / total
    epoch_acc = accuracy_score(all_targets, all_preds)
    epoch_f1 = f1_score(all_targets, all_preds, average='macro', zero_division=0)

    return epoch_loss, epoch_acc, epoch_f1

@torch.no_grad()
def validate(model, dataloader, criterion, device):
    model.eval()
    running_loss = 0.0
    all_preds = []
    all_targets = []

    for images, targets in dataloader:
        images, targets = images.to(device), targets.to(device)

        outputs = model(images)
        loss = criterion(outputs, targets)

        running_loss += loss.item() * images.size(0)
        preds = torch.argmax(outputs, dim=1)
        all_preds.extend(preds.cpu().numpy())
        all_targets.extend(targets.cpu().numpy())

    total = len(dataloader.dataset)
    epoch_loss = running_loss / total
    epoch_acc = accuracy_score(all_targets, all_preds)
    epoch_f1 = f1_score(all_targets, all_preds, average='macro', zero_division=0)

    return epoch_loss, epoch_acc, epoch_f1, all_targets, all_preds

def run_training(args):
    set_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Train] Execution device: {device}")

    # 1. Load class labels
    class_labels = load_class_labels(args.class_labels)
    num_classes = len(class_labels)
    print(f"[Train] Loaded {num_classes} target class labels from '{args.class_labels}'")

    # 2. Discover dataset files or handle smoke test mode
    output_dir = resolve_path(args.output_dir)
    if args.smoke_test or not os.path.exists(args.data_dir):
        if not args.smoke_test:
            print(f"[Train] Data directory '{args.data_dir}' not found.")
            print("[Train] Running pipeline verification in SMOKE-TEST mode with synthetic data.")
        smoke_dir = os.path.join(output_dir, "synthetic_smoke_data")
        file_paths, labels, _ = create_synthetic_smoke_dataset(smoke_dir, class_labels, samples_per_class=4)
        is_smoke_test = True
    else:
        file_paths, labels, _ = discover_dataset(args.data_dir, class_labels)
        is_smoke_test = False

    if len(file_paths) == 0:
        print(f"[ERROR] No valid images found in '{args.data_dir}'.")
        print("Please place PlantVillage/PlantDoc image folders in data_dir matching class label names.")
        print("Or run with --smoke-test to verify pipeline execution.")
        sys.exit(1)

    print(f"[Train] Total dataset size: {len(file_paths)} samples (Smoke test: {is_smoke_test})")

    # 3. Train/Val Split (80% train, 20% val)
    indices = list(range(len(file_paths)))
    train_size = max(1, int(0.8 * len(file_paths)))
    val_size = len(file_paths) - train_size

    if val_size == 0:
        train_indices = indices
        val_indices = indices
    else:
        use_stratify = (
            len(set(labels)) > 1 and
            val_size >= len(set(labels)) and
            min([labels.count(i) for i in set(labels)]) > 1
        )
        train_indices, val_indices = train_test_split(
            indices, train_size=train_size, test_size=val_size, random_state=args.seed,
            stratify=labels if use_stratify else None
        )

    train_files = [file_paths[i] for i in train_indices]
    train_labels = [labels[i] for i in train_indices]
    val_files = [file_paths[i] for i in val_indices]
    val_labels = [labels[i] for i in val_indices]

    train_dataset = CropLeafDataset(train_files, train_labels, transform=get_train_transforms(args.image_size))
    val_dataset = CropLeafDataset(val_files, val_labels, transform=get_val_transforms(args.image_size))

    train_loader = DataLoader(train_dataset, batch_size=min(args.batch_size, len(train_files)), shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=min(args.batch_size, len(val_files)), shuffle=False, num_workers=0)

    # 4. Model, Criterion, Optimizer
    model = create_model(args.model, num_classes=num_classes, pretrained=not is_smoke_test).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    scheduler = CosineAnnealingLR(optimizer, T_max=args.epochs)

    os.makedirs(output_dir, exist_ok=True)
    best_f1 = -1.0
    best_checkpoint_path = os.path.join(output_dir, "best_model.pth")
    history = {"train_loss": [], "train_acc": [], "train_f1": [], "val_loss": [], "val_acc": [], "val_f1": []}

    print(f"[Train] Starting training loop for {args.epochs} epochs...")
    for epoch in range(1, args.epochs + 1):
        t_loss, t_acc, t_f1 = train_one_epoch(model, train_loader, criterion, optimizer, device)
        v_loss, v_acc, v_f1, _, _ = validate(model, val_loader, criterion, device)
        scheduler.step()

        history["train_loss"].append(t_loss)
        history["train_acc"].append(t_acc)
        history["train_f1"].append(t_f1)
        history["val_loss"].append(v_loss)
        history["val_acc"].append(v_acc)
        history["val_f1"].append(v_f1)

        print(f"Epoch [{epoch:02d}/{args.epochs:02d}] "
              f"Train Loss: {t_loss:.4f} Acc: {t_acc:.4f} F1: {t_f1:.4f} | "
              f"Val Loss: {v_loss:.4f} Acc: {v_acc:.4f} F1: {v_f1:.4f}")

        if v_f1 >= best_f1:
            best_f1 = v_f1
            torch.save(model.state_dict(), best_checkpoint_path)
            print(f"  -> Saved model checkpoint (Val Macro-F1: {v_f1:.4f})")

    # Always save a final checkpoint if best checkpoint was not created
    if not os.path.exists(best_checkpoint_path):
        torch.save(model.state_dict(), best_checkpoint_path)

    # 5. Save model configuration and training history metadata
    model_config = {
        "model_name": args.model,
        "num_classes": num_classes,
        "image_size": args.image_size,
        "input_mean": [0.485, 0.456, 0.406],
        "input_std": [0.229, 0.224, 0.225],
        "class_labels": class_labels,
        "best_val_macro_f1": best_f1,
        "is_smoke_test": is_smoke_test
    }

    with open(os.path.join(output_dir, "model_config.json"), "w", encoding="utf-8") as f:
        json.dump(model_config, f, indent=2)

    with open(os.path.join(output_dir, "training_history.json"), "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    print(f"[Train] Training completed! Artifacts saved to '{output_dir}'")
    return best_checkpoint_path

def main():
    parser = argparse.ArgumentParser(description="AgriSmart AI Model Training Pipeline")
    parser.add_argument("--data-dir", type=str, default="./ml-pipeline/data", help="Directory containing crop leaf images")
    parser.add_argument("--class-labels", type=str, default="backend/src/models/class_labels.json", help="Path to class labels JSON")
    parser.add_argument("--model", type=str, default="efficientnet_b0", help="Model backbone architecture")
    parser.add_argument("--epochs", type=int, default=25, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Training batch size")
    parser.add_argument("--lr", type=float, default=3e-4, help="Learning rate")
    parser.add_argument("--weight-decay", type=float, default=1e-2, help="Weight decay")
    parser.add_argument("--image-size", type=int, default=224, help="Input image dimension")
    parser.add_argument("--output-dir", type=str, default="ml-pipeline/checkpoints", help="Output directory for checkpoints")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--smoke-test", action="store_true", help="Run synthetic dataset smoke test for pipeline verification")
    args = parser.parse_args()

    run_training(args)

if __name__ == "__main__":
    main()
