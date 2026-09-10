# 🌾 AgriSmart AI — Intelligent Agriculture for a Sustainable Future

[![Smart India Hackathon](https://img.shields.io/badge/SIH-2026-brightgreen?style=for-the-badge)](https://www.sih.gov.in/)
[![Platform](https://img.shields.io/badge/Architecture-Single--Runtime%20Node.js%20%2B%20ONNX-blue?style=for-the-badge)](#technical-architecture)
[![Inference Engine](https://img.shields.io/badge/Inference-onnxruntime--node-orange?style=for-the-badge)](#machine-learning--inference-pipeline)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20(Prisma)-indigo?style=for-the-badge)](#database-design)
[![UI](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react)](frontend/)

> **"SEE → UNDERSTAND → ACT"**  
> AgriSmart AI is an end-to-end agricultural decision-support ecosystem. It empowers farmers to capture leaf imagery from the field, detect diseases with real-time explainability (Grad-CAM), contextualize risks against live hyper-local weather, receive precision irrigation guidance, and consult a grounded GenAI assistant—all deployed on an ultra-lean, single-runtime production architecture.

---

## 📌 Table of Contents
1. [Problem Statement & The Field-Shift Challenge](#-problem-statement--the-field-shift-challenge)
2. [Key Features](#-key-features)
3. [Updated Technical Architecture](#-updated-technical-architecture)
4. [Tech Stack Matrix](#-tech-stack-matrix)
5. [Core Engine & Advisory Logic](#-core-engine--advisory-logic)
6. [Database Schema](#-database-schema)
7. [API Endpoints Specification](#-api-endpoints-specification)
8. [Project Structure](#-project-structure)
9. [Getting Started & Local Setup](#-getting-started--local-setup)
10. [Model Training & ONNX Export Pipeline](#-model-training--onnx-export-pipeline)
11. [SIH Hackathon Evaluation & Presentation Strategy](#-sih-hackathon-evaluation--presentation-strategy)
12. [Future Roadmap](#-future-roadmap)

---

## 🚨 Problem Statement & The Field-Shift Challenge

Traditional crop disease diagnosis is manual, reactive, and dependent on scarce agricultural extension officers. By the time visual symptoms are verified, extensive yield loss has already occurred.

While existing computer vision prototypes achieve high accuracy on benchmark datasets like **PlantVillage**, they disastrously fail in real agricultural fields due to the **Domain Shift**:
- **Laboratory Datasets:** Single leaf, uniform gray/white background, controlled studio lighting, fixed perpendicular focal distance.
- **Real-World Field Conditions:** Cluttered backgrounds (soil, weeds, hands), dynamic sunlight/shadows, overlapping foliage, wind blur, variable smartphone sensors, and multi-leaf occlusion.

### 💡 The AgriSmart Solution
AgriSmart AI bridges the lab-to-field gap through:
1. **Field-Trained Transfer Learning:** Models trained on combinations of controlled datasets (*PlantVillage*) and real-world in-situ field datasets (*PlantDoc*) with heavy photometric and spatial augmentations.
2. **Explainable AI (Grad-CAM):** Generates heatmaps to visually prove that the neural network focuses on leaf lesions and fungal patterns rather than background dirt or fingers.
3. **Multi-Vector Advisory:** Combines disease diagnosis with live weather forecasts and soil conditions to prevent secondary outbreaks and conserve water.

---

## ✨ Key Features

| Feature | Description | Status |
|---|---|:---:|
| 🍃 **Crop & Disease Detection** | Upload leaf images to diagnose 38+ crop-disease conditions or identify healthy foliage with confidence scoring. | ✅ Core MVP |
| 🔍 **Explainable AI (Grad-CAM)** | Visual attention heatmaps highlight the exact morphological lesions that triggered the diagnosis, fostering farmer trust. | ✅ Phase 2 |
| 🌦️ **Weather-Grounded Disease Risk** | Correlates ambient humidity, rainfall probability, and temperature to calculate imminent pathogen proliferation risk. | ✅ Phase 2 |
| 💧 **Smart Irrigation Advisory** | Synthesizes crop evapotranspiration needs, soil moisture levels, and precipitation forecasts to prevent over/under-watering. | ✅ Phase 3 |
| 🌱 **Sustainability Index (0-100)** | Audits farm management efficiency across water conservation, chemical pesticide reduction, and preventive habits. | ✅ Phase 3 |
| 🤖 **Grounded GenAI Agronomist** | LLM assistant strictly grounded in verified database disease monographs, current diagnosis, and local climate data. | ✅ Phase 3 |
| 📜 **Audit History & Telemetry** | Historical archive of past scans, temporal progress tracking, and farm disease heat-mapping. | ✅ Phase 2 |
| 📡 **IoT Sensor Ingestion (Optional)** | Node.js MQTT/HTTP listener ingestion for telemetry from live ESP32/soil sensor nodes. | 🔄 Phase 4 |

---

## 🏗️ Updated Technical Architecture

To deliver peak production performance without the overhead of maintaining dual microservices (Node.js + Python FastAPI) during hackathon demos and cloud deployment, AgriSmart AI utilizes an **Exported ONNX Single-Runtime Architecture**:

```mermaid
flowchart TD
    subgraph Offline_Training ["🔬 Offline Model Development (Python)"]
        PV["PlantVillage Dataset"] --> Train["Model Training (PyTorch / TensorFlow)<br/>EfficientNet-B0 / MobileNetV3"]
        PD["PlantDoc Field Dataset"] --> Train
        Train --> Val["Validation & Field Robustness Tuning"]
        Val --> ONNX_Exp["Export to ONNX Format (.onnx)<br/>+ Quantization"]
    end

    subgraph Farmer_Client ["📱 Farmer Interface"]
        UI["React.js Frontend (Vite / PWA)"]
        UI -->|"Upload Leaf Image & Fetch Advisory"| API_Gateway
        UI -->|"Ask Farming Query"| GenAI_Endpoint
    end

    subgraph Production_Server ["⚡ Node.js Production Backend (Express.js)"]
        API_Gateway["Express API Gateway"]
        
        subgraph Inference_Engine ["Zero-Python Live Inference"]
            ONNX_Exp -.->|"Weights (.onnx)"| Node_ONNX["onnxruntime-node Engine"]
            API_Gateway -->|"Preprocessed Image Buffer"| Node_ONNX
            Node_ONNX -->|"Logits & Heatmap Matrix"| PostProcess["Classification & Explainability Resolver"]
        end

        subgraph Advisory_Services ["Core Advisory Modules"]
            PostProcess --> DisService["Disease Catalog Service"]
            WeatherSvc["Weather Intelligence Service<br/>(OpenWeather / IMD API)"]
            IrrigEngine["Smart Irrigation Engine"]
            SustEngine["Sustainability Calculator"]
            
            DisService & WeatherSvc --> IrrigEngine
            IrrigEngine --> SustEngine
        end

        subgraph GenAI_Module ["Grounded AI Assistant"]
            GenAI_Endpoint["GenAI Controller"]
            RAG_Grounding["Context Grounding Engine<br/>(Diagnosis + DB Monograph + Weather)"]
            LLM_API["LLM Provider (Gemini / OpenAI API)"]
            
            GenAI_Endpoint --> RAG_Grounding
            RAG_Grounding --> LLM_API
        end

        subgraph Persistence_Layer ["Data Persistence"]
            ORM["Prisma ORM"]
            DB[(PostgreSQL Database)]
            PostProcess & IrrigEngine & SustEngine --> ORM --> DB
        end
    end

    PostProcess -->|"Inference & Risk JSON"| UI
    IrrigEngine -->|"Irrigation Action"| UI
    LLM_API -->|"Grounded Advice"| UI
```

### 🚀 Why This Architecture Wins
- **Zero Python at Runtime:** Model inference runs directly inside the Node.js event loop using C++ bindings through `onnxruntime-node`. No Python server startup lags, no inter-process HTTP latency, and significantly lower RAM usage on cloud/VPS instances.
- **Grounded GenAI:** Eliminates hallucinations by injecting the verified database diagnosis, symptoms, and live weather variables directly into the prompt context before querying the LLM.
- **Field Robustness First:** Offline training fuses laboratory datasets with noisy field datasets subjected to intense lighting, blur, and color jitter augmentations.

---

## 💻 Tech Stack Matrix

| Architectural Layer | Chosen Technology | Rationale & Responsibility |
|---|---|---|
| **Frontend** | **React.js (Vite)** | Reactive single-page application, responsive mobile-first UI, drag-and-drop leaf uploader, Grad-CAM canvas rendering, dynamic metric charts. |
| **Backend / API** | **Node.js + Express.js** | High-concurrency RESTful API gateway, authentication, rate limiting, request validation, and orchestrator of advisory pipelines. |
| **Database & ORM** | **PostgreSQL 15+ via Prisma ORM** | ACID-compliant relational storage for users, crop registries, disease monographs, historical scans, and irrigation logs. |
| **Model Training (Offline)** | **Python (PyTorch / TensorFlow)** | One-time training pipeline using EfficientNet-B0 / MobileNetV3 with custom augmentation pipelines (Albumentations), Grad-CAM weight derivation, and ONNX export. |
| **Model Inference (Live)** | **`onnxruntime-node`** | Native C++ hardware-accelerated inference running directly within Node.js. Zero Python dependencies in production. |
| **Advisory Modules** | **Node.js Native Services** | Rule-based and heuristic algorithmic engines calculating disease proliferation risk, evapotranspiration, irrigation requirements, and sustainability indices. |
| **GenAI Assistant** | **Node.js + LLM API (Gemini / Claude / OpenAI)** | Multilingual farmer chatbot grounded in real-time diagnosis results, meteorological context, and agricultural best-practice databases. |
| **IoT Feed (Optional)** | **Node.js MQTT / HTTP Listener** | Ingestion pipeline for telemetry (soil moisture, temperature, leaf wetness) streamed from edge ESP32 microcontrollers. |

---

## 🧠 Core Engine & Advisory Logic

### 1. Disease Detection & Explainable AI Pipeline
1. **Ingestion & Validation:** Multipart image upload validated for mime-type (`image/jpeg`, `image/png`) and clamped to 10MB.
2. **Tensor Preprocessing:** Image buffer resized to `224x224x3`, normalized to ImageNet statistics ($\mu = [0.485, 0.456, 0.406]$, $\sigma = [0.229, 0.224, 0.225]$), and converted into a `Float32Array` tensor.
3. **ONNX Inference:** `InferenceSession.run()` evaluates tensor weights; softmax generates multi-class probability distributions.
4. **Grad-CAM Localization:** Gradients extracted from the final convolutional feature layer map activation intensities back to pixel coordinates, generating a visual heatmap of infection loci.

### 2. Weather Intelligence Integration
- Queries live meteorological APIs based on farmer geolocation (`lat`, `lon`).
- Evaluates risk criteria:
  $$\text{Fungal Proliferation Risk} = f(\text{Humidity} > 80\%, 20^\circ\text{C} \le \text{Temp} \le 28^\circ\text{C}, \text{Rainfall Prob} > 60\%)$$
- Flags imminent danger for diseases like *Late Blight* and *Powdery Mildew*.

### 3. Smart Irrigation Heuristic
Generates actionable advice by correlating:
- **Crop Crop-Coefficient ($K_c$) & Stage**
- **Soil Moisture Level (%)** (manual input or IoT sensor)
- **48-Hour Precipitation Probability (%)**
- *Decision Logic:* If soil moisture is moderate ($\ge 40\%$) and precipitation probability $> 65\%$, system triggers **"Delay Irrigation: Natural precipitation forecasted within 24h"** to conserve water and prevent root rot.

### 4. Sustainability Score Algorithm (Scale: 0 - 100)
Evaluates farm practices across 4 weighted vectors:
$$\text{Score} = (0.35 \times W_{eff}) + (0.30 \times P_{bio}) + (0.20 \times D_{prev}) + (0.15 \times R_{opt})$$
- $W_{eff}$: Water scheduling efficiency (weather-aligned irrigation).
- $P_{bio}$: Prioritization of biological/organic fungicides over toxic chemical sprays.
- $D_{prev}$: Timely removal of diseased host foliage.
- $R_{opt}$: Optimal soil nutrient and moisture retention habits.

---

## 🗄️ Database Schema

Implemented via Prisma ORM:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String         @id @default(uuid())
  name          String
  email         String         @unique
  passwordHash  String
  phone         String?
  location      String?
  createdAt     DateTime       @default(now())
  predictions   Prediction[]
}

model Crop {
  id            String         @id @default(uuid())
  name          String         @unique
  scientificName String?
  description   String?
  diseases      Disease[]
  predictions   Prediction[]
}

model Disease {
  id            String         @id @default(uuid())
  cropId        String
  crop          Crop           @relation(fields: [cropId], references: [id])
  name          String
  scientificName String?
  symptoms      String         @db.Text
  causes        String?        @db.Text
  prevention    String         @db.Text
  treatmentOrganic String      @db.Text
  treatmentChemical String?    @db.Text
  severity      String         // Low, Moderate, High, Critical
  predictions   Prediction[]
  recommendations Recommendation[]
}

model Prediction {
  id            String         @id @default(uuid())
  userId        String
  user          User           @relation(fields: [userId], references: [id])
  cropId        String
  crop          Crop           @relation(fields: [cropId], references: [id])
  diseaseId     String
  disease       Disease        @relation(fields: [diseaseId], references: [id])
  imageUrl      String
  heatmapUrl    String?
  confidence    Float
  severity      String
  modelVersion  String
  feedbackRating Int?          // Farmer feedback verification
  createdAt     DateTime       @default(now())
}

model Recommendation {
  id            String         @id @default(uuid())
  diseaseId     String
  disease       Disease        @relation(fields: [diseaseId], references: [id])
  weatherCondition String?
  actionText    String         @db.Text
  priority      String         // Urgent, Recommended, Preventative
  createdAt     DateTime       @default(now())
}

model WeatherLog {
  id            String         @id @default(uuid())
  location      String
  temperature   Float
  humidity      Float
  rainProbability Float
  windSpeed     Float
  recordedAt    DateTime       @default(now())
}
```

---

## 🔌 API Endpoints Specification

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new farmer account.
- `POST /api/auth/login` — Authenticate and receive a signed JWT token.
- `GET /api/auth/profile` — Fetch currently authenticated farmer profile.

### 🌿 Disease Prediction & Telemetry (`/api/predictions`)
- `POST /api/predictions` — Upload leaf image (`multipart/form-data`) → Returns predicted crop, disease, confidence score, Grad-CAM heatmap, and localized treatment guidance.
- `GET /api/predictions/:id` — Retrieve details and explanation for a specific historical diagnosis.
- `GET /api/predictions/history` — Paginated list of past scans for the logged-in farmer.

### 🌤️ Weather & Advisory (`/api/advisory`)
- `GET /api/advisory/weather?lat={lat}&lon={lon}` — Fetch current conditions, 5-day agro-forecast, and pathogen risk index.
- `POST /api/advisory/irrigation` — Submit crop type, current soil moisture, and location → Returns dynamic irrigation schedule.
- `GET /api/advisory/sustainability-score` — Fetch personalized farm sustainability metric breakdown.

### 🤖 Grounded GenAI Assistant (`/api/assistant`)
- `POST /api/assistant/chat` — Submit a question in natural language (supports English, Hindi, and regional scripts) → Returns advice strictly grounded in active scan results and verified database practices.

---

## 📂 Project Structure

```text
AgriSmart-AI/
├── backend/                        # Node.js + Express Production Server
│   ├── src/
│   │   ├── config/                 # DB, ONNX runtime, and environment configs
│   │   │   ├── database.js         # Prisma client initialization
│   │   │   └── onnxConfig.js       # ONNX runtime session loader
│   │   ├── controllers/            # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── predictionController.js
│   │   │   ├── advisoryController.js
│   │   │   └── assistantController.js
│   │   ├── services/               # Core business & algorithmic logic
│   │   │   ├── onnxInferenceService.js # Image tensor preprocess & ONNX runner
│   │   │   ├── gradCamService.js   # Activation map & overlay generator
│   │   │   ├── weatherService.js   # Meteorological API consumer
│   │   │   ├── irrigationService.js# Evapotranspiration & irrigation logic
│   │   │   └── genAiService.js     # Grounded LLM prompt composer & caller
│   │   ├── middleware/             # Auth JWT, Multer file upload & error handlers
│   │   ├── models/                 # Model inference artifacts (.onnx)
│   │   │   ├── agrismart_model.onnx
│   │   │   └── class_labels.json
│   │   ├── routes/                 # Express route definitions
│   │   └── server.js               # Application entry point
│   ├── prisma/                     # Database schema & migrations
│   │   └── schema.prisma
│   ├── uploads/                    # Temporary uploaded leaf storage
│   ├── package.json
│   └── .env.example
│
├── frontend/                       # React.js Client Application
│   ├── public/                     # Static assets & favicons
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── ImageUploader.jsx   # Drag & drop image uploader
│   │   │   ├── PredictionCard.jsx  # Diagnosis & confidence display
│   │   │   ├── HeatmapViewer.jsx   # Grad-CAM overlay comparison
│   │   │   ├── WeatherCard.jsx     # Live weather & pathogen risk gauge
│   │   │   ├── IrrigationAdvisory.jsx
│   │   │   ├── SustainabilityGauge.jsx
│   │   │   └── ChatAssistant.jsx   # Grounded GenAI farmer chatbot
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── PredictionView.jsx
│   │   │   ├── HistoryView.jsx
│   │   │   └── Login.jsx
│   │   ├── services/               # Axios API client bindings
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── ml-pipeline/                    # Offline Training & ONNX Export (Python)
│   ├── notebooks/
│   │   └── 01_train_and_export.ipynb
│   ├── src/
│   │   ├── datasets/               # Dataset loaders (PlantVillage + PlantDoc)
│   │   ├── augmentations/          # Heavy field-simulation transforms
│   │   ├── train.py                # Transfer learning training loop
│   │   ├── evaluate.py             # Accuracy, Macro-F1, Confusion Matrix
│   │   └── export_onnx.py          # PyTorch/TensorFlow -> ONNX converter
│   └── requirements.txt
│
├── docs/                           # Architecture, guides & API references
│   ├── context.md                  # Deep architectural & domain briefing
│   └── milestone.md                # Hackathon execution & delivery roadmap
│
├── .gitignore
└── README.md
```

---

## ⚡ Getting Started & Local Setup

### 📋 Prerequisites
- **Node.js**: v18.x or v20.x LTS installed
- **npm** or **yarn**
- **Database**: PostgreSQL 15+ server running locally or on Cloud (Supabase/Neon/Railway)
- **Python**: v3.10+ (Only required if retraining models offline; **not needed** to run backend or frontend!)

---

### 1. Database & Backend Configuration

```bash
# Navigate to backend directory
cd backend

# Install dependencies (includes onnxruntime-node, express, prisma, etc.)
npm install

# Configure environment variables
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/agrismart_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
OPENWEATHER_API_KEY="your-openweather-api-key"
GEMINI_API_KEY="your-gemini-or-llm-api-key"
ONNX_MODEL_PATH="./src/models/agrismart_model.onnx"
CLASS_LABELS_PATH="./src/models/class_labels.json"
```

Push schema migrations and generate Prisma client:
```bash
npx prisma db push
npx prisma generate
```

Start the backend development server:
```bash
npm run dev
# Server running at http://localhost:5000
```

---

### 2. Frontend Configuration

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
# App running at http://localhost:5173
```

---

## 🔬 Model Training & ONNX Export Pipeline

The live application never executes Python scripts. Models are trained offline and exported to ONNX format:

```bash
# Navigate to ml-pipeline directory
cd ml-pipeline
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# Run training across combined PlantVillage + PlantDoc datasets
python src/train.py --model efficientnet_b0 --epochs 25 --batch-size 32

# Export best checkpoint to ONNX with dynamic batch sizing
python src/export_onnx.py \
  --checkpoint ./checkpoints/best_model.pth \
  --output ../backend/src/models/agrismart_model.onnx
```

---

## 🏆 SIH Hackathon Evaluation & Presentation Strategy

When pitching to the Smart India Hackathon jury, highlight these four differentiating pillars:

1. **Production-Ready Engineering (Single-Runtime Architecture):**
   - *Judge Question:* "Why isn't there a separate Python FastAPI container?"
   - *Winning Answer:* "By converting our fine-tuned model to the universal open standard **ONNX** and executing inference via `onnxruntime-node`, we eliminated inter-process network overhead, halved memory consumption, and ensured our platform can run seamlessly on affordable rural edge servers."
2. **True Generalization Over Benchmarks:**
   - Demonstrating robust predictions on raw, unedited smartphone camera photos taken in natural field sunlight, rather than relying exclusively on sterile laboratory leaf cutouts.
3. **Transparent & Trustworthy AI:**
   - Grad-CAM heatmap overlays validate that the neural network is inspecting diseased fungal spots and chlorotic margins rather than background artifacts.
4. **Holistic "See → Understand → Act" Agricultural Decision Support:**
   - Moving beyond simple classification by tying diagnoses directly into weather predictions, irrigation conservation, and an interactive grounded GenAI advisor.

---

## 🗺️ Future Roadmap

- [ ] **Multi-Spectral Drone Image Tiling:** Ingesting drone ortho-mosaics for large-scale field health mapping.
- [ ] **Vernacular Voice Interface:** Native voice-in / voice-out interaction in regional Indian languages (Hindi, Marathi, Telugu, Tamil, Punjabi).
- [ ] **Edge Deployment to Mobile:** Converting ONNX models to ONNX Runtime Mobile / TFLite for completely offline diagnoses in remote zero-connectivity fields.
- [ ] **Predictive Disease Forecasting:** Proactive mathematical modeling of spore dispersion using historical weather trajectories before visible lesions manifest.

---

## 👥 Team & Acknowledgments
Built with ❤️ for **Smart India Hackathon (SIH) 2026**.  
*For questions or collaborations, open an issue or submit a pull request!*
