// ONNX Runtime Session Loader & Model Artifact Cache
const ort = require('onnxruntime-node');
const path = require('path');
const fs = require('fs');

let session = null;
let classLabels = [];

function resolveArtifactPath(envVarValue, defaultRelativePath) {
  if (envVarValue) {
    if (path.isAbsolute(envVarValue)) return envVarValue;
    const fromCwd = path.resolve(process.cwd(), envVarValue);
    if (fs.existsSync(fromCwd)) return fromCwd;
    const fromDirname = path.resolve(__dirname, '..', envVarValue);
    if (fs.existsSync(fromDirname)) return fromDirname;
    return fromCwd;
  }
  return path.join(__dirname, defaultRelativePath);
}

async function initOnnxSession() {
  const modelPath = resolveArtifactPath(process.env.ONNX_MODEL_PATH, '../models/agrismart_efficientnet_b0.onnx');
  const labelsPath = resolveArtifactPath(process.env.CLASS_LABELS_PATH, '../models/class_labels_public.json');

  try {
    // Load class labels
    if (fs.existsSync(labelsPath)) {
      const labelsRaw = fs.readFileSync(labelsPath, 'utf8');
      classLabels = JSON.parse(labelsRaw);
      console.log(`Loaded ${classLabels.length} class labels from ${labelsPath}`);
    } else {
      console.warn(`Class labels file not found at ${labelsPath}. Using default empty array.`);
    }

    // Check if ONNX model weights exist
    if (fs.existsSync(modelPath)) {
      console.log(`Initializing onnxruntime-node session from ${modelPath}...`);
      session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ['cpu'],
        graphOptimizationLevel: 'all'
      });
      console.log('ONNX model session loaded successfully into memory.');
    } else {
      console.warn(`ONNX model weights not found at ${modelPath}. Inference service will run in mock/simulation mode.`);
    }
  } catch (error) {
    console.error('Failed to initialize ONNX session:', error);
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
