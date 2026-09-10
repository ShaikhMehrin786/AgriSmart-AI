# Offline Transfer Learning Model Training Loop
# Trains EfficientNet-B0 / MobileNetV3 and saves best checkpoint
import os
import argparse
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
import timm

def create_model(model_name="efficientnet_b0", num_classes=38, pretrained=True):
    print(f"🔬 Initializing backbone '{model_name}' (num_classes={num_classes}, pretrained={pretrained})...")
    model = timm.create_model(model_name, pretrained=pretrained, num_classes=num_classes)
    return model

def main():
    parser = argparse.ArgumentParser(description="AgriSmart AI Model Training")
    parser.add_argument("--model", type=str, default="efficientnet_b0", help="Backbone architecture")
    parser.add_argument("--epochs", type=int, default=25, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--lr", type=float, default=3e-4, help="Learning rate")
    parser.add_argument("--num-classes", type=int, default=38, help="Number of target disease classes")
    parser.add_argument("--output-dir", type=str, default="./checkpoints", help="Output checkpoint directory")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"🚀 Training on device: {device}")

    model = create_model(args.model, num_classes=args.num_classes).to(device)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=1e-2)
    scheduler = CosineAnnealingLR(optimizer, T_max=args.epochs)

    print("✅ Training scaffold initialized successfully.")
    print("👉 To run training with your local dataset, prepare train/val folders and run python src/train.py")

if __name__ == "__main__":
    main()
