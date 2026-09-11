# 🎴 Model Card — AgriSmart AI Crop Disease Classification Model

> **Target Audience:** M2 (CV & Explainability Lead) and M3 (Backend Architect Lead)  
> **Model Version:** v1.0.0 (EfficientNet-B0 backbone)  
> **Artifact Format:** PyTorch `.pth` checkpoint & Production ONNX `.onnx` weights  
> **SIH Benchmark Configurations:**  
> - Baseline Smoke-Test: `backend/src/models/class_labels.json` (38 classes: 26 diseases + 12 healthy)  
> - Public Real-World Benchmark: `backend/src/models/class_labels_public.json` (28 audited shared classes: 17 diseases + 11 healthy)

---

## 📌 Model Overview

The AgriSmart AI Disease Detection Engine is a transfer-learning deep neural network built on **EfficientNet-B0**. It accepts single foliar (leaf) images and outputs multi-class probability distributions across crop-disease conditions (including healthy foliage).

- **Primary Architecture:** `efficientnet_b0` (timm / torchvision)
- **Input Resolution:** `224 x 224` pixels (RGB)
- **Number of Classes:** Configurable (38 baseline or 28 public benchmark classes)
- **Export Standard:** ONNX Opset 14 (`agrismart_model.onnx`)
- **Execution Provider:** CPU (`CPUExecutionProvider` in PyTorch & `onnxruntime-node`)

---

## 🛡️ Dataset Protocol & Leakage Safeguards

- **Training/Validation Set:** PlantVillage laboratory images (`data/processed/train/` & `data/processed/val/`).
- **Held-Out Test Set:** PlantDoc real-world field images (`data/processed/test_field/`).
- **Audit Verification:** Strict SHA-256 hash collision checks verify `0` overlapping images between training/val sets and the held-out field test set.

---

## 📦 Artifact Locations & Hand-Off Specs

### 🔬 For Member 2 (CV & Explainability / Grad-CAM Lead)

| Artifact | File Path | Description |
|---|---|---|
| **Trained Checkpoint** | [`ml-pipeline/checkpoints/best_model.pth`](file:///d:/AgriSmart%20AI/ml-pipeline/checkpoints/best_model.pth) | PyTorch model weights state dict for feature map activation hook & Grad-CAM derivation. |
| **Model Configuration** | [`ml-pipeline/checkpoints/model_config.json`](file:///d:/AgriSmart%20AI/ml-pipeline/checkpoints/model_config.json) | Metadata containing backbone type, input dimensions, and ImageNet normalization stats. |
| **Public Target Class Labels** | [`backend/src/models/class_labels_public.json`](file:///d:/AgriSmart%20AI/backend/src/models/class_labels_public.json) | Shared PlantVillage + PlantDoc class label array (28 classes: 17 diseases + 11 healthy). |
| **Baseline Target Class Labels** | [`backend/src/models/class_labels.json`](file:///d:/AgriSmart%20AI/backend/src/models/class_labels.json) | 38-class baseline class label array. |
| **Class Intersection Report** | [`ml-pipeline/data/class_intersection_report.json`](file:///d:/AgriSmart%20AI/ml-pipeline/data/class_intersection_report.json) | Detailed cross-dataset mapping of PlantVillage vs PlantDoc. |
| **Dataset Validator** | [`ml-pipeline/src/datasets/validate_dataset.py`](file:///d:/AgriSmart%20AI/ml-pipeline/src/datasets/validate_dataset.py) | SIH dataset validator and data leakage auditor. |
| **Evaluation Suite** | [`ml-pipeline/src/evaluate.py`](file:///d:/AgriSmart%20AI/ml-pipeline/src/evaluate.py) | Evaluation pipeline for computing accuracy, Macro-F1, per-class metrics, and confusion matrix. |

---

### ⚡ For Member 3 (Backend Architect / `onnxruntime-node` Lead)

| Artifact | File Path | Description |
|---|---|---|
| **Production ONNX Model** | [`backend/src/models/agrismart_model.onnx`](file:///d:/AgriSmart%20AI/backend/src/models/agrismart_model.onnx) | Validated ONNX graph ready for zero-Python Node.js in-memory inference. |
| **Class Index Mapping** | [`backend/src/models/class_labels_public.json`](file:///d:/AgriSmart%20AI/backend/src/models/class_labels_public.json) | Ordered JSON array mapping output logit index $0 \dots N-1$ to class names. |
| **Parity Verification Script** | [`ml-pipeline/src/verify_onnx_parity.py`](file:///d:/AgriSmart%20AI/ml-pipeline/src/verify_onnx_parity.py) | Verification utility to ensure zero prediction drift between PyTorch CPU and ONNX Runtime. |

---

## 📐 Tensor Input & Preprocessing Specification

Node.js preprocessing MUST match the PyTorch validation pipeline (`get_val_transforms`):

1. **Format:** RGB 3-Channel buffer (JPEG / PNG / WebP converted to float tensor).
2. **Dimension:** `[1, 3, 224, 224]` (Dynamic batch dimension supported: `[batch_size, 3, 224, 224]`).
3. **Normalization Math:**
   $$\text{Pixel}_{\text{norm}} = \frac{\frac{\text{Pixel}}{255.0} - \text{Mean}}{\text{Std}}$$
   - **Mean ($\mu$):** `[0.485, 0.456, 0.406]`
   - **Standard Deviation ($\sigma$):** `[0.229, 0.224, 0.225]`
4. **Node.js Tensor Construction Example:**
   ```javascript
   // Shape: [1, 3, 224, 224], Float32Array in Planar (CHW) RGB order
   const inputTensor = new ort.Tensor('float32', float32Data, [1, 3, 224, 224]);
   const feeds = { input: inputTensor };
   const results = await session.run(feeds);
   const logits = results.output.data;
   ```

---

## 📊 Output Tensor Format

- **Output Node Name:** `"output"`
- **Logit Shape:** `[1, N]` Float32 values ($N = 31$ public benchmark classes or $N = 38$ baseline classes)
- **Activation:** Apply Softmax to convert raw logits to probabilities:
  $$P(y = c | X) = \frac{\exp(z_c)}{\sum_{j=1}^{N} \exp(z_j)}$$
- **Top-1 Prediction:** Class corresponding to $\arg\max_{c} P(y=c|X)$.

---

## 🧪 Numerical Parity Verification Summary

```text
PyTorch Prediction:  Squash___Powdery_mildew (Confidence: 1.0000)
ONNX Prediction:     Squash___Powdery_mildew (Confidence: 1.0000)
Max Prob Difference: 0.000000e+00
Status:              PASSED (Zero Drift Verified)
```
