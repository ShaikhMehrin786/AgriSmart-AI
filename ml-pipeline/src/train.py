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

def freeze_backbone(model):
    """
    Freezes all EfficientNet-B0 layers except the final classifier head.
    On CPU this cuts backward-pass cost by ~99% since only 35k of 4M
    parameters receive gradients.
    """
    frozen = 0
    for name, param in model.named_parameters():
        if not name.startswith("classifier."):
            param.requires_grad = False
            frozen += param.numel()
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"[Model] Backbone FROZEN — trainable params: {trainable:,}  frozen: {frozen:,}")
    return model


def unfreeze_backbone(model):
    """
    Unfreezes all parameters for full fine-tuning.
    Call this for a second training phase or when passing --unfreeze-backbone.
    """
    for param in model.parameters():
        param.requires_grad = True
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"[Model] Backbone UNFROZEN — trainable params: {trainable:,}")
    return model


def subsample_per_class(file_paths, labels, n_per_class, seed):
    """
    Returns a deterministic subset of (file_paths, labels) keeping exactly
    n_per_class samples from each class that has enough images, or all
    available samples for classes with fewer than n_per_class images.

    Used only by --sanity-samples-per-class.  Never modifies the dataset on disk.
    """
    from collections import defaultdict
    rng = random.Random(seed)

    class_buckets = defaultdict(list)
    for path, label in zip(file_paths, labels):
        class_buckets[label].append(path)

    out_paths, out_labels = [], []
    for label in sorted(class_buckets):
        bucket = class_buckets[label]
        rng.shuffle(bucket)
        chosen = bucket[:n_per_class]
        out_paths.extend(chosen)
        out_labels.extend([label] * len(chosen))

    return out_paths, out_labels


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

    output_dir = resolve_path(args.output_dir)

    # ------------------------------------------------------------------ #
    # 2a. SMOKE-TEST MODE — synthetic data, no real dataset required      #
    # ------------------------------------------------------------------ #
    if args.smoke_test:
        print("[Train] --smoke-test flag set: running pipeline verification with synthetic data.")
        smoke_dir = os.path.join(output_dir, "synthetic_smoke_data")
        file_paths, labels, _ = create_synthetic_smoke_dataset(smoke_dir, class_labels, samples_per_class=4)

        indices = list(range(len(file_paths)))
        train_indices, val_indices = indices[:int(0.8 * len(indices))], indices[int(0.8 * len(indices)):]
        train_files  = [file_paths[i] for i in train_indices]
        train_labels = [labels[i]     for i in train_indices]
        val_files    = [file_paths[i] for i in val_indices]
        val_labels   = [labels[i]     for i in val_indices]
        is_smoke_test = True

    # ------------------------------------------------------------------ #
    # 2b. REAL TRAINING MODE — load pre-split benchmark directories       #
    # ------------------------------------------------------------------ #
    else:
        data_dir = resolve_path(args.data_dir)

        train_dir      = os.path.join(data_dir, "train")
        val_dir        = os.path.join(data_dir, "val")
        test_field_dir = os.path.join(data_dir, "test_field")   # never loaded here

        # Strict existence checks — never fall back silently to synthetic data
        for split_label, split_dir in [("train", train_dir), ("val", val_dir)]:
            if not os.path.isdir(split_dir):
                print(f"[ERROR] Expected {split_label}/ directory not found: {split_dir}")
                print("        Run the benchmark preparation script first, or use --smoke-test.")
                sys.exit(1)

        # Discover files from each pre-split directory
        train_files, train_labels, class_to_idx = discover_dataset(train_dir, class_labels)
        val_files,   val_labels,   _             = discover_dataset(val_dir,   class_labels)

        if len(train_files) == 0:
            print(f"[ERROR] train/ directory exists but contains no valid images: {train_dir}")
            print("        Rerun the benchmark preparation script.")
            sys.exit(1)

        if len(val_files) == 0:
            print(f"[ERROR] val/ directory exists but contains no valid images: {val_dir}")
            print("        Rerun the benchmark preparation script.")
            sys.exit(1)

        print(f"[Train] Training samples  : {len(train_files)}")
        print(f"[Train] Validation samples: {len(val_files)}")
        if os.path.isdir(test_field_dir):
            test_count = sum(
                len(os.listdir(os.path.join(test_field_dir, d)))
                for d in os.listdir(test_field_dir)
                if os.path.isdir(os.path.join(test_field_dir, d))
            )
            print(f"[Train] test_field samples: {test_count}  (held-out — NOT used during training)")

        is_smoke_test = False

    # ------------------------------------------------------------------ #
    # 2c. SANITY-CHECK SUBSET — real images, tiny deterministic slice     #
    # ------------------------------------------------------------------ #
    # Applied after discovery so it works identically for real and smoke  #
    # data paths without touching the dataset on disk.                    #
    if args.sanity_samples_per_class and args.sanity_samples_per_class > 0:
        orig_train = len(train_files)
        orig_val   = len(val_files)
        train_files, train_labels = subsample_per_class(
            train_files, train_labels, args.sanity_samples_per_class, args.seed
        )
        val_files, val_labels = subsample_per_class(
            val_files, val_labels, args.sanity_samples_per_class, args.seed
        )
        print(
            f"[Sanity] --sanity-samples-per-class {args.sanity_samples_per_class}: "
            f"train {orig_train} -> {len(train_files)},  "
            f"val {orig_val} -> {len(val_files)}"
        )
        print("[Sanity] Using real images from processed/train and processed/val.")
        print("[Sanity] Dataset on disk is NOT modified.")

    # ------------------------------------------------------------------ #
    # 3. Build datasets and loaders                                       #
    # ------------------------------------------------------------------ #
    train_dataset = CropLeafDataset(train_files, train_labels, transform=get_train_transforms(args.image_size))
    val_dataset   = CropLeafDataset(val_files,   val_labels,   transform=get_val_transforms(args.image_size))

    train_loader = DataLoader(
        train_dataset,
        batch_size=min(args.batch_size, len(train_files)),
        shuffle=True,
        num_workers=0,
        pin_memory=(device.type == "cuda"),
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=min(args.batch_size, len(val_files)),
        shuffle=False,
        num_workers=0,
        pin_memory=(device.type == "cuda"),
    )

    # 4. Model, Criterion, Optimizer
    model = create_model(args.model, num_classes=num_classes, pretrained=not is_smoke_test).to(device)

    # Freeze backbone for CPU-friendly head-only training unless explicitly disabled.
    # Only the classifier head (~36k params) receives gradients; the frozen backbone
    # still runs forward passes but skips backprop — ~99% fewer gradient computations.
    if args.unfreeze_backbone:
        unfreeze_backbone(model)
    else:
        freeze_backbone(model)

    # Optimizer only covers parameters that require gradients.
    # This is essential when the backbone is frozen — passing all parameters
    # to AdamW would waste memory and time maintaining optimizer state for
    # parameters that never receive gradient updates.
    trainable_params = [p for p in model.parameters() if p.requires_grad]
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = AdamW(trainable_params, lr=args.lr, weight_decay=args.weight_decay)
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
        "is_smoke_test": is_smoke_test,
        "frozen_backbone": not args.unfreeze_backbone,
        "trainable_params": sum(p.numel() for p in model.parameters() if p.requires_grad),
        "total_params": sum(p.numel() for p in model.parameters()),
    }

    with open(os.path.join(output_dir, "model_config.json"), "w", encoding="utf-8") as f:
        json.dump(model_config, f, indent=2)

    with open(os.path.join(output_dir, "training_history.json"), "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    print(f"[Train] Training completed! Artifacts saved to '{output_dir}'")
    return best_checkpoint_path

def main():
    parser = argparse.ArgumentParser(description="AgriSmart AI Model Training Pipeline")
    parser.add_argument("--data-dir", type=str, default="ml-pipeline/data/processed",
                        help="Benchmark root directory containing pre-split train/, val/, and test_field/ subdirectories")
    parser.add_argument("--class-labels", type=str, default="backend/src/models/class_labels_public.json",
                        help="Path to canonical class labels JSON (28-class public benchmark)")
    parser.add_argument("--model", type=str, default="efficientnet_b0", help="Model backbone architecture")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Training batch size")
    parser.add_argument("--lr", type=float, default=3e-4, help="Learning rate")
    parser.add_argument("--weight-decay", type=float, default=1e-2, help="Weight decay")
    parser.add_argument("--image-size", type=int, default=224, help="Input image dimension")
    parser.add_argument("--output-dir", type=str, default="ml-pipeline/checkpoints", help="Output directory for checkpoints")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--smoke-test", action="store_true", help="Run synthetic dataset smoke test for pipeline verification")
    parser.add_argument("--unfreeze-backbone", action="store_true",
                        help="Unfreeze the entire backbone for full fine-tuning. "
                             "Default (omitted): backbone is frozen and only the "
                             "classification head is trained — strongly recommended for CPU.")
    parser.add_argument("--sanity-samples-per-class", type=int, default=0,
                        help="Real-data sanity check: load this many images per class from "
                             "the real processed/train and processed/val directories, then "
                             "run 1 epoch to verify the full pipeline (image loading, "
                             "EfficientNet forward/backward, optimizer, validation) works "
                             "end-to-end on this CPU before committing to a full training run. "
                             "0 = disabled (default, uses all available images). "
                             "Recommended value: 5. Does NOT modify the dataset on disk.")
    args = parser.parse_args()

    run_training(args)

if __name__ == "__main__":
    main()
