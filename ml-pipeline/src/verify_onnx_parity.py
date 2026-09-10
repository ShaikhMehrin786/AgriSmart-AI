# Numerical Parity Verification between PyTorch and ONNX Runtime Engines
import os
import sys
import json
import argparse
import cv2
import numpy as np
import torch
import onnxruntime as ort

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

def run_parity_check(checkpoint_path, onnx_model_path, class_labels_path, image_path=None, model_name="efficientnet_b0", image_size=224, tolerance=1e-4):
    class_labels = load_class_labels(class_labels_path)
    num_classes = len(class_labels)

    # 1. Prepare Input Data
    if image_path and os.path.exists(resolve_path(image_path)):
        img_bgr = cv2.imread(resolve_path(image_path))
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        transform = get_val_transforms(image_size)
        tensor_input = transform(image=img_rgb)['image'].unsqueeze(0)
    else:
        print("[Parity Check] No test image provided; using deterministic random tensor for validation.")
        torch.manual_seed(42)
        tensor_input = torch.randn(1, 3, image_size, image_size)

    np_input = tensor_input.numpy()

    # 2. PyTorch CPU Inference
    pytorch_model = create_model(model_name, num_classes=num_classes, pretrained=False)
    resolved_ckpt = resolve_path(checkpoint_path)
    if os.path.exists(resolved_ckpt):
        state_dict = torch.load(resolved_ckpt, map_location="cpu")
        pytorch_model.load_state_dict(state_dict)
    pytorch_model.eval()

    with torch.no_grad():
        pytorch_logits = pytorch_model(tensor_input).numpy()
        pytorch_probs = torch.softmax(torch.tensor(pytorch_logits), dim=1).numpy()

    py_idx = int(np.argmax(pytorch_probs[0]))
    py_class = class_labels[py_idx]
    py_conf = float(pytorch_probs[0][py_idx])

    # 3. ONNX Runtime CPU Inference
    resolved_onnx = resolve_path(onnx_model_path)
    if not os.path.exists(resolved_onnx):
        raise FileNotFoundError(f"ONNX model weight file not found at: {resolved_onnx}")

    session = ort.InferenceSession(resolved_onnx, providers=['CPUExecutionProvider'])
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name

    onnx_logits = session.run([output_name], {input_name: np_input})[0]
    onnx_probs = torch.softmax(torch.tensor(onnx_logits), dim=1).numpy()

    onnx_idx = int(np.argmax(onnx_probs[0]))
    onnx_class = class_labels[onnx_idx]
    onnx_conf = float(onnx_probs[0][onnx_idx])

    # 4. Compare Differences
    max_logit_diff = float(np.max(np.abs(pytorch_logits - onnx_logits)))
    max_prob_diff = float(np.max(np.abs(pytorch_probs - onnx_probs)))
    is_class_match = (py_class == onnx_class)
    is_parity_passed = (max_prob_diff <= tolerance) and is_class_match

    print("==================================================")
    print("AGRISMART AI - PYTORCH VS ONNX PARITY CHECK")
    print("==================================================")
    print(f"PyTorch Prediction:  {py_class} (Confidence: {py_conf:.4f})")
    print(f"ONNX Prediction:     {onnx_class} (Confidence: {onnx_conf:.4f})")
    print(f"Max Logit Difference: {max_logit_diff:.6e}")
    print(f"Max Prob Difference:  {max_prob_diff:.6e}")
    print(f"Class Match:          {'PASSED' if is_class_match else 'FAILED'}")
    print(f"Parity Test Result:   {'PASSED (Numerical Parity Verified)' if is_parity_passed else 'WARNING (Tolerance Exceeded)'}")
    print("==================================================")

    result = {
        "pytorch_class": py_class,
        "pytorch_confidence": py_conf,
        "onnx_class": onnx_class,
        "onnx_confidence": onnx_conf,
        "max_logit_difference": max_logit_diff,
        "max_prob_difference": max_prob_diff,
        "class_match": is_class_match,
        "parity_passed": is_parity_passed
    }

    return result

def main():
    parser = argparse.ArgumentParser(description="PyTorch vs ONNX Runtime Numerical Parity Check")
    parser.add_argument("--checkpoint", type=str, default="ml-pipeline/checkpoints/best_model.pth")
    parser.add_argument("--onnx-model", type=str, default="backend/src/models/agrismart_model.onnx")
    parser.add_argument("--class-labels", type=str, default="backend/src/models/class_labels.json")
    parser.add_argument("--image", type=str, default=None, help="Optional image path for test")
    parser.add_argument("--model", type=str, default="efficientnet_b0")
    parser.add_argument("--tolerance", type=float, default=1e-4)
    args = parser.parse_args()

    run_parity_check(
        checkpoint_path=args.checkpoint,
        onnx_model_path=args.onnx_model,
        class_labels_path=args.class_labels,
        image_path=args.image,
        model_name=args.model,
        tolerance=args.tolerance
    )

if __name__ == "__main__":
    main()
