# 🎴 Model Card — AgriSmart AI Crop Disease Classification Model

> **Target Application:** AgriSmart AI Production Inference Subsystem (SIH 2026)  
> **Production Model Architecture:** EfficientNet-B0 (Transfer Learning from ImageNet-1k)  
> **Production Artifact:** `backend/src/models/agrismart_efficientnet_b0.onnx`  
> **Class Mapping Index:** `backend/src/models/class_labels_public.json` (28 canonical audited classes)

---

## 1. Task Definition
Foliar crop disease diagnosis and healthy foliage verification from single-leaf images. The model classifies input leaf photographs into one of **28 canonical classes** (17 specific crop diseases across 9 plant species + 11 healthy plant categories).

---

## 2. Model Architecture
- **Backbone Network:** `efficientnet_b0` (timm / torchvision pretrained on ImageNet-1k)
- **Classifier Head:** Dropout ($p=0.3$) $\to$ Linear classification layer ($1280 \to 28$)
- **Input Dimensions:** `[1, 3, 224, 224]` Float32 RGB tensor
- **Inference Runtime:** In-process CPU execution via `onnxruntime-node`

---

## 3. Dataset Composition
The public development and benchmarking corpus combines two established agricultural computer vision datasets:
1. **PlantVillage (Laboratory Baseline):** Laboratory-curated single-leaf specimens on uniform monochrome backgrounds under controlled illumination.
2. **PlantDoc (Field-Condition Benchmark):** In-situ field photographs taken under natural agricultural sunlight, complex soil/foliage backgrounds, shadows, and variable smartphone camera sensors.

---

## 4. Dataset Split
Across the 28 shared canonical classes, the dataset is strictly partitioned into:
- **Training Set (Lab):** 29,615 images (`ml-pipeline/data/processed/train/`)
- **Validation Set (Lab):** 7,403 images (`ml-pipeline/data/processed/val/`)
- **Held-Out Public Field Test Set:** 236 images (`ml-pipeline/data/processed/test_field/`)

---

## 5. Data Leakage Prevention
Strict cryptographic integrity verification:
- **Train ↔ Validation Hash Collisions:** `0`
- **Train ↔ Held-Out Field Test Hash Collisions:** `0`
- **Validation ↔ Held-Out Field Test Hash Collisions:** `0`

SHA-256 collision audits ensure that zero images from the held-out field test set were exposed during training, validation, or hyperparameter selection loops.

---

## 6. Training Configuration
- **Optimizer:** AdamW ($\beta_1 = 0.9, \beta_2 = 0.999$, weight decay $= 10^{-4}$)
- **Learning Rate Schedule:** `CosineAnnealingLR` ($T_{\max} = 5, \eta_{\min} = 10^{-6}$, initial $\text{lr} = 10^{-4}$)
- **Fine-Tuning Paradigm:** Backbone unfrozen for end-to-end gradient updates
- **Batch Size:** 32
- **Epochs:** 5 epochs total; best checkpoint selected at **epoch 4**
- **Augmentation Pipeline (`transforms.py`):**
  - Spatial: `RandomResizedCrop(224, scale=(0.8, 1.0))`, `HorizontalFlip(p=0.5)`, `Affine(rotate=(-20, 20), scale=(0.85, 1.15), p=0.6)`
  - Illumination & Shadows: `RandomShadow(num_shadows_limit=(1, 2), shadow_intensity_range=(0.4, 0.7), p=0.35)`
  - Camera/Sensor: `ImageCompression(quality_range=(60, 95), p=0.4)`, `GaussianBlur(blur_limit=(3, 5), p=0.2)`
  - Color: `ColorJitter(brightness=0.25, contrast=0.25, saturation=0.20, hue=0.04, p=0.6)`
  - Normalization: ImageNet Mean `[0.485, 0.456, 0.406]` and Std Dev `[0.229, 0.224, 0.225]`

---

## 7. Validation Metrics (Laboratory Benchmark)
Evaluated on the held-out laboratory validation set ($N = 7,403$ images across 28 classes):
- **Best Validation Accuracy:** **99.50%**
- **Best Validation Macro-F1:** **0.9931**
- **Best Checkpoint:** Epoch 4 (`checkpoints/best_model.pth`)

---

## 8. Public Field Benchmark Result & Checkpoint Status

> [!IMPORTANT]
> **Field Benchmark Metric Caveat:**  
> An earlier fine-tuned checkpoint achieved a baseline **Macro-F1 of 0.2694** on the public PlantDoc field benchmark ($N = 236$ field images across 28 classes under extreme cross-domain laboratory-to-field shift).  
> The current post-augmentation checkpoint has not yet been re-evaluated on this public field benchmark. Official SIH competition scoring uses the organizer-provided unseen judging dataset.

---

## 9. Per-Class Evaluation & Confusion Matrix Availability
Per-class performance breakdowns (Precision, Recall, F1-Score) and normalized Confusion Matrix artifacts are generated via:
```bash
python ml-pipeline/src/evaluate.py \
  --checkpoint ml-pipeline/checkpoints/best_model.pth \
  --data-dir ml-pipeline/data/processed/val \
  --class-labels backend/src/models/class_labels_public.json \
  --output-dir ml-pipeline/evaluation_results
```
- High-performing classes ($F_1 \ge 0.99$): *Tomato Early Blight, Potato Late Blight, Apple Scab, Corn Common Rust, Grape Black Rot*.
- Healthy foliage identification accuracy exceeds $99.2\%$ across all 11 healthy classes.

---

## 10. Production ONNX Deployment & Numerical Parity
- **Export Command:** `python ml-pipeline/src/export_onnx.py --checkpoint checkpoints/best_model.pth --output ../backend/src/models/agrismart_efficientnet_b0.onnx --class-labels ../backend/src/models/class_labels_public.json`
- **Opset Version:** ONNX Opset 14
- **Runtime Engine:** `onnxruntime-node` (C++ bindings, zero Python in production)
- **Numerical Parity Verification (`verify_onnx_parity.py`):**
  - **Max Logit Difference:** `3.993511e-06`
  - **Max Probability Difference:** `2.235174e-07`
  - **Class Prediction Match:** **PASSED** (Numerical parity verified with negligible floating-point drift)

---

## 11. Limitations & Lab-to-Field Domain Gap
1. **Domain Shift Vulnerability:** Like all models trained predominantly on clean laboratory imagery, performance on in-situ field photos is vulnerable to severe background clutter (soil, farmer hands, weeds), extreme sunlight glare, and wind blur.
2. **Confidence-Aware Abstention Policy:** To mitigate false-positive diagnoses, AgriSmart enforces stratified confidence tiers:
   - **HIGH ($\ge 70\%$):** Confirmed diagnostic guidance issued.
   - **MODERATE ($45\% - 69.99\%$):** Advisory issued with secondary diagnostic candidates.
   - **LOW ($< 45\%$):** Diagnosis presented as uncertain; triggers a 5-step capture guidance checklist without claiming certainty.
3. **Healthy Foliage Protection:** Healthy predictions explicitly block curative chemical fungicide advice and pivot to preventive nutrition and moisture management.

---

## 12. Official SIH Unseen Judging Dataset Distinction
- **Public Benchmark Purpose:** The public PlantVillage/PlantDoc benchmarks were used strictly for offline development, loss convergence, augmentation tuning, and leakage audits.
- **SIH Judging Protocol:** The official SIH evaluation score is determined exclusively by the **SIH Organizers' Unseen Held-Out Judging Dataset** during live evaluation. The official judging dataset is unseen and was not accessible during development.
