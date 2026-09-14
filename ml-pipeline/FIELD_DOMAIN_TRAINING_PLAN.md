# 🌾 Field-Domain Model Training & Domain Adaptation Plan

> **AgriSmart AI — SIH 2026 Machine Learning Pipeline**  
> **Target Architecture:** efficientnet_b0 (Transfer Learning from ImageNet-1k)  
> **Output Space:** 28 Audited Canonical Classes (17 Diseases + 11 Healthy)  
> **Strategy:** Mixed-Domain Multi-Source Training with Held-Out Field Evaluation

---

## 1. Motivation & The Domain Gap

In foliar disease diagnosis, laboratory datasets (e.g., PlantVillage) feature clean detached leaves, uniform grey/black backgrounds, controlled studio illumination, and centered focus. When deployed to mobile devices in real agricultural fields (e.g., PlantDoc), models trained exclusively on lab data experience substantial domain shift due to:
- Direct sunlight, harsh cast shadows, and canopy dappling
- Variable smartphone camera lenses, sensor noise, and compression artifacts
- Background clutter (soil, neighboring weeds, farmer hands, stems, trellis)
- Leaf angle, partial occlusion, and multi-lesion distributions

Our baseline evaluation showed an in-lab validation Macro-F1 of **0.9931**, while zero-shot transfer onto the held-out real-world PlantDoc field test set yielded a Macro-F1 of **0.2694**.

---

## 2. Dataset Protocol & Strict Leakage Safeguards

To bridge this gap without invalidating scientific evaluation, the training dataset incorporates real field training images while strictly protecting the evaluation benchmark:

| Split | Source Dataset | Image Count | Purpose | Leakage Rule |
|---|---|---|---|---|
| **Train Set (Lab + Field Mix)** | PlantVillage Train + PlantDoc Train | 29,615 (PV) + 2,366 (PD) = **31,981** | Primary model training | SHA-256 collision check against 	est_field = 0 |
| **Validation Set (Lab)** | PlantVillage Val | **7,403** | Learning rate scheduling & early stopping | SHA-256 collision check against 	rain & 	est_field = 0 |
| **Held-Out Test Set (Field Only)** | PlantDoc 	est_field | **236** (17 diseases + 10 healthy) | **Untouched benchmark evaluation** | **STRICTLY ZERO TRAINING EXPOSURE** |

> [!IMPORTANT]
> **Zero-Leakage Assurance:** PlantDoc 	est_field images (ml-pipeline/data/processed/test_field) are isolated. Training routines must never point to 	est_field. SHA-256 cryptographic hashes guarantee that not a single test image or intra-dataset duplicate is present in the training corpus.

---

## 3. Training Architecture & Loss Formulation

### Backbone & Head
- **Backbone:** efficientnet_b0 pretrained on ImageNet.
- **Classifier Head:** Dropout (=0.3$) -> Linear projection ( -> 28$).
- **Multi-Stage Fine-Tuning:**
  - **Stage 1 (Head Warmup):** Freeze backbone layers; train classifier head for 3 epochs with learning rate 1e-3.
  - **Stage 2 (Differential Fine-Tuning):** Unfreeze entire backbone; train with discriminative learning rates: backbone 1e-4, head 1e-3.

### Loss Function & Class Imbalance Handling
To combat class imbalance across the 28 classes (ranging from 122 to 4,286 samples), we employ **Focal Loss** with label smoothing (eps = 0.05) and gamma = 2.0 to down-weight well-classified clean lab samples, forcing the gradient to focus on hard field examples.

---

## 4. Albumentations Field Simulation Pipeline

Training leverages the tuned field-domain augmentation pipeline in ml-pipeline/src/augmentations/transforms.py:
1. **Spatial & Handheld Framing:** RandomResizedCrop(224, scale=(0.8, 1.0)), HorizontalFlip(p=0.5), Affine(rotate=(-20, 20), scale=(0.85, 1.15), p=0.6).
2. **Natural Lighting & Shading:** RandomShadow(num_shadows_limit=(1, 2), shadow_intensity_range=(0.4, 0.7), p=0.35).
3. **Camera & Messaging Artifacts:** ImageCompression(quality_range=(60, 95), p=0.4), GaussianBlur(blur_limit=(3, 5), p=0.2).
4. **Photometric Sunlight Variation:** ColorJitter(brightness=0.25, contrast=0.25, saturation=0.20, hue=0.04, p=0.6).
5. **Standard Normalization:** ImageNet Mean [0.485, 0.456, 0.406] & Std Dev [0.229, 0.224, 0.225].

---

## 5. Proposed Training Command

When ready for full execution on GPU/compute environment:

`ash
# From ml-pipeline/ directory:
python src/train.py \
  --model-name efficientnet_b0 \
  --data-dir data/processed \
  --plantdoc-train-dir data/raw/plantdoc_recovered/train \
  --class-labels ../backend/src/models/class_labels_public.json \
  --batch-size 32 \
  --epochs 15 \
  --lr 1e-4 \
  --weight-decay 1e-4 \
  --output-dir checkpoints/field_domain_run \
  --export-onnx ../backend/src/models/agrismart_efficientnet_b0.onnx
`

---

## 6. Evaluation Protocol

Post-training verification uses ml-pipeline/src/evaluate.py on the held-out field dataset:
`ash
python src/evaluate.py \
  --checkpoint checkpoints/field_domain_run/best_model.pth \
  --test-dir data/processed/test_field \
  --class-labels ../backend/src/models/class_labels_public.json \
  --output-dir evaluation_results/field_domain_eval
`
Metrics to record:
- Overall Top-1 Accuracy & Top-3 Accuracy
- Macro-Averaged Precision, Recall, and F1-Score
- Per-Class F1 for high-incidence field diseases (Tomato Early Blight, Apple Scab, Corn Rust)
- Zero-drift ONNX runtime parity test via src/verify_onnx_parity.py
