// AgriSmart AI — Node.js Production Backend Entrypoint
// Single-Runtime Architecture with onnxruntime-node & PostgreSQL
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { initOnnxSession } = require('./config/onnxConfig');
const errorHandler = require('./middleware/errorHandler');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const advisoryRoutes = require('./routes/advisoryRoutes');
const assistantRoutes = require('./routes/assistantRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Request Parsing Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' }
});
app.use('/api/', apiLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'AgriSmart-AI-Production-Server',
    runtime: 'Node.js (In-Process ONNX Inference)',
    database: 'PostgreSQL (Prisma)',
    timestamp: new Date()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/advisory', advisoryRoutes);
app.use('/api/assistant', assistantRoutes);

// Centralized Error Handler
app.use(errorHandler);

// Boot Server and Warm up ONNX Runtime Session
async function startServer() {
  try {
    console.log('🌾 Initializing AgriSmart AI Backend...');
    await initOnnxSession();

    app.listen(PORT, () => {
      console.log(`🚀 AgriSmart Server actively listening on port ${PORT}`);
      console.log(`🌐 Base URL: http://localhost:${PORT}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
