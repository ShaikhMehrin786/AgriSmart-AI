# 🎯 AgriSmart AI — Milestones & Hackathon Execution Roadmap

> **SIH 2026 Strategic Delivery Plan**  
> This document outlines the sprint phases, hourly hackathon execution timeline, 6-member team allocation matrix, acceptance criteria, and jury presentation checklist for **AgriSmart AI**.

---

## 👥 Team Roles & Responsibilities Matrix

Based on the 6-member team structure outlined in the technical specification:

| Role / Member | Core Ownership | Key Deliverables | Associated Tech Stack |
|---|---|---|---|
| **Member 1: ML Lead** | Model Training & ONNX Export | Dataset curation (PlantVillage + PlantDoc), model training (EfficientNet-B0), evaluation metrics, and ONNX conversion. | PyTorch, Albumentations, ONNX, scikit-learn |
| **Member 2: CV & Explainability** | Preprocessing & Grad-CAM | Image normalization pipelines, Grad-CAM activation mapping, heatmap generation, field robustness testing. | OpenCV, NumPy, ONNX Runtime, Matplotlib |
| **Member 3: Backend Architect** | Node.js + Express API | API gateway, JWT auth, `onnxruntime-node` integration, controller routing, error handling, rate limiting. | Node.js, Express, onnxruntime-node, Multer |
| **Member 4: Frontend Lead** | React UI/UX Experience | Responsive farmer dashboard, drag-and-drop leaf uploader, Grad-CAM side-by-side viewer, dynamic charts. | React.js, Vite, Tailwind/Vanilla CSS, Lucide Icons |
| **Member 5: Agronomy & Intelligence** | Advisory & GenAI Services | Weather API integration, smart irrigation heuristic, sustainability index calculator, grounded GenAI prompts. | OpenWeather API, LLM API (Gemini/Groq), Node.js |
| **Member 6: Database & DevOps** | PostgreSQL & Cloud Integration | Prisma schema, PostgreSQL 15+ migrations, seed data, end-to-end integration testing, cloud/local demo deployment. | PostgreSQL 15+, Prisma ORM, Docker, Postman |

---

## ⏱️ 36-Hour Hackathon Execution Timeline

```
[Hours 00-06] Foundation & Scaffolding ──► [Hours 06-12] Core Inference & MVP
                                                             │
[Hours 18-24] Advisory Engines & GenAI ◄── [Hours 12-18] Explainability & Weather
      │
      ▼
[Hours 24-30] End-to-End System Integration ──► [Hours 30-36] Pitch Polish & Demo Lock
```

### 🕒 Phase 1: Foundation, Data Preparation & Scaffolding (Hours 00 – 06)
- [x] **Repository & Workspace Setup:** Initialize monorepo structure (`backend/`, `frontend/`, `ml-pipeline/`, `docs/`).
- [x] **Database Initialization:** Set up PostgreSQL 15+ instance, configure `schema.prisma`, execute initial migration, and seed crop & disease catalogs.
- [x] **Dataset Assembly:** Combine PlantVillage with representative PlantDoc field subsets; configure heavy augmentation pipeline.
- [x] **Base UI Layout:** Scaffold React.js application with navigation, upload zone mockup, and card placeholders.
- [x] **Milestone Gate 1:** Database seeded with 10+ major crop-disease monographs; Node.js health check responding.

### 🕒 Phase 2: Core ML Training, ONNX Export & In-Process Inference (Hours 06 – 12)
- [x] **Transfer Learning Training Loop:** Train EfficientNet-B0 / MobileNetV3 on combined dataset for baseline convergence ($>90\%$ validation accuracy).
- [x] **ONNX Export:** Export trained PyTorch weights to `agrismart_model.onnx` with input shape `[1, 3, 224, 224]`.
- [x] **Node.js ONNX Runner:** Implement `onnxInferenceService.js` utilizing `onnxruntime-node` for direct in-memory tensor inference.
- [x] **Prediction Endpoint:** Wire `POST /api/predictions` with Multer to accept image files and return predicted disease and confidence score.
- [x] **Milestone Gate 2 (Core MVP Working):** Upload leaf photo in Postman or React UI $\to$ receive verified disease diagnosis with zero Python in runtime.

### 🕒 Phase 3: Explainable AI & Weather Risk Integration (Hours 12 – 18)
- [x] **Grad-CAM Implementation:** Extract feature map weights and generate localized activation heatmaps for uploaded images.
- [x] **Heatmap Visualizer:** React component displaying interactive dual-view (Original Leaf vs. Grad-CAM Overlay with opacity slider).
- [x] **Weather Service Integration:** Fetch real-time weather metrics (temperature, humidity, precipitation forecast) via geolocation.
- [x] **Fungal Risk Correlator:** Calculate pathogen proliferation risk based on ambient moisture and crop susceptibility.
- [x] **Milestone Gate 3:** Farmer sees why the model made its prediction and receives an immediate weather-correlated risk badge.

### 🕒 Phase 4: Advanced Advisory, Grounded GenAI & History (Hours 18 – 24)
- [x] **Smart Irrigation Engine:** Implement heuristic model combining soil moisture thresholds, rainfall probability, and crop water demand.
- [x] **Sustainability Score Calculator:** Build algorithmic scoring index (0–100) auditing chemical usage, water efficiency, and hygiene.
- [x] **Grounded GenAI Agronomist:** Build `/api/assistant/chat` orchestrating LLM queries strictly grounded in current diagnosis and DB monograph.
- [x] **Telemetry & History View:** Store scans in database; render paginated timeline showing recovery trajectory over time.
- [x] **Milestone Gate 4:** Functional AI chatbot responding in Hinglish/English with zero hallucinations; dynamic irrigation recommendations active.

### 🕒 Phase 5: System Integration, Robustness & Edge Cases (Hours 24 – 30)
- [x] **Full-Stack End-to-End Testing:** Test the complete workflow: Camera capture $\to$ Upload $\to$ ONNX Inference $\to$ Heatmap $\to$ Weather Context $\to$ Chat $\to$ History log.
- [x] **Field Robustness Audit:** Benchmark model against 20 raw field photographs taken under challenging natural lighting and complex backgrounds.
- [x] **Error Handling & Resilience:** Graceful fallbacks for low-confidence images ($<50\%$), invalid file uploads, and offline weather API timeouts.
- [x] **Security Hardening:** Enforce JWT auth, input validation, file size clamps (10MB), and sanitized headers.
- [x] **Milestone Gate 5:** Robust system handling invalid photos with informative guidance; zero breaking bugs across all views.

### 🕒 Phase 6: Pitch Polish, Demo Hardening & Final Rehearsals (Hours 30 – 36)
- [x] **Live Demo Scripting:** Prepare 3 pristine sample scenarios (e.g., Early Blight on Tomato with high humidity, Healthy Potato Leaf, Leaf with ambiguous background).
- [x] **Backup Demo Video & Slides:** Record high-resolution screen capture walkthrough for offline contingency.
- [x] **Pitch Deck Alignment:** Structure 5-minute presentation focusing on: *Problem $\to$ Field Gap Solution $\to$ Architecture Differentiation $\to$ Live Demo $\to$ Impact & Scalability*.
- [x] **Milestone Gate 6:** Code freeze, presentation rehearsal completed, demo environment fully stable.

---

## 📊 Milestone Progression & Deliverable Gates

| Milestone | Phase Name | Priority Level | Target Metric / Deliverable | Status |
|---|---|:---:|---|:---:|
| **M1** | Project Infrastructure & Schema | P0 (Must Have) | Prisma DB migrations up, Express server live, monorepo configured | 🔴 Incomplete |
| **M2** | Core Zero-Python Disease Inference | P0 (Must Have) | ONNX model running in Node.js, $>90\%$ lab accuracy, $<200\text{ms}$ inference | 🔴 Incomplete |
| **M3** | Explainability & Weather Context | P1 (High Value) | Grad-CAM heatmap rendering on UI, OpenWeather API integration | 🔴 Incomplete |
| **M4** | Advisory Engines & Grounded GenAI | P1 (High Value) | Smart irrigation logic, Sustainability index (0-100), grounded chatbot | 🔴 Incomplete |
| **M5** | Prediction History & User Accounts | P2 (Important) | Farmer scan history, temporal progress tracking, JWT auth | 🔴 Incomplete |
| **M6** | Field Robustness & Hackathon Polish | P0 (Critical) | Benchmark on 20+ field photos, demo script rehearsed, pitch deck ready | 🔴 Incomplete |

---

## 🎯 Definition of Done (DoD) per Milestone

For any milestone feature to be marked complete:
1. **Functional Correctness:** The feature satisfies its user story without crashes or unhandled promise rejections.
2. **Zero-Python Runtime Integrity:** Inference code must execute within `onnxruntime-node` without triggering external Python subprocesses.
3. **Database Consistency:** Any persistent entity must have a corresponding Prisma schema relation and migration.
4. **Responsive UI:** Components must render legibly on both desktop displays and mobile viewports ($375\text{px}$ width).
5. **Error Containment:** Network or inference failures must display clear, human-friendly alerts on the frontend rather than white-screens.

---

## 🏆 SIH Jury Evaluation & Live Demo Script

### 1. The 5-Minute Pitch Structure
- **Minute 1: The Hook & Ground Reality (The "Why")**  
  Show a real leaf photo from a farm with dirt and weeds. Explain why current lab-trained models fail in Indian fields.
- **Minute 2: The Solution & Architecture (The "How")**  
  Explain the **SEE → UNDERSTAND → ACT** framework. Highlight the **Single-Runtime Node.js + ONNX** architecture (faster, lighter, cheaper to host).
- **Minute 3: The Live Demo (The "Wow")**  
  - Upload a real tomato leaf with early blight.
  - Show instantaneous inference and high confidence.
  - Reveal the **Grad-CAM heatmap** showing the model targeting the concentric lesion rings.
  - Show the **Weather Context**: *"Humidity is 88% $\to$ High Outbreak Warning!"*
  - Demonstrate the **Smart Irrigation Advisory**: *"Delay watering: Rain predicted in 4 hours."*
- **Minute 4: Grounded GenAI & Sustainability**  
  Ask the chatbot in Hinglish: *"Kya mujhe abhi dawai chhidakni chahiye?"*  
  Show the AI responding responsibly: *"Barish aane wali hai, abhi spray mat kijiye, bekar beh jayega."*
- **Minute 5: Impact, Feasibility & Roadmap**  
  Present cloud economics (runs on a \$5/mo VPS or edge Raspberry Pi), potential farmer savings, and future IoT/regional voice expansion.

---

## 🛡️ Risk Management & Contingency Matrix

| Identified Risk | Severity | Mitigation & Backup Strategy |
|---|:---:|---|
| **Cloud/Venue Internet Outage** | 🔴 High | Run the entire stack locally (`localhost:5000` + `localhost:5173`) with a local PostgreSQL/SQLite instance and pre-cached weather fallback fixtures. |
| **LLM API Rate Limit / Downtime** | 🟡 Medium | Configure a fallback to a local rule-based response template or secondary provider (e.g., Groq / OpenAI fallback key). |
| **Image Upload Latency / Hang** | 🟡 Medium | Pre-scale images client-side before upload to max $1024\times 1024$ resolution to ensure rapid transmission. |
| **Live Demo Photo Misclassification** | 🔴 High | Curate a dedicated folder of 5 rigorously verified field test images with known ground truth for the live jury demo. |
