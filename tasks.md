# 📋 AgriSmart AI — 6-Member Team Task Allocation & Execution Plan

> **SIH 2026 Sprint & Task Breakdown**  
> **Database:** PostgreSQL 15+ (Prisma ORM)  
> **Backend Paradigm:** Single-Runtime Node.js + `onnxruntime-node` (Zero-Python Production Inference)  
> **Team Size:** 6 Members

---

## 👥 1. Team Role & Ownership Distribution

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             AGRISMART AI TEAM                               │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ Member 1 (ML)        │ Member 2 (CV & XAI)  │ Member 3 (Backend Architect)  │
│ Offline Training &   │ Preprocessing &      │ Node.js, Express &            │
│ ONNX Export          │ Grad-CAM Heatmaps    │ onnxruntime-node Runner       │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ Member 4 (Frontend)  │ Member 5 (Agronomy)  │ Member 6 (DB & DevOps)        │
│ React.js UI/UX &     │ Weather, Irrigation  │ PostgreSQL 15+, Prisma ORM &  │
│ Mobile Dashboard     │ & Grounded GenAI     │ Integration Testing           │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

---

## 🚀 2. Individual Task Breakdown by Team Member

---

### 🔬 Member 1: Machine Learning & Model Export Lead
*Primary Focus: Model training, dataset curation, transfer learning, validation metrics, and ONNX conversion.*

- [ ] **Task 1.1 [P0 | 3 hrs] — Dataset Sourcing & Preprocessing Pipeline**
  - Download and organize **PlantVillage** (clean laboratory baseline) and **PlantDoc** (real-world field dataset).
  - Structure directories into `train/`, `val/`, and `test/` splits (70/15/15).
  - Verify labels across common Indian crops (Tomato, Potato, Corn, Apple, Rice, Chili).
  - *Acceptance Criteria:* Balanced multi-class image folder structure verified with exploratory data analysis script.

- [ ] **Task 1.2 [P0 | 5 hrs] — Model Training Loop (EfficientNet-B0 / MobileNetV3)**
  - Implement PyTorch transfer learning script using `timm` / `torchvision`.
  - Integrate heavy field augmentations: ColorJitter, RandomAffine, GaussianBlur, and RandomShadow to combat domain shift.
  - Implement early stopping and learning rate scheduling (`CosineAnnealingLR`).
  - *Acceptance Criteria:* Model achieves $>92\%$ validation accuracy and $>0.88$ Macro-F1 across target classes.

- [ ] **Task 1.3 [P0 | 3 hrs] — ONNX Weight Export & Validation**
  - Write `export_onnx.py` to convert the best `.pth` checkpoint into `agrismart_model.onnx`.
  - Enforce static/dynamic input tensor shape: `[1, 3, 224, 224]`.
  - Validate numerical parity: Verify that PyTorch output logits match ONNX Runtime predictions within an error tolerance $\epsilon < 10^{-4}$.
  - Generate `class_labels.json` indexing map.
  - *Acceptance Criteria:* Validated `agrismart_model.onnx` and `class_labels.json` handed over to Member 3.

- [ ] **Task 1.4 [P1 | 3 hrs] — Performance Metrics & Confusion Matrix Generation**
  - Generate held-out test evaluation report: Precision, Recall, Macro-F1, and normalized Confusion Matrix.
  - Save publication-grade metric charts for the hackathon pitch deck.
  - *Acceptance Criteria:* Formatted performance report with confusion matrix plot ready for SIH judges.

---

### 👁️ Member 2: Computer Vision & Explainable AI (XAI) Lead
*Primary Focus: Grad-CAM implementation, tensor transformation, and field robustness benchmarking.*

- [ ] **Task 2.1 [P0 | 4 hrs] — Grad-CAM Feature Map Extraction**
  - Hook into the final convolutional feature layer of the backbone network.
  - Compute class activation gradients: $\alpha_k^c = \frac{1}{Z} \sum \frac{\partial y^c}{\partial A^k}$.
  - Generate normalized intensity heatmaps ($[0, 255]$ colormap JET).
  - *Acceptance Criteria:* Python prototype generates visual overlays highlighting diseased leaf lesions.

- [ ] **Task 2.2 [P0 | 4 hrs] — Node.js-Compatible Heatmap Service**
  - Collaborate with Member 3 to port or package the Grad-CAM activation map extraction into the Node.js pipeline.
  - Generate translucent RGB heatmap PNG buffer and composite it over the original leaf image.
  - *Acceptance Criteria:* Node.js prediction endpoint returns both raw diagnostic JSON and a composited heatmap image URL/base64 buffer.

- [ ] **Task 2.3 [P1 | 3 hrs] — Field Robustness & Noisy Image Benchmark**
  - Collect 20 in-the-wild leaf photos taken under direct sunlight, shadows, blur, and soil backgrounds.
  - Benchmark classification stability and false-positive rates on field photos vs. clean images.
  - *Acceptance Criteria:* Robustness evaluation log demonstrating model stability under real farm conditions.

- [ ] **Task 2.4 [P2 | 2 hrs] — Low-Confidence & Invalid Image Guardrail**
  - Implement heuristic checks: if top-1 class probability is $<0.50$ or background pixel ratio is excessively high, flag an `UNCERTAIN_IMAGE` warning.
  - *Acceptance Criteria:* Return helpful feedback ("Image unclear or leaf not detected; please retake in good lighting") instead of false confident guesses.

---

### ⚡ Member 3: Backend & Inference Architecture Lead
*Primary Focus: Node.js Express server, `onnxruntime-node` integration, controllers, JWT auth, and routing.*

- [ ] **Task 3.1 [P0 | 3 hrs] — Express Server Scaffolding & Security Setup**
  - Initialize Node.js + Express project in `backend/`.
  - Configure CORS, Helmet, rate limiting (`express-rate-limit`), and JSON body parsing.
  - Set up environment variable management (`dotenv`) and `.env.example`.
  - *Acceptance Criteria:* Secure Express application listening on port 5000 with health-check endpoint (`GET /api/health`).

- [ ] **Task 3.2 [P0 | 4 hrs] — In-Process `onnxruntime-node` Inference Service**
  - Install and configure `onnxruntime-node` with C++ bindings.
  - Implement image preprocessing using `sharp` (resize to 224x224, convert to RGB Float32Array, normalize using ImageNet mean/std).
  - Load `agrismart_model.onnx` into memory on server boot; execute forward inference.
  - Implement Softmax function to convert logits into percentages.
  - *Acceptance Criteria:* `POST /api/predictions` accepts an uploaded leaf image, runs in-memory inference, and returns predicted crop, disease, and confidence score within $<100\text{ms}$.

- [ ] **Task 3.3 [P0 | 3 hrs] — Multer File Upload & Storage Management**
  - Configure `multer` for memory/disk buffer management with file size limit (10MB).
  - Enforce MIME-type whitelist (`image/jpeg`, `image/png`, `image/webp`).
  - Sanitize file names with UUIDv4 to eliminate directory traversal risks.
  - *Acceptance Criteria:* Only valid images processed; invalid file formats rejected with HTTP 400.

- [ ] **Task 3.4 [P1 | 3 hrs] — JWT Authentication & User Routes**
  - Implement `authController.js`: user registration, bcrypt password hashing (12 rounds), and JWT login issuance.
  - Create `authMiddleware.js` for Bearer token verification.
  - *Acceptance Criteria:* Protected endpoints reject unauthenticated requests with HTTP 401.

- [ ] **Task 3.5 [P1 | 3 hrs] — Prediction History & Telemetry Endpoints**
  - Implement `GET /api/predictions/history` (paginated past scans for logged-in user).
  - Implement `GET /api/predictions/:id` (detailed diagnostic view with treatment breakdown).
  - *Acceptance Criteria:* Farmers can retrieve historical scans with relational disease data.

---

### 💻 Member 4: Frontend & UI/UX Lead
*Primary Focus: React.js application, responsive mobile-first UI, leaf uploader, Grad-CAM viewer, and advisory dashboard.*

- [ ] **Task 4.1 [P0 | 3 hrs] — Vite + React App Setup & Modern Design System**
  - Scaffold React app using Vite in `frontend/`.
  - Configure Google Fonts (Outfit / Inter) and design tokens (palette: deep emerald, leaf green, warm amber, dark slate).
  - Build responsive Navigation bar, header, and route switcher (React Router).
  - *Acceptance Criteria:* Clean, responsive UI shell running smoothly on desktop and mobile viewports.

- [ ] **Task 4.2 [P0 | 4 hrs] — Drag-and-Drop Image Uploader Component**
  - Create `ImageUploader.jsx` supporting file drag-and-drop, file browsing, and mobile camera access (`capture="environment"`).
  - Display instant client-side preview with file validation and animated loading state during inference.
  - *Acceptance Criteria:* Seamless upload experience with loading spinners and immediate feedback.

- [ ] **Task 4.3 [P0 | 4 hrs] — Diagnostic Result & Grad-CAM Visualizer**
  - Build `PredictionCard.jsx`: Crop name, disease tag, confidence gauge (animated circular meter), and severity badge.
  - Build `HeatmapViewer.jsx`: Interactive side-by-side or slider comparison showing original leaf vs. Grad-CAM overlay.
  - *Acceptance Criteria:* Visual verification clearly displayed to the user with high aesthetic polish.

- [ ] **Task 4.4 [P1 | 3 hrs] — Weather, Irrigation & Sustainability Panels**
  - Build `WeatherCard.jsx`: Current temperature, humidity, rainfall probability, and pathogen risk alert.
  - Build `IrrigationCard.jsx`: Actionable irrigation advisory (Delay / Normal / Water Needed) with contextual rationale.
  - Build `SustainabilityGauge.jsx`: Visual 0–100 progress score with breakdown bars.
  - *Acceptance Criteria:* Advisory insights clearly visible directly below the diagnostic result.

- [ ] **Task 4.5 [P1 | 3 hrs] — Grounded GenAI Chatbot Interface**
  - Build `AssistantChat.jsx`: Floating or embedded chat drawer with speech bubble formatting.
  - Support pre-populated quick-prompt chips (e.g., *"Is this safe to spray before rain?"*, *"Give me organic remedies"*).
  - Display typing indicator and streaming message bubbles.
  - *Acceptance Criteria:* Clean, responsive conversational UI connected to the backend GenAI API.

---

### 🌾 Member 5: Agronomy & Intelligence Engine Lead
*Primary Focus: Weather integration, pathogen risk algorithms, irrigation heuristics, sustainability scoring, and grounded GenAI prompts.*

- [ ] **Task 5.1 [P0 | 3 hrs] — Weather Intelligence Service (OpenWeather / IMD)**
  - Implement `weatherService.js` in backend.
  - Fetch real-time weather metrics and 48-hour rainfall probability using latitude and longitude coordinates.
  - Implement 30-minute in-memory / database caching to conserve API quota.
  - *Acceptance Criteria:* `GET /api/advisory/weather?lat=...&lon=...` returns clean JSON weather metrics.

- [ ] **Task 5.2 [P0 | 3 hrs] — Pathogen Proliferation Risk Algorithm**
  - Code mathematical risk function correlating ambient humidity ($>80\%$), temperature range ($20^\circ\text{C} - 28^\circ\text{C}$), and rainfall probability.
  - Categorize risk into: `LOW`, `MODERATE`, `HIGH`, `CRITICAL OUTBREAK WARNING`.
  - *Acceptance Criteria:* Returns dynamic risk level aligned with specific disease biology (e.g., Late Blight thrives in high humidity).

- [ ] **Task 5.3 [P1 | 3 hrs] — Smart Irrigation Heuristic Engine**
  - Implement `irrigationService.js`: evaluate crop water needs, soil moisture levels, and precipitation forecasts.
  - Output explicit action: e.g., *"Delay Irrigation: 75% rain forecasted within 24h. Saves water and avoids root rot."*
  - *Acceptance Criteria:* Generates sensible, protective irrigation recommendations for the farmer.

- [ ] **Task 5.4 [P1 | 3 hrs] — Sustainability Index Calculator (0 – 100)**
  - Implement weighted scoring algorithm evaluating:
    - Water conservation (weather-aligned irrigation) $\to 35\%$
    - Biological/organic fungicide adoption $\to 30\%$
    - Crop sanitation and infected foliage removal $\to 20\%$
    - Soil moisture and organic matter maintenance $\to 15\%$
  - *Acceptance Criteria:* Produces reproducible, transparent numeric score and categorical grade.

- [ ] **Task 5.5 [P0 | 4 hrs] — Grounded GenAI Assistant Prompt Engineering**
  - Implement `genAiService.js` connecting to LLM API (Gemini / OpenAI).
  - Build the **Context Grounding Envelope**:
    - Inject current diagnostic output (Crop, Disease, Confidence, Severity).
    - Inject verified PostgreSQL monograph (organic & chemical treatments, precautions).
    - Inject active weather telemetry (temperature, humidity, precipitation).
    - Inject strict system constraints (no banned chemicals, warn on rain, answer in English or Hinglish).
  - *Acceptance Criteria:* Chatbot provides highly accurate, hallucination-free advice grounded in active farm telemetry.

---

### 🗄️ Member 6: Database & DevOps Lead
*Primary Focus: PostgreSQL 15+ architecture, Prisma ORM, data seeding, integration testing, and demo deployment.*

- [ ] **Task 6.1 [P0 | 3 hrs] — PostgreSQL Setup & Prisma Initialization**
  - Provision local and cloud PostgreSQL 15+ database (e.g., Neon / Supabase / local PostgreSQL).
  - Initialize Prisma in `backend/` (`npx prisma init`).
  - Configure `DATABASE_URL` with connection pooling parameters.
  - *Acceptance Criteria:* Successful connection from Node.js to PostgreSQL verified.

- [ ] **Task 6.2 [P0 | 4 hrs] — PostgreSQL Schema Modeling & Migrations**
  - Write complete `schema.prisma` defining models:
    - `User`, `Crop`, `Disease`, `Prediction`, `Recommendation`, `WeatherLog`, `IrrigationLog`.
  - Establish relational constraints, foreign keys, and indexes for fast queries (`idx_predictions_user`, `idx_diseases_crop`).
  - Run `npx prisma migrate dev --name init_agrismart_db`.
  - *Acceptance Criteria:* Database tables and indexes created in PostgreSQL without schema conflicts.

- [ ] **Task 6.3 [P0 | 4 hrs] — Crop & Disease Monograph Data Seeding**
  - Write `prisma/seed.js` to populate verified agronomic records for at least 15 core crop-disease conditions (Tomato Early Blight, Tomato Late Blight, Potato Scab, Healthy Potato, Apple Cedar Rust, Corn Leaf Spot, etc.).
  - Include specific organic treatments (Neem oil, *Trichoderma*, Copper soap), chemical remedies (Mancozeb, Chlorothalonil), and symptoms.
  - Execute `npx prisma db seed`.
  - *Acceptance Criteria:* PostgreSQL database contains rich, verified agronomic reference monographs.

- [ ] **Task 6.4 [P1 | 3 hrs] — End-to-End API Integration Testing**
  - Write comprehensive Postman / Jest integration tests covering the complete pipeline:
    - Register $\to$ Login $\to$ Upload Leaf Image $\to$ Run ONNX Inference $\to$ Store in PostgreSQL $\to$ Fetch History.
  - *Acceptance Criteria:* All core API routes passing with 100% success on test suite.

- [ ] **Task 6.5 [P1 | 2 hrs] — Dockerization & Demo Deployment**
  - Write `docker-compose.yml` orchestrating PostgreSQL, Node.js backend, and frontend build.
  - Prepare a fail-safe offline local demo script for the jury evaluation.
  - *Acceptance Criteria:* Entire stack bootable via a single command (`docker-compose up` or local npm scripts).

---

## 📅 3. Cross-Team Synchronization Milestones

| Milestone | Target Hour | Required Cross-Team Handshake | Verification Checkpoint |
|---|:---:|---|---|
| **Sync 1: Contracts Freeze** | Hour 06 | **Member 3 (Backend) + Member 4 (Frontend) + Member 6 (DB)** | JSON schema and API payload contracts locked for `/api/predictions` and `/api/auth`. |
| **Sync 2: Model & Runner Handoff** | Hour 12 | **Member 1 (ML) + Member 2 (CV) $\to$ Member 3 (Backend)** | Validated `agrismart_model.onnx` and `class_labels.json` integrated into `onnxruntime-node`. |
| **Sync 3: Grounded Advisory Integration** | Hour 20 | **Member 5 (Agronomy) + Member 6 (DB) $\to$ Member 4 (Frontend)** | Weather, irrigation, and GenAI chatbot endpoints wired into the React UI dashboard. |
| **Sync 4: Field Robustness & Edge Audit** | Hour 28 | **Member 2 (CV) + Member 1 (ML) + Member 4 (Frontend)** | System evaluated against 20 raw field test photos; fallback UI messages verified. |
| **Sync 5: Code Freeze & Pitch Rehearsal** | Hour 32 | **All 6 Members** | Live demo rehearsed 3 times; pitch deck finalized; backup offline video recorded. |

---

## 🏅 4. Jury Presentation Responsibility Allocation

During the 5-minute SIH hackathon evaluation, team members should present as follows:

| Speaker | Segment | Duration | Focus Area |
|---|---|:---:|---|
| **Member 4 (Frontend Lead)** | Introduction & The Field Problem | 45 sec | Real farm vulnerabilities, why laboratory AI models fail in Indian fields. |
| **Member 1 & 2 (ML & CV Leads)** | Machine Learning & Grad-CAM | 60 sec | Transfer learning, data augmentation strategy, and Explainable AI heatmap proof. |
| **Member 3 & 6 (Backend & DB Leads)**| System Architecture & PostgreSQL | 60 sec | Zero-Python single runtime (`onnxruntime-node`), memory efficiency, and ACID data integrity. |
| **Member 5 (Agronomy Lead)** | Advisory Engines & Grounded GenAI | 75 sec | Live demo of weather-risk correlation, smart irrigation, and non-hallucinating AI chatbot. |
| **Team Leader** | Business Impact, Feasibility & Q&A | 60 sec | Cloud economics (\$5/mo hosting), farmer ROI, and roadmap. |
