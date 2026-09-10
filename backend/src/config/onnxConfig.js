// ONNX Runtime Session Loader & Model Artifact Cache
const ort = require('onnxruntime-node');
const path = require('path');
const fs = require('fs');

let session = null;
let classLabels = [];

async function initOnnxSession() {
  const modelPath = process.env.ONNX_MODEL_PATH || path.join(__dirname, '../models/agrismart_model.onnx');
  const labelsPath = process.env.CLASS_LABELS_PATH || path.join(__dirname, '../models/class_labels.json');

  try {
    // Load class labels
    if (fs.existsSync(labelsPath)) {
      const labelsRaw = fs.readFileSync(labelsPath, 'utf8');
      classLabels = JSON.parse(labelsRaw);
      console.log(`🏷️ Loaded ${classLabels.length} class labels.`);
    } else {
      console.warn(`⚠️ Class labels file not found at ${labelsPath}. Using default labels.`);
    }

    // Check if ONNX model weights exist
    if (fs.existsSync(modelPath)) {
      console.log(`⏳ Initializing onnxruntime-node session from ${modelPath}...`);
      session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ['cpu'],
        graphOptimizationLevel: 'all'
      });
      console.log('✅ ONNX model session loaded successfully into memory.');
    } else {
      console.warn(`⚠️ ONNX model weights not found at ${modelPath}. Inference service will run in mock/simulation mode.`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize ONNX session:', error);
  }
}

function getOnnxSession() {
  return session;
}

function getClassLabels() {
  return classLabels;
}

module.exports = {
  initOnnxSession,
  getOnnxSession,
  getClassLabels
};
