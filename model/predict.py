#!/usr/bin/env python3
"""
AgriSmart AI — Single Image Disease Prediction Interface
Fulfills SIH 2026 Core Task Specification (Section 4.1 & 7.1)

Usage:
    CLI:
        python predict.py --image path/to/leaf_image.jpg
        python predict.py --image path/to/leaf_image.jpg --verbose

    Python API:
        from predict import predict
        class_label = predict("path/to/leaf_image.jpg")
"""

import os
import sys
import json
import argparse
import numpy as np
from PIL import Image

def _find_file(rel_path):
    candidates = [
        rel_path,
        os.path.join(os.path.dirname(__file__), rel_path),
        os.path.join(os.path.dirname(__file__), "..", rel_path),
        os.path.join(os.path.dirname(__file__), "backend", "src", "models", os.path.basename(rel_path)),
    ]
    for c in candidates:
        abs_c = os.path.abspath(c)
        if os.path.exists(abs_c):
            return abs_c
    return rel_path

MODEL_FILE = _find_file(os.path.join("backend", "src", "models", "agrismart_efficientnet_b0.onnx"))
LABELS_FILE = _find_file(os.path.join("backend", "src", "models", "class_labels.json"))

_SESSION = None
_LABELS = None

def _get_session():
    global _SESSION, _LABELS
    if _SESSION is None:
        try:
            import onnxruntime as ort
        except ImportError:
            raise ImportError(
                "onnxruntime is required for AgriSmart AI prediction. Install via: pip install onnxruntime"
            )
        if not os.path.exists(MODEL_FILE):
            raise FileNotFoundError(f"Model file not found at: {MODEL_FILE}")
        if not os.path.exists(LABELS_FILE):
            raise FileNotFoundError(f"Class labels file not found at: {LABELS_FILE}")

        _SESSION = ort.InferenceSession(MODEL_FILE, providers=["CPUExecutionProvider"])
        with open(LABELS_FILE, "r", encoding="utf-8") as f:
            _LABELS = json.load(f)
    return _SESSION, _LABELS

def preprocess_image(image_path, input_size=224):
    """Load, convert to RGB, resize, and normalize according to ImageNet statistics."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at: {image_path}")

    img = Image.open(image_path).convert("RGB")
    img = img.resize((input_size, input_size), Image.Resampling.BILINEAR)

    arr = np.array(img, dtype=np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    arr = (arr - mean) / std

    # Transpose to (Channel, Height, Width) and add batch dim -> (1, 3, 224, 224)
    arr = np.transpose(arr, (2, 0, 1))
    arr = np.expand_dims(arr, 0)
    return arr

def predict(image_path, return_meta=False):
    """
    Core submission function contract (Section 4.1):
    predict(image_path) -> class_label (str)
    """
    session, labels = _get_session()
    tensor = preprocess_image(image_path)

    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: tensor})[0][0]

    # Softmax probabilities
    exp_scores = np.exp(outputs - np.max(outputs))
    probs = exp_scores / np.sum(exp_scores)

    top_idx = int(np.argmax(probs))
    predicted_class = labels[top_idx]
    confidence = float(probs[top_idx])

    if return_meta:
        top5_indices = np.argsort(probs)[::-1][:5]
        top5 = [
            {"class_name": labels[idx], "confidence": float(probs[idx])}
            for idx in top5_indices
        ]
        return {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "class_index": top_idx,
            "top5": top5
        }

    return predicted_class

def main():
    parser = argparse.ArgumentParser(description="AgriSmart AI — Crop Disease Predictor CLI (SIH-2026)")
    parser.add_argument("--image", type=str, required=True, help="Path to leaf image file")
    parser.add_argument("--verbose", action="store_true", help="Output confidence and top-5 breakdown")
    args = parser.parse_args()

    if args.verbose:
        res = predict(args.image, return_meta=True)
        print("==================================================")
        print("AGRISMART AI — SINGLE IMAGE DIAGNOSTIC RESULT")
        print("==================================================")
        print(f"Prediction: {res['predicted_class']}")
        print(f"Confidence: {res['confidence']:.4f} ({res['confidence']*100:.2f}%)")
        print("Top-5 Breakdown:")
        for r, item in enumerate(res["top5"], 1):
            print(f"  {r}. {item['class_name']}: {item['confidence']*100:.2f}%")
        print("==================================================")
    else:
        # Standard format requested by Section 4.1: prints the predicted class string
        predicted_class = predict(args.image)
        print(predicted_class)

if __name__ == "__main__":
    main()
