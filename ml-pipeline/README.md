# 🔬 AgriSmart AI — Machine Learning Pipeline

> **Role:** M1 — ML Engineer  
> **Target Task:** Plant/Crop Disease Detection using Computer Vision (SIH 2026 Core Task)  
> **Architecture:** EfficientNet-B0 / MobileNetV3 Transfer Learning  
> **Environment:** CPU-compatible PyTorch 2.6.0 (`torch==2.6.0+cpu`, `torchvision==0.21.0+cpu`)

---

## 📌 Quick Overview

The `ml-pipeline` directory contains the complete offline machine learning codebase for AgriSmart AI:
- **Public Benchmark Preparation & Class Intersection Pipeline** (`prepare_public_benchmark.py`).
- **Dataset Discovery, Splitting & Data Leakage Auditor** (`validate_dataset.py`, `prepare_splits.py`).
- **Field-Oriented Augmentation Pipeline** (Albumentations 2.0+ with ImageNet normalization).
- **Transfer Learning Training Loop** (timm backbone, AdamW, CosineAnnealingLR, Macro-F1 tracking).
- **Evaluation Pipeline** (Accuracy, Macro Precision/Recall/F1, Per-Class CSV, Confusion Matrix PNG).
- **Single Image Inference CLI** (`predict.py`).
- **Production ONNX Exporter** (`export_onnx.py`).
- **PyTorch vs ONNX Runtime Numerical Parity Verifier** (`verify_onnx_parity.py`).

---

## 📚 Public Dataset Citations & Licenses

AgriSmart AI utilizes two open-access agricultural datasets for development and benchmark evaluation:

1. **PlantVillage (Laboratory Baseline):**
   - **Repository:** [`spMohanty/PlantVillage-Dataset`](https://github.com/spMohanty/PlantVillage-Dataset)
   - **Characteristics:** 54,306 laboratory-curated color images covering 14 crops and 26 disease categories.
   - **License:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0).
   - **Role in AgriSmart:** Primary source for transfer-learning feature extraction (`data/processed/train` & `data/processed/val`).

2. **PlantDoc (Field-Condition Benchmark):**
   - **Repository:** [`pratikkayal/PlantDoc-Dataset`](https://github.com/pratikkayal/PlantDoc-Dataset) (Singh et al., CoDS-COMAD 2020)
   - **Characteristics:** 2,598 in-situ field photographs taken under natural agricultural sunlight, complex soil/foliage backgrounds, and variable smartphone sensors.
   - **License:** MIT Open Source License.
   - **Role in AgriSmart:** Isolated held-out field evaluation benchmark (`data/processed/test_field`).

> [!NOTE]
> This public dataset setup serves as our internal development and evaluation benchmark. It is distinct from any organizer-held-out judging evaluation dataset.

---

## 🚨 SIH 2026 Dataset Protocol & Zero Data Leakage Policy

1. **Training & Validation Data:** PlantVillage-style lab-condition leaf images are used for model training and local validation.
2. **Held-Out Test Data:** PlantDoc-style real-world field-condition images are strictly reserved for held-out evaluation (`data/processed/test_field/`).
3. **ZERO Data Leakage Policy:** Held-out field test images must **NEVER** be included in training DataLoaders, validation sets, or hyperparameter selection loops.
4. **Canonical Class Mapping:**
   - Baseline smoke-test configuration: [`backend/src/models/class_labels.json`](file:///d:/AgriSmart%20AI/backend/src/models/class_labels.json) (38 classes: 26 diseases + 12 healthy).
   - Public PlantVillage + PlantDoc shared benchmark: [`backend/src/models/class_labels_public.json`](file:///d:/AgriSmart%20AI/backend/src/models/class_labels_public.json) (28 audited shared classes: 17 diseases + 11 healthy).

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
├── class_intersection_report.json # Detailed cross-dataset mapping
├── dataset_summary_public.json    # Machine-readable summary report
└── dataset_summary_public.csv     # Tabular dataset summary report
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

## 🚀 Public Dataset Acquisition & Preparation

### 1. Manual Download Commands (PowerShell)

```powershell
# Create raw directories
New-Item -ItemType Directory -Path "ml-pipeline/data/raw/plantvillage" -Force
New-Item -ItemType Directory -Path "ml-pipeline/data/raw/plantdoc" -Force

# Clone PlantDoc repository (~50 MB)
git clone https://github.com/pratikkayal/PlantDoc-Dataset.git ml-pipeline/data/raw/plantdoc_repo

# Download and extract PlantVillage color dataset (~2.5 GB)
Invoke-WebRequest -Uri "https://github.com/spMohanty/PlantVillage-Dataset/archive/refs/heads/master.zip" -OutFile "ml-pipeline/data/raw/plantvillage_master.zip"
Expand-Archive -Path "ml-pipeline/data/raw/plantvillage_master.zip" -DestinationPath "ml-pipeline/data/raw/plantvillage_extracted"
```

---

### 2. Class Intersection & Public Benchmark Preparation

Execute the intersection and splitting utility:

```bash
python src/datasets/prepare_public_benchmark.py \
  --pv-dir ./data/raw/plantvillage \
  --pd-dir ./data/raw/plantdoc \
  --processed-dir ./data/processed \
  --labels-output ../backend/src/models/class_labels_public.json \
  --report-output ./data/class_intersection_report.json \
  --summary-output ./data/dataset_summary_public.csv \
  --seed 42
```

---

### 3. Dataset Validation & Leakage Audit

Run strict dataset validation before training:

```bash
python src/datasets/validate_dataset.py \
  --data-dir ./data/processed \
  --class-labels ../backend/src/models/class_labels_public.json
```

The validator automatically checks for corrupt images, missing/unexpected classes, class imbalance, and verifies **zero content hash leakage** between training and held-out test sets.

---

### 4. Model Training Command

Run transfer learning model training across public benchmark datasets:

```bash
python src/train.py \
  --data-dir ./data/processed/train \
  --class-labels ../backend/src/models/class_labels_public.json \
  --model efficientnet_b0 \
  --epochs 25 \
  --batch-size 32 \
  --output-dir ./checkpoints
```

> **Pipeline Smoke Test Mode:** Verify full pipeline execution using synthetic data when full datasets are not present:
> ```bash
> python src/train.py --smoke-test --epochs 2 --batch-size 8 --class-labels ../backend/src/models/class_labels_public.json
> ```

---

### 5. Model Evaluation on Held-Out Field Data

Evaluate the model against real-world field images:

```bash
python src/evaluate.py \
  --checkpoint ./checkpoints/best_model.pth \
  --data-dir ./data/processed/test_field \
  --class-labels ../backend/src/models/class_labels_public.json \
  --output-dir ./evaluation_results
```

---

### 6. Export PyTorch Model to ONNX

Export validated PyTorch checkpoint weights to production ONNX format:

```bash
python src/export_onnx.py \
  --checkpoint ./checkpoints/best_model.pth \
  --output ../backend/src/models/agrismart_efficientnet_b0.onnx \
  --class-labels ../backend/src/models/class_labels_public.json
```

---

### 7. ONNX Numerical Parity Verification

Verify that PyTorch CPU inference and ONNX Runtime CPU inference produce identical predictions:

```bash
python src/verify_onnx_parity.py \
  --checkpoint ./checkpoints/best_model.pth \
  --onnx-model ../backend/src/models/agrismart_efficientnet_b0.onnx \
  --class-labels ../backend/src/models/class_labels_public.json
```
