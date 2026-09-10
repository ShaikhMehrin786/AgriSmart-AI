# 🔬 AgriSmart AI — Machine Learning Pipeline

> **Role:** M1 — ML Engineer  
> **Target Task:** Plant/Crop Disease Detection using Computer Vision (SIH 2026 Core Task)  
> **Architecture:** EfficientNet-B0 / MobileNetV3 Transfer Learning  
> **Environment:** CPU-compatible PyTorch 2.6.0 (`torch==2.6.0+cpu`, `torchvision==0.21.0+cpu`)

---

## 📌 Quick Overview

The `ml-pipeline` directory contains the complete offline machine learning codebase for AgriSmart AI:
- **Dataset discovery & field augmentations** (Albumentations 2.0+ with ImageNet normalization).
- **Transfer learning model training loop** (timm backbone, AdamW, CosineAnnealingLR, Macro-F1 tracking).
- **Evaluation pipeline** (Accuracy, Macro Precision/Recall/F1, Per-class metrics, Confusion Matrix plot).
- **Single image inference CLI** (`predict.py`).
- **Production ONNX exporter** (`export_onnx.py`).
- **PyTorch vs ONNX Runtime numerical parity verifier** (`verify_onnx_parity.py`).

---

## ⚙️ Local Setup & Environment Installation

### 1. Create Virtual Environment

```bash
cd ml-pipeline
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\activate
```

### 2. Install CPU-Only PyTorch & ML Dependencies

```bash
# Install CPU PyTorch wheel first (Required for CPU-only development environments)
python -m pip install torch==2.6.0 torchvision==0.21.0 --index-url https://download.pytorch.org/whl/cpu

# Install remaining ML packages
python -m pip install -r requirements.txt
```

---

## 🚀 Usage Commands

### 1. Validate Environment Installation

```bash
python -c "import torch, torchvision, timm, albumentations, cv2, onnx, onnxruntime; print('Torch:', torch.__version__); print('Device:', torch.device('cuda' if torch.cuda.is_available() else 'cpu'))"
```

---

### 2. Dataset Structure

Place your training images inside `ml-pipeline/data/` organized by class subdirectories matching `backend/src/models/class_labels.json`:

```text
ml-pipeline/data/
├── Apple___Apple_scab/
│   ├── img1.jpg
│   └── img2.jpg
├── Tomato___Early_blight/
│   ├── img1.jpg
│   └── img2.jpg
└── ...
```

---

### 3. Model Training Command

Run transfer learning model training across your local dataset:

```bash
python src/train.py \
  --data-dir ./data \
  --class-labels ../backend/src/models/class_labels.json \
  --model efficientnet_b0 \
  --epochs 25 \
  --batch-size 32 \
  --output-dir ./checkpoints
```

> **Pipeline Smoke Test Mode:** If dataset is not yet present, verify the full training pipeline with synthetic mock data:
> ```bash
> python src/train.py --smoke-test --epochs 2 --batch-size 8
> ```

---

### 4. Model Evaluation Command

Run evaluation report and confusion matrix generator:

```bash
python src/evaluate.py \
  --checkpoint ./checkpoints/best_model.pth \
  --data-dir ./data \
  --class-labels ../backend/src/models/class_labels.json \
  --output-dir ./evaluation_results
```

---

### 5. Single Image Prediction CLI

Predict crop disease and confidence score for a single image:

```bash
python src/predict.py \
  --image ./path/to/leaf_photo.jpg \
  --checkpoint ./checkpoints/best_model.pth \
  --class-labels ../backend/src/models/class_labels.json
```

---

### 6. Export PyTorch Model to ONNX

Export validated PyTorch checkpoint weights to production ONNX format:

```bash
python src/export_onnx.py \
  --checkpoint ./checkpoints/best_model.pth \
  --output ../backend/src/models/agrismart_model.onnx \
  --class-labels ../backend/src/models/class_labels.json
```

---

### 7. ONNX Numerical Parity Verification

Verify that PyTorch CPU inference and ONNX Runtime CPU inference produce identical predictions:

```bash
python src/verify_onnx_parity.py \
  --checkpoint ./checkpoints/best_model.pth \
  --onnx-model ../backend/src/models/agrismart_model.onnx \
  --class-labels ../backend/src/models/class_labels.json
```

---

## 📄 Key Artifacts Produced

- **Checkpoint weights:** `ml-pipeline/checkpoints/best_model.pth`
- **Training metadata:** `ml-pipeline/checkpoints/model_config.json` & `training_history.json`
- **Evaluation report:** `ml-pipeline/evaluation_results/evaluation_report.json`
- **Per-class CSV:** `ml-pipeline/evaluation_results/per_class_metrics.csv`
- **Confusion Matrix plot:** `ml-pipeline/evaluation_results/confusion_matrix.png`
- **Production ONNX weights:** `backend/src/models/agrismart_model.onnx`
