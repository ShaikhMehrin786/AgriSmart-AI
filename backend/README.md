# AgriSmart AI Backend

## Overview
This is the production backend architecture for the AgriSmart AI project. It provides secure APIs for user authentication, zero-Python in-process AI crop disease prediction (`onnxruntime-node`), prediction history, smart irrigation, weather integration, and a grounded AI agricultural assistant.

## Tech Stack
- **Node.js (v18+)** + **Express**
- **In-Process Inference**: `onnxruntime-node` (EfficientNet-B0 ONNX model with 28 public benchmark classes)
- **PostgreSQL 15+** (via **Prisma ORM**)
- **Image Processing**: `sharp` (224x224 RGB ImageNet normalization)
- **JWT** for Authentication & **Bcrypt** for secure password hashing
- **Multer** for image upload management

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma Client and apply migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

3. Run the production/development server:
   ```bash
   npm run dev
   ```

4. Verify server health:
   - `GET http://localhost:5000/api/health`

## Features Implemented & Verified
- **User Authentication**: Secure register/login flow returning JWTs and BCrypt hashed credentials.
- **In-Process ONNX Inference**: Single-runtime leaf upload endpoint (`/api/predictions`) using `onnxruntime-node` (`agrismart_efficientnet_b0.onnx` + `class_labels_public.json`).
- **Prediction History & Persistence**: Fully relational PostgreSQL storage of diagnoses, confidence scores, and scan dates.
- **Advisory Services**: Algorithmic decision engines for hyper-local weather, pathogen risk, smart irrigation, and sustainability scoring.
- **Grounded AI Assistant**: LLM-ready chat endpoint (`/api/assistant/chat`) grounded in diagnosis context and meteorological data.

## Environment Variables
Create a `.env` file in this directory based on `.env.example`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/agrismart_db?schema=public"
JWT_SECRET="agrismart_super_secure_jwt_secret_change_in_production"
OPENWEATHER_API_KEY="your_openweather_api_key_here"
GEMINI_API_KEY="your_gemini_api_key_here"
ONNX_MODEL_PATH="./src/models/agrismart_efficientnet_b0.onnx"
CLASS_LABELS_PATH="./src/models/class_labels_public.json"
```
