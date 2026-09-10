# PyTorch to ONNX Model Exporter for AgriSmart AI
import os
import sys
import json
import argparse
import torch
import onnx

# Ensure ml-pipeline root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.model import create_model

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

def export_to_onnx(model_name, checkpoint_path, output_onnx_path, class_labels_path, image_size=224):
    class_labels = load_class_labels(class_labels_path)
    num_classes = len(class_labels)

    print(f"[ONNX Export] Creating model '{model_name}' (num_classes={num_classes})...")
    model = create_model(model_name, num_classes=num_classes, pretrained=False)

    resolved_checkpoint = resolve_path(checkpoint_path)
    if os.path.exists(resolved_checkpoint):
        state_dict = torch.load(resolved_checkpoint, map_location="cpu")
        model.load_state_dict(state_dict)
        print(f"[ONNX Export] Loaded checkpoint weights from '{resolved_checkpoint}'")
    else:
        print(f"[WARNING] Checkpoint '{checkpoint_path}' not found. Exporting base weights for testing...")

    model.eval()
    dummy_input = torch.randn(1, 3, image_size, image_size, requires_grad=False)

    resolved_output_path = resolve_path(output_onnx_path)
    os.makedirs(os.path.dirname(resolved_output_path), exist_ok=True)

    print(f"[ONNX Export] Exporting PyTorch model to ONNX at '{resolved_output_path}'...")
    torch.onnx.export(
        model,
        dummy_input,
        resolved_output_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input": {0: "batch_size"},
            "output": {0: "batch_size"}
        }
    )

    # Validate exported ONNX model structure
    print("[ONNX Export] Validating ONNX model graph with ONNX checker...")
    onnx_model = onnx.load(resolved_output_path)
    onnx.checker.check_model(onnx_model)

    print(f"[ONNX Export] Export & Validation complete! ONNX artifact saved to: {resolved_output_path}")
    return resolved_output_path

def main():
    parser = argparse.ArgumentParser(description="Export PyTorch model to ONNX for Node.js production inference")
    parser.add_argument("--model", type=str, default="efficientnet_b0")
    parser.add_argument("--checkpoint", type=str, default="ml-pipeline/checkpoints/best_model.pth")
    parser.add_argument("--output", type=str, default="backend/src/models/agrismart_model.onnx")
    parser.add_argument("--class-labels", type=str, default="backend/src/models/class_labels.json")
    parser.add_argument("--image-size", type=int, default=224)
    args = parser.parse_args()

    export_to_onnx(
        model_name=args.model,
        checkpoint_path=args.checkpoint,
        output_onnx_path=args.output,
        class_labels_path=args.class_labels,
        image_size=args.image_size
    )

if __name__ == "__main__":
    main()
