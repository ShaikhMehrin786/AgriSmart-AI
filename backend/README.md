# AgriSmart AI Backend

## Overview
This is the complete backend architecture for the AgriSmart AI project. It provides secure APIs for user authentication, AI crop disease prediction, prediction history, smart irrigation, weather integration, and an AI agricultural assistant.

## Tech Stack
- **Node.js** + **Express**
- **PostgreSQL** (via **Prisma ORM**). Note: Currently configured to use SQLite for rapid local testing without Docker, but you can swap to PostgreSQL by changing the provider in `prisma/schema.prisma`.
- **JWT** for Authentication
- **Bcrypt** for secure password hashing
- **Multer** for image uploads

## Setup Instructions

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Generate Prisma Client and sync the database schema:
   \`\`\`bash
   npx prisma generate
   npx prisma db push
   \`\`\`

3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Verify it's running by checking the health endpoint:
   - \`GET http://localhost:5000/api/health\`

## Features Implemented
- **User Authentication**: Secure register/login flow returning JWTs.
- **Disease Prediction**: Upload endpoint for leaf images (`/api/predictions`) integrated with a mock ML service (`mlInferenceService.js`) which you can swap out with an actual ONNX runtime execution later.
- **Prediction History**: API to retrieve past scans and detailed Grad-CAM image paths.
- **Advisory Services**: Endpoints for weather, smart irrigation, and sustainability scoring.
- **AI Assistant**: Centralized LLM-ready chat endpoint.

## Environment Variables
Create a \`.env\` file in this directory based on the following:
\`\`\`env
PORT=5000
DATABASE_URL="file:./dev.db" # Change to postgres:// url for production
JWT_SECRET="your_secret_key"
WEATHER_API_KEY="your_weather_api_key"
AI_PROVIDER="MOCK" # Set to OPENAI/GEMINI later
\`\`\`
