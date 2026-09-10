# Single Image Prediction CLI and Module for AgriSmart AI
import os
import sys
import json
import argparse
import cv2
import torch

# Ensure ml-pipeline root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.model import create_model
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
def predict_image(image_path, model_path, class_labels_path, model_name="efficientnet_b0", image_size=224, device=None):
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    class_labels = load_class_labels(class_labels_path)
    num_classes = len(class_labels)

    resolved_image_path = resolve_path(image_path)
    if not os.path.exists(resolved_image_path):
        raise FileNotFoundError(f"Input image not found at: {image_path}")

    image_bgr = cv2.imread(resolved_image_path)
    if image_bgr is None:
        raise ValueError(f"Unable to load image file at: {resolved_image_path}")

    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

    val_transform = get_val_transforms(image_size)
    augmented = val_transform(image=image_rgb)
    tensor_input = augmented['image'].unsqueeze(0).to(device)

    model = create_model(model_name, num_classes=num_classes, pretrained=False).to(device)
    resolved_model_path = resolve_path(model_path)
    if os.path.exists(resolved_model_path):
        state_dict = torch.load(resolved_model_path, map_location=device)
        model.load_state_dict(state_dict)
    else:
        print(f"[WARNING] Checkpoint '{model_path}' not found; using initialized model weights.")

    model.eval()
    outputs = model(tensor_input)
    probabilities = torch.softmax(outputs, dim=1).squeeze(0)

    top_conf, top_idx = torch.max(probabilities, dim=0)
    top_class = class_labels[top_idx.item()]
    confidence = top_conf.item()

    # Calculate Top-5 predictions
    top5_probs, top5_indices = torch.topk(probabilities, min(5, num_classes))
    top5 = []
    for p, idx in zip(top5_probs, top5_indices):
        top5.append({
            "class_name": class_labels[idx.item()],
            "confidence": float(p.item())
        })

    return {
        "predicted_class": top_class,
        "confidence": confidence,
        "class_index": top_idx.item(),
        "top5": top5
    }

def main():
    parser = argparse.ArgumentParser(description="Single Image Prediction CLI")
    parser.add_argument("--image", type=str, required=True, help="Path to leaf image")
    parser.add_argument("--checkpoint", type=str, default="ml-pipeline/checkpoints/best_model.pth", help="Path to model checkpoint")
    parser.add_argument("--class-labels", type=str, default="backend/src/models/class_labels.json", help="Path to class labels JSON")
    parser.add_argument("--model", type=str, default="efficientnet_b0", help="Model backbone architecture")
    parser.add_argument("--image-size", type=int, default=224, help="Image input dimension")
    args = parser.parse_args()

    result = predict_image(
        image_path=args.image,
        model_path=args.checkpoint,
        class_labels_path=args.class_labels,
        model_name=args.model,
        image_size=args.image_size
    )

    print("==================================================")
    print("AGRISMART AI — SINGLE IMAGE DIAGNOSTIC RESULT")
    print("==================================================")
    print(f"Prediction: {result['predicted_class']}")
    print(f"Confidence: {result['confidence']:.4f} ({result['confidence']*100:.2f}%)")
    print("Top-5 Class Probabilities:")
    for rank, item in enumerate(result['top5'], 1):
        print(f"  {rank}. {item['class_name']}: {item['confidence']:.4f}")
    print("==================================================")

if __name__ == "__main__":
    main()
