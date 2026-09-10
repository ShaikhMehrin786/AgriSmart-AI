# 🔬 AgriSmart AI — Machine Learning Pipeline

> **Role:** M1 — ML Engineer  
> **Target Task:** Plant/Crop Disease Detection using Computer Vision (SIH 2026 Core Task)  
> **Architecture:** EfficientNet-B0 / MobileNetV3 Transfer Learning  
> **Environment:** CPU-compatible PyTorch 2.6.0 (`torch==2.6.0+cpu`, `torchvision==0.21.0+cpu`)

---

## 📌 Quick Overview

The `ml-pipeline` directory contains the complete offline machine learning codebase for AgriSmart AI:
- **Dataset Discovery, Splitting & Data Leakage Auditor** (`validate_dataset.py`, `prepare_splits.py`).
- **Field-Oriented Augmentation Pipeline** (Albumentations 2.0+ with ImageNet normalization).
- **Transfer Learning Training Loop** (timm backbone, AdamW, CosineAnnealingLR, Macro-F1 tracking).
- **Evaluation Pipeline** (Accuracy, Macro Precision/Recall/F1, Per-Class CSV, Confusion Matrix PNG).
- **Single Image Inference CLI** (`predict.py`).
- **Production ONNX Exporter** (`export_onnx.py`).
- **PyTorch vs ONNX Runtime Numerical Parity Verifier** (`verify_onnx_parity.py`).

---

## 🚨 SIH 2026 Dataset Protocol & Held-Out Test Policy

1. **Training & Validation Data:** PlantVillage-style lab-condition leaf images are used for model training and local validation.
2. **Held-Out Test Data:** PlantDoc-style real-world field-condition images are strictly reserved for held-out evaluation (`data/processed/test_field/`).
3. **ZERO Data Leakage Policy:** Held-out field test images must **NEVER** be included in training DataLoaders, validation sets, or hyperparameter selection loops.
4. **Shared SIH Class List:** The baseline configuration uses 38 PlantVillage classes for pipeline verification. When the organizers release the final ~15–20 shared SIH class list, replace `backend/src/models/class_labels.json` — the pipeline automatically adapts to any configurable class count without code changes.

---

## 📁 Dataset Directory Architecture

```text
ml-pipeline/data/
├── raw/
│   ├── plantvillage/             # Raw lab-condition images
│   └── plantdoc/                 # Raw field-condition images
├── processed/
│   ├── train/                    # Lab training images (PlantVillage)
│   │   ├── <class_1>/
│   │   └── <class_2>/
│   ├── val/                      # Lab validation images (PlantVillage)
│   │   ├── <class_1>/
│   │   └── <class_2>/
│   └── test_field/               # Held-out field test images (PlantDoc)
│       ├── <class_1>/
│       └── <class_2>/
├── dataset_summary.json          # Machine-readable summary report
└── dataset_summary.csv           # Tabular dataset summary report
```

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

### 1. Dataset Preparation & Reproducible Splitting

Split raw laboratory images into an 80/20 train/validation set and isolate field test images:

```bash
python src/datasets/prepare_splits.py \
  --lab-data-dir ./data/raw/plantvillage \
  --field-data-dir ./data/raw/plantdoc \
  --output-processed-dir ./data/processed \
  --class-labels ../backend/src/models/class_labels.json \
  --seed 42
```

---

### 2. Dataset Validation & Leakage Audit

Run strict dataset validation before training:

```bash
python src/datasets/validate_dataset.py \
  --data-dir ./data/processed \
  --class-labels ../backend/src/models/class_labels.json
```

The validator automatically checks for corrupt images, missing/unexpected classes, class imbalance, and verifies **zero content hash leakage** between training and held-out test sets.

---

### 3. Model Training Command

Run transfer learning model training across processed datasets:

```bash
python src/train.py \
  --data-dir ./data/processed/train \
  --class-labels ../backend/src/models/class_labels.json \
  --model efficientnet_b0 \
  --epochs 25 \
  --batch-size 32 \
  --output-dir ./checkpoints
```

> **Pipeline Smoke Test Mode:** Verify full pipeline execution using synthetic data when full datasets are not present:
> ```bash
> python src/train.py --smoke-test --epochs 2 --batch-size 8
> ```

---

### 4. Model Evaluation Command

Run evaluation on local validation data or held-out field test set:

```bash
python src/evaluate.py \
  --checkpoint ./checkpoints/best_model.pth \
  --data-dir ./data/processed/test_field \
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

- **Dataset Summary JSON:** `ml-pipeline/data/processed/dataset_summary.json`
- **Dataset Summary CSV:** `ml-pipeline/data/processed/dataset_summary.csv`
- **Checkpoint weights:** `ml-pipeline/checkpoints/best_model.pth`
- **Training metadata:** `ml-pipeline/checkpoints/model_config.json` & `training_history.json`
- **Evaluation report:** `ml-pipeline/evaluation_results/evaluation_report.json`
- **Per-class CSV:** `ml-pipeline/evaluation_results/per_class_metrics.csv`
- **Confusion Matrix plot:** `ml-pipeline/evaluation_results/confusion_matrix.png`
- **Production ONNX weights:** `backend/src/models/agrismart_model.onnx`
